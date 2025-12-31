/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://it-enterprise.eu',
  },
  images: {
    domains: ['localhost', 'it-enterprise.eu'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.it-enterprise.eu',
      },
    ],
  },
}

module.exports = nextConfig
