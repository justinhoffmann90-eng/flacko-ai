/**
 * Yahoo Finance Price Data Fetcher
 * 
 * Fetches intraday and historical price data for TSLA from Yahoo Finance.
 * Used for HIRO recap, forecast vs actual, and weekly scorecard generation.
 */

import { parseISO, startOfDay, endOfDay } from "date-fns";

interface IntradaySnapshot {
  time: string;
  price: number;
  movement: string;
}

interface IntradayPriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change_pct: number;
  snapshots?: IntradaySnapshot[];
}

/**
 * Fetches intraday price data for TSLA for a specific date.
 * 
 * NOTE: Yahoo Finance free API is limited. For production use:
 * 1. Consider paid API (Alpha Vantage, IEX Cloud, Polygon.io)
 * 2. Or use existing TradingView/SpotGamma data
 * 3. Or cache data from daily reports
 * 
 * For now, this is a simplified implementation that uses Yahoo Finance
 * chart API which is unofficial and may break.
 */
export async function getIntradayPriceData(date: string): Promise<IntradayPriceData> {
  try {
    const targetDate = parseISO(date);
    const startTime = Math.floor(startOfDay(targetDate).getTime() / 1000);
    const endTime = Math.floor(endOfDay(targetDate).getTime() / 1000);

    // Yahoo Finance chart API (unofficial)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${startTime}&period2=${endTime}&interval=5m`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]) {
      throw new Error("No data returned from Yahoo Finance");
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;

    // Calculate OHLC for the day
    const opens = quote.open.filter((v: number | null) => v !== null);
    const highs = quote.high.filter((v: number | null) => v !== null);
    const lows = quote.low.filter((v: number | null) => v !== null);
    const closes = quote.close.filter((v: number | null) => v !== null);
    const volumes = quote.volume.filter((v: number | null) => v !== null);

    if (opens.length === 0) {
      throw new Error("No price data available for this date");
    }

    const open = opens[0];
    const high = Math.max(...highs);
    const low = Math.min(...lows);
    const close = closes[closes.length - 1];
    const volume = volumes.reduce((sum: number, v: number) => sum + v, 0);
    const change_pct = ((close - open) / open) * 100;

    // Generate snapshots for HIRO correlation (9am, 11am, 1pm, 3pm)
    const snapshots = generateSnapshots(timestamps, quote.close);

    return {
      date,
      open,
      high,
      low,
      close,
      volume,
      change_pct,
      snapshots,
    };
  } catch (error) {
    console.error("Yahoo Finance fetch error:", error);
    
    // Return placeholder data on error
    return {
      date,
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      volume: 0,
      change_pct: 0,
    };
  }
}

/**
 * Fetch current quote for a single ticker (TSLA, ^VIX, etc.)
 */
export async function getCurrentQuote(ticker: string): Promise<{
  price: number;
  change: number;
  changePct: number;
  timestamp: string;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance quote error for ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = price - previousClose;
    const changePct = (change / previousClose) * 100;

    return {
      price,
      change,
      changePct,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch current market data for TSLA, VIX, and QQQ
 */
export async function getMarketSnapshot(): Promise<{
  tsla: { price: number; changePct: number } | null;
  vix: { price: number; changePct: number } | null;
  qqq: { price: number; changePct: number } | null;
  timestamp: string;
}> {
  const [tsla, vix, qqq] = await Promise.all([
    getCurrentQuote("TSLA"),
    getCurrentQuote("^VIX"),
    getCurrentQuote("QQQ"),
  ]);

  return {
    tsla: tsla ? { price: tsla.price, changePct: tsla.changePct } : null,
    vix: vix ? { price: vix.price, changePct: vix.changePct } : null,
    qqq: qqq ? { price: qqq.price, changePct: qqq.changePct } : null,
    timestamp: new Date().toISOString(),
  };
}

function generateSnapshots(timestamps: number[], closes: (number | null)[]): IntradaySnapshot[] {
  const snapshots: IntradaySnapshot[] = [];

  // Target times: 9am, 11am, 1pm, 3pm CT (14:00, 16:00, 18:00, 20:00 UTC)
  const targetHours = [14, 16, 18, 20]; // UTC hours

  targetHours.forEach((targetHour) => {
    // Find closest timestamp to target hour
    let closestIdx = -1;
    let minDiff = Infinity;

    timestamps.forEach((ts, idx) => {
      const date = new Date(ts * 1000);
      const hour = date.getUTCHours();
      const diff = Math.abs(hour - targetHour);

      if (diff < minDiff && closes[idx] !== null) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== -1) {
      const time = new Date(timestamps[closestIdx] * 1000);
      const price = closes[closestIdx]!;
      
      // Determine movement (simplified)
      let movement = "held steady";
      if (closestIdx > 0 && closes[closestIdx - 1] !== null) {
        const prevPrice = closes[closestIdx - 1]!;
        const change = ((price - prevPrice) / prevPrice) * 100;
        if (change > 0.5) movement = `rallied to $${price.toFixed(2)}`;
        else if (change < -0.5) movement = `dropped to $${price.toFixed(2)}`;
        else movement = `held at $${price.toFixed(2)}`;
      }

      snapshots.push({
        time: time.toISOString(),
        price,
        movement,
      });
    }
  });

  return snapshots;
}
