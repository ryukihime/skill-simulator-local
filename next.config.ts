import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/skill-simulator-local',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;



