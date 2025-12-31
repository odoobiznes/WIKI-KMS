/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://zmankesef.cz',
  },
  images: {
    domains: ['localhost', 'zmankesef.cz'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.zmankesef.cz',
      },
    ],
  },
}

module.exports = nextConfig
