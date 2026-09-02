import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default Server Action body limit is 1MB; raised to fit attachment
  // uploads (up to 5 files x 10MB, plus multipart overhead).
  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },
  // Dev-only: lets a phone/other device on the same network use HMR when
  // testing against this machine's LAN address instead of localhost.
  allowedDevOrigins: ["172.15.4.23"],
};

export default nextConfig;
