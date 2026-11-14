import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows the hosted preview domain to load the dev server's assets
  // (Next blocks cross-origin dev requests by default).
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
