/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://it-enterprise.cloud',
  },
  images: {
    domains: ['localhost', 'it-enterprise.cloud'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.it-enterprise.cloud',
      },
    ],
  },
}

module.exports = nextConfig
