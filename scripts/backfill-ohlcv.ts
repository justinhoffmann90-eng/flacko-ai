/**
 * scripts/backfill-ohlcv.ts
 *
 * Backfills the ohlcv_bars table with historical data + pre-computed indicators.
 * Fetches from Yahoo Finance directly (no yahoo-finance2 library).
 * Runs on Mac Mini — no Vercel rate limit concerns.
 *
 * Usage:
 *   cd ~/Flacko_AI/flacko-ai
 *   npx tsx scripts/backfill-ohlcv.ts                          # all tickers, all timeframes
 *   npx tsx scripts/backfill-ohlcv.ts --ticker TSLA            # one ticker, all timeframes
 *   npx tsx scripts/backfill-ohlcv.ts --ticker TSLA --timeframe weekly
 *   npx tsx scripts/backfill-ohlcv.ts --mode incremental       # only fetch new bars
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import {
  computeAllIndicators,
  OHLCVBar,
  IndicatorBar,
} from "../lib/indicators";

// ─── Config ───────────────────────────────────────────────────────────────────

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

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rctbqtemkahdbifxrqom.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_TICKERS = [
  "TSLA",
  "QQQ",
  "SPY",
  "NVDA",
  "AAPL",
  "GOOGL",
  "MU",
  "BABA",
  "AMZN",
  "META",
  "^VIX",
];

type Timeframe = "weekly" | "daily" | "monthly";
const TIMEFRAMES: Timeframe[] = ["weekly", "daily", "monthly"];

const BATCH_SIZE = 500; // Max rows per Supabase upsert

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}
function hasFlag(flag: string): boolean {
  return args.includes(flag);
}

const tickerArg = getArg("--ticker");
const timeframeArg = getArg("--timeframe") as Timeframe | undefined;
const modeArg = getArg("--mode") || "full"; // 'full' or 'incremental'
const dryRun = hasFlag("--dry-run");

const tickers = tickerArg ? [tickerArg.toUpperCase()] : DEFAULT_TICKERS;
const timeframes: Timeframe[] = timeframeArg ? [timeframeArg] : TIMEFRAMES;

// ─── Yahoo Finance fetch ───────────────────────────────────────────────────────

const YAHOO_INTERVAL: Record<Timeframe, string> = {
  weekly: "1wk",
  daily: "1d",
  monthly: "1mo",
};

const START_DATE = "2005-01-01";

/**
 * Fetch Yahoo Finance data via curl (avoids Node.js-specific rate limiting).
 * curl uses the system's network stack + macOS keychain cookies, which bypass
 * the IP-based rate limits that hit Node.js fetch.
 */
