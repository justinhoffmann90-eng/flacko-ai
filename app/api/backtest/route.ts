import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────────────────────

type Timeframe = "weekly" | "daily" | "4h" | "monthly";

interface OHLCVBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorBar extends OHLCVBar {
  rsi: number | null;
  bxt: number | null;
  bxt_state: "HH" | "LH" | "HL" | "LL" | null;
  bxt_consecutive_ll: number;
  ema_9: number | null;
  ema_13: number | null;
  ema_21: number | null;
  sma_200: number | null;
}

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

// ─── In-memory cache (1-hour TTL) ─────────────────────────────────────────────

interface CacheEntry {
  bars: OHLCVBar[];
  fetchedAt: number;
}

const dataCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(ticker: string, timeframe: Timeframe): string {
  return `${ticker.toUpperCase()}:${timeframe}`;
}

// ─── Yahoo Finance data fetching ───────────────────────────────────────────────

async function fetchOHLCV(ticker: string, timeframe: Timeframe): Promise<OHLCVBar[]> {
  const cacheKey = getCacheKey(ticker, timeframe);
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.bars;
  }

  // Suppress yahoo-finance2 notices
  yahooFinance.suppressNotices(["yahooSurvey", "ripHistorical"]);

  let bars: OHLCVBar[];

  if (timeframe === "4h") {
    // Fetch 1h bars for last 60 days, then resample to 4H
    const period1 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const result = await yahooFinance.chart(ticker, {
      period1: period1.toISOString().slice(0, 10),
      interval: "1h",
    });

    const rawBars = extractBars(result);
    bars = resampleTo4H(rawBars);
  } else {
    const intervalMap: Record<Timeframe, string> = {
      weekly: "1wk",
      daily: "1d",
      monthly: "1mo",
      "4h": "1h",
    };
    const interval = intervalMap[timeframe];

    const result = await yahooFinance.chart(ticker, {
      period1: "2005-01-01",
      interval: interval as "1d" | "1wk" | "1mo",
    });

    bars = extractBars(result);
  }

  dataCache.set(cacheKey, { bars, fetchedAt: Date.now() });
  return bars;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBars(result: any): OHLCVBar[] {
  const quotes = result?.quotes ?? result?.indicators?.quote?.[0] ?? [];
  const timestamps = result?.timestamp ?? [];

  if (Array.isArray(quotes) && quotes.length > 0 && quotes[0]?.date !== undefined) {
    // quotes array format (from chart())
    return quotes
      .filter(
        (q: { date?: Date; open?: number; high?: number; low?: number; close?: number; volume?: number }) =>
          q.close != null && q.open != null
      )
      .map((q: { date?: Date; open?: number; high?: number; low?: number; close?: number; volume?: number }) => ({
        date: q.date instanceof Date ? q.date : new Date(q.date!),
        open: q.open ?? 0,
        high: q.high ?? 0,
        low: q.low ?? 0,
        close: q.close ?? 0,
        volume: q.volume ?? 0,
      }));
  }

  // Fallback: parallel arrays format
  if (timestamps.length > 0) {
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const opens = result?.indicators?.quote?.[0]?.open ?? [];
    const highs = result?.indicators?.quote?.[0]?.high ?? [];
    const lows = result?.indicators?.quote?.[0]?.low ?? [];
    const volumes = result?.indicators?.quote?.[0]?.volume ?? [];
    const bars: OHLCVBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue;
      bars.push({
        date: new Date(timestamps[i] * 1000),
        open: opens[i] ?? 0,
        high: highs[i] ?? 0,
        low: lows[i] ?? 0,
        close: closes[i],
        volume: volumes[i] ?? 0,
      });
    }
    return bars;
  }

  return [];
}

function resampleTo4H(bars: OHLCVBar[]): OHLCVBar[] {
  // Group hourly bars into 4-hour buckets (0-3, 4-7, 8-11, 12-15, 16-19, 20-23)
  const buckets = new Map<string, OHLCVBar[]>();

  for (const bar of bars) {
    const d = bar.date;
    const bucketHour = Math.floor(d.getHours() / 4) * 4;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${bucketHour}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(bar);
  }

  const result: OHLCVBar[] = [];
  for (const [, group] of buckets) {
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

// ─── Indicator math ────────────────────────────────────────────────────────────

function computeEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(values.length).fill(null);
  let ema: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (ema === null) {
      // Seed with simple average of first `period` values
      if (i < period - 1) continue;
      ema = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
      result[i] = ema;
    } else {
      ema = values[i] * k + ema * (1 - k);
      result[i] = ema;
    }
  }
  return result;
}

