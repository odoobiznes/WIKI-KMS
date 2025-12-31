/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://it-enterprise.co.il',
  },
  images: {
    domains: ['localhost', 'it-enterprise.co.il'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.it-enterprise.co.il',
      },
    ],
  },
}

module.exports = nextConfig
