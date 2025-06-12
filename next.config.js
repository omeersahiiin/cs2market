/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Primary Steam CDN
      'steamcommunity-a.akamaihd.net',
      // Alternative Steam CDNs
      'community.akamai.steamstatic.com',
      'community.cloudflare.steamstatic.com',
      'steamcdn-a.akamaihd.net',
      'steamuserimages-a.akamaihd.net',
      // Additional Steam domains for maximum compatibility
      'cdn.akamai.steamstatic.com',
      'cdn.cloudflare.steamstatic.com'
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
    serverComponentsExternalPackages: ['@prisma/client']
  }
};

module.exports = nextConfig;
