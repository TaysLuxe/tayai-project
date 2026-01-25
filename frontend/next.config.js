/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  // Remove standalone output for Railway - use standard build instead
  // output: 'standalone',
  images: {
    unoptimized: true, // Disable image optimization for Railway deployment
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  },
  webpack: (config) => {
    const projectRoot = path.resolve(__dirname);
    
    // Explicitly set alias for @ to project root
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': projectRoot,
    };
    
    // Ensure modules are resolved from project root
    config.resolve.modules = [
      path.resolve(projectRoot, 'node_modules'),
      'node_modules',
      ...(config.resolve.modules || []),
    ];
    
    return config;
  },
}

module.exports = nextConfig

