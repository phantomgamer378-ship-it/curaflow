import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: [
    "@clinic/auth",
    "@clinic/queue",
    "@clinic/types",
    "@clinic/ui"
  ]
};

export default nextConfig;
