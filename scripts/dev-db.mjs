// Embedded PostgreSQL for local development (PGlite exposed over the Postgres
// wire protocol). Real Postgres semantics — unique constraints, transactions,
// enums — with zero installation. Data persists in ./.data/pgdata.
//
//   npm run db:dev            start the server (keep it running)
//
// Production does NOT use this: set DATABASE_URL to a managed Postgres.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdirSync } from "node:fs";

const port = Number(process.env.DEV_DB_PORT ?? 5433);
const dataDir = process.env.DEV_DB_DIR ?? ".data/pgdata";
mkdirSync(dataDir, { recursive: true });

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 20 });
await server.start();
console.log(`[dev-db] PostgreSQL-compatible server listening on postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);
console.log(`[dev-db] data directory: ${dataDir}`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
