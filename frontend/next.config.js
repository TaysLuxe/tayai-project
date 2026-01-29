/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  // Ensure lib, contexts, components resolve from project root (fixes Docker/Railway build)
  webpack: (config, { isServer }) => {
    const projectRoot = path.resolve(__dirname);
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = projectRoot;
    config.resolve.modules = [projectRoot, 'node_modules', ...(config.resolve.modules || [])];
    return config;
  },

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000'),
    NEXT_PUBLIC_WS_URL:
      process.env.NEXT_PUBLIC_WS_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'ws://localhost:8000'),
  },
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_API_URL?.trim()) {
      if (process.env.BACKEND_API_URL) {
        const backendUrl = process.env.BACKEND_API_URL.replace(/\/api\/v1\/?$/, '').trim();
        if (backendUrl) {
          return [
            {
              source: '/api/v1/:path*',
              destination: `${backendUrl}/api/v1/:path*`,
            },
          ];
        }
      }

      if (process.env.NODE_ENV === 'production') {
        return [
          {
            source: '/api/v1/:path*',
            destination: 'https://api.taysluxeacademy.com/api/v1/:path*',
          },
        ];
      }
    }

    return [];
  },
};

module.exports = nextConfig;
