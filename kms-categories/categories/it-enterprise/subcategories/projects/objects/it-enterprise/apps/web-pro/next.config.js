/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://it-enterprise.pro',
  },
  images: {
    domains: ['localhost', 'it-enterprise.pro'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.it-enterprise.pro',
      },
    ],
  },
}

module.exports = nextConfig
