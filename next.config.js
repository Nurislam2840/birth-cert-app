/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // 🟢 .ttf ফাইল হ্যান্ডেল করার জন্য Webpack 5 এর asset/resource ব্যবহার করা হলো
    config.module.rules.push({
      test: /\.(ttf|woff|woff2)$/,
      type: 'asset/resource',
    });

    return config;
  },
};

module.exports = nextConfig;