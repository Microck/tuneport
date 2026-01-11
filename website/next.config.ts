import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  basePath: "/tuneport",
  assetPrefix: "/tuneport/",
};

export default nextConfig;
