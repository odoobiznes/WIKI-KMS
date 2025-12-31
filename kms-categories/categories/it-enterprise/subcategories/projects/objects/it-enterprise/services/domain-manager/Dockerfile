FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat docker-cli
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/database/package.json ./packages/database/
COPY services/domain-manager/package.json ./services/domain-manager/

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

# Build Domain Manager
WORKDIR /app/services/domain-manager
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN apk add --no-cache docker-cli

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 domainmanager

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/services/domain-manager/dist ./services/domain-manager/dist
COPY --from=builder /app/services/domain-manager/package.json ./services/domain-manager/

USER domainmanager

WORKDIR /app/services/domain-manager

EXPOSE 3001

CMD ["node", "dist/index.js"]

