import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'via.placeholder.com',
      'localhost',
      'rnfltpgus.github.io',
      'placehold.co',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    // ESLint 검사를 비활성화하여 빌드 오류를 방지합니다
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
