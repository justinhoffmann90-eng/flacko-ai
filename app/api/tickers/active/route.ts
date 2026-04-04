import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getTickersWithSubscribers } from "@/lib/tickers/subscribers";
import { getTickerConfig } from "@/lib/tickers/config";

/**
 * GET /api/tickers/active
 * 
 * Returns tickers that have active subscribers and need reports generated.
 * Protected by ADMIN_SECRET or CRON_SECRET.
 * 
 * Used by Trunks to determine which tickers to generate reports for each day.
 * If a ticker has 0 subscribers, we skip it — no wasted tokens.
 */
export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  const isAdmin = authHeader === `Bearer ${process.env.ADMIN_SECRET}`;
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isAdmin && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickersWithSubs = await getTickersWithSubscribers();

    const result = tickersWithSubs.map(t => ({
      ticker: t.ticker,
      subscribers: t.activeSubscribers,
      config: {
        name: getTickerConfig(t.ticker).name,
        hasSpotGamma: getTickerConfig(t.ticker).hasSpotGamma,
        hasHiro: getTickerConfig(t.ticker).hasHiro,
        bxEngineSupported: getTickerConfig(t.ticker).bxEngineSupported,
      },
    }));

    return NextResponse.json({
      date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }),
      tickersToGenerate: result,
      totalTickers: result.length,
      totalSubscribers: result.reduce((sum, t) => sum + t.subscribers, 0),
    });
  } catch (error) {
    console.error("Failed to get active tickers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
