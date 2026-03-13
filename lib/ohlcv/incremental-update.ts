/**
 * lib/ohlcv/incremental-update.ts
 *
 * Nightly incremental update for ohlcv_bars table.
 * Called from /api/orb/compute to keep the backtest DB fresh.
 *
 * Logic:
 *   1. For each ticker+timeframe, find the latest bar_date in ohlcv_bars
 *   2. Fetch only new bars from Yahoo since that date
 *   3. Load lookback context from DB to warm up indicator computation
 *   4. Compute indicators for new bars using the combined history
 *   5. Upsert new rows into ohlcv_bars
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  computeAllIndicators,
  OHLCVBar,
  IndicatorBar,
} from "@/lib/indicators";

// ─── Config ───────────────────────────────────────────────────────────────────

const TICKERS = [
  "TSLA",
  "QQQ",
  "SPY",
  "NVDA",
  "AAPL",
  "GOOGL",
  "MU",
  "BABA",
  "AMZN",
];

type Timeframe = "weekly" | "daily" | "monthly";
const TIMEFRAMES: Timeframe[] = ["weekly", "daily", "monthly"];

const YAHOO_INTERVAL: Record<Timeframe, string> = {
  weekly: "1wk",
  daily: "1d",
  monthly: "1mo",
};

const BATCH_SIZE = 500;
const LOOKBACK_CONTEXT = 300; // How many existing bars to load for indicator warmup

// ─── Yahoo Finance fetch (new bars only) ──────────────────────────────────────

async function fetchNewBars(
  ticker: string,
  timeframe: Timeframe,
  afterDate: string // ISO date — fetch bars strictly after this date
): Promise<OHLCVBar[]> {
  const interval = YAHOO_INTERVAL[timeframe];

  // Start one day after the last known bar
  const startDate = new Date(afterDate);
  startDate.setDate(startDate.getDate() + 1);

  const p1 = Math.floor(startDate.getTime() / 1000);
  const p2 = Math.floor(Date.now() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&period1=${p1}&period2=${p2}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error(`Yahoo rate limit for ${ticker}/${timeframe}`);
    throw new Error(`Yahoo HTTP ${res.status} for ${ticker}/${timeframe}`);
  }

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return [];

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
}

// ─── Load lookback context from DB ────────────────────────────────────────────

async function loadContextBars(
  supabase: SupabaseClient,
  ticker: string,
  timeframe: Timeframe,
  count: number = LOOKBACK_CONTEXT
): Promise<OHLCVBar[]> {
  const { data } = await supabase
    .from("ohlcv_bars")
    .select("bar_date, open, high, low, close, volume")
    .eq("ticker", ticker)
    .eq("timeframe", timeframe)
    .order("bar_date", { ascending: false })
    .limit(count);

  if (!data || data.length === 0) return [];

  return data
    .map((row: any) => ({
      date: new Date(row.bar_date),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }))
    .reverse(); // Ascending
}

// ─── Get latest bar date ───────────────────────────────────────────────────────

async function getLatestDate(
  supabase: SupabaseClient,
  ticker: string,
  timeframe: Timeframe
): Promise<string | null> {
  const { data } = await supabase
    .from("ohlcv_bars")
    .select("bar_date")
    .eq("ticker", ticker)
    .eq("timeframe", timeframe)
    .order("bar_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.bar_date ?? null;
}

// ─── Upsert batch ─────────────────────────────────────────────────────────────

async function upsertRows(
  supabase: SupabaseClient,
  rows: object[]
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("ohlcv_bars")
      .upsert(batch, { onConflict: "ticker,timeframe,bar_date" });

    if (error) throw new Error(`ohlcv upsert error: ${error.message}`);
  }
}

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

// ─── Main incremental update ───────────────────────────────────────────────────

interface UpdateResult {
  ticker: string;
  timeframe: Timeframe;
  newBars: number;
  skipped: boolean;
  error?: string;
}

export async function incrementalUpdateOHLCV(
  supabase: SupabaseClient,
  options: {
    tickers?: string[];
    timeframes?: Timeframe[];
    delayMs?: number; // Delay between Yahoo requests (default: 1000ms)
  } = {}
): Promise<UpdateResult[]> {
  const {
    tickers: tickerList = TICKERS,
    timeframes: timeframeList = TIMEFRAMES,
    delayMs = 1000,
  } = options;

  // Check if table exists
  const { error: tableCheck } = await supabase
    .from("ohlcv_bars")
    .select("id")
    .limit(1);

  if (tableCheck?.code === "42P01") {
    console.warn("[ohlcv] Table ohlcv_bars does not exist — skipping incremental update");
    return [];
  }

  const results: UpdateResult[] = [];

  for (const ticker of tickerList) {
    for (const timeframe of timeframeList) {
      try {
        const latestDate = await getLatestDate(supabase, ticker, timeframe);

        if (!latestDate) {
          // No data at all — skip (needs full backfill first)
          results.push({ ticker, timeframe, newBars: 0, skipped: true });
          continue;
        }

        // Check if already current (today's date or yesterday for market hours)
        const latestMs = new Date(latestDate).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (Date.now() - latestMs < oneDayMs * 2) {
          // Updated within last 2 days — skip
          results.push({ ticker, timeframe, newBars: 0, skipped: true });
          continue;
        }

        const newBars = await fetchNewBars(ticker, timeframe, latestDate);

        if (newBars.length === 0) {
          results.push({ ticker, timeframe, newBars: 0, skipped: true });
          continue;
        }

        // Load context for indicator warmup
        const contextBars = await loadContextBars(supabase, ticker, timeframe);
        const allBars = [...contextBars, ...newBars];
        const indicatorBars = computeAllIndicators(allBars);

        // Only upsert the genuinely new bars
        const newIndicatorBars = indicatorBars.slice(contextBars.length);
        const rows = newIndicatorBars.map((bar) => toDbRow(bar, ticker, timeframe));

        await upsertRows(supabase, rows);

        console.log(`[ohlcv] ${ticker}/${timeframe}: +${rows.length} bars`);
        results.push({ ticker, timeframe, newBars: rows.length, skipped: false });

        // Polite delay between Yahoo requests
        await new Promise((r) => setTimeout(r, delayMs));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ohlcv] ${ticker}/${timeframe} error: ${errMsg}`);
        results.push({ ticker, timeframe, newBars: 0, skipped: false, error: errMsg });
      }
    }
  }

  const totalNew = results.reduce((s, r) => s + r.newBars, 0);
  const failed = results.filter((r) => r.error).length;
  console.log(`[ohlcv] Incremental update complete: +${totalNew} bars, ${failed} errors`);

  return results;
}
