/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'myfamily.grade.sbs'],
  },
  // إعدادات الملفات الثابتة
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  // ضمان توليد CSS بشكل صحيح
  experimental: {
    optimizeCss: false,
  },
  // إعدادات إضافية للـ static files
  generateBuildId: async () => {
    // استخدام timestamp كـ build ID لضمان عدم cache الملفات القديمة
    return `build-${Date.now()}`
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    
    // ضمان أن CSS يتم توليده بشكل صحيح
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            styles: {
              name: 'styles',
              test: /\.(css|scss)$/,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
