import { NextResponse } from "next/server";
import { fetchTSLAPrice, fetchLastClose, PriceData } from "@/lib/price/fetcher";
import { isMarketHours } from "@/lib/utils";

// In-memory cache for price (shared across requests in same instance)
let priceCache: { data: PriceData; timestamp: number } | null = null;
let closeCache: { price: number; timestamp: number } | null = null;
const CACHE_TTL = 15000; // 15 seconds
const CLOSE_CACHE_TTL = 300000; // 5 minutes for close price (doesn't change often)

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
        // Fall through to return cached or close price
      }
    }

    // Outside market hours: fetch previous close from Yahoo Finance
    // Check cache first
    if (closeCache && now - closeCache.timestamp < CLOSE_CACHE_TTL) {
      return NextResponse.json({
        price: closeCache.price,
        timestamp: new Date(closeCache.timestamp).toISOString(),
        isMarketOpen: false,
        cached: true,
      });
    }

    // Fetch fresh close price from Yahoo
    try {
      const closePrice = await fetchLastClose();
      closeCache = { price: closePrice, timestamp: now };

      return NextResponse.json({
        price: closePrice,
        timestamp: new Date().toISOString(),
        isMarketOpen: false,
        cached: false,
      });
    } catch (error) {
      console.error("Failed to fetch close price:", error);

      // If we have any cached data, use it
      if (closeCache) {
        return NextResponse.json({
          price: closeCache.price,
          timestamp: new Date(closeCache.timestamp).toISOString(),
          isMarketOpen: false,
          cached: true,
          stale: true,
        });
      }

      return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
    }
  } catch (error) {
    console.error("Price API error:", error);
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
