/**
 * scripts/backfill-meta.ts
 *
 * Backfills META daily OHLCV into ohlcv_bars from Yahoo Finance.
 * Uses longer retry delays to handle rate limiting.
 *
 * Usage: npx tsx scripts/backfill-meta.ts
 */

import { createClient } from "@supabase/supabase-js";
import { computeAllIndicators, OHLCVBar, IndicatorBar } from "../lib/indicators";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchYahooViaCurl(
  ticker: string,
  interval: string,
  period1: string,
): Promise<OHLCVBar[]> {
  const p1 = Math.floor(new Date(period1).getTime() / 1000);
  const p2 = Math.floor(Date.now() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&period1=${p1}&period2=${p2}`;

  const maxRetries = 6;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const curlCmd = `curl -s -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "${url}"`;
      const raw = execSync(curlCmd, { timeout: 30000 }).toString();

      if (raw.trim() === "Too Many Requests" || raw.includes("Too Many Requests")) {
        const wait = Math.pow(2, attempt + 1) * 10000 + Math.random() * 5000;
        console.log(`  Rate limit. Waiting ${Math.round(wait / 1000)}s (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(wait);
        continue;
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        const wait = Math.pow(2, attempt + 1) * 10000 + Math.random() * 5000;
        console.log(`  Non-JSON response. Waiting ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }

      if (data?.chart?.error) {
        const errMsg = data.chart.error.description || data.chart.error.code;
        if (errMsg?.includes("Too Many Requests") || errMsg?.includes("429")) {
          const wait = Math.pow(2, attempt + 1) * 10000 + Math.random() * 5000;
          console.log(`  Rate limit (JSON). Waiting ${Math.round(wait / 1000)}s...`);
          await sleep(wait);
          continue;
        }
        throw new Error(`Yahoo error: ${errMsg}`);
      }

      const result = data?.chart?.result?.[0];
      if (!result) throw new Error("No data in Yahoo response");

      const timestamps: number[] = result.timestamp ?? [];
      const quote = result.indicators?.quote?.[0] ?? {};
      const bars: OHLCVBar[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const c = quote.close?.[i];
        const o = quote.open?.[i];
        if (c == null || o == null) continue;
        bars.push({
          date: new Date(timestamps[i] * 1000),
          open: o,
          high: quote.high?.[i] ?? o,
          low: quote.low?.[i] ?? o,
          close: c,
          volume: quote.volume?.[i] ?? 0,
        });
      }

      return bars.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < maxRetries) {
        const wait = Math.pow(2, attempt + 1) * 5000;
        console.log(`  Error: ${msg}. Retrying in ${Math.round(wait / 1000)}s...`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  const ticker = "META";
  const timeframes = ["daily", "weekly", "monthly"] as const;
  const BATCH_SIZE = 500;

  // Check existing rows
  const { count } = await supabase
    .from("ohlcv_bars")
    .select("*", { count: "exact", head: true })
    .eq("ticker", ticker);

  console.log(`META current row count in ohlcv_bars: ${count ?? 0}`);

  for (const tf of timeframes) {
    console.log(`\nFetching META/${tf} from Yahoo Finance...`);

    const intervalMap = { daily: "1d", weekly: "1wk", monthly: "1mo" } as const;
    let rawBars: OHLCVBar[];
    try {
      rawBars = await fetchYahooViaCurl(ticker, intervalMap[tf], "2012-05-18");
    } catch (err) {
      console.error(`  Failed to fetch META/${tf}:`, err instanceof Error ? err.message : err);
      continue;
    }

    console.log(`  Fetched ${rawBars.length} raw bars`);

    // Compute indicators
    const bars = computeAllIndicators(rawBars);
    console.log(`  Computed indicators for ${bars.length} bars`);

    // Build upsert rows
    const rows = bars.map((bar: IndicatorBar) => {
      const d = bar.date.toISOString().split("T")[0];
      return {
        ticker,
        timeframe: tf,
        bar_date: d,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
        rsi: bar.rsi != null && Number.isFinite(bar.rsi) ? Number(bar.rsi.toFixed(2)) : null,
        bxt: bar.bxt != null && Number.isFinite(bar.bxt) ? Number(bar.bxt.toFixed(4)) : null,
        bxt_state: bar.bxt_state ?? null,
        bxt_consecutive_ll: bar.bxt_consecutive_ll ?? 0,
        ema_9: bar.ema_9 != null && Number.isFinite(bar.ema_9) ? Number(bar.ema_9.toFixed(4)) : null,
        ema_13: bar.ema_13 != null && Number.isFinite(bar.ema_13) ? Number(bar.ema_13.toFixed(4)) : null,
        ema_21: bar.ema_21 != null && Number.isFinite(bar.ema_21) ? Number(bar.ema_21.toFixed(4)) : null,
        sma_200: bar.sma_200 != null && Number.isFinite(bar.sma_200) ? Number(bar.sma_200.toFixed(4)) : null,
      };
    });

    // Upsert in batches
    let upserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("ohlcv_bars")
        .upsert(batch, { onConflict: "ticker,timeframe,bar_date" });

      if (error) {
        console.error(`  Upsert error at batch ${i}: ${error.message}`);
        break;
      }
      upserted += batch.length;
    }

    console.log(`  Upserted ${upserted} rows for META/${tf}`);

    // Wait between timeframes to avoid rate limits
    if (tf !== "monthly") {
      console.log("  Waiting 10s before next timeframe...");
      await sleep(10000);
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from("ohlcv_bars")
    .select("*", { count: "exact", head: true })
    .eq("ticker", ticker);

  console.log(`\nFinal META row count: ${finalCount ?? 0}`);
}

main().catch(console.error);
