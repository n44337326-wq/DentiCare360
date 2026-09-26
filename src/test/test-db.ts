import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { readdirSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";

/**
 * Spins up a REAL PostgreSQL-compatible database (PGlite over the wire
 * protocol), applies the project's actual migration files, and points
 * DATABASE_URL at it. Integration tests then exercise the real services, the
 * real Prisma client and real constraints (unique indexes, transactions) —
 * not mocks. Each test file gets its own isolated database.
 *
 * Call BEFORE importing anything that imports `@/database/client`.
 */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

export async function startTestDatabase() {
  const pg = await PGlite.create();

  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const migrations = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const name of migrations) await pg.exec(readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8"));

  const port = await freePort();
  const server = new PGLiteSocketServer({ db: pg, port, host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;

  return {
    pg,
    async stop() {
      await server.stop();
      await pg.close();
    },
  };
}
