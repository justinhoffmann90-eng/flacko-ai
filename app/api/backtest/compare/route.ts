import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";
import {
  evaluateAllSetups,
  type Indicators,
  type PreviousState,
  suggestMode,
} from "@/lib/orb/evaluate-setups";
import { computeIndicators } from "@/lib/orb/compute-indicators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const SUPPORTED_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "AMZN", "META", "MU", "GOOGL", "BABA"] as const;

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

interface StateRow {
  setup_id: string;
  status: "active" | "watching" | "inactive";
  active_since: string | null;
  active_day: number | null;
  entry_price: number | null;
  gauge_entry_value: number | null;
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

// ─── Lightweight indicator resolution from ohlcv_bars ────────────────────────

type BxtState = "HH" | "LH" | "HL" | "LL";

function normalizeBxtState(value: string | null): BxtState | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "HH" || upper === "LH" || upper === "HL" || upper === "LL") return upper;
  return null;
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

// ─── Resolve indicators from ohlcv_bars ─────────────────────────────────────

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

  if (!dailyRows || dailyRows.length < 30 || !weeklyRows || weeklyRows.length < 5) return null;

  const n = dailyRows.length;
  const latest = dailyRows[n - 1];
  const prev = dailyRows[n - 2];
  if (!latest || !prev) return null;

  const close = latest.close;
  const rsi = toNumber(latest.rsi);
  const rsiPrev = toNumber(prev.rsi);
  const ema9 = toNumber(latest.ema_9);
  const ema21 = toNumber(latest.ema_21);
  const sma200 = toNumber(latest.sma_200);
  const bxDaily = toNumber(latest.bxt);
  const bxDailyPrev = toNumber(prev.bxt);

  if (!isFiniteNumber(close) || !isFiniteNumber(rsi) || !isFiniteNumber(rsiPrev) ||
      !isFiniteNumber(ema9) || !isFiniteNumber(ema21) || !isFiniteNumber(sma200) ||
      !isFiniteNumber(bxDaily) || !isFiniteNumber(bxDailyPrev)) return null;

  const wn = weeklyRows.length;
  const weeklyLatest = weeklyRows[wn - 1];
  const weeklyPrev = weeklyRows[wn - 2];
  if (!weeklyLatest || !weeklyPrev) return null;

  const weeklyEma9 = toNumber(weeklyLatest.ema_9);
  const weeklyEma13 = toNumber(weeklyLatest.ema_13);
  const weeklyEma21 = toNumber(weeklyLatest.ema_21);
  const bxWeekly = toNumber(weeklyLatest.bxt);
  const bxWeeklyPrev = toNumber(weeklyPrev.bxt);

  if (!isFiniteNumber(weeklyEma9) || !isFiniteNumber(weeklyEma13) || !isFiniteNumber(weeklyEma21) ||
      !isFiniteNumber(bxWeekly) || !isFiniteNumber(bxWeeklyPrev)) return null;

  // SMI
  const closes = dailyRows.map((r) => r.close);
  const highs = dailyRows.map((r) => r.high);
  const lows = dailyRows.map((r) => r.low);
  const smiResult = computeSmi(highs, lows, closes);
  const smiCurr = smiResult.smi[n - 1];
  const smiSignalCurr = smiResult.signal[n - 1];
  const smiPrev = smiResult.smi[n - 2];
  const smiSignalPrev = smiResult.signal[n - 2];
  const smiPrev3 = smiResult.smi[Math.max(0, n - 4)];

  if (!Number.isFinite(smiCurr) || !Number.isFinite(smiSignalCurr) ||
      !Number.isFinite(smiPrev) || !Number.isFinite(smiSignalPrev)) return null;

  // BXT states
  const bxDailyState = normalizeBxtState(latest.bxt_state) ?? (bxDaily > bxDailyPrev ? "HH" : "LL");
  const bxDailyStatePrev = normalizeBxtState(prev.bxt_state) ?? (bxDailyPrev > (toNumber(dailyRows[n - 3]?.bxt) ?? bxDailyPrev) ? "HH" : "LL");
  const bxWeeklyState = normalizeBxtState(weeklyLatest.bxt_state) ?? (bxWeekly > bxWeeklyPrev ? "HH" : "LL");
  const bxWeeklyStatePrev = normalizeBxtState(weeklyPrev.bxt_state) ?? "LL";

  // VIX
  let vixClose = 0;
  let vixWeeklyChangePct = 0;
  if (vixDailyRows && vixDailyRows.length > 0) {
    vixClose = vixDailyRows[vixDailyRows.length - 1].close;
  }
  if (vixWeeklyRows && vixWeeklyRows.length >= 2) {
    const lv = vixWeeklyRows[vixWeeklyRows.length - 1].close;
    const pv = vixWeeklyRows[vixWeeklyRows.length - 2].close;
    if (pv !== 0) vixWeeklyChangePct = ((lv - pv) / pv) * 100;
  }

  // Consecutive series
  let consecutiveDown = 0, consecutiveUp = 0, stabilizationDays = 0;
  for (let i = n - 1; i >= 1; i--) {
    if (closes[i] < closes[i - 1]) consecutiveDown++;
    else break;
  }
  for (let i = n - 1; i >= 1; i--) {
    if (closes[i] > closes[i - 1]) consecutiveUp++;
    else break;
  }
  for (let i = n - 1; i >= 1; i--) {
    if (lows[i] >= lows[i - 1]) stabilizationDays++;
    else break;
  }

  // Daily HH streak
  let dailyHhStreak = 0;
  for (let i = n - 1; i >= 0; i--) {
    const st = normalizeBxtState(dailyRows[i].bxt_state);
    if (st === "HH") dailyHhStreak++;
    else break;
  }

  // EMA9 slope
  const ema9_5d_ago = n >= 6 ? toNumber(dailyRows[n - 6].ema_9) : null;
  const ema9Slope5d = isFiniteNumber(ema9_5d_ago) && ema9_5d_ago !== 0 ? ((ema9 - ema9_5d_ago) / ema9_5d_ago) * 100 : 0;

  // Days below EMA9
  let daysBelowEma9 = 0;
  for (let i = n - 1; i >= 0; i--) {
    const e = toNumber(dailyRows[i].ema_9);
    if (isFiniteNumber(e) && dailyRows[i].close < e) daysBelowEma9++;
    else break;
  }

  // Was full bull in last 5d
  let wasFullBull5d = false;
  for (let j = Math.max(0, n - 5); j < n; j++) {
    const e9 = toNumber(dailyRows[j].ema_9), e21 = toNumber(dailyRows[j].ema_21);
    if (isFiniteNumber(e9) && isFiniteNumber(e21) && dailyRows[j].close > e9 && e9 > e21) { wasFullBull5d = true; break; }
  }

  const recentVolumes = dailyRows.slice(Math.max(0, n - 30)).map((r) => (Number.isFinite(r.volume) ? r.volume : 0));

  return {
    date: latest.bar_date,
    close, open: toNumber(latest.open) ?? close,
    volume: Number.isFinite(latest.volume) ? latest.volume : 0,
    volumes: recentVolumes,
    vix_close: vixClose, vix_weekly_change_pct: vixWeeklyChangePct,
    bx_daily: bxDaily, bx_daily_prev: bxDailyPrev,
    bx_daily_state: bxDailyState, bx_daily_state_prev: bxDailyStatePrev,
    bx_weekly: bxWeekly, bx_weekly_prev: bxWeeklyPrev,
    bx_weekly_state: bxWeeklyState, bx_weekly_state_prev: bxWeeklyStatePrev,
    bx_weekly_transition: bxWeeklyState !== bxWeeklyStatePrev ? `${bxWeeklyStatePrev}_to_${bxWeeklyState}` : null,
    rsi, rsi_prev: rsiPrev,
    rsi_change_3d: rsi - (toNumber(dailyRows[Math.max(0, n - 4)]?.rsi) ?? rsiPrev),
    smi: smiCurr, smi_signal: smiSignalCurr,
    smi_prev: smiPrev, smi_signal_prev: smiSignalPrev,
    smi_change_3d: smiCurr - (Number.isFinite(smiPrev3) ? smiPrev3 : smiPrev),
    smi_bull_cross: smiPrev <= smiSignalPrev && smiCurr > smiSignalCurr,
    smi_bear_cross: smiPrev >= smiSignalPrev && smiCurr < smiSignalCurr,
    ema9, ema21, sma200,
    sma200_dist: ((close - sma200) / sma200) * 100,
    price_vs_ema9: ((close - ema9) / ema9) * 100,
    price_vs_ema21: ((close - ema21) / ema21) * 100,
    consecutive_down: consecutiveDown, consecutive_up: consecutiveUp,
    stabilization_days: stabilizationDays,
    weekly_ema9: weeklyEma9, weekly_ema13: weeklyEma13, weekly_ema21: weeklyEma21,
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

// ─── Seasonality (30D only, for speed) ──────────────────────────────────────

async function computeSeasonality30d(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
): Promise<{ avg_return: number; win_rate: number } | null> {
  const rawDaily = await fetchOhlcvRows(supabase, ticker, "daily", 5100);
  if (!rawDaily || rawDaily.length < 250) return null;

  const monthBuckets: Map<string, { first: number; last: number }> = new Map();
  for (const bar of rawDaily) {
    const key = bar.bar_date.substring(0, 7);
    const existing = monthBuckets.get(key);
    if (!existing) monthBuckets.set(key, { first: bar.close, last: bar.close });
    else existing.last = bar.close;
  }

  const monthReturnsByMonth: Map<number, number[]> = new Map();
  for (let m = 1; m <= 12; m++) monthReturnsByMonth.set(m, []);

  const sortedKeys = [...monthBuckets.keys()].sort();
  const latestCompleteKey = sortedKeys.length >= 2 ? sortedKeys[sortedKeys.length - 2] : null;
  for (let i = 1; i < sortedKeys.length; i++) {
    const prevKey = sortedKeys[i - 1];
    const currKey = sortedKeys[i];
    if (latestCompleteKey && currKey > latestCompleteKey) continue;
    const prevBucket = monthBuckets.get(prevKey)!;
    const currBucket = monthBuckets.get(currKey)!;
    if (prevBucket.last <= 0 || currBucket.last <= 0) continue;
    const monthNum = parseInt(currKey.split("-")[1], 10);
    monthReturnsByMonth.get(monthNum)!.push(((currBucket.last - prevBucket.last) / prevBucket.last) * 100);
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const daysLeftInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const daysFromNextMonth = Math.max(0, 30 - daysLeftInMonth);

  const currReturns = monthReturnsByMonth.get(currentMonth)!;
  const nextReturns = monthReturnsByMonth.get(nextMonth)!;
  if (currReturns.length === 0) return null;

  const currAvg = currReturns.reduce((s, v) => s + v, 0) / currReturns.length;
  const currWin = round((currReturns.filter((r) => r > 0).length / currReturns.length) * 100);

  if (daysFromNextMonth > 0 && nextReturns.length > 0) {
    const nextAvg = nextReturns.reduce((s, v) => s + v, 0) / nextReturns.length;
    const nextWin = round((nextReturns.filter((r) => r > 0).length / nextReturns.length) * 100);
    return {
      avg_return: round((currAvg * daysLeftInMonth + nextAvg * daysFromNextMonth) / 30),
      win_rate: round((currWin * daysLeftInMonth + nextWin * daysFromNextMonth) / 30),
    };
  }

  return { avg_return: round(currAvg), win_rate: currWin };
}

// ─── Derive recommendation from mode + setups ──────────────────────────────

function deriveRecommendation(
  modeSuggestion: string,
  buyActive: number,
  avoidActive: number,
): string {
  if (avoidActive > 0) return "Reduce Risk";
  if (modeSuggestion === "RED" || modeSuggestion === "EJECTED") return "Reduce Risk";
  if (modeSuggestion === "ORANGE") return "Wait";
  if (buyActive >= 3 && (modeSuggestion === "GREEN" || modeSuggestion === "GREEN_EXTENDED")) return "Buy";
  if (buyActive >= 1) return "Lean Buy";
  return "Wait";
}

// ─── Main handler ───────────────────────────────────────────────────────────

export async function GET() {
  // Check subscriber status
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
    // Default to non-subscriber
  }

  try {
    const supabase = await createServiceClient();

    // Fetch setup definitions once for type lookups
    const { data: definitions } = await supabase
      .from("orb_setup_definitions")
      .select("id, type");

    const results = await Promise.allSettled(
      SUPPORTED_TICKERS.map(async (ticker) => {
        // Resolve indicators
        const fromDb = await computeIndicatorsFromOhlcv(supabase, ticker);
        let indicators: Indicators & { open: number; volume: number; volumes: number[] };
        if (fromDb) {
          indicators = fromDb;
        } else {
          indicators = await computeIndicators(ticker);
        }

        // Get previous states
        const { data: stateRows } = await supabase
          .from("orb_setup_states")
          .select("setup_id, status, active_since, active_day, entry_price, gauge_entry_value")
          .eq("ticker", ticker);

        const prevMap = new Map<string, PreviousState>(
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

        const setupResults = evaluateAllSetups(indicators, prevMap);
        const mode = suggestMode(indicators, setupResults.filter((s) => s.is_active));

        // Use setup type from definitions, not hardcoded ID matching
        const setupTypeMap = new Map<string, string>();
        if (definitions) {
          for (const def of definitions) {
            setupTypeMap.set(def.id, def.type);
          }
        }
        const buyActive = setupResults.filter((s) =>
          s.is_active && setupTypeMap.get(s.setup_id) === "buy"
        ).length;
        const avoidActive = setupResults.filter((s) =>
          s.is_active && setupTypeMap.get(s.setup_id) === "avoid"
        ).length;
        const watching = setupResults.filter((s) => s.is_watching).length;

        // Compute change % from previous close
        const prevClose = indicators.close / (1 + 0); // We need the actual prev close
        // Get it from daily data
        let changePct = 0;
        const dailyRows = await fetchOhlcvRows(supabase, ticker, "daily", 2);
        if (dailyRows && dailyRows.length >= 2) {
          const prevCloseActual = dailyRows[dailyRows.length - 2].close;
          if (prevCloseActual > 0) changePct = round(((indicators.close - prevCloseActual) / prevCloseActual) * 100);
        }

        // Seasonality 30D
        const seasonality30d = await computeSeasonality30d(supabase, ticker);

        return {
          ticker,
          close: round(indicators.close),
          change_pct: changePct,
          mode: mode.suggestion,
          buy_active: buyActive,
          avoid_active: avoidActive,
          watching,
          recommendation_short: deriveRecommendation(mode.suggestion, buyActive, avoidActive),
          seasonality_30d: seasonality30d?.avg_return ?? null,
        };
      }),
    );

    const tickers = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof Promise.resolve>>>).value as {
        ticker: string; close: number; change_pct: number; mode: string;
        buy_active: number; avoid_active: number; watching: number;
        recommendation_short: string; seasonality_30d: number | null;
      });

    const errors = results
      .map((r, i) => r.status === "rejected" ? { ticker: SUPPORTED_TICKERS[i], error: String((r as PromiseRejectedResult).reason) } : null)
      .filter((e): e is NonNullable<typeof e> => e !== null);

    return NextResponse.json({
      tickers,
      errors: errors.length > 0 ? errors : undefined,
      is_subscriber: isSubscriber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
