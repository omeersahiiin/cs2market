/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'community.cloudflare.steamstatic.com',
        port: '',
        pathname: '/economy/image/**',
      },
      {
        protocol: 'https',
        hostname: 'steamcommunity-a.akamaihd.net',
        port: '',
        pathname: '/economy/image/**',
      },
      {
        protocol: 'https',
        hostname: 'community.akamai.steamstatic.com',
        port: '',
        pathname: '/economy/image/**',
      },
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'steamuserimages-a.akamaihd.net',
        port: '',
        pathname: '/**',
      }
    ],
    domains: [
      'community.cloudflare.steamstatic.com',
      'steamcommunity-a.akamaihd.net',
      'community.akamai.steamstatic.com',
      'steamcdn-a.akamaihd.net',
      'steamuserimages-a.akamaihd.net'
    ],
    unoptimized: true,
    // Add image optimization settings for better performance
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  env: {
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'true'
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'cs2market-prod.vercel.app']
    }
  }
};

module.exports = nextConfig;
