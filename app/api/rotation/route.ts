import { NextResponse } from "next/server";

export const revalidate = 3600;

const USER_AGENT = "Mozilla/5.0 (compatible; FlackoAI/1.0)";
const BENCHMARK = "VTI";
const WINDOW = 10;
const OUTPUT_POINTS = 8;

const SECTORS = [
  { symbol: "XLE", name: "Energy", color: "#f97316" },
  { symbol: "XLB", name: "Materials", color: "#a78bfa" },
  { symbol: "XLI", name: "Industrials", color: "#60a5fa" },
  { symbol: "XLY", name: "Consumer Discretionary", color: "#f472b6" },
  { symbol: "XLP", name: "Consumer Staples", color: "#4ade80" },
  { symbol: "XLV", name: "Health Care", color: "#2dd4bf" },
  { symbol: "XLF", name: "Financials", color: "#fbbf24" },
  { symbol: "XLK", name: "Technology", color: "#818cf8" },
  { symbol: "XLC", name: "Communication Services", color: "#fb923c" },
  { symbol: "XLU", name: "Utilities", color: "#a3e635" },
  { symbol: "XLRE", name: "Real Estate", color: "#f87171" },
  { symbol: "TSLA", name: "Tesla", color: "#ffffff" },
];

type YahooSeries = {
  timestamps: number[];
  closes: Array<number | null>;
};

type RotationPoint = { rs: number; momentum: number; date: string };

type RotationSector = {
  symbol: string;
  name: string;
  color: string;
  points: RotationPoint[];
};

async function fetchYahooSeries(symbol: string): Promise<YahooSeries> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=6mo&interval=1wk`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance fetch failed for ${symbol}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];

  if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) {
    throw new Error(`Yahoo Finance response missing data for ${symbol}`);
  }

  return {
    timestamps: result.timestamp,
    closes: result.indicators.quote[0].close,
  };
}

function rollingSma(values: number[], period: number): Array<number | null> {
  const output: Array<number | null> = Array(values.length).fill(null);
  if (values.length < period) return output;

  for (let i = period - 1; i < values.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      sum += values[j];
    }
    output[i] = sum / period;
  }

  return output;
}

function rollingStdev(values: Array<number | null>, period: number): Array<number | null> {
  const output: Array<number | null> = Array(values.length).fill(null);
  if (values.length < period) return output;

  for (let i = period - 1; i < values.length; i += 1) {
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let j = i - period + 1; j <= i; j += 1) {
      const value = values[j];
      if (!Number.isFinite(value)) continue;
      sum += value as number;
      sumSq += (value as number) * (value as number);
      count += 1;
    }

    if (count < 2) continue;

    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    output[i] = variance > 0 ? Math.sqrt(variance) : 0;
  }

  return output;
}

function toSeriesMap(series: YahooSeries): { map: Map<number, number>; timestamps: number[] } {
  const map = new Map<number, number>();
  const timestamps: number[] = [];

  series.timestamps.forEach((timestamp, index) => {
    const close = series.closes[index];
    if (!Number.isFinite(close)) return;
    const ts = timestamp * 1000;
    map.set(ts, close as number);
    timestamps.push(ts);
  });

  return { map, timestamps };
}

function computeRrgPoints(symbolSeries: YahooSeries, benchmarkSeries: YahooSeries): RotationPoint[] {
  const benchmark = toSeriesMap(benchmarkSeries);
  const symbol = toSeriesMap(symbolSeries);

  const aligned = benchmark.timestamps
    .map((timestamp) => {
      const benchmarkClose = benchmark.map.get(timestamp);
      const symbolClose = symbol.map.get(timestamp);
      if (!Number.isFinite(benchmarkClose) || !Number.isFinite(symbolClose)) return null;
      if ((benchmarkClose as number) === 0) return null;
      return { timestamp, benchmarkClose: benchmarkClose as number, symbolClose: symbolClose as number };
    })
    .filter(Boolean) as Array<{ timestamp: number; benchmarkClose: number; symbolClose: number }>;

  const rsRaw = aligned.map((point) => point.symbolClose / point.benchmarkClose);
  const rsSma = rollingSma(rsRaw, WINDOW);
  const rsStdev = rollingStdev(rsRaw, WINDOW);

  const rsRatio = rsRaw.map((value, index) => {
    const sma = rsSma[index];
    const stdev = rsStdev[index];
    if (!Number.isFinite(sma) || !Number.isFinite(stdev) || stdev === 0) return null;
    return 100 + (value - (sma as number)) / (stdev as number);
  });

  const rsDiff = rsRatio.map((value, index) => {
    if (index === 0 || !Number.isFinite(value) || !Number.isFinite(rsRatio[index - 1])) return null;
    return (value as number) - (rsRatio[index - 1] as number);
  });

  const diffStdev = rollingStdev(rsDiff, WINDOW);

  const rsMomentum = rsRatio.map((value, index) => {
    if (index === 0 || !Number.isFinite(value) || !Number.isFinite(rsRatio[index - 1])) return null;
    const stdev = diffStdev[index];
    if (!Number.isFinite(stdev) || stdev === 0) return null;
    return 100 + ((value as number) - (rsRatio[index - 1] as number)) / (stdev as number);
  });

  const points = aligned
    .map((point, index) => {
      const rs = rsRatio[index];
      const momentum = rsMomentum[index];
      if (!Number.isFinite(rs) || !Number.isFinite(momentum)) return null;
      return {
        rs: Math.round((rs as number) * 1000) / 1000,
        momentum: Math.round((momentum as number) * 1000) / 1000,
        date: new Date(point.timestamp).toISOString(),
      };
    })
    .filter(Boolean) as RotationPoint[];

  if (points.length <= OUTPUT_POINTS) return points;
  return points.slice(-OUTPUT_POINTS);
}

export async function GET() {
  try {
    const fetchSymbols = Array.from(new Set([BENCHMARK, ...SECTORS.map((sector) => sector.symbol)]));

    const results = await Promise.allSettled(fetchSymbols.map((symbol) => fetchYahooSeries(symbol)));
    const dataBySymbol = new Map<string, YahooSeries>();

    results.forEach((result, index) => {
      const symbol = fetchSymbols[index];
      if (result.status === "fulfilled") {
        dataBySymbol.set(symbol, result.value);
      } else {
        console.warn(`[api/rotation] failed to fetch ${symbol}`, result.reason);
      }
    });

    const benchmarkSeries = dataBySymbol.get(BENCHMARK);
    if (!benchmarkSeries) {
      return NextResponse.json({ error: "Failed to fetch benchmark data" }, { status: 502 });
    }

    const sectors: RotationSector[] = SECTORS.map((sector) => {
      const series = dataBySymbol.get(sector.symbol);
      if (!series) {
        return { ...sector, points: [] };
      }

      return {
        ...sector,
        points: computeRrgPoints(series, benchmarkSeries),
      };
    });

    return NextResponse.json({
      sectors,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/rotation] fetch failed", error);
    return NextResponse.json({ error: "Failed to fetch rotation data" }, { status: 500 });
  }
}
