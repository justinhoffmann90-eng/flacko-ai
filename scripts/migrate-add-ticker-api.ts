/**
 * scripts/migrate-add-ticker-api.ts
 *
 * Executes the ticker column migration via Supabase's postgrest-compatible approach.
 * Uses individual ALTER statements via the REST API.
 *
 * Usage: npx tsx scripts/migrate-add-ticker-api.ts
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

// Use the Supabase SQL endpoint directly
async function executeSql(sql: string): Promise<{ success: boolean; error?: string }> {
  // Supabase exposes a /rest/v1/rpc endpoint, but for raw SQL we need
  // to use the pg endpoint or create a helper function.
  // Let's try using the supabase-js query builder to create a pg function first.

  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  // Actually, let's use the direct SQL API available in newer Supabase
  const sqlUrl = `${SUPABASE_URL}/pg/query`;

  const res = await fetch(sqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `HTTP ${res.status}: ${text}` };
  }

  return { success: true };
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Check if migration already done
  const { error: testErr } = await supabase
    .from("orb_setup_states")
    .select("ticker")
    .limit(1);

  if (!testErr) {
    console.log("✓ ticker column already exists on orb_setup_states — checking other tables...");

    // Verify all tables
    const tables = ["orb_backtest_instances", "orb_daily_indicators", "orb_signal_log", "orb_tracker"];
    for (const table of tables) {
      const { error } = await supabase.from(table).select("ticker").limit(1);
      if (error) {
        console.log(`  ✗ ${table}: ${error.message}`);
      } else {
        console.log(`  ✓ ${table}: ticker column exists`);
      }
    }

    // Count existing TSLA rows to verify
    const { count } = await supabase
      .from("orb_setup_states")
      .select("*", { count: "exact", head: true })
      .eq("ticker", "TSLA");
    console.log(`\norb_setup_states TSLA rows: ${count}`);

    return;
  }

  console.log("ticker column does not exist yet. Attempting migration...");

  // Try the /pg/query endpoint
  const migrationStatements = [
    {
      label: "Add ticker to orb_setup_states",
      sql: `ALTER TABLE orb_setup_states ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';`,
    },
    {
      label: "Rekey orb_setup_states PK",
      sql: `ALTER TABLE orb_setup_states DROP CONSTRAINT IF EXISTS orb_setup_states_pkey; ALTER TABLE orb_setup_states ADD PRIMARY KEY (ticker, setup_id);`,
    },
    {
      label: "Add ticker to orb_backtest_instances",
      sql: `ALTER TABLE orb_backtest_instances ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';`,
    },
    {
      label: "Rekey orb_backtest_instances UNIQUE",
      sql: `ALTER TABLE orb_backtest_instances DROP CONSTRAINT IF EXISTS orb_backtest_instances_setup_id_signal_date_key; ALTER TABLE orb_backtest_instances ADD CONSTRAINT orb_backtest_instances_ticker_setup_signal UNIQUE (ticker, setup_id, signal_date);`,
    },
    {
      label: "Add ticker to orb_daily_indicators",
      sql: `ALTER TABLE orb_daily_indicators ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';`,
    },
    {
      label: "Rekey orb_daily_indicators PK",
      sql: `ALTER TABLE orb_daily_indicators DROP CONSTRAINT IF EXISTS orb_daily_indicators_pkey; ALTER TABLE orb_daily_indicators ADD PRIMARY KEY (ticker, date);`,
    },
    {
      label: "Add ticker to orb_signal_log",
      sql: `ALTER TABLE orb_signal_log ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';`,
    },
    {
      label: "Reindex orb_signal_log",
      sql: `DROP INDEX IF EXISTS idx_orb_signal_log_setup; CREATE INDEX idx_orb_signal_log_setup ON orb_signal_log(ticker, setup_id, event_date);`,
    },
    {
      label: "Add ticker to orb_tracker",
      sql: `ALTER TABLE orb_tracker ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';`,
    },
    {
      label: "Reindex orb_tracker",
      sql: `DROP INDEX IF EXISTS idx_orb_tracker_setup; CREATE INDEX idx_orb_tracker_setup ON orb_tracker(ticker, setup_id, status);`,
    },
  ];

  for (const stmt of migrationStatements) {
    const result = await executeSql(stmt.sql);
    if (result.success) {
      console.log(`✓ ${stmt.label}`);
    } else {
      console.error(`✗ ${stmt.label}: ${result.error}`);
      console.log("\n--- The /pg/query endpoint may not be available.");
      console.log("Please run the migration SQL file in the Supabase SQL Editor:");
      console.log("File: supabase/migrations/20260320000000_add_ticker_to_orb_tables.sql");
      return;
    }
  }

  console.log("\n✓ Migration completed successfully!");
}

main().catch(console.error);
