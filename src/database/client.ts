import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Single PrismaClient per server process (survives Next.js dev hot-reload).
 * Talks to PostgreSQL through the `pg` driver adapter. In local development
 * DATABASE_URL points at the embedded server started by `npm run db:dev`; in
 * production it points at any managed Postgres.
 */
const globalForDb = globalThis as unknown as { __denticareDb?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and configure it.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) });
}

export const db: PrismaClient = globalForDb.__denticareDb ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.__denticareDb = db;

export type Db = typeof db;
export { Prisma } from "@/generated/prisma/client";
