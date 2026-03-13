/**
 * lib/indicators.ts
 *
 * Shared technical indicator computation functions.
 * Extracted from app/api/backtest/route.ts for reuse in:
 *   - scripts/backfill-ohlcv.ts
 *   - app/api/backtest/route.ts
 *   - lib/orb/ (future)
 *
 * Formulas verified against TradingView — DO NOT change parameters.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OHLCVBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type BxtState = "HH" | "LH" | "HL" | "LL" | null;

export interface IndicatorBar extends OHLCVBar {
  rsi: number | null;
  bxt: number | null;
  bxt_state: BxtState;
  bxt_consecutive_ll: number;
  ema_9: number | null;
  ema_13: number | null;
  ema_21: number | null;
  sma_200: number | null;
}

// ─── EMA ──────────────────────────────────────────────────────────────────────

export function computeEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(values.length).fill(null);
  let ema: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (ema === null) {
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

// ─── SMA ──────────────────────────────────────────────────────────────────────

export function computeSMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    result[i] = sum / period;
  }
  return result;
}

// ─── RSI (Wilder's smoothing) ─────────────────────────────────────────────────

export function computeRSI(values: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period + 1) return result;

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

// ─── BXT: RSI(EMA(close,5) - EMA(close,20), 5) - 50 ─────────────────────────

function subtractArrays(a: (number | null)[], b: (number | null)[]): (number | null)[] {
  return a.map((v, i) => (v != null && b[i] != null ? v - b[i]! : null));
}

export function computeBXT(closes: number[]): (number | null)[] {
  const ema5 = computeEMA(closes, 5);
  const ema20 = computeEMA(closes, 20);
  const diff = subtractArrays(ema5, ema20);
  const diffForRSI = diff.map((v) => v ?? 0);
  const rsiOfDiff = computeRSI(diffForRSI, 5);
  return rsiOfDiff.map((v) => (v != null ? v - 50 : null));
}

export function computeBXTStates(bxt: (number | null)[]): BxtState[] {
  const states: BxtState[] = new Array(bxt.length).fill(null);
  for (let i = 1; i < bxt.length; i++) {
    const prev = bxt[i - 1];
    const curr = bxt[i];
    if (prev == null || curr == null) continue;

    if (curr > prev) {
      if (i < 2 || bxt[i - 2] == null) {
        states[i] = "HH";
        continue;
      }
      const prevPrev = bxt[i - 2]!;
      states[i] = prev >= prevPrev ? "HH" : "HL";
    } else {
      if (i < 2 || bxt[i - 2] == null) {
        states[i] = "LL";
        continue;
      }
      const prevPrev = bxt[i - 2]!;
      states[i] = prev <= prevPrev ? "LL" : "LH";
    }
  }
  return states;
}

export function computeBXTConsecutiveLL(states: BxtState[]): number[] {
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

export function computeAllIndicators(bars: OHLCVBar[]): IndicatorBar[] {
  const closes = bars.map((b) => b.close);

  const rsi14 = computeRSI(closes, 14);
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
