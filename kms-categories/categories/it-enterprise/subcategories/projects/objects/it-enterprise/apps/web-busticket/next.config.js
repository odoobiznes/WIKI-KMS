/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://bus-ticket.info',
  },
  images: {
    domains: ['localhost', 'bus-ticket.info'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bus-ticket.info',
      },
    ],
  },
}

module.exports = nextConfig
