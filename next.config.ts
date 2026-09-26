import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. (A strict script CSP needs
 * per-request nonces; uploaded documents get their own sandboxing CSP in the
 * download route.)
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Camera/microphone are needed only for the online-consultation lobby, and only from this origin.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin the workspace root (there may be other lockfiles higher up the directory tree).
  turbopack: { root: process.cwd() },
  // The database driver and Prisma client must stay external to the server bundle.
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "bcryptjs"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
