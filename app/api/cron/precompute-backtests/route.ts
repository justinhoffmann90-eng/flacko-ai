import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import {
  evaluateAllSetups,
  type Indicators,
  type PreviousState,
  type SetupResult,
} from "@/lib/orb/evaluate-setups";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300; // 5 minutes — heavy computation

const SUPPORTED_BACKTEST_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "AMZN", "META", "MU", "GOOGL", "BABA"] as const;
const BACKTEST_START_INDEX = 250;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BxtState = "HH" | "LH" | "HL" | "LL";

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

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function normalizeBxtState(value: string | null): BxtState | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "HH" || upper === "LH" || upper === "HL" || upper === "LL") return upper;
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
    if (Number.isFinite(values[i])) { firstValidIndex = i; break; }
  }
  if (firstValidIndex < 0) return states;
  states[firstValidIndex] = values[firstValidIndex] > 0 ? "HH" : "LL";
  for (let i = firstValidIndex + 1; i < values.length; i++) {
    if (!Number.isFinite(values[i])) { states[i] = states[i - 1]; continue; }
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
    for (let j = i - period + 1; j <= i; j++) { if (values[j] > max) max = values[j]; }
    result[i] = max;
  }
  return result;
}

function lowest(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(Number.NaN);
  for (let i = period - 1; i < values.length; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) { if (values[j] < min) min = values[j]; }
    result[i] = min;
  }
  return result;
}

function computeSmi(
  highs: number[], lows: number[], closes: number[],
  kPeriod = 10, dPeriod = 3, emaPeriod = 3,
): { smi: number[]; signal: number[] } {
  const upper = highest(highs, kPeriod);
  const lower = lowest(lows, kPeriod);
  const midpointDiff = closes.map((close, i) => {
    if (!Number.isFinite(upper[i]) || !Number.isFinite(lower[i])) return Number.NaN;
    return close - (upper[i] + lower[i]) / 2;
  });
  const fullRange = highs.map((_, i) => {
    if (!Number.isFinite(upper[i]) || !Number.isFinite(lower[i])) return Number.NaN;
    return upper[i] - lower[i];
  });
  const diffSmooth1 = ema(midpointDiff.map((v) => (Number.isFinite(v) ? v : 0)), dPeriod);
  const diffSmooth2 = ema(diffSmooth1.map((v) => (Number.isFinite(v) ? v : 0)), emaPeriod);
  const rangeSmooth1 = ema(fullRange.map((v) => (Number.isFinite(v) ? v : 0)), dPeriod);
  const rangeSmooth2 = ema(rangeSmooth1.map((v) => (Number.isFinite(v) ? v : 0)), emaPeriod);
  const smiValues = new Array(closes.length).fill(Number.NaN);
  for (let i = 0; i < closes.length; i++) {
    if (!Number.isFinite(diffSmooth2[i]) || !Number.isFinite(rangeSmooth2[i])) continue;
    smiValues[i] = Math.abs(rangeSmooth2[i]) < 1e-10 ? 0 : (diffSmooth2[i] / (rangeSmooth2[i] / 2)) * 100;
  }
  const signal = ema(smiValues.map((v) => (Number.isFinite(v) ? v : 0)), emaPeriod);
  return { smi: smiValues, signal };
}

// ─── Paginated OHLCV fetch (mirrors scan route) ─────────────────────────────

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
  return rows.reverse();
}

// ─── Core backtest walk (same as computeDynamicBacktestRows in scan route) ──

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

function buildBacktestRow(
  setupId: string, signalDate: string, signalClose: number,
  closes: number[], signalIndex: number,
): BacktestRow {
  const fwdReturn = (offset: number): number | null => {
    const idx = signalIndex + offset;
    if (idx >= closes.length || !isFiniteNumber(closes[idx])) return null;
    return round(((closes[idx] - signalClose) / signalClose) * 100);
  };
  const ret5 = fwdReturn(5), ret10 = fwdReturn(10), ret20 = fwdReturn(20), ret60 = fwdReturn(60);
  return {
    setup_id: setupId, signal_date: signalDate, signal_price: signalClose,
    ret_5d: ret5, ret_10d: ret10, ret_20d: ret20, ret_60d: ret60,
    is_win_5d: ret5 != null ? ret5 > 0 : null, is_win_10d: ret10 != null ? ret10 > 0 : null,
    is_win_20d: ret20 != null ? ret20 > 0 : null, is_win_60d: ret60 != null ? ret60 > 0 : null,
  };
}

