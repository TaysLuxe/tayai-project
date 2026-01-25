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
  // Rewrites to proxy API requests to backend (fallback only)
  // Note: Direct API calls via NEXT_PUBLIC_API_URL are preferred over rewrites
  // Rewrites are only used if NEXT_PUBLIC_API_URL is not set
  async rewrites() {
    // Only use rewrites if NEXT_PUBLIC_API_URL is NOT set
    // This is a fallback - direct API calls are preferred
    if (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.trim() === '') {
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
      
      // Option 2: Hardcoded fallback for production domain (only if no env vars set)
      // If on ai.taysluxeacademy.com and no env vars, proxy to api.taysluxeacademy.com
      if (process.env.NODE_ENV === 'production') {
        return [
          {
            source: '/api/v1/:path*',
            destination: 'https://api.taysluxeacademy.com/api/v1/:path*',
          },
        ];
      }
    }
    
    // If NEXT_PUBLIC_API_URL is set, don't use rewrites - use direct API calls
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

