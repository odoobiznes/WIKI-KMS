/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://avoda.cz',
  },
  images: {
    domains: ['localhost', 'avoda.cz'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.avoda.cz',
      },
    ],
  },
}

module.exports = nextConfig
