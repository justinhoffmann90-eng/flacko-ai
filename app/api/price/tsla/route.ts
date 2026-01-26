import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchTSLAPrice, PriceData } from "@/lib/price/fetcher";
import { isMarketHours } from "@/lib/utils";

interface CachedPrice {
  price: number;
  timestamp: string;
  isMarketOpen: boolean;
}

// In-memory cache for price (shared across requests in same instance)
let priceCache: { data: PriceData; timestamp: number } | null = null;
const CACHE_TTL = 15000; // 15 seconds

export async function GET() {
  try {
    const now = Date.now();
    const marketOpen = isMarketHours();

    // During market hours, fetch fresh price (with caching)
    if (marketOpen) {
      // Check if cache is still valid
      if (priceCache && now - priceCache.timestamp < CACHE_TTL) {
        return NextResponse.json({
          price: priceCache.data.price,
          change: priceCache.data.change,
          changePercent: priceCache.data.changePercent,
          timestamp: new Date(priceCache.timestamp).toISOString(),
          isMarketOpen: true,
          cached: true,
        });
      }

      // Fetch fresh price
      try {
        const priceData = await fetchTSLAPrice();
        priceCache = { data: priceData, timestamp: now };

        return NextResponse.json({
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          timestamp: new Date().toISOString(),
          isMarketOpen: true,
          cached: false,
        });
      } catch (error) {
        console.error("Failed to fetch live price:", error);
        // Fall through to use stored price
      }
    }

    // Outside market hours or on error, use last known price from system_config
    const supabase = await createServiceClient();
    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "alert_system_status")
      .single();

    const storedPrice = config?.value as { last_price?: number; last_run?: string } | null;

    if (storedPrice?.last_price) {
      return NextResponse.json({
        price: storedPrice.last_price,
        timestamp: storedPrice.last_run || new Date().toISOString(),
        isMarketOpen: false,
        cached: true,
      });
    }

    // Last resort: fetch from report's close price
    const { data: report } = await supabase
      .from("reports")
      .select("extracted_data")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    const closePrice = (report?.extracted_data as { price?: { close?: number } })?.price?.close;

    return NextResponse.json({
      price: closePrice || 0,
      timestamp: new Date().toISOString(),
      isMarketOpen: false,
      cached: true,
      source: "report",
    });
  } catch (error) {
    console.error("Price API error:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
