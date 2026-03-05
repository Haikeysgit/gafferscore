import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'crests.football-data.org',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict\u002DTransport\u002DSecurity',
            value: 'max\u002Dage=63072000; includeSubDomains; preload'
          },
          {
            key: 'X\u002DFrame\u002DOptions',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X\u002DContent\u002DType\u002DOptions',
            value: 'nosniff'
          },
          {
            key: 'Referrer\u002DPolicy',
            value: 'origin\u002Dwhen\u002Dcross\u002Dorigin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;