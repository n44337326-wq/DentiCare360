import { defineConfig } from "prisma/config";

// Prisma reads this config instead of a `url` in schema.prisma (Prisma 7+).
// Load the same env files Next.js uses so `prisma` CLI and the app agree.
process.loadEnvFile?.(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5433/postgres",
  },
});
