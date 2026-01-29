/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    externalDir: true, // ✅ REQUIRED for importing from lib/, contexts/, components/
  },
  images: {
    unoptimized: true,
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
