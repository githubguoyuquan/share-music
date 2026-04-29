import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.36"],
  // Prisma + pg must not be bundled into Route Handlers (Turbopack); otherwise runtime can throw and return empty 500.
  serverExternalPackages: ["@prisma/client", "prisma", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