function computeWildersRSI(values: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period + 1) return result;

  // Calculate initial avg gain/loss using SMA of first `period` changes
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

function computeSMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    result[i] = sum / period;
  }
  return result;
}

function subtractArrays(a: (number | null)[], b: (number | null)[]): (number | null)[] {
  return a.map((v, i) => (v != null && b[i] != null ? v - b[i]! : null));
}

// ─── BXT: RSI(EMA(close,5) - EMA(close,20), 5) - 50 ─────────────────────────

function computeBXT(closes: number[]): (number | null)[] {
  const ema5 = computeEMA(closes, 5);
  const ema20 = computeEMA(closes, 20);
  const diff = subtractArrays(ema5, ema20);

  // RSI of diff — need actual numeric values; fill nulls with 0 for RSI seed
  const diffForRSI = diff.map((v) => v ?? 0);
  const rsiOfDiff = computeWildersRSI(diffForRSI, 5);

  return rsiOfDiff.map((v) => (v != null ? v - 50 : null));
}

type BxtState = "HH" | "LH" | "HL" | "LL" | null;

function computeBXTStates(bxt: (number | null)[]): BxtState[] {
  const states: BxtState[] = new Array(bxt.length).fill(null);
  for (let i = 1; i < bxt.length; i++) {
    const prev = bxt[i - 1];
    const curr = bxt[i];
    if (prev == null || curr == null) continue;

    if (curr > prev) {
      // Higher value: HH if prev was also going up, but we only look at current vs prev
      // Using simple HH/LH/HL/LL: compare current high/low vs previous
      // BXT "state" = direction of current bar vs previous bar + direction of prior bar vs bar before
      // Simplified: just compare i vs i-1 (current), and i-1 vs i-2 (previous direction)
      if (i < 2 || bxt[i - 2] == null) {
        states[i] = curr > prev ? "HH" : "LL";
        continue;
      }
      const prevPrev = bxt[i - 2]!;
      if (prev >= prevPrev) {
        states[i] = "HH"; // curr > prev AND prev >= prevPrev → both up → HH
      } else {
        states[i] = "HL"; // curr > prev AND prev < prevPrev → turned up from lower → HL
      }
    } else {
      if (i < 2 || bxt[i - 2] == null) {
        states[i] = "LL";
        continue;
      }
      const prevPrev = bxt[i - 2]!;
      if (prev <= prevPrev) {
        states[i] = "LL"; // curr < prev AND prev <= prevPrev → both down → LL
      } else {
        states[i] = "LH"; // curr < prev AND prev > prevPrev → turned down from higher → LH
      }
    }
  }
  return states;
}

function computeBXTConsecutiveLL(states: BxtState[]): number[] {
  const result: number[] = new Array(states.length).fill(0);
  let streak = 0;
  for (let i = 0; i < states.length; i++) {
    if (states[i] === "LL") {
      streak++;
    } else if (states[i] !== null) {
      streak = 0;
    }
    result[i] = streak;
  }
  return result;
}

// ─── Compute all indicators ────────────────────────────────────────────────────

function computeIndicators(bars: OHLCVBar[]): IndicatorBar[] {
  const closes = bars.map((b) => b.close);

  const rsi14 = computeWildersRSI(closes, 14);
  const bxt = computeBXT(closes);
  const bxtStates = computeBXTStates(bxt);
  const bxtConsLL = computeBXTConsecutiveLL(bxtStates);
  const ema9 = computeEMA(closes, 9);
  const ema13 = computeEMA(closes, 13);
  const ema21 = computeEMA(closes, 21);
  const sma200 = computeSMA(closes, 200);

  return bars.map((bar, i) => ({
    ...bar,
    rsi: rsi14[i],
    bxt: bxt[i],
    bxt_state: bxtStates[i],
    bxt_consecutive_ll: bxtConsLL[i],
    ema_9: ema9[i],
    ema_13: ema13[i],
    ema_21: ema21[i],
    sma_200: sma200[i],
  }));
}

// ─── Condition parsing ─────────────────────────────────────────────────────────

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
  "rsi", "bxt", "bxt_consecutive_ll",
  "ema_9", "ema_13", "ema_21", "sma_200",
  "close", "open", "high", "low", "volume",
  // aliases with prefix
  "weekly_rsi", "daily_rsi", "monthly_rsi",
];

function normalizeVar(v: string): string {
  // Strip timeframe prefix aliases (weekly_rsi → rsi, etc.)
  return v.replace(/^(weekly|daily|monthly|4h)_/, "");
}

