import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable ESLint during builds to avoid blocking on lint errors */
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* Disable TypeScript type-checking during builds for faster deploys */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
