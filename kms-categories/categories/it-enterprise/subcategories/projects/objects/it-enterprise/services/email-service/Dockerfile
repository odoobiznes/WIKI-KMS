FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY services/email-service/package.json ./services/email-service/

# Install dependencies
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build Email Service
WORKDIR /app/services/email-service
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 emailservice

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/services/email-service/dist ./services/email-service/dist
COPY --from=builder /app/services/email-service/package.json ./services/email-service/

USER emailservice

WORKDIR /app/services/email-service

EXPOSE 3002

CMD ["node", "dist/index.js"]

