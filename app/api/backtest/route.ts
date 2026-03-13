import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  BxtState,
  computeAllIndicators,
  OHLCVBar,
  IndicatorBar,
} from "@/lib/indicators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

// ─── Supabase client ──────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Timeframe = "weekly" | "daily" | "4h" | "monthly";

interface SummaryPeriod {
  n: number;
  wins: number;
  win_rate_pct: string;
  avg_return: number;
  median_return: number;
  best: number;
  worst: number;
  avg_max_upside: number | null;
  avg_max_downside: number | null;
}

interface SignalRecord {
  signal_date: string;
  signal_close: number;
  streak_len: number;
  completed: boolean;
  is_current?: boolean;
  is_active?: boolean;
}

interface TickerResult {
  condition: string;
  ticker: string;
  timeframe: string;
  signal_count: number;
  completed_count: number;
  period_labels: string[];
  signals: SignalRecord[];
  summary: Record<string, SummaryPeriod>;
  counts: {
    total: number;
    completed: number;
    current: number;
    active_streak: number;
  };
}

// ─── Supabase data fetch ───────────────────────────────────────────────────────

/**
 * Fetches all ohlcv_bars rows for a ticker+timeframe from Supabase.
 * Returns IndicatorBar[] (all indicators pre-computed).
 *
 * Falls back to Yahoo Finance fetch + in-process computation if the table
 * doesn't exist or has no data for the requested ticker/timeframe.
 */
async function fetchBarsFromDB(
  ticker: string,
  timeframe: Timeframe
): Promise<IndicatorBar[]> {
  // Only weekly/daily/monthly are in ohlcv_bars (4h is not supported in DB)
  if (timeframe === "4h") {
    return fetchBarsFromYahoo(ticker, timeframe);
  }

  const { data, error } = await supabase
    .from("ohlcv_bars")
    .select(
      "bar_date,open,high,low,close,volume,rsi,bxt,bxt_state,bxt_consecutive_ll,ema_9,ema_13,ema_21,sma_200"
    )
    .eq("ticker", ticker)
    .eq("timeframe", timeframe)
    .order("bar_date", { ascending: true });

  if (error) {
    // Table doesn't exist or query error — fall back to Yahoo
    console.warn(
      `[backtest] DB query failed (${error.code}: ${error.message}), falling back to Yahoo`
    );
    return fetchBarsFromYahoo(ticker, timeframe);
  }

  if (!data || data.length === 0) {
    // No data in DB for this ticker/timeframe yet — fall back to Yahoo
    console.warn(
      `[backtest] No data in ohlcv_bars for ${ticker}/${timeframe}, falling back to Yahoo`
    );
    return fetchBarsFromYahoo(ticker, timeframe);
  }

  // Map DB rows to IndicatorBar[]
  return data.map((row: any): IndicatorBar => ({
    date: new Date(row.bar_date),
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
    rsi: row.rsi,
    bxt: row.bxt,
    bxt_state: row.bxt_state as BxtState,
    bxt_consecutive_ll: row.bxt_consecutive_ll ?? 0,
    ema_9: row.ema_9,
    ema_13: row.ema_13,
    ema_21: row.ema_21,
    sma_200: row.sma_200,
  }));
}

// ─── Yahoo Finance fallback (identical to original implementation) ─────────────

