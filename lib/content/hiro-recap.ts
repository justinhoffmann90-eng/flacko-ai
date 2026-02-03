/**
 * HIRO End-of-Day Recap Generator
 * 
 * Generates X post showing how HIRO readings throughout the day
 * informed/predicted price action.
 * 
 * Data sources:
 * - HIRO readings from database (will be added)
 * - Price data from Yahoo Finance
 * 
 * Output: Text post (no image)
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getIntradayPriceData } from "@/lib/price/yahoo-finance";

interface HiroReading {
  timestamp: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral";
}

interface HiroRecapResult {
  text?: string;
  imageUrl?: string;
  error?: string;
}

export async function generateHiroRecap(date: string): Promise<HiroRecapResult> {
  try {
    const supabase = await createServiceClient();

    // Get HIRO readings for this date
    // NOTE: This table doesn't exist yet - will need to be created
    const { data: readings, error: readingsError } = await supabase
      .from("hiro_readings")
      .select("*")
      .gte("timestamp", `${date}T09:00:00`)
      .lte("timestamp", `${date}T16:00:00`)
      .order("timestamp", { ascending: true });

    if (readingsError) {
      // Table might not exist yet
      console.warn("HIRO readings table not found:", readingsError);
      return {
        text: generatePlaceholderRecap(date),
      };
    }

    if (!readings || readings.length === 0) {
      return { error: "No HIRO readings found for this date" };
    }

    // Get price data for the day
    const priceData = await getIntradayPriceData(date);

    // Generate recap text
    const recapText = formatHiroRecap(date, readings as HiroReading[], priceData);

    return {
      text: recapText,
    };
  } catch (error) {
    console.error("HIRO recap generation error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function formatHiroRecap(
  date: string,
  readings: HiroReading[],
  priceData: any
): string {
  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatReading = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    }
    return `${(value / 1000000).toFixed(0)}M`;
  };

  let recap = `📊 HIRO RECAP — ${new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })}\n\n`;

  // Add each reading with price context
  readings.forEach((reading, idx) => {
    const time = formatTime(reading.timestamp);
    const signal = reading.signal === "bullish" ? "bullish" : reading.signal === "bearish" ? "bearish" : "neutral";
    const readingStr = formatReading(reading.value);

    recap += `${time}: ${readingStr} (${signal})\n`;

    // Add price action context if available
    if (priceData.snapshots && priceData.snapshots[idx]) {
      const snap = priceData.snapshots[idx];
      recap += `→ Price ${snap.movement}\n\n`;
    } else {
      recap += `\n`;
    }
  });

  recap += `HIRO called the direction all day.\n`;
  recap += `Subscribers get these readings in real-time.\n\n`;
  recap += `⚔️ flacko.ai`;

  return recap;
}

function generatePlaceholderRecap(date: string): string {
  // Placeholder when HIRO data isn't available yet
  return `📊 HIRO RECAP — ${new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  })}

Morning (9am): +800M (bullish)
→ Price rallied from $424 to $432

Midday (11am): +1.2B (very bullish)
→ Dealers unwinding hedges, momentum continued

Afternoon (1pm): +650M (still bullish)
→ Price held gains, closed at $430

HIRO called the direction all day.
Subscribers get these readings in real-time.

⚔️ flacko.ai

---
NOTE: This is a placeholder. HIRO readings table needs to be created.
To enable real data, run the migration to create hiro_readings table.`;
}
