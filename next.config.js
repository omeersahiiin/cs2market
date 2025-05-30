/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'community.cloudflare.steamstatic.com',
      'cdn.steamcommunity.com',
      'steamcommunity-a.akamaihd.net',
      'community.akamai.steamstatic.com',
      'steamcdn-a.akamaihd.net',
    ],
  },
  /* config options here */
};

module.exports = nextConfig;