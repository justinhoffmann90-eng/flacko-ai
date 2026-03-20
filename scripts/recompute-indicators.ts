/**
 * Recompute indicators for all tickers from existing ohlcv_bars data.
 * No Yahoo Finance calls — purely reads bars from Supabase, computes indicators, writes back.
 *
 * Usage:
 *   npx tsx scripts/recompute-indicators.ts
 *   npx tsx scripts/recompute-indicators.ts --ticker TSLA
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { computeAllIndicators, OHLCVBar } from "../lib/indicators";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

loadEnvLocal();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ALL_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "AMZN", "META", "MU", "GOOGL", "BABA", "^VIX"];
const TIMEFRAMES = ["daily", "weekly"] as const;

async function fetchAllBars(ticker: string, timeframe: string) {
  const rows: any[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("ohlcv_bars")
      .select("*")
      .eq("ticker", ticker)
      .eq("timeframe", timeframe)
      .order("bar_date", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
}

async function main() {
  const tickerArg = process.argv.find(a => a.startsWith("--ticker="))?.split("=")[1]
    ?? (process.argv.includes("--ticker") ? process.argv[process.argv.indexOf("--ticker") + 1] : null);
  const tickers = tickerArg ? [tickerArg.toUpperCase()] : ALL_TICKERS;

  for (const ticker of tickers) {
    for (const timeframe of TIMEFRAMES) {
      console.log(`\n📊 ${ticker}/${timeframe}...`);

      const rows = await fetchAllBars(ticker, timeframe);
      if (rows.length < 30) {
        console.log(`  ⚠ Only ${rows.length} rows, skipping`);
        continue;
      }

      // Convert to OHLCVBar format for computeAllIndicators
      const bars: OHLCVBar[] = rows.map((r: any) => ({
        date: r.bar_date,
        open: Number(r.open),
        high: Number(r.high),
        low: Number(r.low),
        close: Number(r.close),
        volume: Number(r.volume ?? 0),
      }));

      // Compute indicators
      const indicatorBars = computeAllIndicators(bars);

      // Find rows that need updating (missing indicators)
      const updates: any[] = [];
      for (let i = 0; i < indicatorBars.length; i++) {
        const bar = indicatorBars[i];
        const original = rows[i];

        // Check if indicators are missing
        if (original.rsi == null || original.bxt == null || original.ema_9 == null) {
          updates.push({
            ticker,
            bar_date: original.bar_date,
            timeframe,
            open: original.open,
            high: original.high,
            low: original.low,
            close: original.close,
            volume: original.volume,
            rsi: bar.rsi ?? null,
            bxt: bar.bxt ?? null,
            bxt_state: bar.bxt_state ?? null,
            bxt_consecutive_ll: bar.bxt_consecutive_ll ?? null,
            ema_9: bar.ema_9 ?? null,
            ema_13: bar.ema_13 ?? null,
            ema_21: bar.ema_21 ?? null,
            sma_200: bar.sma_200 ?? null,
          });
        }
      }

      if (updates.length === 0) {
        console.log(`  ✅ All ${rows.length} bars have indicators`);
        continue;
      }

      console.log(`  📝 Updating ${updates.length} bars with computed indicators...`);

      // Upsert in batches of 500
      for (let i = 0; i < updates.length; i += 500) {
        const batch = updates.slice(i, i + 500);
        const { error } = await supabase
          .from("ohlcv_bars")
          .upsert(batch, { onConflict: "ticker,bar_date,timeframe" });
        if (error) {
          console.log(`  ❌ Upsert error: ${error.message}`);
        }
      }

      console.log(`  ✅ Updated ${updates.length} bars`);
    }
  }

  console.log("\n✅ All indicators recomputed");
}

main();
