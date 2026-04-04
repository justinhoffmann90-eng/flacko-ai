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

// Rate limit tracking for Yahoo Finance
let yahooBackoffUntil = 0;

/**
 * Fetch price data for any ticker.
 * Falls through: Yahoo → Finnhub → Polygon → Alpha Vantage
 */
export async function fetchTickerPrice(symbol: string = 'TSLA'): Promise<PriceData> {
  const ticker = symbol.toUpperCase();

  // Try Yahoo Finance first (free, no API key needed)
  try {
    if (Date.now() < yahooBackoffUntil) {
      console.warn("Yahoo Finance in backoff period, skipping to fallback");
      throw new Error("Yahoo Finance rate limited");
    }
    
    const data = await fetchFromYahoo(ticker);
    return data;
  } catch (error) {
    console.error(`Yahoo Finance failed for ${ticker}, trying Finnhub:`, error);
  }

  // Fallback to Finnhub
  try {
    const data = await fetchFromFinnhub(ticker);
    return data;
  } catch (error) {
    console.error(`Finnhub failed for ${ticker}, trying Polygon:`, error);
  }

  // Fallback to Polygon
  try {
    const data = await fetchFromPolygon(ticker);
    return data;
  } catch (error) {
    console.error(`Polygon also failed for ${ticker}, trying Alpha Vantage:`, error);
  }

  // Final fallback to Alpha Vantage
  try {
    const data = await fetchFromAlphaVantage(ticker);
    return data;
  } catch (error) {
    console.error(`All providers failed for ${ticker}:`, error);
    throw new Error(`Failed to fetch ${ticker} price from all providers`);
  }
}

/** @deprecated Use fetchTickerPrice('TSLA') instead. Kept for backwards compatibility. */
export async function fetchTSLAPrice(): Promise<PriceData> {
  return fetchTickerPrice('TSLA');
}

async function fetchFromYahoo(symbol: string): Promise<PriceData> {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 60 },
    }
  );

  if (response.status === 403 || response.status === 429) {
    yahooBackoffUntil = Date.now() + 60000;
    throw new Error(`Yahoo Finance rate limited (${response.status}), backing off for 60s`);
  }

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data = await response.json();
  const quote = data.chart.result[0];
  const meta = quote.meta;
  const indicators = quote.indicators.quote[0];

  return {
    symbol: symbol,
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    high: indicators.high?.[indicators.high.length - 1] || meta.regularMarketDayHigh,
    low: indicators.low?.[indicators.low.length - 1] || meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    timestamp: Date.now(),
  };
}

async function fetchFromFinnhub(symbol: string): Promise<PriceData> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("Finnhub API key not configured");
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.c || data.c === 0) {
    throw new Error(`No price data from Finnhub for ${symbol}`);
  }

  return {
    symbol: symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    volume: 0,
    timestamp: data.t * 1000,
  };
}

async function fetchFromPolygon(symbol: string): Promise<PriceData> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    throw new Error("Polygon API key not configured");
  }

  const response = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?apiKey=${apiKey}`,
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
    symbol: symbol,
    price: result.c,
    change: result.c - result.o,
    changePercent: ((result.c - result.o) / result.o) * 100,
    high: result.h,
    low: result.l,
    volume: result.v,
    timestamp: result.t,
  };
}

async function fetchFromAlphaVantage(symbol: string): Promise<PriceData> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
  
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`);
  }

  const data = await response.json();
  const quote = data["Global Quote"];

  if (!quote || !quote["05. price"]) {
    throw new Error(`No price data from Alpha Vantage for ${symbol}`);
  }

  const price = parseFloat(quote["05. price"]);
  const prevClose = parseFloat(quote["08. previous close"]);

  return {
    symbol: symbol,
    price: price,
    change: price - prevClose,
    changePercent: ((price - prevClose) / prevClose) * 100,
    high: parseFloat(quote["03. high"]),
    low: parseFloat(quote["04. low"]),
    volume: parseInt(quote["06. volume"]),
    timestamp: Date.now(),
  };
}

/**
 * Fetch realtime price for any ticker.
 * @param symbol - Ticker symbol (defaults to TSLA for backwards compat)
 */
export async function fetchRealtimePrice(symbol: string = 'TSLA'): Promise<number> {
  const data = await fetchTickerPrice(symbol);
  return data.price;
}

/**
 * Fetch last close price for any ticker (for after-hours display).
 * @param symbol - Ticker symbol (defaults to TSLA for backwards compat)
 */
export async function fetchLastClose(symbol: string = 'TSLA'): Promise<number> {
  const ticker = symbol.toUpperCase();

  if (Date.now() < yahooBackoffUntil) {
    console.warn(`Yahoo Finance in backoff period for ${ticker} close price`);
    try {
      const data = await fetchFromAlphaVantage(ticker);
      return data.price;
    } catch (error) {
      console.error("Alpha Vantage fallback failed:", error);
      throw error;
    }
  }

  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 300 },
    }
  );

  if (response.status === 403 || response.status === 429) {
    yahooBackoffUntil = Date.now() + 60000;
    console.warn(`Yahoo Finance rate limited (${response.status}), backing off for 60s`);
    
    try {
      const data = await fetchFromAlphaVantage(ticker);
      return data.price;
    } catch (error) {
      console.error("Alpha Vantage fallback failed:", error);
      throw new Error(`Yahoo Finance rate limited and fallback failed`);
    }
  }

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status}`);
  }

  const data = await response.json();
  const meta = data.chart.result[0].meta;
  return meta.regularMarketPrice;
}
