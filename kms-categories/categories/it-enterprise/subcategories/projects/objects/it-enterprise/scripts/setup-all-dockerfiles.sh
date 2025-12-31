#!/bin/bash

# Script pro vytvoření Dockerfile pro všechny aplikace

APPS=(
  "web-solutions:3002"
  "web-cloud:3003"
  "web-pro:3004"
  "web-eu:3005"
  "web-coil:3006"
  "web-biznesmen:3007"
  "web-gazdaservice:3008"
  "web-zmankesef:3009"
  "web-avoda:3010"
  "web-busticket:3011"
)

for app_port in "${APPS[@]}"; do
  IFS=':' read -r app port <<< "$app_port"
  echo "Creating Dockerfile for $app on port $port"
  
  cat > "apps/$app/Dockerfile" << EOF
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE $port
ENV PORT $port
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
EOF

  # Vytvořit .dockerignore
  cat > "apps/$app/.dockerignore" << EOF
node_modules
.next
.git
.gitignore
README.md
.env*.local
.vercel
.DS_Store
*.log
EOF

  echo "✅ Dockerfile created for $app"
done

echo "All Dockerfiles created successfully!"

