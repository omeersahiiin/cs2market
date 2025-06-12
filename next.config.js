/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'steamcommunity-a.akamaihd.net',
      'community.akamai.steamstatic.com',
      'steamcdn-a.akamaihd.net'
    ],
    unoptimized: true
  },
  env: {
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'true',
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
};

module.exports = nextConfig;