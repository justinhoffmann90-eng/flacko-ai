import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";
import { computeDerivedTimeframeIndicators } from "@/lib/ohlcv/derived-timeframes";
import type { OHLCVBar } from "@/lib/indicators";
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

  if (timeframe === "weekly") {
    const dailyLimit = Math.max(limit * 7, 450);
    const dailyRows = await fetchOhlcvRows(supabase, ticker, "daily", dailyLimit);
    if (!dailyRows || dailyRows.length === 0) return null;

    const dailyBars: OHLCVBar[] = dailyRows.map((row) => ({
      date: new Date(`${row.bar_date}T00:00:00Z`),
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));

    const weeklyBars = computeDerivedTimeframeIndicators(dailyBars, "weekly");
    if (weeklyBars.length === 0) return null;

    return weeklyBars.slice(-limit).map((bar) => ({
      bar_date: bar.date.toISOString().slice(0, 10),
      open: round(bar.open),
      high: round(bar.high),
      low: round(bar.low),
      close: round(bar.close),
      volume: Math.round(bar.volume ?? 0),
      rsi: bar.rsi,
      bxt: bar.bxt,
      bxt_state: bar.bxt_state,
      ema_9: bar.ema_9,
      ema_13: bar.ema_13,
      ema_21: bar.ema_21,
      sma_200: bar.sma_200,
    }));
  }

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
    bx_weekly_consec_ll: 0, // not computed in compare path
  };
}

// ─── Seasonality (30D only, for speed) ──────────────────────────────────────

async function computeSeasonality30d(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  ticker: string,
): Promise<{ avg_return: number; win_rate: number } | null> {
  const rawDaily = await fetchOhlcvRows(supabase, ticker, "daily", 5100);
  if (!rawDaily || rawDaily.length < 250) return null;

  const allDaily = rawDaily.filter((bar) => toNumber(bar.close) != null && Number(bar.close) > 0);
  if (allDaily.length < 250) return null;

  // Build a date-indexed close map for fast lookups
  const closeByDate = new Map<string, number>();
  for (const bar of allDaily) closeByDate.set(bar.bar_date, bar.close);

  const now = new Date();
  const todayMonth = now.getMonth();
  const todayDate = now.getDate();

  // Get unique years in the data
  const years = new Set<number>();
  for (const bar of allDaily) years.add(parseInt(bar.bar_date.substring(0, 4), 10));

  // Compute 30-day forward returns from the same calendar date in each historical year
  const returns30d: number[] = [];
  for (const year of years) {
    if (year === now.getFullYear()) continue;
    // Find closest trading day to this calendar date
    let anchorDate: string | null = null;
    let anchorClose: number | null = null;
    for (let offset = 0; offset <= 5; offset++) {
      const adjustments = offset === 0 ? [0] : [offset, -offset];
      for (const adj of adjustments) {
        const tryDate = new Date(Date.UTC(year, todayMonth, todayDate + adj));
        const tryKey = tryDate.toISOString().split("T")[0];
        const c = closeByDate.get(tryKey);
        if (c != null && c > 0) { anchorDate = tryKey; anchorClose = c; break; }
      }
      if (anchorDate) break;
    }
    if (!anchorDate || !anchorClose) continue;

    // Find close 30 trading days forward
    const futureBars = allDaily.filter((b) => b.bar_date > anchorDate! && parseInt(b.bar_date.substring(0, 4), 10) <= year + 1);
    if (futureBars.length >= 30) {
      const futureClose = futureBars[29].close;
      if (futureClose > 0) {
        returns30d.push(((futureClose - anchorClose) / anchorClose) * 100);
      }
    }
  }

  if (returns30d.length < 3) return null;
  const avg = returns30d.reduce((s, v) => s + v, 0) / returns30d.length;
  const wins = returns30d.filter((r) => r > 0).length;
  return { avg_return: round(avg), win_rate: round((wins / returns30d.length) * 100) };
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

    // Fetch setup definitions + cached seasonality in parallel
    const [{ data: definitions }, { data: cachedSeasonality }] = await Promise.all([
      supabase.from("orb_setup_definitions").select("id, type"),
      supabase.from("orb_scan_cache").select("ticker, seasonality_json").in("ticker", [...SUPPORTED_TICKERS]),
    ]);

    // Build seasonality lookup from cache
    const seasonalityCache = new Map<string, { avg_return: number; win_rate: number } | null>();
    if (cachedSeasonality) {
      for (const row of cachedSeasonality) {
        const json = row.seasonality_json as { next_30d?: { avg_return: number; win_rate: number } | null } | null;
        seasonalityCache.set(row.ticker, json?.next_30d ?? null);
      }
    }

    const results = await Promise.allSettled(
      SUPPORTED_TICKERS.map(async (ticker) => {
        // Resolve indicators (lightweight — only needs ~450 daily bars)
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
        let changePct = 0;
        const dailyRows = await fetchOhlcvRows(supabase, ticker, "daily", 2);
        if (dailyRows && dailyRows.length >= 2) {
          const prevCloseActual = dailyRows[dailyRows.length - 2].close;
          if (prevCloseActual > 0) changePct = round(((indicators.close - prevCloseActual) / prevCloseActual) * 100);
        }

        // Use cached seasonality; fall back to live computation only if not cached
        let seasonality30d: { avg_return: number; win_rate: number } | null = null;
        if (seasonalityCache.has(ticker)) {
          seasonality30d = seasonalityCache.get(ticker) ?? null;
        } else {
          seasonality30d = await computeSeasonality30d(supabase, ticker);
        }

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
