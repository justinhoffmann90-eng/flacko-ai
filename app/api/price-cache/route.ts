import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

/**
 * GET /api/price-cache
 * Returns cached TSLA and TSLL prices from Supabase
 * Public endpoint (no auth required for reads)
 */
export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase
      .from("price_cache")
      .select("*")
      .in("symbol", ["TSLA", "TSLL"])
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching price cache:", error);
      return NextResponse.json(
        { error: "Failed to fetch price cache" },
        { status: 500 }
      );
    }

    // Return most recent entry for each symbol
    const tsla = data?.find((d) => d.symbol === "TSLA");
    const tsll = data?.find((d) => d.symbol === "TSLL");

    return NextResponse.json({
      TSLA: tsla || null,
      TSLL: tsll || null,
      cached_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Price cache GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/price-cache
 * Fetches fresh prices from Yahoo Finance and updates cache
 * Requires CRON_SECRET authentication
 */
export async function POST() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Fetch both TSLA and TSLL in parallel
    const [tslaData, tsllData] = await Promise.all([
      fetchYahooPrice("TSLA"),
      fetchYahooPrice("TSLL"),
    ]);

    // Upsert to price_cache table
    const { error: tslaError } = await supabase
      .from("price_cache")
      .upsert(
        {
          symbol: "TSLA",
          price: tslaData.price,
          change: tslaData.change,
          change_percent: tslaData.changePercent,
          volume: tslaData.volume,
          high: tslaData.high,
          low: tslaData.low,
          previous_close: tslaData.previousClose,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );

    const { error: tsllError } = await supabase
      .from("price_cache")
      .upsert(
        {
          symbol: "TSLL",
          price: tsllData.price,
          change: tsllData.change,
          change_percent: tsllData.changePercent,
          volume: tsllData.volume,
          high: tsllData.high,
          low: tsllData.low,
          previous_close: tsllData.previousClose,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "symbol" }
      );

    if (tslaError || tsllError) {
      console.error("Error upserting price cache:", { tslaError, tsllError });
      return NextResponse.json(
        { error: "Failed to update cache" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: ["TSLA", "TSLL"],
      TSLA: tslaData,
      TSLL: tsllData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Price cache POST error:", error);
    return NextResponse.json(
      { error: "Failed to refresh price cache", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Fetch price from Yahoo Finance chart API
 * Direct API call (no yahoo-finance2 library)
 */
async function fetchYahooPrice(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo API error for ${symbol}: ${response.status} ${response.statusText}`);
  }

  const json = await response.json() as any;
  const result = json.chart?.result?.[0];
  
  if (!result) {
    throw new Error(`No chart data for ${symbol}`);
  }

  const meta = result.meta;
  const price = meta.regularMarketPrice || 0;
  const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
  const change = price - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  return {
    symbol: meta.symbol,
    price,
    change,
    changePercent,
    volume: meta.regularMarketVolume || 0,
    high: meta.regularMarketDayHigh || 0,
    low: meta.regularMarketDayLow || 0,
    previousClose,
  };
}
