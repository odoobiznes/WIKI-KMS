/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  transpilePackages: ['i18n', '@it-enterprise/api-client', '@it-enterprise/ui'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://it-enterprise.cz',
  },
  images: {
    domains: ['localhost', 'it-enterprise.cz'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.it-enterprise.cz',
      },
      {
        protocol: 'https',
        hostname: '**.it-enterprise.solutions',
      },
    ],
  },
}

module.exports = nextConfig
