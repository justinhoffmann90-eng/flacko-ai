/**
 * scripts/migrate-add-ticker.ts
 *
 * Adds ticker TEXT NOT NULL DEFAULT 'TSLA' to all 5 ORB tables and rekeys constraints.
 *
 * Usage: npx tsx scripts/migrate-add-ticker.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runSQL(sql: string, label: string) {
  console.log(`Running: ${label}...`);
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error) {
    // Try direct approach via REST — Supabase doesn't have exec_sql by default
    // We'll use the postgres connection string approach instead
    console.error(`  RPC failed: ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${label}`);
  return true;
}

async function main() {
  // Since Supabase JS client doesn't support raw SQL execution directly,
  // we need to use the Supabase SQL editor approach via the Management API.
  // Instead, let's use the direct postgres connection.

  // Actually, let's use the supabase client to check if columns already exist
  // by trying to query with the ticker column.

  console.log("Checking current schema state...");

  // Test if ticker column already exists on orb_setup_states
  const { error: testErr } = await supabase
    .from("orb_setup_states")
    .select("ticker")
    .limit(1);

  if (!testErr) {
    console.log("ticker column already exists on orb_setup_states — migration may have already run");
  }

  // We need to run raw SQL. Let's output the migration SQL and run it via the
  // Supabase Management API or direct pg connection.

  const migrationSQL = `
-- ============================================================
-- Migration: Add ticker column to all 5 ORB tables
-- ============================================================

-- 1. orb_setup_states — add ticker, rekey PK to (ticker, setup_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_setup_states' AND column_name = 'ticker') THEN
    ALTER TABLE orb_setup_states ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    ALTER TABLE orb_setup_states DROP CONSTRAINT IF EXISTS orb_setup_states_pkey;
    ALTER TABLE orb_setup_states ADD PRIMARY KEY (ticker, setup_id);
  END IF;
END $$;

-- 2. orb_backtest_instances — add ticker, rekey UNIQUE to (ticker, setup_id, signal_date)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_backtest_instances' AND column_name = 'ticker') THEN
    ALTER TABLE orb_backtest_instances ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    ALTER TABLE orb_backtest_instances DROP CONSTRAINT IF EXISTS orb_backtest_instances_setup_id_signal_date_key;
    ALTER TABLE orb_backtest_instances ADD CONSTRAINT orb_backtest_instances_ticker_setup_signal UNIQUE (ticker, setup_id, signal_date);
  END IF;
END $$;

-- 3. orb_daily_indicators — add ticker, rekey PK to (ticker, date)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_daily_indicators' AND column_name = 'ticker') THEN
    ALTER TABLE orb_daily_indicators ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    ALTER TABLE orb_daily_indicators DROP CONSTRAINT IF EXISTS orb_daily_indicators_pkey;
    ALTER TABLE orb_daily_indicators ADD PRIMARY KEY (ticker, date);
  END IF;
END $$;

-- 4. orb_signal_log — add ticker column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_signal_log' AND column_name = 'ticker') THEN
    ALTER TABLE orb_signal_log ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    -- Update index to include ticker
    DROP INDEX IF EXISTS idx_orb_signal_log_setup;
    CREATE INDEX idx_orb_signal_log_setup ON orb_signal_log(ticker, setup_id, event_date);
  END IF;
END $$;

-- 5. orb_tracker — add ticker column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_tracker' AND column_name = 'ticker') THEN
    ALTER TABLE orb_tracker ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    -- Update index to include ticker
    DROP INDEX IF EXISTS idx_orb_tracker_setup;
    CREATE INDEX idx_orb_tracker_setup ON orb_tracker(ticker, setup_id, status);
  END IF;
END $$;
`;

  console.log("\n=== Migration SQL ===");
  console.log(migrationSQL);
  console.log("=== End Migration SQL ===\n");

  // Write the migration file
  const migrationPath = path.resolve(process.cwd(), "supabase/migrations/20260320000000_add_ticker_to_orb_tables.sql");
  fs.writeFileSync(migrationPath, migrationSQL.trim() + "\n");
  console.log(`Migration file written to: ${migrationPath}`);

  // Now execute via psql if available, otherwise prompt user
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (dbPassword) {
    const { execSync } = await import("child_process");
    const dbHost = "db.rctbqtemkahdbifxrqom.supabase.co";
    const connStr = `postgresql://postgres.rctbqtemkahdbifxrqom:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

    try {
      console.log("Executing migration via psql...");
      const result = execSync(`psql "${connStr}" -f "${migrationPath}" 2>&1`, {
        encoding: "utf8",
        timeout: 30000,
      });
      console.log(result);
      console.log("✓ Migration completed successfully!");
    } catch (e: any) {
      console.error("psql execution failed:", e.message);
      console.log("\nPlease run this SQL in the Supabase SQL Editor manually.");
    }
  } else {
    console.log("\nNo SUPABASE_DB_PASSWORD found. Please run the SQL above in the Supabase SQL Editor.");
  }
}

main().catch(console.error);