async function fetchYahoo(
  ticker: string,
  timeframe: Timeframe,
  afterDate?: string // ISO date string — only fetch bars after this
): Promise<OHLCVBar[]> {
  const interval = YAHOO_INTERVAL[timeframe];

  // Determine period1
  const period1Date = afterDate ? new Date(afterDate) : new Date(START_DATE);
  // Add one day to afterDate to avoid re-fetching the last known bar
  if (afterDate) period1Date.setDate(period1Date.getDate() + 1);

  const p1 = Math.floor(period1Date.getTime() / 1000);
  const p2 = Math.floor(Date.now() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&period1=${p1}&period2=${p2}`;

  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use curl — bypasses Node.js rate limiting issues
      const curlCmd = `curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" "${url}"`;
      const raw = execSync(curlCmd, { timeout: 30000 }).toString();

      // Check for plain-text rate limit response before JSON parse
      if (raw.trim() === "Too Many Requests" || raw.trim().startsWith("Too Many Requests")) {
        const wait = Math.pow(2, attempt + 1) * 5000 + Math.random() * 3000;
        console.log(`  ⏳ Rate limit (plain). Waiting ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        // Could be HTML error page — treat as rate limit and retry
        const wait = Math.pow(2, attempt + 1) * 5000 + Math.random() * 3000;
        console.log(`  ⏳ Non-JSON response (possibly rate limited). Waiting ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }

      // Check for rate limit in JSON
      if (data?.chart?.error?.code === "Too Many Requests" || raw.includes('"Too Many Requests"')) {
        const wait = Math.pow(2, attempt + 1) * 5000 + Math.random() * 3000;
        console.log(`  ⏳ Rate limit (JSON). Waiting ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }

      const result = data?.chart?.result?.[0];
      if (!result) throw new Error(`No data in Yahoo response for ${ticker}`);

      const timestamps: number[] = result.timestamp ?? [];
      const quote = result.indicators?.quote?.[0] ?? {};
      const opens: number[] = quote.open ?? [];
      const highs: number[] = quote.high ?? [];
      const lows: number[] = quote.low ?? [];
      const closes: number[] = quote.close ?? [];
      const volumes: number[] = quote.volume ?? [];

      const bars: OHLCVBar[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] == null || opens[i] == null) continue;
        bars.push({
          date: new Date(timestamps[i] * 1000),
          open: opens[i],
          high: highs[i] ?? opens[i],
          low: lows[i] ?? opens[i],
          close: closes[i],
          volume: volumes[i] ?? 0,
        });
      }

      return bars.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Too Many Requests") || msg.includes("rate limit") || msg.includes("429")) {
        const wait = Math.pow(2, attempt + 1) * 3000 + Math.random() * 2000;
        console.log(`  ⏳ Rate limit error. Waiting ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }
      if (attempt < maxRetries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Max retries for ${ticker} ${timeframe}`);
}

// ─── Incremental: get latest bar date from DB ─────────────────────────────────

async function getLatestBarDate(
  ticker: string,
  timeframe: Timeframe
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ohlcv_bars")
    .select("bar_date")
    .eq("ticker", ticker)
    .eq("timeframe", timeframe)
    .order("bar_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data?.bar_date ?? null;
}

// ─── Incremental: get lookback context bars from DB ───────────────────────────

async function getContextBars(
  ticker: string,
  timeframe: Timeframe,
  count: number = 300
): Promise<OHLCVBar[]> {
  const { data, error } = await supabase
    .from("ohlcv_bars")
    .select("bar_date, open, high, low, close, volume")
    .eq("ticker", ticker)
    .eq("timeframe", timeframe)
    .order("bar_date", { ascending: false })
    .limit(count);

  if (error || !data) return [];

  return data
    .map((row: any) => ({
      date: new Date(row.bar_date),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }))
    .reverse(); // Ascending order
}

// ─── Batch upsert ─────────────────────────────────────────────────────────────

async function upsertBatch(rows: object[]): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("ohlcv_bars")
      .upsert(batch, { onConflict: "ticker,timeframe,bar_date" });

    if (error) {
      // Check if table doesn't exist
      if (error.code === "42P01") {
        console.error(
          "\n❌ Table ohlcv_bars does not exist!\n" +
            "   Run: npx tsx scripts/create-ohlcv-table.ts\n" +
            "   Or paste scripts/create-ohlcv-table.sql into the Supabase SQL Editor.\n"
        );
        process.exit(1);
      }
      throw new Error(`Supabase upsert error: ${error.message}`);
    }
  }
}

// ─── Convert IndicatorBar → DB row ────────────────────────────────────────────

function toDbRow(
  bar: IndicatorBar,
  ticker: string,
  timeframe: Timeframe
): object {
  return {
    ticker,
    timeframe,
    bar_date: bar.date.toISOString().slice(0, 10),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
    rsi: bar.rsi,
    bxt: bar.bxt,
    bxt_state: bar.bxt_state,
    bxt_consecutive_ll: bar.bxt_consecutive_ll,
    ema_9: bar.ema_9,
    ema_13: bar.ema_13,
    ema_21: bar.ema_21,
    sma_200: bar.sma_200,
  };
}

// ─── Main backfill logic per ticker+timeframe ─────────────────────────────────

async function backfillOne(ticker: string, timeframe: Timeframe): Promise<void> {
  const label = `${ticker}/${timeframe}`;

  if (modeArg === "incremental") {
    // Incremental: fetch only new bars and recompute with context
    const latestDate = await getLatestBarDate(ticker, timeframe);
    if (!latestDate) {
      console.log(`  ${label}: No existing data, switching to full backfill...`);
      return backfillOneFull(ticker, timeframe);
    }

    console.log(`  ${label}: Last bar ${latestDate}, fetching newer...`);
    const newBars = await fetchYahoo(ticker, timeframe, latestDate);

    if (newBars.length === 0) {
      console.log(`  ${label}: Already up to date`);
      return;
    }

    // Fetch context for indicator warmup
    const contextBars = await getContextBars(ticker, timeframe, 300);
    const allBars = [...contextBars, ...newBars];
    const indicatorBars = computeAllIndicators(allBars);

    // Only upsert the new bars (last newBars.length)
    const newIndicatorBars = indicatorBars.slice(contextBars.length);
    const rows = newIndicatorBars.map((bar) => toDbRow(bar, ticker, timeframe));

    if (!dryRun) {
      await upsertBatch(rows);
    }
    console.log(
      `  ${label}: ✅ Upserted ${rows.length} new bars${dryRun ? " (dry run)" : ""}`
    );
  } else {
    await backfillOneFull(ticker, timeframe);
  }
}

async function backfillOneFull(ticker: string, timeframe: Timeframe): Promise<void> {
  const label = `${ticker}/${timeframe}`;

  console.log(`  ${label}: Fetching from Yahoo Finance...`);
  const bars = await fetchYahoo(ticker, timeframe);
  console.log(`  ${label}: ${bars.length} bars fetched, computing indicators...`);

  if (bars.length === 0) {
    console.log(`  ${label}: ⚠️ No bars returned, skipping`);
    return;
  }

  const indicatorBars = computeAllIndicators(bars);
  const rows = indicatorBars.map((bar) => toDbRow(bar, ticker, timeframe));

  if (!dryRun) {
    await upsertBatch(rows);
    console.log(`  ${label}: ✅ Upserted ${rows.length} rows`);
  } else {
    console.log(`  ${label}: ✅ ${rows.length} rows (dry run, not inserted)`);
    // Show sample
    if (rows.length > 0) {
      console.log(`  ${label}: Sample first row:`, rows[0]);
      console.log(`  ${label}: Sample last row:`, rows[rows.length - 1]);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 OHLCV Backfill`);
  console.log(
    `   Mode: ${modeArg} | Tickers: ${tickers.join(", ")} | Timeframes: ${timeframes.join(", ")}${dryRun ? " | DRY RUN" : ""}\n`
  );

  // Verify table exists first
  const { error: tableCheck } = await supabase
    .from("ohlcv_bars")
    .select("id")
    .limit(1);
  if (tableCheck?.code === "42P01") {
    console.error(
      "❌ Table ohlcv_bars does not exist!\n" +
        "   Run: npx tsx scripts/create-ohlcv-table.ts first\n"
    );
    process.exit(1);
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const ticker of tickers) {
    for (const timeframe of timeframes) {
      try {
        await backfillOne(ticker, timeframe);
        totalSuccess++;
        // Small delay between requests to be polite to Yahoo
        await sleep(1500);
      } catch (err) {
        console.error(`  ❌ ${ticker}/${timeframe} failed:`, err);
        totalFailed++;
      }
    }
  }

  console.log(`\n✅ Done: ${totalSuccess} succeeded, ${totalFailed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