async function fetchYahooChart(
  ticker: string,
  interval: string,
  period1: string,
  range?: string
): Promise<OHLCVBar[]> {
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}`;
      if (range) {
        url += `&range=${range}`;
      } else {
        const p1 = Math.floor(new Date(period1).getTime() / 1000);
        const p2 = Math.floor(Date.now() / 1000);
        url += `&period1=${p1}&period2=${p2}`;
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });

      if (res.status === 429) {
        if (attempt < maxRetries) {
          await new Promise((r) =>
            setTimeout(
              r,
              Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000
            )
          );
          continue;
        }
        throw new Error("Yahoo Finance rate limit after retries");
      }

      if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error(`No data returned for ${ticker}`);

      const timestamps: number[] = result.timestamp ?? [];
      const quote = result.indicators?.quote?.[0] ?? {};
      const opens: number[] = quote.open ?? [];
      const highs: number[] = quote.high ?? [];
      const lows: number[] = quote.low ?? [];
      const closes: number[] = quote.close ?? [];
      const volumes: number[] = quote.volume ?? [];

      const bars: OHLCVBar[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] == null || opens[i] == null) continue;
        bars.push({
          date: new Date(timestamps[i] * 1000),
          open: opens[i],
          high: highs[i] ?? opens[i],
          low: lows[i] ?? opens[i],
          close: closes[i],
          volume: volumes[i] ?? 0,
        });
      }
      return bars;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        (msg.includes("429") || msg.includes("rate limit")) &&
        attempt < maxRetries
      ) {
        await new Promise((r) =>
          setTimeout(
            r,
            Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000
          )
        );
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

function resampleTo4H(bars: OHLCVBar[]): OHLCVBar[] {
  const buckets = new Map<string, OHLCVBar[]>();
  for (const bar of bars) {
    const d = bar.date;
    const bucketHour = Math.floor(d.getHours() / 4) * 4;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${bucketHour}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(bar);
  }
  const result: OHLCVBar[] = [];
  for (const group of Array.from(buckets.values())) {
    if (group.length === 0) continue;
    result.push({
      date: group[0].date,
      open: group[0].open,
      high: Math.max(...group.map((b) => b.high)),
      low: Math.min(...group.map((b) => b.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((s, b) => s + b.volume, 0),
    });
  }
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

async function fetchBarsFromYahoo(
  ticker: string,
  timeframe: Timeframe
): Promise<IndicatorBar[]> {
  let rawBars: OHLCVBar[];
  if (timeframe === "4h") {
    const rawBars1h = await fetchYahooChart(ticker, "1h", "", "60d");
    rawBars = resampleTo4H(rawBars1h);
  } else {
    const intervalMap: Record<Timeframe, string> = {
      weekly: "1wk",
      daily: "1d",
      monthly: "1mo",
      "4h": "1h",
    };
    rawBars = await fetchYahooChart(
      ticker,
      intervalMap[timeframe],
      "2005-01-01"
    );
  }
  return computeAllIndicators(rawBars);
}

// ─── Condition parsing (unchanged from original) ──────────────────────────────

type Operator = "<" | ">" | "<=" | ">=" | "==" | "!=";

interface Clause {
  variable: string;
  operator: Operator;
  value: number | string;
  isVarVsVar: boolean;
  rhsVariable?: string;
}

interface ParsedCondition {
  clauses: Clause[];
  logic: ("AND" | "OR")[];
}

const KNOWN_VARS = [
  "rsi",
  "bxt",
  "bxt_consecutive_ll",
  "ema_9",
  "ema_13",
  "ema_21",
  "sma_200",
  "close",
  "open",
  "high",
  "low",
  "volume",
  "weekly_rsi",
  "daily_rsi",
  "monthly_rsi",
];

function normalizeVar(v: string): string {
  return v.replace(/^(weekly|daily|monthly|4h)_/, "");
}

function parseCondition(condition: string): ParsedCondition {
  const parts = condition.split(/\b(AND|OR)\b/i);
  const clauses: Clause[] = [];
  const logic: ("AND" | "OR")[] = [];

  let clauseIdx = 0;
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase() === "AND") {
      logic.push("AND");
    } else if (trimmed.toUpperCase() === "OR") {
      logic.push("OR");
    } else {
      const match = trimmed.match(
        /^([a-z_0-9]+)\s*(<=|>=|!=|==|<|>)\s*([a-z_0-9.+-]+)$/i
      );
      if (!match) {
        throw new Error(
          `Could not parse clause ${clauseIdx + 1}: "${trimmed}". Expected format: variable operator value (e.g. rsi < 35)`
        );
      }
      const [, lhsRaw, op, rhsRaw] = match;
      const lhs = normalizeVar(lhsRaw.toLowerCase());
      const rhs = rhsRaw.trim();

      const rhsNorm = normalizeVar(rhs.toLowerCase());
      const isVarVsVar = KNOWN_VARS.some((v) => normalizeVar(v) === rhsNorm);

      const clause: Clause = {
        variable: lhs,
        operator: op as Operator,
        value: isVarVsVar ? rhsNorm : parseFloat(rhs),
        isVarVsVar,
        rhsVariable: isVarVsVar ? rhsNorm : undefined,
      };

      if (!isVarVsVar && isNaN(clause.value as number)) {
        throw new Error(
          `Invalid value "${rhs}" in clause: "${trimmed}". Value must be a number or known variable.`
        );
      }

      clauses.push(clause);
      clauseIdx++;
    }
  }

  if (clauses.length === 0) {
    throw new Error("No valid clauses found in condition string.");
  }

  return { clauses, logic };
}

function getIndicatorValue(
  bar: IndicatorBar,
  variable: string
): number | null {
  switch (variable) {
    case "rsi":
      return bar.rsi;
    case "bxt":
      return bar.bxt;
    case "bxt_consecutive_ll":
      return bar.bxt_consecutive_ll;
    case "ema_9":
      return bar.ema_9;
    case "ema_13":
      return bar.ema_13;
    case "ema_21":
      return bar.ema_21;
    case "sma_200":
      return bar.sma_200;
    case "close":
      return bar.close;
    case "open":
      return bar.open;
    case "high":
      return bar.high;
    case "low":
      return bar.low;
    case "volume":
      return bar.volume;
    default:
      return null;
  }
}

function evaluateClause(bar: IndicatorBar, clause: Clause): boolean {
  const lhsVal = getIndicatorValue(bar, clause.variable);
  if (lhsVal === null) return false;

  let rhsVal: number;
  if (clause.isVarVsVar && clause.rhsVariable) {
    const v = getIndicatorValue(bar, clause.rhsVariable);
    if (v === null) return false;
    rhsVal = v;
  } else {
    rhsVal = clause.value as number;
  }

  switch (clause.operator) {
    case "<":
      return lhsVal < rhsVal;
    case ">":
      return lhsVal > rhsVal;
    case "<=":
      return lhsVal <= rhsVal;
    case ">=":
      return lhsVal >= rhsVal;
    case "==":
      return lhsVal === rhsVal;
    case "!=":
      return lhsVal !== rhsVal;
    default:
      return false;
  }
}

function evaluateCondition(
  bar: IndicatorBar,
  parsed: ParsedCondition
): boolean {
  if (parsed.clauses.length === 0) return false;

  let result = evaluateClause(bar, parsed.clauses[0]);

  for (let i = 1; i < parsed.clauses.length; i++) {
    const logicOp = parsed.logic[i - 1] ?? "AND";
    const clauseResult = evaluateClause(bar, parsed.clauses[i]);
    if (logicOp === "AND") {
      result = result && clauseResult;
    } else {
      result = result || clauseResult;
    }
  }

  return result;
}

// ─── Forward return calculation (unchanged from original) ─────────────────────

const FORWARD_PERIODS: Record<Timeframe, number[]> = {
  weekly: [1, 2, 4, 6, 8, 10],
  daily: [1, 5, 10, 30],
  "4h": [1, 2, 3, 5, 10],
  monthly: [1, 2, 3, 6, 12],
};

const PERIOD_LABELS: Record<Timeframe, string[]> = {
  weekly: ["1w", "2w", "4w", "6w", "8w", "10w"],
  daily: ["1d", "5d", "10d", "30d"],
  "4h": ["1x4h", "2x4h", "3x4h", "5x4h", "10x4h"],
  monthly: ["1mo", "2mo", "3mo", "6mo", "12mo"],
};

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeForwardReturns(
  bars: IndicatorBar[],
  signalIndices: number[],
  periods: number[]
): {
  signals: SignalRecord[];
  summary: Record<string, SummaryPeriod>;
} {
  const maxPeriod = Math.max(...periods);
  const totalBars = bars.length;

  interface SignalData {
    idx: number;
    bar: IndicatorBar;
    completed: boolean;
    returns: Record<number, number | null>;
    maxUpside: Record<number, number | null>;
    maxDownside: Record<number, number | null>;
  }

  const signalData: SignalData[] = signalIndices.map((idx) => {
    const bar = bars[idx];
    const entryClose = bar.close;
    const completed = idx + maxPeriod < totalBars;

    const returns: Record<number, number | null> = {};
    const maxUpside: Record<number, number | null> = {};
    const maxDownside: Record<number, number | null> = {};

    for (const p of periods) {
      if (idx + p < totalBars) {
        returns[p] =
          ((bars[idx + p].close - entryClose) / entryClose) * 100;

        let maxUp = -Infinity;
        let maxDn = Infinity;
        for (let j = idx + 1; j <= idx + p && j < totalBars; j++) {
          const ret = ((bars[j].close - entryClose) / entryClose) * 100;
          if (ret > maxUp) maxUp = ret;
          if (ret < maxDn) maxDn = ret;
        }
        maxUpside[p] = maxUp === -Infinity ? null : maxUp;
        maxDownside[p] = maxDn === Infinity ? null : maxDn;
      } else {
        returns[p] = null;
        maxUpside[p] = null;
        maxDownside[p] = null;
      }
    }

    return { idx, bar, completed, returns, maxUpside, maxDownside };
  });

  const signals: SignalRecord[] = signalData.map((sd) => ({
    signal_date: sd.bar.date.toISOString().slice(0, 10),
    signal_close: parseFloat(sd.bar.close.toFixed(4)),
    streak_len: sd.bar.bxt_consecutive_ll,
    completed: sd.completed,
  }));

  const incompleteIndices = signals
    .map((s, i) => (!s.completed ? i : -1))
    .filter((i) => i >= 0);

  if (incompleteIndices.length >= 2) {
    signals[incompleteIndices[incompleteIndices.length - 2]].is_current = true;
    signals[incompleteIndices[incompleteIndices.length - 1]].is_active = true;
  } else if (incompleteIndices.length === 1) {
    signals[incompleteIndices[0]].is_active = true;
  }

  const summary: Record<string, SummaryPeriod> = {};
  for (const p of periods) {
    const completedData = signalData.filter(
      (sd) => sd.returns[p] !== null && sd.completed
    );

    if (completedData.length === 0) {
      summary[String(p)] = {
        n: 0,
        wins: 0,
        win_rate_pct: "0%",
        avg_return: 0,
        median_return: 0,
        best: 0,
        worst: 0,
        avg_max_upside: null,
        avg_max_downside: null,
      };
      continue;
    }

    const rets = completedData.map((sd) => sd.returns[p]!);
    const wins = rets.filter((r) => r > 0).length;
    const upsides = completedData
      .map((sd) => sd.maxUpside[p])
      .filter((v): v is number => v !== null);
    const downsides = completedData
      .map((sd) => sd.maxDownside[p])
      .filter((v): v is number => v !== null);

    summary[String(p)] = {
      n: completedData.length,
      wins,
      win_rate_pct: `${Math.round((wins / completedData.length) * 100)}%`,
      avg_return: parseFloat(
        (rets.reduce((s, v) => s + v, 0) / rets.length).toFixed(2)
      ),
      median_return: parseFloat(median(rets).toFixed(2)),
      best: parseFloat(Math.max(...rets).toFixed(2)),
      worst: parseFloat(Math.min(...rets).toFixed(2)),
      avg_max_upside:
        upsides.length > 0
          ? parseFloat(
              (
                upsides.reduce((s, v) => s + v, 0) / upsides.length
              ).toFixed(2)
            )
          : null,
      avg_max_downside:
        downsides.length > 0
          ? parseFloat(
              (
                downsides.reduce((s, v) => s + v, 0) / downsides.length
              ).toFixed(2)
            )
          : null,
    };
  }

  return { signals, summary };
}

// ─── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: {
    condition?: string;
    ticker?: string;
    timeframe?: string;
    forward?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    condition,
    ticker = "TSLA",
    timeframe = "weekly",
  } = body;

  if (!condition || !condition.trim()) {
    return NextResponse.json(
      { error: "Missing required field: condition" },
      { status: 400 }
    );
  }

  if (!["weekly", "daily", "4h", "monthly"].includes(timeframe)) {
    return NextResponse.json(
      {
        error: `Invalid timeframe: "${timeframe}". Must be weekly, daily, 4h, or monthly.`,
      },
      { status: 400 }
    );
  }

  const tf = timeframe as Timeframe;
  const tickerUpper = ticker.toUpperCase().trim();

  if (!tickerUpper || !/^[A-Z.^-]{1,10}$/.test(tickerUpper)) {
    return NextResponse.json(
      { error: `Invalid ticker symbol: "${ticker}"` },
      { status: 400 }
    );
  }

  // Parse condition
  let parsedCondition: ParsedCondition;
  try {
    parsedCondition = parseCondition(condition.trim());
  } catch (err) {
    return NextResponse.json(
      { error: `Condition parse error: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // Fetch bars (Supabase first, Yahoo fallback)
  let indicatorBars: IndicatorBar[];
  try {
    indicatorBars = await fetchBarsFromDB(tickerUpper, tf);
  } catch (err: unknown) {
    const msg = (err as Error).message ?? String(err);
    if (
      msg.includes("No fundamentals data found") ||
      msg.includes("Not Found") ||
      msg.includes("404")
    ) {
      return NextResponse.json(
        { error: `Invalid or unknown ticker: "${tickerUpper}"` },
        { status: 400 }
      );
    }
    if (
      msg.includes("Too Many Requests") ||
      msg.includes("429") ||
      msg.includes("rate limit")
    ) {
      return NextResponse.json(
        {
          error:
            "Yahoo Finance rate limit hit. Please retry in a moment.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Failed to fetch data for ${tickerUpper}: ${msg}` },
      { status: 500 }
    );
  }

  if (indicatorBars.length === 0) {
    return NextResponse.json(
      {
        error: `No price data returned for ticker "${tickerUpper}" with timeframe "${tf}".`,
      },
      { status: 400 }
    );
  }

  // Find signal bars
  const signalIndices: number[] = [];
  for (let i = 0; i < indicatorBars.length; i++) {
    if (evaluateCondition(indicatorBars[i], parsedCondition)) {
      signalIndices.push(i);
    }
  }

  // Compute forward returns
  const periods = FORWARD_PERIODS[tf];
  const periodLabels = PERIOD_LABELS[tf];
  const { signals, summary } = computeForwardReturns(
    indicatorBars,
    signalIndices,
    periods
  );

  const completedCount = signals.filter((s) => s.completed).length;
  const incompleteSignals = signals.filter((s) => !s.completed);
  const currentCount = incompleteSignals.filter((s) => s.is_current).length;
  const activeCount = incompleteSignals.filter((s) => s.is_active).length;

  const tickerResult: TickerResult = {
    condition: condition.trim(),
    ticker: tickerUpper,
    timeframe: tf,
    signal_count: signals.length,
    completed_count: completedCount,
    period_labels: periodLabels,
    signals,
    summary,
    counts: {
      total: signals.length,
      completed: completedCount,
      current: currentCount,
      active_streak: activeCount,
    },
  };

  return NextResponse.json({
    result: {
      [tickerUpper]: tickerResult,
    },
  });
}
