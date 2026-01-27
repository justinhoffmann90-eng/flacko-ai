export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: number;
}

export async function fetchTSLAPrice(): Promise<PriceData> {
  // Try Yahoo Finance first (free, no API key needed)
  try {
    const data = await fetchFromYahoo();
    return data;
  } catch (error) {
    console.error("Yahoo Finance failed, trying Finnhub:", error);
  }

  // Fallback to Finnhub
  try {
    const data = await fetchFromFinnhub();
    return data;
  } catch (error) {
    console.error("Finnhub failed, trying Polygon:", error);
  }

  // Fallback to Polygon
  try {
    const data = await fetchFromPolygon();
    return data;
  } catch (error) {
    console.error("Polygon also failed:", error);
    throw new Error("Failed to fetch TSLA price from all providers");
  }
}

async function fetchFromYahoo(): Promise<PriceData> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    }
  );

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data = await response.json();
  const quote = data.chart.result[0];
  const meta = quote.meta;
  const indicators = quote.indicators.quote[0];

  return {
    symbol: "TSLA",
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    high: indicators.high?.[indicators.high.length - 1] || meta.regularMarketDayHigh,
    low: indicators.low?.[indicators.low.length - 1] || meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    timestamp: Date.now(),
  };
}

async function fetchFromFinnhub(): Promise<PriceData> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("Finnhub API key not configured");
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=TSLA&token=${apiKey}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.c || data.c === 0) {
    throw new Error("No price data from Finnhub");
  }

  return {
    symbol: "TSLA",
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    volume: 0, // Finnhub quote doesn't include volume
    timestamp: data.t * 1000,
  };
}

async function fetchFromPolygon(): Promise<PriceData> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error("Polygon API key not configured");
  }

  const response = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/TSLA/prev?apiKey=${apiKey}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error(`Polygon API error: ${response.status}`);
  }

  const data = await response.json();
  const result = data.results[0];

  return {
    symbol: "TSLA",
    price: result.c,
    change: result.c - result.o,
    changePercent: ((result.c - result.o) / result.o) * 100,
    high: result.h,
    low: result.l,
    volume: result.v,
    timestamp: result.t,
  };
}

// For real-time price during market hours
export async function fetchRealtimePrice(): Promise<number> {
  const data = await fetchTSLAPrice();
  return data.price;
}

// Fetch last close price (for after-hours display)
// This returns today's close price after market hours
export async function fetchLastClose(): Promise<number> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=1d`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    }
  );

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data = await response.json();
  const meta = data.chart.result[0].meta;

  // After market close, regularMarketPrice is today's closing price
  // This is what we want to display as "Last Close"
  return meta.regularMarketPrice;
}
