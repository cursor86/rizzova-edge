import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    // Product media is served by Cloudflare Images, already resized per variant.
    remotePatterns: [{ protocol: "https", hostname: "imagedelivery.net" }, { protocol: "https", hostname: "rizzova.com" }],
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default config;
