/** @type {import('next').NextConfig} */
const path = require('path');

// Get backend API URL from environment variable
// If not set, we'll use rewrites to proxy to backend
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL;

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true, // Disable image optimization for Railway deployment
  },
  env: {
    // Only set default for development - production should use environment variable
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000'),
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || (process.env.NODE_ENV === 'production' ? '' : 'ws://localhost:8000'),
  },
  // Rewrites to proxy API requests to backend
  // This allows /api/v1/* requests to be forwarded to the backend service
  // Priority: BACKEND_API_URL > NEXT_PUBLIC_API_URL > hardcoded fallback
  async rewrites() {
    // Option 1: Use BACKEND_API_URL if set (server-side only, for proxying)
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
    
    // Option 2: Use NEXT_PUBLIC_API_URL if set and points to different domain
    if (process.env.NEXT_PUBLIC_API_URL) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '').trim();
      if (apiUrl && apiUrl !== 'http://localhost:8000' && !apiUrl.includes('localhost')) {
        // Only proxy if it's a different domain
        return [
          {
            source: '/api/v1/:path*',
            destination: `${apiUrl}/api/v1/:path*`,
          },
        ];
      }
    }
    
    // Option 3: Hardcoded fallback for production domain
    // If on ai.taysluxeacademy.com, proxy to api.taysluxeacademy.com
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/v1/:path*',
          destination: 'https://api.taysluxeacademy.com/api/v1/:path*',
        },
      ];
    }
    
    return [];
  },
  webpack: (config, { isServer }) => {
    const projectRoot = path.resolve(__dirname);
    
    // Explicitly set alias for @ to project root
    // This ensures @/lib/api resolves to ./lib/api.ts
    if (!config.resolve) {
      config.resolve = {};
    }
    
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    config.resolve.alias['@'] = projectRoot;
    
    // Ensure modules are resolved from project root
    if (!config.resolve.modules) {
      config.resolve.modules = [];
    }
    
    config.resolve.modules = [
      path.resolve(projectRoot, 'node_modules'),
      'node_modules',
      ...config.resolve.modules,
    ];
    
    return config;
  },
}

module.exports = nextConfig

