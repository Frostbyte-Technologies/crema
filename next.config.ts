import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ponytail: starter zips go through a server action; Vercel caps request bodies at 4.5MB.
    // Switch to @vercel/blob client uploads if starters ever outgrow that.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
