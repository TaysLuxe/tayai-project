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
  // Note: If you want to use Next.js rewrites to proxy API requests instead of direct calls,
  // uncomment the rewrites function below and set BACKEND_API_URL in Railway.
  // However, using a custom domain for the backend (e.g., api.taysluxeacademy.com) is recommended.
  //
  // async rewrites() {
  //   if (process.env.BACKEND_API_URL) {
  //     const backendUrl = process.env.BACKEND_API_URL.replace(/\/api\/v1\/?$/, '');
  //     return [
  //       {
  //         source: '/api/v1/:path*',
  //         destination: `${backendUrl}/api/v1/:path*`,
  //       },
  //     ];
  //   }
  //   return [];
  // },
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

