/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://biznesmen.cz',
  },
  images: {
    domains: ['localhost', 'biznesmen.cz'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.biznesmen.cz',
      },
    ],
  },
}

module.exports = nextConfig
