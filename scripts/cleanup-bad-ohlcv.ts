/**
 * scripts/cleanup-bad-ohlcv.ts
 *
 * Deletes all ohlcv_bars rows where close <= 0 OR open <= 0.
 *
 * Usage: npx tsx scripts/cleanup-bad-ohlcv.ts
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

async function main() {
  console.log("Checking for bad rows (close <= 0 OR open <= 0)...");

  // Count bad rows first
  const { count: badCloseCount } = await supabase
    .from("ohlcv_bars")
    .select("*", { count: "exact", head: true })
    .lte("close", 0);

  const { count: badOpenCount } = await supabase
    .from("ohlcv_bars")
    .select("*", { count: "exact", head: true })
    .lte("open", 0);

  console.log(`Found ${badCloseCount ?? 0} rows with close <= 0`);
  console.log(`Found ${badOpenCount ?? 0} rows with open <= 0`);

  // Delete rows where close <= 0
  if (badCloseCount && badCloseCount > 0) {
    const { error: err1 } = await supabase
      .from("ohlcv_bars")
      .delete()
      .lte("close", 0);
    if (err1) {
      console.error("Error deleting close <= 0 rows:", err1.message);
    } else {
      console.log(`Deleted rows with close <= 0`);
    }
  }

  // Delete rows where open <= 0 (may overlap with above)
  if (badOpenCount && badOpenCount > 0) {
    const { error: err2 } = await supabase
      .from("ohlcv_bars")
      .delete()
      .lte("open", 0);
    if (err2) {
      console.error("Error deleting open <= 0 rows:", err2.message);
    } else {
      console.log(`Deleted rows with open <= 0`);
    }
  }

  // Verify
  const { count: remainingBad } = await supabase
    .from("ohlcv_bars")
    .select("*", { count: "exact", head: true })
    .or("close.lte.0,open.lte.0");

  console.log(`Remaining bad rows: ${remainingBad ?? 0}`);
  console.log("Done!");
}

main().catch(console.error);
