/**
 * Ticker Subscriber Utilities
 * 
 * Determines which tickers have active subscribers and need reports generated.
 * Used by the daily report workflow to avoid wasting tokens on unpurchased tickers.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { DEFAULT_TICKER, getEnabledTickers } from "./config";

export interface TickerSubscriberCount {
  ticker: string;
  activeSubscribers: number;
}

/**
 * Get all tickers that have at least one active subscriber.
 * TSLA is always included (legacy subscriptions system).
 * Other tickers only if they have rows in ticker_subscriptions.
 * 
 * This is the source of truth for "should we generate a report today?"
 */
export async function getTickersWithSubscribers(): Promise<TickerSubscriberCount[]> {
  const supabase = await createServiceClient();
  const results: TickerSubscriberCount[] = [];

  // TSLA: always check legacy subscriptions table
  const { count: tslaLegacyCount } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "comped", "trial"]);

  const { count: tslaTickerCount } = await supabase
    .from("ticker_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("ticker", "TSLA")
    .in("status", ["active", "comped"]);

  const tslaTotal = (tslaLegacyCount || 0) + (tslaTickerCount || 0);
  if (tslaTotal > 0) {
    results.push({ ticker: "TSLA", activeSubscribers: tslaTotal });
  }

  // All other enabled tickers: check ticker_subscriptions only
  const enabledTickers = getEnabledTickers().filter(t => t.symbol !== "TSLA");
  
  if (enabledTickers.length > 0) {
    const symbols = enabledTickers.map(t => t.symbol);
    
    const { data: tickerCounts } = await supabase
      .from("ticker_subscriptions")
      .select("ticker")
      .in("ticker", symbols)
      .in("status", ["active", "comped"]);

    if (tickerCounts) {
      // Count per ticker
      const countMap = new Map<string, number>();
      for (const row of tickerCounts) {
        countMap.set(row.ticker, (countMap.get(row.ticker) || 0) + 1);
      }
      
      for (const [ticker, count] of countMap) {
        if (count > 0) {
          results.push({ ticker, activeSubscribers: count });
        }
      }
    }
  }

  return results.sort((a, b) => b.activeSubscribers - a.activeSubscribers);
}

/**
 * Check if a specific ticker has any active subscribers.
 * Quick check for "should I generate this report?"
 */
export async function tickerHasSubscribers(ticker: string): Promise<boolean> {
  const supabase = await createServiceClient();
  
  if (ticker === "TSLA") {
    // Check legacy subs
    const { count } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ["active", "comped", "trial"]);
    if (count && count > 0) return true;
  }

  // Check ticker_subscriptions
  const { count } = await supabase
    .from("ticker_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("ticker", ticker.toUpperCase())
    .in("status", ["active", "comped"]);

  return (count || 0) > 0;
}

/**
 * Get all subscribers for a specific ticker (for email delivery).
 * Returns user_id + email for each subscriber.
 */
export async function getTickerSubscribers(ticker: string): Promise<{ user_id: string; email: string }[]> {
  const supabase = await createServiceClient();
  const subscribers: { user_id: string; email: string }[] = [];

  if (ticker === "TSLA") {
    // Include legacy subscribers
    const { data: legacySubs } = await supabase
      .from("subscriptions")
      .select("user_id, users!inner(email)")
      .in("status", ["active", "comped", "trial"]);
    
    if (legacySubs) {
      for (const sub of legacySubs) {
        const email = (sub as any).users?.email;
        if (email) {
          subscribers.push({ user_id: sub.user_id, email });
        }
      }
    }
  }

  // Ticker subscriptions
  const { data: tickerSubs } = await supabase
    .from("ticker_subscriptions")
    .select("user_id, users!inner(email)")
    .eq("ticker", ticker.toUpperCase())
    .in("status", ["active", "comped"]);

  if (tickerSubs) {
    for (const sub of tickerSubs) {
      const email = (sub as any).users?.email;
      if (email && !subscribers.find(s => s.user_id === sub.user_id)) {
        subscribers.push({ user_id: sub.user_id, email });
      }
    }
  }

  return subscribers;
}
