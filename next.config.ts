import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package-lock.json in the home directory
  // makes Next infer ~ as the root, which breaks Turbopack file-watching /
  // CSS cache invalidation in dev.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
        pathname: '/**',
      },
      {
        // Cloudflare Stream auto-thumbnails (customer-<code>.cloudflarestream.com).
        protocol: 'https',
        hostname: '**.cloudflarestream.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/@:username',
        destination: '/:username',
      },
    ];
  },
};

export default nextConfig;
