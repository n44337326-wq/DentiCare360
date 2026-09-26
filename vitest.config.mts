import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    // Integration tests boot a real (embedded) Postgres per file.
    testTimeout: 30_000,
    hookTimeout: 90_000,
    env: { NODE_ENV: "test", AUTH_SECRET: "test-secret-not-for-production", UPLOAD_DIR: ".data/test-uploads" },
  },
});
