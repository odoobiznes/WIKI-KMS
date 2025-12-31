#!/bin/bash

# Script pro vytvoření nové Next.js aplikace v monorepo

APP_NAME=$1
PORT=$2
DOMAIN=$3

if [ -z "$APP_NAME" ] || [ -z "$PORT" ] || [ -z "$DOMAIN" ]; then
  echo "Usage: ./scripts/create-app.sh <app-name> <port> <domain>"
  echo "Example: ./scripts/create-app.sh web-solutions 3002 it-enterprise.solutions"
  exit 1
fi

APP_DIR="apps/$APP_NAME"

echo "Creating app: $APP_NAME on port $PORT for domain $DOMAIN"

# Vytvoření adresáře
mkdir -p "$APP_DIR/src/app" "$APP_DIR/src/components" "$APP_DIR/src/lib" "$APP_DIR/src/types" "$APP_DIR/src/locales"

# package.json
cat > "$APP_DIR/package.json" << EOF
{
  "name": "@it-enterprise/$APP_NAME",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p $PORT",
    "build": "next build",
    "start": "next start -p $PORT",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next dist"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-intl": "^3.5.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "framer-motion": "^10.18.0",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "clsx": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "lucide-react": "^0.309.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0"
  }
}
EOF

# next.config.js
cat > "$APP_DIR/next.config.js" << EOF
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://$DOMAIN',
  },
  images: {
    domains: ['localhost', '$DOMAIN'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.$DOMAIN',
      },
    ],
  },
}

module.exports = nextConfig
EOF

# tsconfig.json
cat > "$APP_DIR/tsconfig.json" << EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# tailwind.config.js
cat > "$APP_DIR/tailwind.config.js" << EOF
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
EOF

# postcss.config.js
cat > "$APP_DIR/postcss.config.js" << EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# layout.tsx
cat > "$APP_DIR/src/app/layout.tsx" << EOF
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: '$DOMAIN',
  description: 'IT Enterprise Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
EOF

# globals.css
cat > "$APP_DIR/src/app/globals.css" << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# page.tsx
cat > "$APP_DIR/src/app/page.tsx" << EOF
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            $DOMAIN
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Platforma je ve vývoji
          </p>
        </div>
      </div>
    </main>
  )
}
EOF

# Dockerfile
cat > "$APP_DIR/Dockerfile" << EOF
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
EXPOSE $PORT
ENV PORT $PORT
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
EOF

# .dockerignore
cat > "$APP_DIR/.dockerignore" << EOF
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

echo "App $APP_NAME created successfully!"
echo "Next steps:"
echo "1. Add service to docker-compose.yml"
echo "2. Run: npm install"
echo "3. Run: npm run dev"

