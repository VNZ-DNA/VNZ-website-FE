import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Giới hạn Turbopack trong project Website độc lập.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
