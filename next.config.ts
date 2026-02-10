import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      { // Tambahkan img.lazcdn.com
        protocol: 'https',
        hostname: 'img.lazcdn.com',
        port: '',
        pathname: '/**',
      },
      { // Tambahkan plus.unsplash.com
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
