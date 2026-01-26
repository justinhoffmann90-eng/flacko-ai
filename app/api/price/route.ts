import { NextResponse } from "next/server";
import { fetchTSLAPrice } from "@/lib/price/fetcher";

export async function GET() {
  try {
    const priceData = await fetchTSLAPrice();

    return NextResponse.json({
      symbol: priceData.symbol,
      price: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
      high: priceData.high,
      low: priceData.low,
      volume: priceData.volume,
      timestamp: priceData.timestamp,
    });
  } catch (error) {
    console.error("Price fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
