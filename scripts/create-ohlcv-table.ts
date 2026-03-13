/**
 * scripts/create-ohlcv-table.ts
 *
 * Creates the ohlcv_bars table in Supabase via direct PostgreSQL connection.
 *
 * Usage:
 *   cd ~/Flacko_AI/flacko-ai
 *   npx tsx scripts/create-ohlcv-table.ts
 *
 * Requires environment variable (or .env.local):
 *   SUPABASE_DB_PASSWORD=<your-db-password>
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local manually (no dotenv dependency needed)
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
// Try direct connection first (port 5432), fallback to session pooler (port 5432 via direct)
// Supabase direct: db.{ref}.supabase.co:5432, user: postgres
const DB_HOST = "db.rctbqtemkahdbifxrqom.supabase.co";
const DB_PORT = 5432;
const DB_USER = "postgres";
const DB_NAME = "postgres";

async function main() {
  if (!DB_PASSWORD) {
    console.error("❌ SUPABASE_DB_PASSWORD not set in .env.local");
    process.exit(1);
  }

  // Dynamic import of pg (not a NextJS dep, may need install)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Client: any;
  try {
    // @ts-ignore — pg has no types in this project; use dynamic import
    const pg = await import("pg");
    Client = pg.default?.Client ?? pg.Client;
  } catch {
    console.error("❌ pg package not found. Run: npm install pg --save-dev");
    process.exit(1);
  }

  const client = new Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase PostgreSQL");

    const sqlPath = path.resolve(process.cwd(), "scripts/create-ohlcv-table.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    await client.query(sql);
    console.log("✅ ohlcv_bars table created (or already exists)");

    // Verify
    const res = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ohlcv_bars'"
    );
    if (res.rows[0].count === "1") {
      console.log("✅ Table verified in database");
    } else {
      console.error("❌ Table not found after creation");
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
