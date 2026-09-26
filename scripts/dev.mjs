// `npm run dev` — one command from a fresh clone to a running app.
//
//   1. If DATABASE_URL points at the embedded dev database (127.0.0.1:5433), start it
//      (PGlite over the Postgres wire protocol; data persists in ./.data/pgdata).
//   2. First run only: apply the Prisma migrations and load the fictional demo data.
//   3. Start `next dev`.
//
// Pointing DATABASE_URL at any other Postgres skips step 1 and runs Next directly
// (run `npm run db:setup` yourself to migrate/seed that database).
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* .env.local is optional */
}

const DEFAULT_URL = "postgresql://postgres:postgres@127.0.0.1:5433/postgres";
process.env.DATABASE_URL ??= DEFAULT_URL;
const url = new URL(process.env.DATABASE_URL);
const embedded = ["127.0.0.1", "localhost"].includes(url.hostname) && url.port === "5433";

const run = (script, args = [], label = script) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { stdio: "inherit", env: process.env });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${label} exited with code ${code}`))));
  });

let db;
let server;

async function stopDatabase() {
  try {
    await server?.stop();
    await db?.close();
  } catch {
    /* shutting down */
  }
}

if (embedded) {
  const dataDir = process.env.DEV_DB_DIR ?? ".data/pgdata";
  mkdirSync(dataDir, { recursive: true });
  db = await PGlite.create(dataDir);
  server = new PGLiteSocketServer({ db, port: Number(url.port), host: "127.0.0.1", maxConnections: 20 });
  await server.start();
  console.log(`[dev] embedded PostgreSQL listening on ${url.hostname}:${url.port} (data in ${dataDir})`);

  const { rows } = await db.query(`select to_regclass('public."User"') as t`);
  if (!rows[0].t) {
    console.log("[dev] empty database — applying migrations and loading demo data…");
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"], "prisma migrate deploy");
    await run("node_modules/tsx/dist/cli.mjs", ["prisma/seed.ts"], "seed");
  }
}

if (!existsSync("src/generated/prisma/client.ts")) {
  await run("node_modules/prisma/build/index.js", ["generate"], "prisma generate");
}

const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

const shutdown = async (code = 0) => {
  next.kill();
  await stopDatabase();
  process.exit(code);
};
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
next.on("exit", (code) => shutdown(code ?? 0));
