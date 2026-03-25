/**
 * /api/cron/refresh-live-prices
 *
 * Lightweight cron (every 30 min, 9am-4pm ET weekdays) that:
 * 1. Fetches live TSLA price via multi-provider fetcher (Yahoo → Finnhub → Polygon → AV)
 * 2. Upserts today's bar into ohlcv_bars with fresh close price
 * 3. Invalidates orb_scan_cache so next backtest request gets fresh data
 *
 * This keeps the backtest scanner showing today's price during market hours
 * without running the full 5-minute indicator recompute.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchTSLAPrice } from "@/lib/price/fetcher";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Only TSLA for now — it's the primary ticker and we have a robust fetcher for it
const TICKERS_TO_REFRESH = ["TSLA"];

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    authHeader !== `Bearer ${process.env.ADMIN_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const results: Record<string, { price: number | null; status: string }> = {};

  for (const ticker of TICKERS_TO_REFRESH) {
    try {
      // Use the robust multi-provider fetcher (Yahoo → Finnhub → Polygon → Alpha Vantage)
      const priceData = await fetchTSLAPrice();
      const livePrice = priceData.price;

      if (!livePrice || livePrice <= 0) {
        results[ticker] = { price: null, status: "no_price" };
        continue;
      }

      // Get the most recent bar from DB to inherit indicators
      const { data: latestRow } = await supabase
        .from("ohlcv_bars")
        .select("*")
        .eq("ticker", ticker)
        .eq("timeframe", "daily")
        .order("bar_date", { ascending: false })
        .limit(1)
        .single();

      if (!latestRow) {
        results[ticker] = { price: livePrice, status: "no_base_row" };
        continue;
      }

      // Upsert today's bar with live price
      // Indicators (RSI, BXT, EMAs) are inherited from yesterday's row
      // They will be properly recomputed tonight by the nightly orb/compute cron
      const todayBar = {
        ticker,
        timeframe: "daily",
        bar_date: todayStr,
        open: priceData.price, // Approximation — open not available from all providers
        high: priceData.high ?? livePrice,
        low: priceData.low ?? livePrice,
        close: livePrice,
        volume: priceData.volume ?? 0,
        // Inherit indicators from latest bar
        rsi: latestRow.rsi,
        bxt: latestRow.bxt,
        bxt_state: latestRow.bxt_state,
        ema_9: latestRow.ema_9,
        ema_13: latestRow.ema_13,
        ema_21: latestRow.ema_21,
        sma_200: latestRow.sma_200,
      };

      const { error: upsertError } = await supabase
        .from("ohlcv_bars")
        .upsert(todayBar, { onConflict: "ticker,timeframe,bar_date" });

      if (upsertError) {
        results[ticker] = { price: livePrice, status: `upsert_error: ${upsertError.message}` };
        continue;
      }

      results[ticker] = { price: livePrice, status: "ok" };
    } catch (e) {
      results[ticker] = { price: null, status: `error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  // Invalidate orb_scan_cache for updated tickers so next scan request recomputes
  const updatedTickers = Object.entries(results)
    .filter(([, v]) => v.status === "ok")
    .map(([t]) => t);

  if (updatedTickers.length > 0) {
    await supabase
      .from("orb_scan_cache")
      .update({ updated_at: "2000-01-01T00:00:00Z" })
      .in("ticker", updatedTickers);
    console.log(`[refresh-live-prices] Invalidated cache for: ${updatedTickers.join(", ")}`);
  }

  console.log(`[refresh-live-prices] ${todayStr}:`, results);
  return NextResponse.json({ date: todayStr, results, invalidated: updatedTickers });
}
