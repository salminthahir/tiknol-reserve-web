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
      { // Tambahkan Supabase Storage
        protocol: 'https',
        hostname: 'dhpeqqscxivmbpihkflt.supabase.co',
        port: '',
        pathname: '/**',
      },
      { // Tambahkan placehold.co
        protocol: 'https',
        hostname: 'placehold.co',
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

export default nextConfig;
