import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";
import {
  evaluateAllSetups,
  type Indicators,
  type PreviousState,
  type SetupResult,
  suggestMode,
} from "@/lib/orb/evaluate-setups";
import { computeIndicators } from "@/lib/orb/compute-indicators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const SUPPORTED_BACKTEST_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "AMZN", "META", "MU", "GOOGL", "BABA"] as const;
const PEER_TICKERS = SUPPORTED_BACKTEST_TICKERS;
const VALIDATED_BACKTEST_TICKER = "TSLA";
const BACKTEST_START_INDEX = 250; // Need ~250 bars for SMA200 lookback

type ScanStatus = "active" | "watching" | "inactive";
type ReturnColumn = "ret_5d" | "ret_10d" | "ret_20d" | "ret_60d";
type BxtState = "HH" | "LH" | "HL" | "LL";

interface DefinitionRow {
  id: string;
  name: string | null;
  public_name: string | null;
  number: number | null;
  type: "buy" | "avoid" | null;
  one_liner: string | null;
  public_description: string | null;
  description: string | null;
}

interface StateRow {
  setup_id: string;
  status: "active" | "watching" | "inactive";
  active_since: string | null;
  active_day: number | null;
  entry_price: number | null;
  gauge_entry_value: number | null;
}

interface BacktestRow {
  setup_id: string;
  signal_date: string;
  signal_price: number;
  ret_5d: number | null;
  ret_10d: number | null;
  ret_20d: number | null;
  ret_60d: number | null;
  is_win_5d: boolean | null;
  is_win_10d: boolean | null;
  is_win_20d: boolean | null;
  is_win_60d: boolean | null;
}

interface OhlcvRow {
  bar_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi: number | null;
  bxt: number | null;
  bxt_state: string | null;
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

interface FallbackSetupMeta {
  name: string;
  public_name: string;
  type: "buy" | "avoid";
  one_liner: string;
  number: number;
}

const FALLBACK_SETUP_META: Record<string, FallbackSetupMeta> = {
  "smi-oversold-gauge": {
    name: "SMI Oversold Gauge",
    public_name: "Oversold Gauge",
    type: "buy",
    one_liner: "SMI crosses below -60 and tracks recovery toward +30.",
    number: 1,
  },
  "oversold-extreme": {
    name: "Oversold Extreme",
    public_name: "Generational Oversold",
    type: "buy",
    one_liner: "Price deeply below the 200 SMA with stabilization.",
    number: 2,
  },
  "regime-shift": {
    name: "Regime Shift",
    public_name: "Regime Shift",
    type: "buy",
    one_liner: "Weekly momentum turns while structure gets reclaimed.",
    number: 3,
  },
  "deep-value": {
    name: "Deep Value",
    public_name: "Deep Value",
    type: "buy",
    one_liner: "200 SMA dislocation zone with improving momentum.",
    number: 4,
  },
  "green-shoots": {
    name: "Green Shoots",
    public_name: "Green Shoots",
    type: "buy",
    one_liner: "Daily BX flips LL→HL below long-term trend.",
    number: 5,
  },
  "momentum-flip": {
    name: "Momentum Flip",
    public_name: "Momentum Flip",
    type: "buy",
    one_liner: "Daily BX flips HL→HH with RSI runway.",
    number: 6,
  },
  "trend-confirm": {
    name: "Trend Confirmation",
    public_name: "Trend Confirmation",
    type: "buy",
    one_liner: "SMI bull cross with BX HH confirmation.",
    number: 7,
  },
  "trend-ride": {
    name: "Trend Ride",
    public_name: "Trend Ride",
    type: "buy",
    one_liner: "Daily and weekly structure aligned for continuation.",
    number: 8,
  },
  "trend-continuation": {
    name: "Trend Continuation",
    public_name: "Trend Continuation",
    type: "buy",
    one_liner: "Weekly EMAs stacked and daily momentum positive.",
    number: 9,
  },
  goldilocks: {
    name: "Goldilocks",
    public_name: "Goldilocks Zone",
    type: "buy",
    one_liner: "Trend confirmed, positive momentum, not overheated.",
    number: 10,
  },
  capitulation: {
    name: "Capitulation Bounce",
    public_name: "Capitulation Bounce",
    type: "buy",
    one_liner: "Extended selloff and oversold momentum snapback setup.",
    number: 11,
  },
  "vix-spike-reversal": {
    name: "VIX Spike Reversal",
    public_name: "VIX Spike Reversal",
    type: "buy",
    one_liner: "Fear spike regime where historical reversals appear.",
    number: 12,
  },
  "smi-overbought": {
    name: "SMI Overbought Gauge",
    public_name: "Overbought Gauge",
    type: "avoid",
    one_liner: "SMI crosses above +75 and tracks reset risk.",
    number: 1,
  },
  "dual-ll": {
    name: "Dual Timeframe Downtrend",
    public_name: "Dual LL",
    type: "avoid",
    one_liner: "Daily and weekly BX both in LL state.",
    number: 2,
  },
  overextended: {
    name: "Overextended",
    public_name: "Overextended",
    type: "avoid",
    one_liner: "Price stretched far above long-term trend.",
    number: 3,
  },
  "momentum-crack": {
    name: "Momentum Crack",
    public_name: "Momentum Crack",
    type: "avoid",
    one_liner: "Momentum deterioration from previously strong levels.",
    number: 4,
  },
  "ema-shield-caution": {
    name: "EMA Shield Caution",
    public_name: "EMA Shield Caution",
    type: "avoid",
    one_liner: "Early warning that short-term trend support is weakening.",
    number: 5,
  },
  "ema-shield-break": {
    name: "EMA Shield Break",
    public_name: "EMA Shield Break",
    type: "avoid",
    one_liner: "Sustained break below D9 EMA with negative slope.",
    number: 6,
  },
};

const PERIOD_TO_COLUMN: Record<"5" | "10" | "20" | "60", ReturnColumn> = {
  "5": "ret_5d",
  "10": "ret_10d",
  "20": "ret_20d",
  "60": "ret_60d",
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function round(value: number, decimals: number = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
}

function normalizeBxtState(value: string | null): BxtState | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "HH" || upper === "LH" || upper === "HL" || upper === "LL") {
    return upper;
  }
  return null;
}

function deriveBxtState(curr: number, prev: number, prevState: BxtState): BxtState {
  const currentHigh = curr > prev;
  const previousWasHigh = prevState[0] === "H";
  if (currentHigh && previousWasHigh) return "HH";
  if (!currentHigh && previousWasHigh) return "LH";
  if (currentHigh && !previousWasHigh) return "HL";
  return "LL";
}

function inferBxtStates(values: number[]): BxtState[] {
  const states: BxtState[] = new Array(values.length).fill("LL") as BxtState[];
  let firstValidIndex = -1;

  for (let i = 0; i < values.length; i++) {
    if (Number.isFinite(values[i])) {
      firstValidIndex = i;
      break;
    }
  }

  if (firstValidIndex < 0) return states;

  states[firstValidIndex] = values[firstValidIndex] > 0 ? "HH" : "LL";

  for (let i = firstValidIndex + 1; i < values.length; i++) {
    if (!Number.isFinite(values[i])) {
      states[i] = states[i - 1];
      continue;
    }
    const prev = Number.isFinite(values[i - 1]) ? values[i - 1] : values[i];
    states[i] = deriveBxtState(values[i], prev, states[i - 1]);
  }

  return states;
}

function ema(values: number[], period: number): number[] {
  if (values.length < period) return new Array(values.length).fill(Number.NaN);

  const k = 2 / (period + 1);
  const result = new Array(values.length).fill(Number.NaN);

  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k);
  }

  return result;
}

function highest(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(Number.NaN);
  for (let i = period - 1; i < values.length; i++) {
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] > max) max = values[j];
    }
    result[i] = max;
  }
  return result;
}

function lowest(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(Number.NaN);
  for (let i = period - 1; i < values.length; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] < min) min = values[j];
    }
    result[i] = min;
  }
  return result;
}

function computeSmi(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 10,
  dPeriod: number = 3,
  emaPeriod: number = 3,
): { smi: number[]; signal: number[] } {
  const upper = highest(highs, kPeriod);
  const lower = lowest(lows, kPeriod);

  const midpointDiff = closes.map((close, index) => {
    if (!Number.isFinite(upper[index]) || !Number.isFinite(lower[index])) return Number.NaN;
    return close - (upper[index] + lower[index]) / 2;
  });

  const fullRange = highs.map((_, index) => {
    if (!Number.isFinite(upper[index]) || !Number.isFinite(lower[index])) return Number.NaN;
    return upper[index] - lower[index];
  });

  const diffSmooth1 = ema(midpointDiff.map((value) => (Number.isFinite(value) ? value : 0)), dPeriod);
  const diffSmooth2 = ema(diffSmooth1.map((value) => (Number.isFinite(value) ? value : 0)), emaPeriod);

  const rangeSmooth1 = ema(fullRange.map((value) => (Number.isFinite(value) ? value : 0)), dPeriod);
  const rangeSmooth2 = ema(rangeSmooth1.map((value) => (Number.isFinite(value) ? value : 0)), emaPeriod);

  const smiValues = new Array(closes.length).fill(Number.NaN);
  for (let i = 0; i < closes.length; i++) {
    if (!Number.isFinite(diffSmooth2[i]) || !Number.isFinite(rangeSmooth2[i])) continue;
    if (Math.abs(rangeSmooth2[i]) < 1e-10) {
      smiValues[i] = 0;
    } else {
      smiValues[i] = (diffSmooth2[i] / (rangeSmooth2[i] / 2)) * 100;
    }
  }

  const signal = ema(smiValues.map((value) => (Number.isFinite(value) ? value : 0)), emaPeriod);
  return { smi: smiValues, signal };
}

