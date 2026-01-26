// Price fetching utility using Finnhub API
// Free tier: 60 API calls/minute, real-time US stock quotes

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
}

export async function getStockQuote(symbol: string = "TSLA"): Promise<StockQuote | null> {
  if (!FINNHUB_API_KEY) {
    console.error("FINNHUB_API_KEY is not set");
    return null;
  }

  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      { next: { revalidate: 0 } } // No caching for real-time data
    );

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Finnhub returns: c (current), pc (previous close), d (change), dp (change %), h (high), l (low), o (open), t (timestamp)
    if (!data.c || data.c === 0) {
      console.error("No price data returned from Finnhub");
      return null;
    }

    return {
      symbol,
      currentPrice: data.c,
      previousClose: data.pc,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      timestamp: data.t * 1000, // Convert to milliseconds
    };
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    return null;
  }
}

// Check if market is open (US Eastern Time, 9:30 AM - 4:00 PM, Mon-Fri)
export function isMarketOpen(): boolean {
  const now = new Date();

  // Convert to Eastern Time
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));

  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Market hours: 9:30 AM (570 min) to 4:00 PM (960 min), Mon-Fri
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  const isWeekday = day >= 1 && day <= 5;
  const isDuringHours = timeInMinutes >= marketOpen && timeInMinutes < marketClose;

  return isWeekday && isDuringHours;
}