function updatePreviousStates(
  prevMap: Map<string, PreviousState>, results: SetupResult[], date: string, close: number,
) {
  for (const r of results) {
    const prev = prevMap.get(r.setup_id);
    const status: "active" | "watching" | "inactive" = r.is_active ? "active" : r.is_watching ? "watching" : "inactive";
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

async function computeBacktestForTicker(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
): Promise<BacktestRow[]> {
  const [dailyRows, weeklyRows, vixDailyRows, vixWeeklyRows] = await Promise.all([
    fetchOhlcvRows(supabase, ticker, "daily", 5100),
    fetchOhlcvRows(supabase, ticker, "weekly", 1100),
    fetchOhlcvRows(supabase, "^VIX", "daily", 5100),
    fetchOhlcvRows(supabase, "^VIX", "weekly", 1100),
  ]);

  if (!dailyRows || !weeklyRows || dailyRows.length < BACKTEST_START_INDEX || weeklyRows.length < 10) {
    return [];
  }

  const closes = dailyRows.map((r) => r.close);
  const highs = dailyRows.map((r) => r.high);
  const lows = dailyRows.map((r) => r.low);
  const volumes = dailyRows.map((r) => r.volume);
  const rsiSeries = dailyRows.map((r) => toNumber(r.rsi) ?? Number.NaN);
  const ema9Series = dailyRows.map((r) => toNumber(r.ema_9) ?? Number.NaN);
  const ema21Series = dailyRows.map((r) => toNumber(r.ema_21) ?? Number.NaN);
  const sma200Series = dailyRows.map((r) => toNumber(r.sma_200) ?? Number.NaN);

  const smiResult = computeSmi(highs, lows, closes);

  const dailyBxtSeries = dailyRows.map((r) => toNumber(r.bxt) ?? Number.NaN);
  const dailyInferredStates = inferBxtStates(dailyBxtSeries);
  const weeklyBxtSeries = weeklyRows.map((r) => toNumber(r.bxt) ?? Number.NaN);
  const weeklyInferredStates = inferBxtStates(weeklyBxtSeries);
  const weeklyEma9Series = weeklyRows.map((r) => toNumber(r.ema_9) ?? Number.NaN);
  const weeklyEma13Series = weeklyRows.map((r) => toNumber(r.ema_13) ?? Number.NaN);
  const weeklyEma21Series = weeklyRows.map((r) => toNumber(r.ema_21) ?? Number.NaN);

  const vixDailyCloses = vixDailyRows ? vixDailyRows.map((r) => r.close) : [];
  const vixWeeklyCloses = vixWeeklyRows ? vixWeeklyRows.map((r) => r.close) : [];
  const vixDailyDates = vixDailyRows ? vixDailyRows.map((r) => r.bar_date) : [];
  const vixWeeklyDates = vixWeeklyRows ? vixWeeklyRows.map((r) => r.bar_date) : [];

  // Weekly alignment
  const weeklyIndexByDaily: number[] = new Array(dailyRows.length).fill(-1);
  let lastWeeklyIdx = 0;
  for (let i = 0; i < dailyRows.length; i++) {
    const d = dailyRows[i].bar_date;
    while (lastWeeklyIdx + 1 < weeklyRows.length && weeklyRows[lastWeeklyIdx + 1].bar_date <= d) lastWeeklyIdx++;
    if (weeklyRows[lastWeeklyIdx].bar_date <= d) weeklyIndexByDaily[i] = lastWeeklyIdx;
  }

  // VIX daily alignment
  const vixDailyIndexByDaily: number[] = new Array(dailyRows.length).fill(-1);
  let lastVixDailyIdx = 0;
  for (let i = 0; i < dailyRows.length; i++) {
    const d = dailyRows[i].bar_date;
    while (lastVixDailyIdx + 1 < vixDailyDates.length && vixDailyDates[lastVixDailyIdx + 1] <= d) lastVixDailyIdx++;
    if (vixDailyDates.length > 0 && vixDailyDates[lastVixDailyIdx] <= d) vixDailyIndexByDaily[i] = lastVixDailyIdx;
  }

  // VIX weekly alignment
  const vixWeeklyIndexByDaily: number[] = new Array(dailyRows.length).fill(-1);
  let lastVixWeeklyIdx = 0;
  for (let i = 0; i < dailyRows.length; i++) {
    const d = dailyRows[i].bar_date;
    while (lastVixWeeklyIdx + 1 < vixWeeklyDates.length && vixWeeklyDates[lastVixWeeklyIdx + 1] <= d) lastVixWeeklyIdx++;
    if (vixWeeklyDates.length > 0 && vixWeeklyDates[lastVixWeeklyIdx] <= d) vixWeeklyIndexByDaily[i] = lastVixWeeklyIdx;
  }

  // Pre-compute derived series
  const consecutiveDownSeries: number[] = new Array(dailyRows.length).fill(0);
  const consecutiveUpSeries: number[] = new Array(dailyRows.length).fill(0);
  const stabilizationSeries: number[] = new Array(dailyRows.length).fill(0);
  const dailyHhStreakSeries: number[] = new Array(dailyRows.length).fill(0);
  const daysBelowEma9Series: number[] = new Array(dailyRows.length).fill(0);
  const wasFullBull5dSeries: boolean[] = new Array(dailyRows.length).fill(false);

  for (let i = 1; i < dailyRows.length; i++) {
    if (closes[i] < closes[i - 1]) consecutiveDownSeries[i] = consecutiveDownSeries[i - 1] + 1;
    if (closes[i] > closes[i - 1]) consecutiveUpSeries[i] = consecutiveUpSeries[i - 1] + 1;
    if (lows[i] >= lows[i - 1]) stabilizationSeries[i] = stabilizationSeries[i - 1] + 1;
    const state = normalizeBxtState(dailyRows[i].bxt_state) ?? dailyInferredStates[i] ?? "LL";
    if (state === "HH") dailyHhStreakSeries[i] = dailyHhStreakSeries[i - 1] + 1;
    const barEma9 = ema9Series[i];
    if (isFiniteNumber(barEma9) && closes[i] < barEma9) daysBelowEma9Series[i] = daysBelowEma9Series[i - 1] + 1;
    let wasBull = false;
    for (let j = Math.max(0, i - 4); j <= i; j++) {
      const bEma9 = ema9Series[j], bEma21 = ema21Series[j];
      if (!isFiniteNumber(bEma9) || !isFiniteNumber(bEma21) || !Number.isFinite(closes[j])) continue;
      if (closes[j] > bEma9 && bEma9 > bEma21) { wasBull = true; break; }
    }
    wasFullBull5dSeries[i] = wasBull;
  }

  // Walk through bars and evaluate setups
  const allRows: BacktestRow[] = [];
  const previousStates = new Map<string, PreviousState>();
  const startIndex = Math.max(BACKTEST_START_INDEX, 5);

  for (let i = startIndex; i < dailyRows.length; i++) {
    if (i < 3) continue;
    const weeklyIndex = weeklyIndexByDaily[i];
    if (weeklyIndex < 1) continue;

    const close = closes[i];
    const rsi = rsiSeries[i], rsiPrev = rsiSeries[i - 1];
    const bxtDaily = dailyBxtSeries[i], bxtDailyPrev = dailyBxtSeries[i - 1];
    const e9 = ema9Series[i], e21 = ema21Series[i], s200 = sma200Series[i];
    const wEma9 = weeklyEma9Series[weeklyIndex], wEma13 = weeklyEma13Series[weeklyIndex], wEma21 = weeklyEma21Series[weeklyIndex];
    const bxtWeekly = weeklyBxtSeries[weeklyIndex], bxtWeeklyPrev = weeklyBxtSeries[weeklyIndex - 1];
    const smiCurr = smiResult.smi[i], smiSignalCurr = smiResult.signal[i];
    const smiPrev = smiResult.smi[i - 1], smiSignalPrev = smiResult.signal[i - 1];
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
      const lv = vixWeeklyCloses[vixWeeklyIndex], pv = vixWeeklyCloses[vixWeeklyIndex - 1];
      if (Number.isFinite(lv) && Number.isFinite(pv) && pv !== 0) vixWeeklyChangePct = ((lv - pv) / pv) * 100;
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
      const previousStatus = previousStates.get(result.setup_id)?.status ?? "inactive";
      if (result.is_active && previousStatus !== "active") {
        allRows.push(buildBacktestRow(result.setup_id, indicators.date, indicators.close, closes, i));
      }
    }

    updatePreviousStates(previousStates, setupResults, indicators.date, indicators.close);
  }

  return allRows;
}

// ─── Main cron handler ──────────────────────────────────────────────────────

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const results: Array<{ ticker: string; rows: number; error?: string }> = [];

  for (const ticker of SUPPORTED_BACKTEST_TICKERS) {
    try {
      console.log(`[precompute-backtests] Starting ${ticker}...`);
      const rows = await computeBacktestForTicker(supabase, ticker);
      console.log(`[precompute-backtests] ${ticker}: ${rows.length} instances computed`);

      if (rows.length === 0) {
        results.push({ ticker, rows: 0 });
        continue;
      }

      // Upsert in batches of 500
      const BATCH_SIZE = 500;
      let upserted = 0;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE).map((row) => ({
          ticker,
          setup_id: row.setup_id,
          signal_date: row.signal_date,
          signal_price: row.signal_price,
          ret_5d: row.ret_5d,
          ret_10d: row.ret_10d,
          ret_20d: row.ret_20d,
          ret_60d: row.ret_60d,
          is_win_5d: row.is_win_5d,
          is_win_10d: row.is_win_10d,
          is_win_20d: row.is_win_20d,
          is_win_60d: row.is_win_60d,
        }));

        const { error: upsertError } = await supabase
          .from("orb_backtest_instances")
          .upsert(batch, { onConflict: "ticker,setup_id,signal_date" });

        if (upsertError) {
          console.error(`[precompute-backtests] ${ticker} batch ${i}-${i + batch.length} error:`, upsertError.message);
        } else {
          upserted += batch.length;
        }
      }

      console.log(`[precompute-backtests] ${ticker}: ${upserted}/${rows.length} upserted`);
      results.push({ ticker, rows: upserted });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[precompute-backtests] ${ticker} failed:`, msg);
      results.push({ ticker, rows: 0, error: msg });
    }
  }

  const totalRows = results.reduce((sum, r) => sum + r.rows, 0);
  const failures = results.filter((r) => r.error);

  console.log(`[precompute-backtests] Done. ${totalRows} total rows across ${results.length} tickers. ${failures.length} failures.`);

  return NextResponse.json({
    ok: true,
    total_rows: totalRows,
    tickers: results,
    failures: failures.length,
  });
}
