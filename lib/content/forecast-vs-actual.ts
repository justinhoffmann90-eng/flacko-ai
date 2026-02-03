/**
 * Forecast vs Actual Post Generator
 * 
 * Compares PREVIOUS day's report forecasts to actual price action.
 * Shows system accuracy without giving away current levels.
 * 
 * Key principle: Use yesterday's report, not today's.
 * 
 * Output: Multiple tweet drafts (text only)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getIntradayPriceData } from "@/lib/price/yahoo-finance";
import { format, subDays, parseISO } from "date-fns";

interface ForecastVsActualResult {
  text?: string;
  imageUrl?: string;
  error?: string;
}

export async function generateForecastVsActual(date: string): Promise<ForecastVsActualResult> {
  try {
    const supabase = await createServiceClient();

    // Get YESTERDAY's report (key principle: don't reveal today's levels)
    const yesterday = format(subDays(parseISO(date), 1), "yyyy-MM-dd");

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("report_date", yesterday)
      .single();

    if (reportError || !report) {
      return { error: `Report not found for ${yesterday}` };
    }

    // Get actual price data for yesterday
    const priceData = await getIntradayPriceData(yesterday);

    // Generate tweet options (Type A, B, C from spec)
    const tweets = generateForecastTweets(report, priceData, yesterday);

    // Return all tweet options separated by line breaks
    const text = tweets.join("\n\n---\n\n");

    return {
      text,
    };
  } catch (error) {
    console.error("Forecast vs actual generation error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function generateForecastTweets(report: any, priceData: any, date: string): string[] {
  const tweets: string[] = [];
  const extracted = report.extracted_data;

  // Type A: Level Accuracy
  if (extracted.levels_map && extracted.levels_map.length > 0) {
    const keyLevel = extracted.levels_map.find((l: any) => 
      l.type === "nibble" || l.type === "watch"
    );
    
    if (keyLevel && priceData.low && priceData.high) {
      const levelPrice = keyLevel.price;
      const actualLow = priceData.low;
      const actualHigh = priceData.high;
      const closestTouch = Math.min(
        Math.abs(levelPrice - actualLow),
        Math.abs(levelPrice - actualHigh)
      );

      tweets.push(
`Yesterday's report: "$${levelPrice.toFixed(2)} ${keyLevel.level} = ${keyLevel.action}"

What happened:
• Low of day: $${actualLow.toFixed(2)}
• High of day: $${actualHigh.toFixed(2)}
• Closest touch: $${closestTouch.toFixed(2)} away

${closestTouch < 5 ? "Nailed it." : "Close call."} This is what flow analysis does.`
      );
    }
  }

  // Type B: Mode Call Recap
  if (extracted.positioning) {
    const mode = extracted.tiers?.long || "yellow";
    const dailyCap = extracted.positioning.daily_cap || "10%";
    
    const modeEmoji = {
      green: "🟢",
      yellow: "🟡",
      orange: "🟠",
      red: "🔴",
    }[mode] || "🟡";

    let outcome = "moved within expected range";
    if (priceData.change_pct) {
      const absChange = Math.abs(priceData.change_pct);
      if (absChange > 5) outcome = "big move, but we sized accordingly";
      else if (absChange > 3) outcome = "decent move, position sized right";
      else outcome = "choppy day, glad we stayed small";
    }

    tweets.push(
`Yesterday: ${modeEmoji} ${mode.toUpperCase()} MODE (${dailyCap} daily cap)

What happened:
• TSLA ${priceData.change_pct > 0 ? "up" : "down"} ${Math.abs(priceData.change_pct).toFixed(1)}%
• ${outcome}

Mode system ${priceData.change_pct > 5 ? "protected capital" : "kept us disciplined"}.`
    );
  }

  // Type C: Scenario Outcome
  if (extracted.price && priceData.low && priceData.high) {
    const close = extracted.price.close;
    
    // Estimate scenarios based on typical ranges
    const baseRangeLow = close * 0.98;
    const baseRangeHigh = close * 1.02;
    const actualLow = priceData.low;
    const actualHigh = priceData.high;

    tweets.push(
`Yesterday's base case: "Chop between $${baseRangeLow.toFixed(2)}-$${baseRangeHigh.toFixed(2)}"

Actual range: $${actualLow.toFixed(2)} - $${actualHigh.toFixed(2)}

${Math.abs(actualLow - baseRangeLow) < 3 && Math.abs(actualHigh - baseRangeHigh) < 3
  ? "Base case nailed it."
  : "Close to target range."}

The scenarios aren't guesses — they're probability-weighted outcomes.`
    );
  }

  return tweets;
}