function parseCondition(condition: string): ParsedCondition {
  // Tokenize on AND/OR (case-insensitive)
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
      // Parse a single clause: var OP value  or  var OP var
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

      // Is rhs a variable name?
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

function getIndicatorValue(bar: IndicatorBar, variable: string): number | null {
  switch (variable) {
    case "rsi": return bar.rsi;
    case "bxt": return bar.bxt;
    case "bxt_consecutive_ll": return bar.bxt_consecutive_ll;
    case "ema_9": return bar.ema_9;
    case "ema_13": return bar.ema_13;
    case "ema_21": return bar.ema_21;
    case "sma_200": return bar.sma_200;
    case "close": return bar.close;
    case "open": return bar.open;
    case "high": return bar.high;
    case "low": return bar.low;
    case "volume": return bar.volume;
    default: return null;
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
    case "<":  return lhsVal < rhsVal;
    case ">":  return lhsVal > rhsVal;
    case "<=": return lhsVal <= rhsVal;
    case ">=": return lhsVal >= rhsVal;
    case "==": return lhsVal === rhsVal;
    case "!=": return lhsVal !== rhsVal;
    default:   return false;
  }
}

function evaluateCondition(bar: IndicatorBar, parsed: ParsedCondition): boolean {
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

// ─── Forward return calculation ────────────────────────────────────────────────

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
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
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

  // For each signal, compute returns for each period
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
        returns[p] = ((bars[idx + p].close - entryClose) / entryClose) * 100;

        // Max upside/downside within the window [idx+1, idx+p]
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

  // Build signal records
  const signals: SignalRecord[] = signalData.map((sd) => ({
    signal_date: sd.bar.date.toISOString().slice(0, 10),
    signal_close: parseFloat(sd.bar.close.toFixed(4)),
    streak_len: sd.bar.bxt_consecutive_ll,
    completed: sd.completed,
  }));

  // Mark current and active (last two incomplete signals)
  const incompleteIndices = signals
    .map((s, i) => (!s.completed ? i : -1))
    .filter((i) => i >= 0);

  if (incompleteIndices.length >= 2) {
    signals[incompleteIndices[incompleteIndices.length - 2]].is_current = true;
    signals[incompleteIndices[incompleteIndices.length - 1]].is_active = true;
  } else if (incompleteIndices.length === 1) {
    signals[incompleteIndices[0]].is_active = true;
  }

  // Build summary per period
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
      avg_return: parseFloat((rets.reduce((s, v) => s + v, 0) / rets.length).toFixed(2)),
      median_return: parseFloat(median(rets).toFixed(2)),
      best: parseFloat(Math.max(...rets).toFixed(2)),
      worst: parseFloat(Math.min(...rets).toFixed(2)),
      avg_max_upside: upsides.length > 0
        ? parseFloat((upsides.reduce((s, v) => s + v, 0) / upsides.length).toFixed(2))
        : null,
      avg_max_downside: downsides.length > 0
        ? parseFloat((downsides.reduce((s, v) => s + v, 0) / downsides.length).toFixed(2))
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
    // forward param accepted but we use defaults per timeframe
  } = body;

  if (!condition || !condition.trim()) {
    return NextResponse.json(
      { error: "Missing required field: condition" },
      { status: 400 }
    );
  }

  if (!["weekly", "daily", "4h", "monthly"].includes(timeframe)) {
    return NextResponse.json(
      { error: `Invalid timeframe: "${timeframe}". Must be weekly, daily, 4h, or monthly.` },
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
  let parsedCondition;
  try {
    parsedCondition = parseCondition(condition.trim());
  } catch (err) {
    return NextResponse.json(
      { error: `Condition parse error: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  // Fetch data
  let rawBars: OHLCVBar[];
  try {
    rawBars = await fetchOHLCV(tickerUpper, tf);
  } catch (err: unknown) {
    const msg = (err as Error).message ?? String(err);
    if (msg.includes("No fundamentals data found") || msg.includes("Not Found") || msg.includes("404")) {
      return NextResponse.json(
        { error: `Invalid or unknown ticker: "${tickerUpper}"` },
        { status: 400 }
      );
    }
    if (msg.includes("Too Many Requests") || msg.includes("429") || msg.includes("rate limit")) {
      return NextResponse.json(
        { error: "Yahoo Finance rate limit hit. Please retry in a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Failed to fetch data for ${tickerUpper}: ${msg}` },
      { status: 500 }
    );
  }

  if (rawBars.length === 0) {
    return NextResponse.json(
      { error: `No price data returned for ticker "${tickerUpper}" with timeframe "${tf}".` },
      { status: 400 }
    );
  }

  // Compute indicators
  const indicatorBars = computeIndicators(rawBars);

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
  const { signals, summary } = computeForwardReturns(indicatorBars, signalIndices, periods);

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