function computeForwardSummary(rows: BacktestRow[]): Record<string, SummaryPeriod> {
  const summary: Record<string, SummaryPeriod> = {};

  for (const [period, column] of Object.entries(PERIOD_TO_COLUMN) as ["5" | "10" | "20" | "60", ReturnColumn][]) {
    const returns = rows
      .map((row) => toNumber(row[column]))
      .filter((value): value is number => value !== null);

    if (returns.length === 0) {
      summary[period] = {
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

    const wins = returns.filter((value) => value > 0).length;
    const avgReturn = returns.reduce((sum, value) => sum + value, 0) / returns.length;

    summary[period] = {
      n: returns.length,
      wins,
      win_rate_pct: `${Math.round((wins / returns.length) * 100)}%`,
      avg_return: round(avgReturn),
      median_return: round(median(returns)),
      best: round(Math.max(...returns)),
      worst: round(Math.min(...returns)),
      avg_max_upside: null,
      avg_max_downside: null,
    };
  }

  return summary;
}

function buildRelevantIndicators(setupId: string, indicators: Indicators) {
  const base = {
    close: round(indicators.close),
    rsi: round(indicators.rsi),
    smi: round(indicators.smi),
    bx_daily_state: indicators.bx_daily_state,
    bx_weekly_state: indicators.bx_weekly_state,
    sma200_dist: round(indicators.sma200_dist),
    ema9: round(indicators.ema9),
    ema21: round(indicators.ema21),
    price_vs_ema9: round(indicators.price_vs_ema9),
    vix_weekly_change_pct: round(indicators.vix_weekly_change_pct),
    days_below_ema9: indicators.days_below_ema9,
    ema9_slope_5d: round(indicators.ema9_slope_5d),
  };

  switch (setupId) {
    case "smi-oversold-gauge":
    case "smi-overbought":
      return {
        smi: base.smi,
        smi_signal: round(indicators.smi_signal),
        smi_prev: round(indicators.smi_prev),
      };
    case "dual-ll":
      return {
        bx_daily_state: base.bx_daily_state,
        bx_weekly_state: base.bx_weekly_state,
        bx_daily: round(indicators.bx_daily),
        bx_weekly: round(indicators.bx_weekly),
      };
    case "overextended":
    case "oversold-extreme":
    case "deep-value":
      return {
        close: base.close,
        sma200_dist: base.sma200_dist,
        bx_daily_state: base.bx_daily_state,
      };
    case "regime-shift":
      return {
        bx_weekly_state: base.bx_weekly_state,
        bx_weekly_transition: indicators.bx_weekly_transition,
        daily_hh_streak: indicators.daily_hh_streak,
        price_above_weekly_13: indicators.price_above_weekly_13,
      };
    case "trend-ride":
    case "trend-continuation":
      return {
        bx_daily_state: base.bx_daily_state,
        weekly_emas_stacked: indicators.weekly_emas_stacked,
        price_above_weekly_all: indicators.price_above_weekly_all,
        price_above_weekly_21: indicators.price_above_weekly_21,
      };
    case "trend-confirm":
      return {
        smi: base.smi,
        smi_signal: round(indicators.smi_signal),
        smi_bull_cross: indicators.smi_bull_cross,
        bx_daily_state: base.bx_daily_state,
      };
    case "momentum-crack":
      return {
        smi: base.smi,
        smi_change_3d: round(indicators.smi_change_3d),
        was_full_bull_5d: indicators.was_full_bull_5d,
      };
    case "ema-shield-caution":
    case "ema-shield-break":
      return {
        days_below_ema9: base.days_below_ema9,
        ema9_slope_5d: base.ema9_slope_5d,
        price_vs_ema9: base.price_vs_ema9,
      };
    case "vix-spike-reversal":
      return {
        vix_weekly_change_pct: base.vix_weekly_change_pct,
        sma200_dist: base.sma200_dist,
        bx_daily_state: base.bx_daily_state,
      };
    default:
      return {
        close: base.close,
        rsi: base.rsi,
        smi: base.smi,
        bx_daily_state: base.bx_daily_state,
      };
  }
}

// ─── Helper for finite number check ──────────────────────────────────────────
function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

// ─── Build a BacktestRow from a signal ───────────────────────────────────────
function buildBacktestRow(
  setupId: string,
  signalDate: string,
  signalClose: number,
  closes: number[],
  signalIndex: number,
): BacktestRow {
  const fwdReturn = (offset: number): number | null => {
    const idx = signalIndex + offset;
    if (idx >= closes.length || !isFiniteNumber(closes[idx])) return null;
    return round(((closes[idx] - signalClose) / signalClose) * 100);
  };
  const ret5 = fwdReturn(5);
  const ret10 = fwdReturn(10);
  const ret20 = fwdReturn(20);
  const ret60 = fwdReturn(60);
  return {
    setup_id: setupId,
    signal_date: signalDate,
    signal_price: signalClose,
    ret_5d: ret5,
    ret_10d: ret10,
    ret_20d: ret20,
    ret_60d: ret60,
    is_win_5d: ret5 != null ? ret5 > 0 : null,
    is_win_10d: ret10 != null ? ret10 > 0 : null,
    is_win_20d: ret20 != null ? ret20 > 0 : null,
    is_win_60d: ret60 != null ? ret60 > 0 : null,
  };
}

// ─── Update previousStates from setup results ───────────────────────────────
function updatePreviousStates(
  prevMap: Map<string, PreviousState>,
  results: SetupResult[],
  date: string,
  close: number,
) {
  for (const r of results) {
    const prev = prevMap.get(r.setup_id);
    const status: "active" | "watching" | "inactive" = r.is_active
      ? "active"
      : r.is_watching
      ? "watching"
      : "inactive";
    prevMap.set(r.setup_id, {
      setup_id: r.setup_id,
      status,
      gauge_entry_value: r.gauge_entry_value ?? prev?.gauge_entry_value,
      entry_price: r.is_active ? (prev?.status === "active" ? prev.entry_price : close) : undefined,
      active_since: r.is_active ? (prev?.status === "active" ? prev.active_since : date) : undefined,
      active_day: r.is_active
        ? (prev?.status === "active" && typeof prev.active_day === "number" ? prev.active_day + 1 : 1)
        : undefined,
    });
  }
}

// ─── On-the-fly historical backtest walk ─────────────────────────────────────
async function computeDynamicBacktestRows(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
  setupFilter: Set<string>,
): Promise<Map<string, BacktestRow[]>> {
  // Fetch last 20 years of data (~5040 trading days)
  const [dailyRows, weeklyRows, vixDailyRows, vixWeeklyRows] = await Promise.all([
    fetchOhlcvRows(supabase, ticker, "daily", 5100),
    fetchOhlcvRows(supabase, ticker, "weekly", 1100),
    fetchOhlcvRows(supabase, "^VIX", "daily", 5100),
    fetchOhlcvRows(supabase, "^VIX", "weekly", 1100),
  ]);

  if (!dailyRows || !weeklyRows || dailyRows.length < BACKTEST_START_INDEX || weeklyRows.length < 10) {
    return new Map();
  }

  // Pre-compute full arrays
  const closes = dailyRows.map((r) => r.close);
  const highs = dailyRows.map((r) => r.high);
  const lows = dailyRows.map((r) => r.low);
  const volumes = dailyRows.map((r) => r.volume);
  const rsiSeries = dailyRows.map((r) => toNumber(r.rsi) ?? Number.NaN);
  const ema9Series = dailyRows.map((r) => toNumber(r.ema_9) ?? Number.NaN);
  const ema21Series = dailyRows.map((r) => toNumber(r.ema_21) ?? Number.NaN);
  const sma200Series = dailyRows.map((r) => toNumber(r.sma_200) ?? Number.NaN);

  // SMI for entire series
  const smiResult = computeSmi(highs, lows, closes);

  // BXT states
  const dailyBxtSeries = dailyRows.map((r) => toNumber(r.bxt) ?? Number.NaN);
  const dailyInferredStates = inferBxtStates(dailyBxtSeries);
  const weeklyBxtSeries = weeklyRows.map((r) => toNumber(r.bxt) ?? Number.NaN);
  const weeklyInferredStates = inferBxtStates(weeklyBxtSeries);
  const weeklyEma9Series = weeklyRows.map((r) => toNumber(r.ema_9) ?? Number.NaN);
  const weeklyEma13Series = weeklyRows.map((r) => toNumber(r.ema_13) ?? Number.NaN);
  const weeklyEma21Series = weeklyRows.map((r) => toNumber(r.ema_21) ?? Number.NaN);

  // VIX arrays
  const vixDailyCloses = vixDailyRows ? vixDailyRows.map((r) => r.close) : [];
  const vixWeeklyCloses = vixWeeklyRows ? vixWeeklyRows.map((r) => r.close) : [];
  const vixDailyDates = vixDailyRows ? vixDailyRows.map((r) => r.bar_date) : [];
  const vixWeeklyDates = vixWeeklyRows ? vixWeeklyRows.map((r) => r.bar_date) : [];

  // Build date→index maps for weekly and VIX alignment
  const weeklyDateIndex = new Map<string, number>();
  weeklyRows.forEach((r, i) => weeklyDateIndex.set(r.bar_date, i));

  // Map each daily bar to its corresponding weekly bar index
  const weeklyIndexByDaily: number[] = new Array(dailyRows.length).fill(-1);
  let lastWeeklyIdx = 0;
  for (let i = 0; i < dailyRows.length; i++) {
    const d = dailyRows[i].bar_date;
    // Find the latest weekly bar on or before this daily bar
    while (lastWeeklyIdx + 1 < weeklyRows.length && weeklyRows[lastWeeklyIdx + 1].bar_date <= d) {
      lastWeeklyIdx++;
    }
    if (weeklyRows[lastWeeklyIdx].bar_date <= d) {
      weeklyIndexByDaily[i] = lastWeeklyIdx;
    }
  }

  // Map daily bars to VIX indices
  const vixDailyIndexByDaily: number[] = new Array(dailyRows.length).fill(-1);
  let lastVixDailyIdx = 0;
  for (let i = 0; i < dailyRows.length; i++) {
    const d = dailyRows[i].bar_date;
    while (lastVixDailyIdx + 1 < vixDailyDates.length && vixDailyDates[lastVixDailyIdx + 1] <= d) {
      lastVixDailyIdx++;
    }
    if (vixDailyDates.length > 0 && vixDailyDates[lastVixDailyIdx] <= d) {
      vixDailyIndexByDaily[i] = lastVixDailyIdx;
    }
  }

  const vixWeeklyIndexByDaily: number[] = new Array(dailyRows.length).fill(-1);
  let lastVixWeeklyIdx = 0;
  for (let i = 0; i < dailyRows.length; i++) {
    const d = dailyRows[i].bar_date;
    while (lastVixWeeklyIdx + 1 < vixWeeklyDates.length && vixWeeklyDates[lastVixWeeklyIdx + 1] <= d) {
      lastVixWeeklyIdx++;
    }
    if (vixWeeklyDates.length > 0 && vixWeeklyDates[lastVixWeeklyIdx] <= d) {
      vixWeeklyIndexByDaily[i] = lastVixWeeklyIdx;
    }
  }

  // Pre-compute derived series
  const consecutiveDownSeries: number[] = new Array(dailyRows.length).fill(0);
  const consecutiveUpSeries: number[] = new Array(dailyRows.length).fill(0);
  const stabilizationSeries: number[] = new Array(dailyRows.length).fill(0);
  const dailyHhStreakSeries: number[] = new Array(dailyRows.length).fill(0);
  const daysBelowEma9Series: number[] = new Array(dailyRows.length).fill(0);
  const wasFullBull5dSeries: boolean[] = new Array(dailyRows.length).fill(false);

  for (let i = 1; i < dailyRows.length; i++) {
    // consecutive down
    if (closes[i] < closes[i - 1]) consecutiveDownSeries[i] = consecutiveDownSeries[i - 1] + 1;
    // consecutive up
    if (closes[i] > closes[i - 1]) consecutiveUpSeries[i] = consecutiveUpSeries[i - 1] + 1;
    // stabilization (higher lows)
    if (lows[i] >= lows[i - 1]) stabilizationSeries[i] = stabilizationSeries[i - 1] + 1;
    // daily HH streak
    const state = normalizeBxtState(dailyRows[i].bxt_state) ?? dailyInferredStates[i] ?? "LL";
    if (state === "HH") dailyHhStreakSeries[i] = dailyHhStreakSeries[i - 1] + 1;
    // days below ema9
    const barEma9 = ema9Series[i];
    if (isFiniteNumber(barEma9) && closes[i] < barEma9) {
      daysBelowEma9Series[i] = daysBelowEma9Series[i - 1] + 1;
    }
    // was full bull in last 5 days
    let wasBull = false;
    for (let j = Math.max(0, i - 4); j <= i; j++) {
      const bEma9 = ema9Series[j];
      const bEma21 = ema21Series[j];
      if (!isFiniteNumber(bEma9) || !isFiniteNumber(bEma21) || !Number.isFinite(closes[j])) continue;
      if (closes[j] > bEma9 && bEma9 > bEma21) { wasBull = true; break; }
    }
    wasFullBull5dSeries[i] = wasBull;
  }

  // Walk through bars and evaluate setups
  const rowsBySetup = new Map<string, BacktestRow[]>();
  const previousStates = new Map<string, PreviousState>();
  const startIndex = Math.max(BACKTEST_START_INDEX, 5);

  for (let i = startIndex; i < dailyRows.length; i++) {
    if (i < 3) continue;

    const weeklyIndex = weeklyIndexByDaily[i];
    if (weeklyIndex < 1) continue;

    const close = closes[i];
    const rsi = rsiSeries[i];
    const rsiPrev = rsiSeries[i - 1];
    const bxtDaily = dailyBxtSeries[i];
    const bxtDailyPrev = dailyBxtSeries[i - 1];
    const e9 = ema9Series[i];
    const e21 = ema21Series[i];
    const s200 = sma200Series[i];
    const wEma9 = weeklyEma9Series[weeklyIndex];
    const wEma13 = weeklyEma13Series[weeklyIndex];
    const wEma21 = weeklyEma21Series[weeklyIndex];
    const bxtWeekly = weeklyBxtSeries[weeklyIndex];
    const bxtWeeklyPrev = weeklyBxtSeries[weeklyIndex - 1];
    const smiCurr = smiResult.smi[i];
    const smiSignalCurr = smiResult.signal[i];
    const smiPrev = smiResult.smi[i - 1];
    const smiSignalPrev = smiResult.signal[i - 1];
    const smiPrev3 = smiResult.smi[Math.max(0, i - 3)];

    if (
      !isFiniteNumber(close) || !isFiniteNumber(rsi) || !isFiniteNumber(rsiPrev) ||
      !isFiniteNumber(bxtDaily) || !isFiniteNumber(bxtDailyPrev) ||
      !isFiniteNumber(e9) || !isFiniteNumber(e21) || !isFiniteNumber(s200) ||
      !isFiniteNumber(wEma9) || !isFiniteNumber(wEma13) || !isFiniteNumber(wEma21) ||
      !isFiniteNumber(bxtWeekly) || !isFiniteNumber(bxtWeeklyPrev) ||
      !Number.isFinite(smiCurr) || !Number.isFinite(smiSignalCurr) ||
      !Number.isFinite(smiPrev) || !Number.isFinite(smiSignalPrev) || !Number.isFinite(smiPrev3)
    ) continue;

    const bxDailyState = normalizeBxtState(dailyRows[i].bxt_state) ?? dailyInferredStates[i] ?? "LL";
    const bxDailyStatePrev = normalizeBxtState(dailyRows[i - 1].bxt_state ?? null) ?? dailyInferredStates[i - 1] ?? "LL";
    const bxWeeklyState = normalizeBxtState(weeklyRows[weeklyIndex].bxt_state) ?? weeklyInferredStates[weeklyIndex] ?? "LL";
    const bxWeeklyStatePrev = normalizeBxtState(weeklyRows[weeklyIndex - 1].bxt_state ?? null) ?? weeklyInferredStates[weeklyIndex - 1] ?? "LL";

    const vixDailyIndex = vixDailyIndexByDaily[i];
    const vixClose = vixDailyIndex >= 0 && Number.isFinite(vixDailyCloses[vixDailyIndex]) ? vixDailyCloses[vixDailyIndex] : 0;
    const vixWeeklyIndex = vixWeeklyIndexByDaily[i];
    let vixWeeklyChangePct = 0;
    if (vixWeeklyIndex >= 1) {
      const lv = vixWeeklyCloses[vixWeeklyIndex];
      const pv = vixWeeklyCloses[vixWeeklyIndex - 1];
      if (Number.isFinite(lv) && Number.isFinite(pv) && pv !== 0) {
        vixWeeklyChangePct = ((lv - pv) / pv) * 100;
      }
    }

    const ema9FiveDaysAgo = ema9Series[Math.max(0, i - 5)];
    const ema9Slope5d = isFiniteNumber(ema9FiveDaysAgo) && ema9FiveDaysAgo !== 0
      ? ((e9 - ema9FiveDaysAgo) / ema9FiveDaysAgo) * 100 : 0;

    const recentVolumes = volumes.slice(Math.max(0, i - 29), i + 1).map((v) => (Number.isFinite(v) ? v : 0));

    const indicators: Indicators & { open: number; volume: number; volumes: number[] } = {
      date: dailyRows[i].bar_date,
      close, open: toNumber(dailyRows[i].open) ?? close,
      volume: Number.isFinite(volumes[i]) ? volumes[i] : 0,
      volumes: recentVolumes,
      vix_close: vixClose, vix_weekly_change_pct: vixWeeklyChangePct,
      bx_daily: bxtDaily, bx_daily_prev: bxtDailyPrev,
      bx_daily_state: bxDailyState, bx_daily_state_prev: bxDailyStatePrev,
      bx_weekly: bxtWeekly, bx_weekly_prev: bxtWeeklyPrev,
      bx_weekly_state: bxWeeklyState, bx_weekly_state_prev: bxWeeklyStatePrev,
      bx_weekly_transition: bxWeeklyState !== bxWeeklyStatePrev ? `${bxWeeklyStatePrev}_to_${bxWeeklyState}` : null,
      rsi, rsi_prev: rsiPrev,
      rsi_change_3d: rsi - (toNumber(dailyRows[Math.max(0, i - 3)]?.rsi) ?? rsiPrev),
      smi: smiCurr, smi_signal: smiSignalCurr,
      smi_prev: smiPrev, smi_signal_prev: smiSignalPrev,
      smi_change_3d: smiCurr - smiPrev3,
      smi_bull_cross: smiPrev <= smiSignalPrev && smiCurr > smiSignalCurr,
      smi_bear_cross: smiPrev >= smiSignalPrev && smiCurr < smiSignalCurr,
      ema9: e9, ema21: e21, sma200: s200,
      sma200_dist: ((close - s200) / s200) * 100,
      price_vs_ema9: ((close - e9) / e9) * 100,
      price_vs_ema21: ((close - e21) / e21) * 100,
      consecutive_down: consecutiveDownSeries[i], consecutive_up: consecutiveUpSeries[i],
      stabilization_days: stabilizationSeries[i],
      weekly_ema9: wEma9, weekly_ema13: wEma13, weekly_ema21: wEma21,
      weekly_emas_stacked: wEma9 > wEma13 && wEma13 > wEma21,
      price_above_weekly_all: close > wEma9 && close > wEma13 && close > wEma21,
      price_above_weekly_13: close > wEma13,
      price_above_weekly_21: close > wEma21,
      daily_hh_streak: dailyHhStreakSeries[i],
      ema9_slope_5d: ema9Slope5d,
      days_below_ema9: daysBelowEma9Series[i],
      was_full_bull_5d: wasFullBull5dSeries[i],
    };

    const setupResults = evaluateAllSetups(indicators, previousStates);

    for (const result of setupResults) {
      if (!setupFilter.has(result.setup_id)) continue;
      const previousStatus = previousStates.get(result.setup_id)?.status ?? "inactive";
      if (result.is_active && previousStatus !== "active") {
        const row = buildBacktestRow(result.setup_id, indicators.date, indicators.close, closes, i);
        const existing = rowsBySetup.get(result.setup_id);
        if (existing) existing.push(row);
        else rowsBySetup.set(result.setup_id, [row]);
      }
    }

    updatePreviousStates(previousStates, setupResults, indicators.date, indicators.close);
  }

  // Sort each setup's rows descending by date
  for (const rows of rowsBySetup.values()) {
    rows.sort((a, b) => b.signal_date.localeCompare(a.signal_date));
  }

  return rowsBySetup;
}

// ─── Seasonality computation ─────────────────────────────────────────────────
async function computeSeasonality(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
): Promise<{
  monthly: Array<{ month: number; name: string; avg_return: number; median_return: number; win_rate: number; n: number }>;
  next_30d: { avg_return: number; win_rate: number; n: number } | null;
  forward: {
    d5: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
    d10: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
    d30: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
    d60: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
  };
}> {
  // Fetch all monthly bars or compute from daily bars
  const rawDaily = await fetchOhlcvRows(supabase, ticker, "daily", 5100);
  const allDaily = (rawDaily ?? []).filter((bar) => toNumber(bar.close) != null && Number(bar.close) > 0);
  const emptyForward = { d5: null, d10: null, d30: null, d60: null };
  if (!allDaily || allDaily.length < 250) return { monthly: [], next_30d: null, forward: emptyForward };

  // Group bars by year-month to get monthly returns
  const monthlyReturns: Map<number, number[]> = new Map();
  for (let m = 1; m <= 12; m++) monthlyReturns.set(m, []);

  // Walk through and compute month-over-month returns
  let prevMonthClose: number | null = null;
  let prevMonth: number | null = null;

  for (const bar of allDaily) {
    const d = new Date(bar.bar_date + "T12:00:00Z");
    const month = d.getMonth() + 1; // 1-12

    if (prevMonth !== null && month !== prevMonth && prevMonthClose !== null) {
      // Month changed — record return for the NEW month that just completed
      const ret = ((bar.close - prevMonthClose) / prevMonthClose) * 100;
      // The return belongs to prevMonth (the month that just ended)
      monthlyReturns.get(prevMonth)!.push(ret);
    }

    // Track last bar of each month
    if (prevMonth !== null && month !== prevMonth) {
      prevMonthClose = bar.close;
    } else if (prevMonthClose === null) {
      prevMonthClose = bar.close;
    }
    prevMonth = month;
  }

  // Actually, let me redo this properly — compute return for each calendar month
  // by looking at close on first and last trading day of each month
  const monthBuckets: Map<string, { first: number; last: number }> = new Map(); // "YYYY-MM" → first/last close
  for (const bar of allDaily) {
    const key = bar.bar_date.substring(0, 7); // "YYYY-MM"
    const existing = monthBuckets.get(key);
    if (!existing) {
      monthBuckets.set(key, { first: bar.close, last: bar.close });
    } else {
      existing.last = bar.close;
    }
  }

  // Compute monthly returns
  const monthReturnsByMonth: Map<number, number[]> = new Map();
  for (let m = 1; m <= 12; m++) monthReturnsByMonth.set(m, []);

  const sortedKeys = [...monthBuckets.keys()].sort();
  const latestCompleteMonthKey = sortedKeys.length >= 2 ? sortedKeys[sortedKeys.length - 2] : null;
  for (let i = 1; i < sortedKeys.length; i++) {
    const prevKey = sortedKeys[i - 1];
    const currKey = sortedKeys[i];
    if (latestCompleteMonthKey && currKey > latestCompleteMonthKey) continue; // exclude incomplete current month from history
    const prevBucket = monthBuckets.get(prevKey)!;
    const currBucket = monthBuckets.get(currKey)!;
    if (!prevBucket || !currBucket || prevBucket.last <= 0 || currBucket.last <= 0) continue;
    const monthNum = parseInt(currKey.split("-")[1], 10);
    const ret = ((currBucket.last - prevBucket.last) / prevBucket.last) * 100;
    monthReturnsByMonth.get(monthNum)!.push(ret);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // First pass: compute raw averages to find the baseline (overall avg monthly return)
  const allMonthlyReturns: number[] = [];
  const rawSeasonalEntries: Array<{ month: number; name: string; avg_return: number; median_return: number; win_rate: number; n: number }> = [];
  for (let m = 1; m <= 12; m++) {
    const returns = monthReturnsByMonth.get(m)!;
    allMonthlyReturns.push(...returns);
    if (returns.length === 0) {
      rawSeasonalEntries.push({ month: m, name: monthNames[m - 1], avg_return: 0, median_return: 0, win_rate: 0, n: 0 });
      continue;
    }
    const sorted = [...returns].sort((a, b) => a - b);
    const med = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const avg = returns.reduce((s, v) => s + v, 0) / returns.length;
    const wins = returns.filter((r) => r > 0).length;
    rawSeasonalEntries.push({
      month: m,
      name: monthNames[m - 1],
      avg_return: round(avg),
      median_return: round(med),
      win_rate: round((wins / returns.length) * 100),
      best: round(Math.max(...returns)),
      worst: round(Math.min(...returns)),
      n: returns.length,
    });
  }

  // Detrend: subtract the overall average monthly return so the chart shows
  // relative strength/weakness instead of all-green from long-term growth bias
  const overallAvg = allMonthlyReturns.length > 0
    ? allMonthlyReturns.reduce((s, v) => s + v, 0) / allMonthlyReturns.length
    : 0;
  const monthly = rawSeasonalEntries.map((m) => ({
    ...m,
    avg_return: m.n > 0 ? round(m.avg_return - overallAvg) : 0,
    median_return: m.median_return, // Keep median raw — it's already more robust
  }));

  // Next 30 days — what month are we in now and what does the next month look like?
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  // Blend current month remaining + next month proportionally
  const daysLeftInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const daysFromNextMonth = Math.max(0, 30 - daysLeftInMonth);
  const currMonthData = monthly[currentMonth - 1];
  const nextMonthData = monthly[nextMonth - 1];

  let next30d = null;
  if (currMonthData.n > 0) {
    if (daysFromNextMonth > 0 && nextMonthData.n > 0) {
      const blend = (currMonthData.avg_return * daysLeftInMonth + nextMonthData.avg_return * daysFromNextMonth) / 30;
      const blendWin = (currMonthData.win_rate * daysLeftInMonth + nextMonthData.win_rate * daysFromNextMonth) / 30;
      next30d = { avg_return: round(blend), win_rate: round(blendWin), n: Math.min(currMonthData.n, nextMonthData.n) };
    } else {
      next30d = { avg_return: currMonthData.avg_return, win_rate: currMonthData.win_rate, n: currMonthData.n };
    }
  }

  // Forward seasonality: 5D, 10D, 30D, 60D from today's calendar position
  // Look at every historical year on the same month+day, compute forward returns
  const forwardWindows = [5, 10, 30, 60] as const;
  const forwardResults: Record<number, number[]> = { 5: [], 10: [], 30: [], 60: [] };

  // Build a date-indexed close map for fast lookups
  const closeByDate = new Map<string, number>();
  for (const bar of allDaily) {
    closeByDate.set(bar.bar_date, bar.close);
  }

  // For each historical year, find the bar closest to today's month/day
  const todayMonth = now.getMonth(); // 0-indexed
  const todayDate = now.getDate();
  const todayDoy = Math.floor((Date.UTC(now.getFullYear(), todayMonth, todayDate) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);

  // Get unique years in the data
  const years = new Set<number>();
  for (const bar of allDaily) {
    years.add(parseInt(bar.bar_date.substring(0, 4), 10));
  }

  for (const year of years) {
    if (year === now.getFullYear()) continue; // skip current year (incomplete)
    // Find the trading day closest to this calendar date in that year
    // Try exact date first, then +/-1, +/-2 to account for weekends/holidays
    let anchorDate: string | null = null;
    let anchorClose: number | null = null;
    for (let offset = 0; offset <= 5; offset++) {
      for (const dir of [0, 1, -1]) {
        const tryDate = new Date(Date.UTC(year, todayMonth, todayDate + (offset * (dir || 1))));
        const tryKey = tryDate.toISOString().split("T")[0];
        const c = closeByDate.get(tryKey);
        if (c != null && c > 0) {
          anchorDate = tryKey;
          anchorClose = c;
          break;
        }
      }
      if (anchorDate) break;
    }
    if (!anchorDate || !anchorClose) continue;

    // For each forward window, find the close N trading days forward
    // Approximate: collect all bars after anchor date, take the Nth one
    const futureBars = allDaily.filter((b) => b.bar_date > anchorDate! && parseInt(b.bar_date.substring(0, 4), 10) <= year + 1);
    for (const window of forwardWindows) {
      if (futureBars.length >= window) {
        const futureClose = futureBars[window - 1].close;
        if (futureClose > 0) {
          const ret = ((futureClose - anchorClose!) / anchorClose!) * 100;
          forwardResults[window].push(ret);
        }
      }
    }
  }

  // Compute annualized daily drift for detrending forward windows
  // Use the overall dataset: total return / total trading days * window size
  const firstClose = allDaily[0].close;
  const lastClose = allDaily[allDaily.length - 1].close;
  const totalDays = allDaily.length;
  const dailyDrift = totalDays > 1 ? (Math.pow(lastClose / firstClose, 1 / totalDays) - 1) * 100 : 0;

  function computeForwardStats(returns: number[], windowDays: number) {
    if (returns.length < 3) return null;
    // Detrend: subtract the expected drift for this window length
    const expectedDrift = dailyDrift * windowDays;
    const detrended = returns.map((r) => r - expectedDrift);
    const sorted = [...detrended].sort((a, b) => a - b);
    const med = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const avg = detrended.reduce((s, v) => s + v, 0) / detrended.length;
    const wins = detrended.filter((r) => r > 0).length;
    return {
      avg_return: round(avg),
      median_return: round(med),
      win_rate: round((wins / detrended.length) * 100),
      best: round(Math.max(...detrended)),
      worst: round(Math.min(...detrended)),
      n: returns.length,
    };
  }

  const forward = {
    d5: computeForwardStats(forwardResults[5], 5),
    d10: computeForwardStats(forwardResults[10], 10),
    d30: computeForwardStats(forwardResults[30], 30),
    d60: computeForwardStats(forwardResults[60], 60),
  };

  return { monthly, next_30d: next30d, forward };
}

function buildCurrentSummarySentence(params: {
  ticker: string;
  modeSuggestion: ReturnType<typeof suggestMode>;
  buyActiveCount: number;
  avoidActiveCount: number;
  watchingCount: number;
  average20d: number | null;
  activeSetups?: Array<{
    id: string;
    name: string;
    type: "buy" | "avoid";
    winRate20d?: string | null;
    avgReturn20d?: number | null;
    n?: number;
  }>;
  seasonality?: {
    next_30d: { avg_return: number; win_rate: number; n: number } | null;
    forward?: {
      d5: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
      d10: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
      d30: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
      d60: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
    };
  } | null;
  indicators?: {
    close?: number | null;
    rsi?: number | null;
    smi?: number | null;
    sma200_dist?: number | null;
    bx_daily_state?: string | null;
    bx_weekly_state?: string | null;
    ema9?: number | null;
    ema21?: number | null;
    vix_close?: number | null;
  };
}) {
  const { ticker, modeSuggestion, buyActiveCount, avoidActiveCount, watchingCount, average20d, activeSetups, seasonality, indicators } = params;

  const lines: string[] = [];
  const mode = modeSuggestion.suggestion;

  // 1. REGIME + TECHNICAL CONTEXT — rich structural description
  const regimeLabel: Record<string, string> = {
    "RED / EJECTED": "confirmed downtrend — price is below the Weekly 21 EMA, placing it in Master Eject territory where historical risk of further drawdown is elevated",
    "RED": "bearish regime — BX Trender is printing lower lows on both the daily and weekly timeframes, indicating sustained selling pressure across multiple time horizons",
    "ORANGE": "early recovery phase — BX Trender momentum has bottomed on the daily chart but weekly structure has not confirmed, making this a \"show me\" tape",
    "ORANGE (Improving)": "improving recovery — daily BX Trender is leading with a higher low while weekly momentum is still lagging, typical of the early stages of a trend reversal",
    "YELLOW": "neutral consolidation — price action is range-bound with no clear directional edge on either timeframe, a tape that rewards patience over conviction",
    "YELLOW (Improving)": "improving consolidation — BX Trender is trending higher within the range, suggesting accumulation that could precede a breakout",
    "GREEN (Extended)": "confirmed uptrend but extended — BX Trender is printing HH on both timeframes, however the move is stretched and historically vulnerable to mean-reversion pullbacks",
    "GREEN": "confirmed uptrend — BX Trender is in HH mode on both daily and weekly, the strongest structural alignment for sustained long positioning",
    "GREEN (Recovering)": "recovering uptrend — BX Trender is turning back up after a pullback within a broader bullish structure, historically a high-probability re-entry zone",
  };
  lines.push(`${ticker} is in a ${regimeLabel[mode] ?? "neutral regime"}.`);

  // Add key technical levels for context — always cite the timeframe
  const techParts: string[] = [];
  if (indicators?.close != null) {
    techParts.push(`Last close: $${Number(indicators.close).toFixed(2)}`);
  }
  if (indicators?.rsi != null) {
    const rsiVal = Number(indicators.rsi);
    const rsiContext = rsiVal < 30 ? " (oversold)" : rsiVal < 40 ? " (approaching oversold)" : rsiVal > 70 ? " (overbought)" : rsiVal > 60 ? " (approaching overbought)" : "";
    techParts.push(`Daily RSI ${rsiVal.toFixed(1)}${rsiContext}`);
  }
  if (indicators?.smi != null) {
    const smiVal = Number(indicators.smi);
    const smiContext = smiVal < -40 ? " (deeply negative)" : smiVal < -20 ? " (negative)" : smiVal > 40 ? " (deeply positive)" : smiVal > 20 ? " (positive)" : " (neutral zone)";
    techParts.push(`Daily SMI ${smiVal.toFixed(1)}${smiContext}`);
  }
  if (indicators?.bx_daily_state && indicators?.bx_weekly_state) {
    techParts.push(`BX Trender: ${indicators.bx_daily_state} (daily) / ${indicators.bx_weekly_state} (weekly)`);
  }
  if (indicators?.sma200_dist != null) {
    const dist = Number(indicators.sma200_dist);
    techParts.push(`${Math.abs(dist).toFixed(1)}% ${dist >= 0 ? "above" : "below"} 200-day SMA`);
  }
  if (techParts.length > 0) {
    lines.push(`Technical snapshot: ${techParts.join(" · ")}.`);
  }

  // 2. SETUP EVIDENCE — cite active setups with statistical backing
  // Timeframe labels for each setup — always cite which timeframe(s) drive the signal
  const setupTimeframeMap: Record<string, string> = {
    "smi-oversold-gauge": "Daily SMI",
    "capitulation": "Daily RSI + Daily BXT",
    "deep-value": "Daily RSI + Daily BXT",
    "oversold-extreme": "Daily RSI + Daily SMI",
    "momentum-flip": "Daily SMI + Daily BXT",
    "green-shoots": "Daily BXT + Weekly BXT",
    "trend-confirm": "Daily BXT + Daily SMI",
    "trend-ride": "Daily BXT + Weekly BXT",
    "trend-continuation": "Weekly BXT + Weekly EMAs",
    "goldilocks": "Daily BXT + Daily RSI + Daily SMI",
    "regime-shift": "Weekly BXT",
    "climactic-volume-reversal": "Daily Volume + Daily RSI + Daily SMI",
    "vix-spike-reversal": "Weekly VIX",
    "dual-ll": "Daily BXT + Weekly BXT",
    "smi-overbought": "Daily SMI",
    "overextended": "Daily Close vs 200-Day SMA",
    "momentum-crack": "Daily SMI + Daily BXT",
    "ema-shield-caution": "Daily Close vs 9/21 EMA",
    "ema-shield-break": "Daily Close vs 9/21 EMA",
  };

  const buySetups = (activeSetups ?? []).filter((s) => s.type === "buy" && s.n && s.n > 0);
  const avoidSetups = (activeSetups ?? []).filter((s) => s.type === "avoid" && s.n && s.n > 0);

  // Sort buy setups by win rate descending — only cite setups with positive edge
  const sortedBuys = [...buySetups]
    .filter((s) => {
      const wr = parseFloat((s.winRate20d ?? "0").replace("%", ""));
      const avg = s.avgReturn20d ?? 0;
      return wr > 50 && avg > 0;
    })
    .sort((a, b) => {
      const aWr = parseFloat((a.winRate20d ?? "0").replace("%", ""));
      const bWr = parseFloat((b.winRate20d ?? "0").replace("%", ""));
      return bWr - aWr;
    });

  if (sortedBuys.length > 0) {
    const top = sortedBuys.slice(0, 2);
    const citations = top.map((s) => {
      const wr = s.winRate20d ?? "N/A";
      const avg = s.avgReturn20d != null ? `${s.avgReturn20d >= 0 ? "+" : ""}${s.avgReturn20d.toFixed(1)}%` : "N/A";
      const tf = setupTimeframeMap[s.id ?? ""] ?? "";
      const tfLabel = tf ? ` [${tf}]` : "";
      return `"${s.name}"${tfLabel} — ${wr} win rate with ${avg} average forward return over ${s.n} historical instances`;
    });
    lines.push(`The strongest active buy signal${top.length > 1 ? "s" : ""}: ${citations.join("; ")}.`);
  } else if (buySetups.length > 0) {
    lines.push(`${buySetups.length} buy setup${buySetups.length !== 1 ? "s are" : " is"} technically active, but none demonstrate a statistically compelling edge at the 20-day horizon (win rate ≤50% or negative expected return). This is not a setup worth sizing into.`);
  }

  if (avoidSetups.length > 0) {
    const worst = avoidSetups[0];
    const avoidWr = worst.winRate20d ?? "N/A";
    const avoidAvg = worst.avgReturn20d != null ? `${worst.avgReturn20d >= 0 ? "+" : ""}${worst.avgReturn20d.toFixed(1)}%` : "N/A";
    const tf = setupTimeframeMap[worst.id ?? ""] ?? "";
    const tfLabel = tf ? ` [${tf}]` : "";
    lines.push(`Risk signal: "${worst.name}"${tfLabel} is active — across ${worst.n} historical instances, this pattern averaged ${avoidAvg} over the next 20 trading days with a ${avoidWr} hit rate. This is a structural warning, not a timing signal.`);
  }

  // 3. CONFLICTING SIGNAL ANALYSIS — when buy AND avoid setups are both active
  if (sortedBuys.length > 0 && avoidSetups.length > 0) {
    lines.push(`Signal conflict: Both buy and caution setups are firing simultaneously. This is a mixed tape — the buy setup suggests a statistical bounce opportunity, but the caution setup indicates the broader trend structure hasn't repaired. Historically, when these signals overlap, the caution signal tends to dominate in the first 5-10 days before the buy signal's edge materializes. Translation: if you act on the buy signal, size small and expect chop before any resolution.`);
  }

  if (buySetups.length === 0 && avoidSetups.length === 0) {
    if (watchingCount > 0) {
      lines.push(`No setups have triggered yet, but ${watchingCount} ${watchingCount !== 1 ? "are" : "is"} approaching activation thresholds. The conditions are close to aligning — this is a "preparation" phase, not an "action" phase. Build your watchlist and define your entry levels now so you can act decisively when setups confirm.`);
    } else {
      lines.push(`No setups are active or approaching activation. The ORB system is in full standby — current conditions don't match any of the 19 evaluated historical patterns. This is not ambiguous; it means the tape lacks a quantifiable edge in either direction. The correct position is patience.`);
    }
  }

  // 4. HISTORICAL EDGE — composite forward return with context
  if (average20d != null && Number.isFinite(average20d)) {
    const edgeTone = average20d > 2 ? "meaningfully positive" : average20d > 0 ? "modestly positive" : average20d > -2 ? "modestly negative" : "meaningfully negative";
    lines.push(`Composite edge: Across all active setups, the blended 20-day forward return averages ${average20d >= 0 ? "+" : ""}${average20d.toFixed(1)}% — a ${edgeTone} expected value that ${average20d >= 0 ? "supports" : "argues against"} directional positioning at current levels.`);
  }

  // 5. SEASONALITY — forward windows (5D, 10D, 30D, 60D)
  const fw = seasonality?.forward;
  if (fw) {
    const windowLabels = [
      { key: "d5" as const, label: "5D" },
      { key: "d10" as const, label: "10D" },
      { key: "d30" as const, label: "30D" },
      { key: "d60" as const, label: "60D" },
    ];
    const parts: string[] = [];
    for (const { key, label } of windowLabels) {
      const s = fw[key];
      if (s && s.n >= 3) {
        parts.push(`${label}: ${s.avg_return >= 0 ? "+" : ""}${s.avg_return.toFixed(1)}% avg / ${s.median_return >= 0 ? "+" : ""}${s.median_return.toFixed(1)}% median (${s.win_rate.toFixed(0)}% win, n=${s.n})`);
      }
    }
    if (parts.length > 0) {
      const s30 = fw.d30;
      const s60 = fw.d60;
      const tone = s30 ? (s30.avg_return >= 1 ? "favorable" : s30.avg_return <= -1 ? "unfavorable" : "neutral") : "mixed";
      lines.push(`Seasonality from this calendar date is historically ${tone}: ${parts.join(" · ")}.`);
      // Add median vs average context for credibility
      if (s30 && s60 && Math.abs(s60.avg_return - s60.median_return) > 3) {
        lines.push(`Note: The 60D average is skewed by outlier years — the median return of ${s60.median_return >= 0 ? "+" : ""}${s60.median_return.toFixed(1)}% is a more conservative baseline for sizing expectations.`);
      }
    }
  }

  // 6. CLEAR RECOMMENDATION — with conviction level and specific guidance
  let stance: string;
  if ((mode.includes("RED") && avoidActiveCount > 0) || avoidActiveCount >= 2) {
    stance = "REDUCE RISK. The trend structure is against longs on both timeframes and caution setups confirm elevated downside risk. This is not a \"buy the dip\" environment — it's a capital preservation environment. Tighten stops on existing positions, avoid initiating new longs, and wait for structural repair (daily BX Trender needs to print at least a higher low) before re-engaging.";
  } else if (mode.includes("RED") && avoidActiveCount === 0) {
    stance = "DEFENSIVE WAIT. The trend is bearish but no specific caution setups have triggered, meaning the downtrend may be mature rather than accelerating. Stay flat on new positions. The re-entry trigger is a daily BX Trender state change from LL to HL, which would signal the first structural improvement.";
  } else if (avoidActiveCount > 0 && buyActiveCount === 0) {
    stance = "WAIT — CAUTION ACTIVE. Risk signals are present without offsetting buy signals. This is a tape to watch, not trade. Stay flat until either the caution signal deactivates (clearing the risk) or a high-conviction buy setup triggers alongside it (providing an offsetting edge).";
  } else if (mode.includes("GREEN") && buyActiveCount >= 2 && avoidActiveCount === 0) {
    stance = "BUY WITH CONVICTION. Trend structure is bullish on both timeframes, multiple buy setups confirm, and no caution signals are present. This is the highest-confidence alignment the system produces. Use pullbacks to key support levels as entry opportunities and size according to your risk tolerance.";
  } else if (mode.includes("GREEN") && buyActiveCount > 0) {
    stance = "BUY. Trend structure is bullish and buy setups confirm the directional edge. Add on weakness toward support rather than chasing strength. If caution setups are also present, size down to reflect the mixed signal.";
  } else if (buyActiveCount >= 2 && avoidActiveCount === 0) {
    stance = "BUY. Multiple buy setups are firing simultaneously — the statistical edge favors longs even if the broader trend isn't fully confirmed. Size based on your risk tolerance and use the setup with the highest historical win rate as your primary conviction anchor.";
  } else if (buyActiveCount === 1 && avoidActiveCount === 0) {
    stance = "LEAN BUY. One buy setup is active with no offsetting caution signals — a positive but not decisive edge. Consider a partial position (half-size or less) and scale in if additional setups confirm or the trend structure improves.";
  } else if (mode.includes("YELLOW") && mode.includes("Improving")) {
    stance = "WAIT — IMPROVING. Conditions are getting better (BX Trender rising within range) but no setups have triggered yet. This is the preparation phase: build your watchlist, define entry levels, and be ready to act when the first setup confirms. Don't front-run the improvement.";
  } else if (watchingCount > 0) {
    stance = "WAIT. No setups have triggered, but approaching setups indicate conditions are evolving. Monitor daily for setup activations. The edge isn't here yet, but it's getting closer.";
  } else {
    stance = "WAIT — NO EDGE. Neither buy nor caution setups are active, and no setups are approaching. The system has no quantifiable directional edge at current levels. Patience is the correct position — forcing a trade here means trading without an edge, which is gambling, not trading.";
  }

  lines.push(`Recommendation: ${stance}`);

  return lines.join("\n\n");
}

function derivePeerState(buyActive: number, avoidActive: number, watching: number): "BULLISH" | "RISK" | "WATCH" | "NEUTRAL" {
  if (avoidActive > 0) return "RISK";
  if (buyActive >= 3) return "BULLISH";
  if (buyActive > 0 || watching > 0) return "WATCH";
  return "NEUTRAL";
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchOhlcvRows(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
  timeframe: "daily" | "weekly",
  limit: number,
): Promise<OhlcvRow[] | null> {
  const today = new Date().toISOString().split("T")[0];
  const pageSize = 1000;
  const rows: OhlcvRow[] = [];

  for (let offset = 0; offset < limit; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, limit - 1);
    const { data, error } = await supabase
      .from("ohlcv_bars")
      .select("bar_date, open, high, low, close, volume, rsi, bxt, bxt_state, ema_9, ema_13, ema_21, sma_200")
      .eq("ticker", ticker)
      .eq("timeframe", timeframe)
      .lte("bar_date", today)
      .order("bar_date", { ascending: false })
      .range(offset, end);

    if (error) return null;
    if (!data || data.length === 0) break;

    rows.push(...(data as OhlcvRow[]));
    if (data.length < pageSize) break;
  }

  if (rows.length === 0) return null;
  return rows.reverse(); // Return chronological (oldest first, newest last)
}

async function computeIndicatorsFromOhlcv(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
): Promise<(Indicators & { open: number; volume: number; volumes: number[] }) | null> {
  const [dailyRows, weeklyRows, vixDailyRows, vixWeeklyRows] = await Promise.all([
    fetchOhlcvRows(supabase, ticker, "daily", 450),
    fetchOhlcvRows(supabase, ticker, "weekly", 150),
    fetchOhlcvRows(supabase, "^VIX", "daily", 120),
    fetchOhlcvRows(supabase, "^VIX", "weekly", 30),
  ]);

  if (!dailyRows || !weeklyRows || dailyRows.length < 30 || weeklyRows.length < 10) {
    return null;
  }

  const latest = dailyRows[dailyRows.length - 1];
  const prev = dailyRows[dailyRows.length - 2];
  const prev3 = dailyRows[Math.max(0, dailyRows.length - 4)];

  const weeklyLatest = weeklyRows[weeklyRows.length - 1];
  const weeklyPrev = weeklyRows[weeklyRows.length - 2];

  const close = toNumber(latest.close);
  const rsi = toNumber(latest.rsi);
  const rsiPrev = toNumber(prev?.rsi);
  const bxtDaily = toNumber(latest.bxt);
  const bxtDailyPrev = toNumber(prev?.bxt);
  const ema9 = toNumber(latest.ema_9);
  const ema21 = toNumber(latest.ema_21);
  const sma200 = toNumber(latest.sma_200);

  const weeklyEma9 = toNumber(weeklyLatest.ema_9);
  const weeklyEma13 = toNumber(weeklyLatest.ema_13);
  const weeklyEma21 = toNumber(weeklyLatest.ema_21);
  const bxtWeekly = toNumber(weeklyLatest.bxt);
  const bxtWeeklyPrev = toNumber(weeklyPrev?.bxt);

  if (
    close == null ||
    rsi == null ||
    rsiPrev == null ||
    bxtDaily == null ||
    bxtDailyPrev == null ||
    ema9 == null ||
    ema21 == null ||
    sma200 == null ||
    weeklyEma9 == null ||
    weeklyEma13 == null ||
    weeklyEma21 == null ||
    bxtWeekly == null ||
    bxtWeeklyPrev == null
  ) {
    return null;
  }

  const closes = dailyRows.map((row) => row.close);
  const highs = dailyRows.map((row) => row.high);
  const lows = dailyRows.map((row) => row.low);
  const volumes = dailyRows.map((row) => row.volume);

  const smiResult = computeSmi(highs, lows, closes);
  const smiCurr = smiResult.smi[smiResult.smi.length - 1];
  const smiSignalCurr = smiResult.signal[smiResult.signal.length - 1];
  const smiPrev = smiResult.smi[Math.max(0, smiResult.smi.length - 2)];
  const smiSignalPrev = smiResult.signal[Math.max(0, smiResult.signal.length - 2)];
  const smiPrev3 = smiResult.smi[Math.max(0, smiResult.smi.length - 4)];

  if (
    !Number.isFinite(smiCurr) ||
    !Number.isFinite(smiSignalCurr) ||
    !Number.isFinite(smiPrev) ||
    !Number.isFinite(smiSignalPrev) ||
    !Number.isFinite(smiPrev3)
  ) {
    return null;
  }

  const dailyBxtSeries = dailyRows.map((row) => toNumber(row.bxt) ?? Number.NaN);
  const dailyInferredStates = inferBxtStates(dailyBxtSeries);
  const bxDailyState = normalizeBxtState(latest.bxt_state) ?? dailyInferredStates[dailyInferredStates.length - 1] ?? "LL";
  const bxDailyStatePrev = normalizeBxtState(prev?.bxt_state ?? null) ?? dailyInferredStates[Math.max(0, dailyInferredStates.length - 2)] ?? "LL";

  const weeklyBxtSeries = weeklyRows.map((row) => toNumber(row.bxt) ?? Number.NaN);
  const weeklyInferredStates = inferBxtStates(weeklyBxtSeries);
  const bxWeeklyState = normalizeBxtState(weeklyLatest.bxt_state) ?? weeklyInferredStates[weeklyInferredStates.length - 1] ?? "LL";
  const bxWeeklyStatePrev = normalizeBxtState(weeklyPrev?.bxt_state ?? null) ?? weeklyInferredStates[Math.max(0, weeklyInferredStates.length - 2)] ?? "LL";

  let consecutiveDown = 0;
  let consecutiveUp = 0;
  for (let i = closes.length - 1; i > 0; i--) {
    if (closes[i] < closes[i - 1]) consecutiveDown += 1;
    else break;
  }
  for (let i = closes.length - 1; i > 0; i--) {
    if (closes[i] > closes[i - 1]) consecutiveUp += 1;
    else break;
  }

  let stabilizationDays = 0;
  for (let i = lows.length - 1; i > 0; i--) {
    if (lows[i] >= lows[i - 1]) stabilizationDays += 1;
    else break;
  }

  let dailyHhStreak = 0;
  for (let i = dailyRows.length - 1; i >= 0; i--) {
    const state = normalizeBxtState(dailyRows[i].bxt_state) ?? dailyInferredStates[i] ?? "LL";
    if (state === "HH") dailyHhStreak += 1;
    else break;
  }

  const ema9FiveDaysAgo = toNumber(dailyRows[Math.max(0, dailyRows.length - 6)]?.ema_9);
  const ema9Slope5d =
    ema9FiveDaysAgo != null && ema9FiveDaysAgo !== 0
      ? ((ema9 - ema9FiveDaysAgo) / ema9FiveDaysAgo) * 100
      : 0;

  let daysBelowEma9 = 0;
  for (let i = dailyRows.length - 1; i >= 0; i--) {
    const barEma9 = toNumber(dailyRows[i].ema_9);
    if (barEma9 == null) break;
    if (dailyRows[i].close < barEma9) daysBelowEma9 += 1;
    else break;
  }

  let wasFullBull5d = false;
  for (let i = Math.max(0, dailyRows.length - 5); i < dailyRows.length; i++) {
    const bar = dailyRows[i];
    const barEma9 = toNumber(bar.ema_9);
    const barEma21 = toNumber(bar.ema_21);
    if (barEma9 == null || barEma21 == null) continue;
    if (bar.close > barEma9 && barEma9 > barEma21) {
      wasFullBull5d = true;
      break;
    }
  }

  // VIX: try DB first, fall back to Yahoo if not in ohlcv_bars
  let vixClose = 0;
  let vixWeeklyChangePct = 0;

  if (vixDailyRows && vixDailyRows.length > 0) {
    vixClose = toNumber(vixDailyRows[vixDailyRows.length - 1].close) ?? 0;
    if (vixWeeklyRows && vixWeeklyRows.length >= 2) {
      const latestVixWeek = toNumber(vixWeeklyRows[vixWeeklyRows.length - 1].close);
      const prevVixWeek = toNumber(vixWeeklyRows[vixWeeklyRows.length - 2].close);
      if (latestVixWeek != null && prevVixWeek != null && prevVixWeek !== 0) {
        vixWeeklyChangePct = ((latestVixWeek - prevVixWeek) / prevVixWeek) * 100;
      }
    }
  } else {
    // Fallback: fetch VIX from Yahoo Finance
    try {
      const yahooFinance = (await import("yahoo-finance2")).default;
      const vixResult = await yahooFinance.historical("^VIX", {
        period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        interval: "1d",
      });
      if (vixResult && vixResult.length > 0) {
        vixClose = vixResult[vixResult.length - 1]?.close ?? 0;
        // Compute weekly change from last 5+ trading days
        if (vixResult.length >= 6) {
          const latestVix = vixResult[vixResult.length - 1]?.close ?? 0;
          const weekAgoVix = vixResult[Math.max(0, vixResult.length - 6)]?.close ?? 0;
          if (weekAgoVix > 0) {
            vixWeeklyChangePct = ((latestVix - weekAgoVix) / weekAgoVix) * 100;
          }
        }
      }
    } catch (e) {
      console.warn("[scan] VIX Yahoo fallback failed:", e instanceof Error ? e.message : e);
    }
  }

  return {
    date: latest.bar_date,
    close,
    open: latest.open,
    volume: latest.volume,
    volumes: volumes.slice(-30),
    vix_close: vixClose,
    vix_weekly_change_pct: vixWeeklyChangePct,
    bx_daily: bxtDaily,
    bx_daily_prev: bxtDailyPrev,
    bx_daily_state: bxDailyState,
    bx_daily_state_prev: bxDailyStatePrev,
    bx_weekly: bxtWeekly,
    bx_weekly_prev: bxtWeeklyPrev,
    bx_weekly_state: bxWeeklyState,
    bx_weekly_state_prev: bxWeeklyStatePrev,
    bx_weekly_transition: bxWeeklyStatePrev !== bxWeeklyState ? `${bxWeeklyStatePrev}_to_${bxWeeklyState}` : null,
    rsi,
    rsi_prev: rsiPrev,
    rsi_change_3d: rsi - (toNumber(prev3?.rsi) ?? rsiPrev),
    smi: smiCurr,
    smi_signal: smiSignalCurr,
    smi_prev: smiPrev,
    smi_signal_prev: smiSignalPrev,
    smi_change_3d: smiCurr - smiPrev3,
    smi_bull_cross: smiPrev <= smiSignalPrev && smiCurr > smiSignalCurr,
    smi_bear_cross: smiPrev >= smiSignalPrev && smiCurr < smiSignalCurr,
    ema9,
    ema21,
    sma200,
    sma200_dist: ((close - sma200) / sma200) * 100,
    price_vs_ema9: ((close - ema9) / ema9) * 100,
    price_vs_ema21: ((close - ema21) / ema21) * 100,
    consecutive_down: consecutiveDown,
    consecutive_up: consecutiveUp,
    stabilization_days: stabilizationDays,
    weekly_ema9: weeklyEma9,
    weekly_ema13: weeklyEma13,
    weekly_ema21: weeklyEma21,
    weekly_emas_stacked: weeklyEma9 > weeklyEma13 && weeklyEma13 > weeklyEma21,
    price_above_weekly_all: close > weeklyEma9 && close > weeklyEma13 && close > weeklyEma21,
    price_above_weekly_13: close > weeklyEma13,
    price_above_weekly_21: close > weeklyEma21,
    daily_hh_streak: dailyHhStreak,
    ema9_slope_5d: ema9Slope5d,
    days_below_ema9: daysBelowEma9,
    was_full_bull_5d: wasFullBull5d,
  };
}

async function resolveIndicators(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
): Promise<{ indicators: Indicators & { open: number; volume: number; volumes: number[] }; source: "ohlcv_bars" | "yahoo" }> {
  const fromDb = await computeIndicatorsFromOhlcv(supabase, ticker);
  if (fromDb) {
    return { indicators: fromDb, source: "ohlcv_bars" };
  }

  const fromYahoo = await computeIndicators(ticker);
  return { indicators: fromYahoo, source: "yahoo" };
}

async function evaluateTickerNow(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
  tslaPrevMap: Map<string, PreviousState>,
): Promise<{
  indicators: Indicators & { open: number; volume: number; volumes: number[] };
  setupResults: SetupResult[];
  mode: ReturnType<typeof suggestMode>;
  source: "ohlcv_bars" | "yahoo";
}> {
  const { indicators, source } = await resolveIndicators(supabase, ticker);

  // For TSLA, use the pre-loaded map; for other tickers, read from DB
  let prevMap: Map<string, PreviousState>;
  if (ticker === VALIDATED_BACKTEST_TICKER) {
    prevMap = tslaPrevMap;
  } else {
    const { data: rows } = await supabase
      .from("orb_setup_states")
      .select("setup_id, status, active_since, active_day, entry_price, gauge_entry_value")
      .eq("ticker", ticker);

    prevMap = new Map<string, PreviousState>(
      ((rows as StateRow[]) || []).map((row) => [
        row.setup_id,
        {
          setup_id: row.setup_id,
          status: row.status,
          gauge_entry_value: row.gauge_entry_value ?? undefined,
          entry_price: row.entry_price ?? undefined,
          active_since: row.active_since ?? undefined,
          active_day: row.active_day ?? undefined,
        },
      ]),
    );
  }

  const setupResults = evaluateAllSetups(indicators, prevMap);

  // Upsert new states back to orb_setup_states for all tickers
  const upsertRows = setupResults.map((result) => {
    const prev = prevMap.get(result.setup_id);
    const status: "active" | "watching" | "inactive" = result.is_active
      ? "active"
      : result.is_watching
        ? "watching"
        : "inactive";

    return {
      ticker,
      setup_id: result.setup_id,
      status,
      active_since: result.active_since_override ?? (status === "active" ? (prev?.active_since ?? indicators.date) : null),
      active_day: result.active_day_override ?? (status === "active" ? (prev?.active_day ?? 1) : null),
      entry_price: status === "active" ? (prev?.entry_price ?? indicators.close) : null,
      gauge_entry_value: result.gauge_entry_value ?? (status === "active" ? (prev?.gauge_entry_value ?? null) : null),
    };
  });

  if (upsertRows.length > 0) {
    await supabase
      .from("orb_setup_states")
      .upsert(upsertRows, { onConflict: "ticker,setup_id" });
  }

  const mode = suggestMode(indicators, setupResults.filter((setup) => setup.is_active));
  return { indicators, setupResults, mode, source };
}

export async function GET(request: NextRequest) {
  // Check if the caller is a paying subscriber
  let isSubscriber = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, trial_ends_at, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .single();
      isSubscriber = hasSubscriptionAccess(subscription);
    }
  } catch {
    // Gracefully default to non-subscriber
  }
  // Server-side rate limiting for non-subscribers
  if (!isSubscriber) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    const rateLimitKey = `scan:${ip}:${new Date().toISOString().split("T")[0]}`;

    try {
      const serviceSupabase = await createServiceClient();
      // Use a simple KV-style table or just check in-memory (Vercel edge has no persistent state)
      // Use Supabase to track: upsert a row with ip + date + count
      const { data: existing } = await serviceSupabase
        .from("rate_limits")
        .select("count")
        .eq("key", rateLimitKey)
        .single();

      const currentCount = existing?.count ?? 0;
      const MAX_FREE_SCANS = 3;

      if (currentCount >= MAX_FREE_SCANS) {
        return NextResponse.json(
          {
            error: "Daily scan limit reached. Subscribe for unlimited access.",
            rateLimited: true,
            scansUsed: currentCount,
            maxScans: MAX_FREE_SCANS,
          },
          { status: 429 },
        );
      }

      // Increment counter
      await serviceSupabase
        .from("rate_limits")
        .upsert(
          { key: rateLimitKey, count: currentCount + 1, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
    } catch {
      // If rate_limits table doesn't exist or fails, allow the request (graceful degradation)
    }
  }

  const tickerRaw = request.nextUrl.searchParams.get("ticker") ?? "TSLA";
  const ticker = tickerRaw.trim().toUpperCase();

  if (!ticker || !/^[A-Z.^-]{1,10}$/.test(ticker)) {
    return NextResponse.json(
      { error: `Invalid ticker symbol: "${tickerRaw}"` },
      { status: 400 },
    );
  }

  if (!(SUPPORTED_BACKTEST_TICKERS as readonly string[]).includes(ticker)) {
    return NextResponse.json(
      {
        error: `Unsupported ticker: ${ticker}. /backtest currently supports TSLA, QQQ, SPY, NVDA, AAPL, AMZN, META, MU, GOOGL, and BABA.`,
      },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServiceClient();


    const [{ data: definitions, error: definitionsError }, { data: stateRows, error: statesError }] = await Promise.all([
      supabase
        .from("orb_setup_definitions")
        .select("id, name, public_name, number, type, one_liner, public_description, description"),
      supabase
        .from("orb_setup_states")
        .select("setup_id, status, active_since, active_day, entry_price, gauge_entry_value")
        .eq("ticker", ticker),
    ]);

    if (definitionsError) {
      return NextResponse.json({ error: definitionsError.message }, { status: 500 });
    }

    if (statesError) {
      return NextResponse.json({ error: statesError.message }, { status: 500 });
    }

    const tslaPrevMap = new Map<string, PreviousState>(
      ((stateRows as StateRow[]) || []).map((row) => [
        row.setup_id,
        {
          setup_id: row.setup_id,
          status: row.status,
          gauge_entry_value: row.gauge_entry_value ?? undefined,
          entry_price: row.entry_price ?? undefined,
          active_since: row.active_since ?? undefined,
          active_day: row.active_day ?? undefined,
        },
      ]),
    );

    let evaluatedTicker: Awaited<ReturnType<typeof evaluateTickerNow>>;
    try {
      evaluatedTicker = await evaluateTickerNow(supabase, ticker, tslaPrevMap);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("Too Many Requests") || message.includes("429") ? 429 : 500;
      return NextResponse.json(
        {
          error:
            status === 429
              ? "Rate limit reached while fetching market data. Please retry in a moment."
              : `Failed to compute indicators for ${ticker}: ${message}`,
        },
        { status },
      );
    }

    const definitionsMap = new Map<string, DefinitionRow>();
    for (const definition of (definitions as DefinitionRow[]) || []) {
      definitionsMap.set(definition.id, definition);
    }

    const stateMap = new Map<string, StateRow>();
    for (const row of (stateRows as StateRow[]) || []) {
      stateMap.set(row.setup_id, row);
    }

    const setupPayload = evaluatedTicker.setupResults.map((result) => {
      const definition = definitionsMap.get(result.setup_id);
      const fallback = FALLBACK_SETUP_META[result.setup_id];

      const status: ScanStatus = result.is_active ? "active" : result.is_watching ? "watching" : "inactive";

      const setupName = definition?.name || fallback?.name || result.setup_id;
      const publicName = definition?.public_name || fallback?.public_name || setupName;
      const type: "buy" | "avoid" =
        (definition?.type as "buy" | "avoid" | null) ||
        fallback?.type ||
        (result.setup_id.includes("over") || result.setup_id.includes("crack") || result.setup_id.includes("shield") || result.setup_id.includes("dual") ? "avoid" : "buy");

      const state = stateMap.get(result.setup_id);

      return {
        id: result.setup_id,
        name: setupName,
        public_name: publicName,
        number: definition?.number ?? fallback?.number ?? 999,
        type,
        status,
        one_liner: definition?.one_liner || fallback?.one_liner || null,
        public_description: definition?.public_description || definition?.description || null,
        reason: result.reason,
        conditions_met: result.conditions_met,
        relevant_indicators: buildRelevantIndicators(result.setup_id, evaluatedTicker.indicators),
        current_signal: status === "active"
          ? {
              date: evaluatedTicker.indicators.date,
              close: round(evaluatedTicker.indicators.close),
            }
          : null,
        active_streak: status === "active"
          ? {
              active_since: state?.active_since ?? evaluatedTicker.indicators.date,
              active_day: state?.active_day ?? null,
              entry_price: state?.entry_price != null ? round(state.entry_price) : null,
            }
          : null,
        backtest: {
          n: 0,
          instances: [] as Array<{
            date: string;
            price: number;
            status: "completed" | "open";
            ret_5d: number | null;
            ret_10d: number | null;
            ret_20d: number | null;
            ret_60d: number | null;
          }>,
          summary: {} as Record<string, SummaryPeriod>,
          message: "No historical instances found." as string | null,
        },
      };
    });

    const activeOrWatchingIds = setupPayload
      .filter((setup) => setup.status === "active" || setup.status === "watching")
      .map((setup) => setup.id);

    let usedCachedBacktest = false;

    if (activeOrWatchingIds.length > 0) {
      let rowsBySetup = new Map<string, BacktestRow[]>();

      // Check if this ticker has ANY pre-computed backtest instances
      const { count: cachedCount } = await supabase
        .from("orb_backtest_instances")
        .select("ticker", { count: "exact", head: true })
        .eq("ticker", ticker);

      if (cachedCount && cachedCount > 0) {
        // Ticker has cached backtest data — read instances for active/watching setups
        usedCachedBacktest = true;
        const { data: backtestRows, error: backtestError } = await supabase
          .from("orb_backtest_instances")
          .select("setup_id, signal_date, signal_price, ret_5d, ret_10d, ret_20d, ret_60d, is_win_5d, is_win_10d, is_win_20d, is_win_60d")
          .eq("ticker", ticker)
          .in("setup_id", activeOrWatchingIds)
          .order("signal_date", { ascending: false });

        if (backtestError) {
          return NextResponse.json({ error: backtestError.message }, { status: 500 });
        }

        for (const row of (backtestRows ?? []) as BacktestRow[]) {
          const list = rowsBySetup.get(row.setup_id) ?? [];
          list.push(row);
          rowsBySetup.set(row.setup_id, list);
        }
      } else {
        // No cached results for this ticker — fall back to on-the-fly computation
        rowsBySetup = await computeDynamicBacktestRows(supabase, ticker, new Set(activeOrWatchingIds));
      }

      for (const setup of setupPayload) {
        if (setup.status === "inactive") continue;

        const rows = rowsBySetup.get(setup.id) ?? [];
        const instances = rows.map((row) => ({
          date: row.signal_date,
          price: round(toNumber(row.signal_price) ?? 0),
          status: toNumber(row.ret_60d) == null ? "open" as const : "completed" as const,
          ret_5d: toNumber(row.ret_5d),
          ret_10d: toNumber(row.ret_10d),
          ret_20d: toNumber(row.ret_20d),
          ret_60d: toNumber(row.ret_60d),
        }));

        setup.backtest = {
          n: rows.length,
          instances,
          summary: computeForwardSummary(rows),
          message: rows.length === 0 ? "No historical instances found." : null,
        };
      }
    }

    const activeBuy = setupPayload.filter((setup) => setup.status === "active" && setup.type === "buy").length;
    const activeAvoid = setupPayload.filter((setup) => setup.status === "active" && setup.type === "avoid").length;
    const watchingCount = setupPayload.filter((setup) => setup.status === "watching").length;

    const activeSetupsWith20d = setupPayload
      .filter((setup) => setup.status === "active")
      .map((setup) => setup.backtest.summary?.["20"]?.avg_return)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

    const average20d = activeSetupsWith20d.length > 0
      ? activeSetupsWith20d.reduce((sum, value) => sum + value, 0) / activeSetupsWith20d.length
      : null;

    const sortedSetups = [...setupPayload].sort((a, b) => {
      const statusRank: Record<ScanStatus, number> = { active: 0, watching: 1, inactive: 2 };
      const byStatus = statusRank[a.status] - statusRank[b.status];
      if (byStatus !== 0) return byStatus;

      const byType = a.type === b.type ? 0 : a.type === "buy" ? -1 : 1;
      if (byType !== 0) return byType;

      return (a.number ?? 999) - (b.number ?? 999);
    });

    // Build scenario comparisons — distribute across setups, don't let one dominate
    const relevantSetups = sortedSetups
      .filter((setup) => (setup.status === "active" || setup.status === "watching") && setup.backtest.instances.length > 0);

    let scenarioComparisons: Array<{
      setup_id: string;
      setup_name: string;
      date: string;
      entry_price: number;
      distance_pct: number;
      ret_5d: number | null;
      ret_10d: number | null;
      ret_20d: number | null;
      ret_60d: number | null;
    }> = [];

    if (relevantSetups.length === 1) {
      // Only one setup — show its most price-similar instances
      scenarioComparisons = relevantSetups[0].backtest.instances
        .map((instance) => ({
          setup_id: relevantSetups[0].id,
          setup_name: relevantSetups[0].public_name || relevantSetups[0].name,
          date: instance.date,
          entry_price: instance.price,
          distance_pct: round(((instance.price - evaluatedTicker.indicators.close) / evaluatedTicker.indicators.close) * 100, 2),
          ret_5d: instance.ret_5d,
          ret_10d: instance.ret_10d,
          ret_20d: instance.ret_20d,
          ret_60d: instance.ret_60d,
        }))
        .sort((a, b) => Math.abs(a.distance_pct) - Math.abs(b.distance_pct))
        .slice(0, 6);
    } else {
      // Multiple setups — round-robin to show variety (3 per setup max, 8 total)
      const maxPerSetup = Math.max(2, Math.ceil(8 / relevantSetups.length));
      for (const setup of relevantSetups) {
        const instances = setup.backtest.instances
          .map((instance) => ({
            setup_id: setup.id,
            setup_name: setup.public_name || setup.name,
            date: instance.date,
            entry_price: instance.price,
            distance_pct: round(((instance.price - evaluatedTicker.indicators.close) / evaluatedTicker.indicators.close) * 100, 2),
            ret_5d: instance.ret_5d,
            ret_10d: instance.ret_10d,
            ret_20d: instance.ret_20d,
            ret_60d: instance.ret_60d,
          }))
          .sort((a, b) => Math.abs(a.distance_pct) - Math.abs(b.distance_pct))
          .slice(0, maxPerSetup);
        scenarioComparisons.push(...instances);
      }
      scenarioComparisons = scenarioComparisons
        .sort((a, b) => Math.abs(a.distance_pct) - Math.abs(b.distance_pct))
        .slice(0, 8);
    }

    // Build the scenario context label for the frontend
    const scenarioSetupNames = [...new Set(scenarioComparisons.map(s => s.setup_name))];
    const scenarioContext = scenarioSetupNames.length === 1
      ? `Showing the ${scenarioComparisons.length} most similar past instances of "${scenarioSetupNames[0]}" — the setup currently ${relevantSetups[0]?.status === "active" ? "active" : "approaching trigger"} on ${ticker}.`
      : `Showing past instances across ${scenarioSetupNames.length} setups: ${scenarioSetupNames.join(", ")}. Each card is a real historical occurrence where conditions matched.`;

    const peerComparison = await mapWithConcurrency(PEER_TICKERS, 3, async (peerTicker) => {
      try {
        const peer = await evaluateTickerNow(supabase, peerTicker, tslaPrevMap);
        const buyActiveCount = peer.setupResults.filter((setup) => setup.is_active && !setup.setup_id.includes("over") && !setup.setup_id.includes("crack") && !setup.setup_id.includes("shield") && setup.setup_id !== "dual-ll").length;
        const avoidActiveCount = peer.setupResults.filter((setup) => setup.is_active && (setup.setup_id.includes("over") || setup.setup_id.includes("crack") || setup.setup_id.includes("shield") || setup.setup_id === "dual-ll")).length;
        const watching = peer.setupResults.filter((setup) => setup.is_watching).length;

        return {
          ticker: peerTicker,
          state: derivePeerState(buyActiveCount, avoidActiveCount, watching),
          buy_active: buyActiveCount,
          avoid_active: avoidActiveCount,
          watching,
          date: peer.indicators.date,
          source: peer.source,
        };
      } catch (error) {
        return {
          ticker: peerTicker,
          state: "NEUTRAL",
          buy_active: 0,
          avoid_active: 0,
          watching: 0,
          date: null,
          source: "unavailable",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Check orb_scan_cache for pre-computed seasonality, fall back to live computation
    let seasonality: Awaited<ReturnType<typeof computeSeasonality>>;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: cached } = await supabase
        .from("orb_scan_cache")
        .select("seasonality_json, updated_at")
        .eq("ticker", ticker)
        .single();
      if (cached?.seasonality_json && cached.updated_at && cached.updated_at.startsWith(today)) {
        seasonality = cached.seasonality_json as Awaited<ReturnType<typeof computeSeasonality>>;
      } else {
        seasonality = await computeSeasonality(supabase, ticker);
      }
    } catch {
      // Cache table may not exist — fall back to live computation
      seasonality = await computeSeasonality(supabase, ticker);
    }

    const activeSetupsForSummary = sortedSetups
      .filter((s) => s.status === "active")
      .map((s) => ({
        id: s.id,
        name: s.public_name || s.name,
        type: s.type,
        winRate20d: s.backtest.summary?.["20"]?.win_rate_pct ?? null,
        avgReturn20d: s.backtest.summary?.["20"]?.avg_return ?? null,
        n: s.backtest.summary?.["20"]?.n ?? 0,
      }));

    const rightNowSentence = buildCurrentSummarySentence({
      ticker,
      modeSuggestion: evaluatedTicker.mode,
      buyActiveCount: activeBuy,
      avoidActiveCount: activeAvoid,
      watchingCount,
      average20d,
      activeSetups: activeSetupsForSummary,
      seasonality,
      indicators: {
        close: evaluatedTicker.indicators.close,
        rsi: evaluatedTicker.indicators.rsi,
        smi: evaluatedTicker.indicators.smi,
        sma200_dist: evaluatedTicker.indicators.sma200_dist,
        bx_daily_state: evaluatedTicker.indicators.bx_daily_state,
        bx_weekly_state: evaluatedTicker.indicators.bx_weekly_state,
        ema9: evaluatedTicker.indicators.ema9,
        ema21: evaluatedTicker.indicators.ema21,
        vix_close: evaluatedTicker.indicators.vix_close,
      },
    });

    return NextResponse.json({
      ticker,
      date: evaluatedTicker.indicators.date,
      source: evaluatedTicker.source,
      indicators: {
        close: round(evaluatedTicker.indicators.close),
        rsi: round(evaluatedTicker.indicators.rsi),
        bxt: round(evaluatedTicker.indicators.bx_daily),
        bxt_state: evaluatedTicker.indicators.bx_daily_state,
        smi: round(evaluatedTicker.indicators.smi),
        sma200_dist: round(evaluatedTicker.indicators.sma200_dist),
        ema9: round(evaluatedTicker.indicators.ema9),
        ema21: round(evaluatedTicker.indicators.ema21),
        bx_daily: round(evaluatedTicker.indicators.bx_daily),
        bx_daily_prev: round(evaluatedTicker.indicators.bx_daily_prev),
        bx_daily_state: evaluatedTicker.indicators.bx_daily_state,
        bx_weekly: round(evaluatedTicker.indicators.bx_weekly),
        bx_weekly_prev: round(evaluatedTicker.indicators.bx_weekly_prev),
        bx_weekly_state: evaluatedTicker.indicators.bx_weekly_state,
        bx_weekly_transition: evaluatedTicker.indicators.bx_weekly_transition,
        smi_signal: round(evaluatedTicker.indicators.smi_signal),
        vix_close: round(evaluatedTicker.indicators.vix_close),
        vix_weekly_change_pct: round(evaluatedTicker.indicators.vix_weekly_change_pct),
      },
      right_now: {
        summary: rightNowSentence,
        suggestion: evaluatedTicker.mode.suggestion,
        confidence: evaluatedTicker.mode.confidence,
        reasoning: evaluatedTicker.mode.reasoning,
      },
      seasonality,
      peer_comparison: peerComparison,
      scenarios: scenarioComparisons,
      scenario_context: scenarioContext,
      setups: sortedSetups,
      meta: {
        backtest_source: usedCachedBacktest ? "orb_backtest_instances" : "ohlcv_scan",
        data_range: await (async () => {
          const { data: rangeData } = await supabase
            .from("ohlcv_bars")
            .select("bar_date")
            .eq("ticker", ticker)
            .eq("timeframe", "daily")
            .order("bar_date", { ascending: true })
            .limit(1);
          const { data: latestData } = await supabase
            .from("ohlcv_bars")
            .select("bar_date")
            .eq("ticker", ticker)
            .eq("timeframe", "daily")
            .order("bar_date", { ascending: false })
            .limit(1);
          const earliest = (rangeData as OhlcvRow[])?.[0]?.bar_date ?? null;
          const latest = (latestData as OhlcvRow[])?.[0]?.bar_date ?? null;
          const years = earliest && latest
            ? Math.round((new Date(latest).getTime() - new Date(earliest).getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
            : null;
          return { earliest, latest, years };
        })(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

