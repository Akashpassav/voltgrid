import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.cursor.com", "*.cursor.sh"],
};

export default nextConfig;
