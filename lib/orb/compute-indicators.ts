/**
 * compute-indicators.ts
 *
 * Fetches OHLCV data from Yahoo Finance and computes all technical indicators
 * needed by the ORB (Orb Research Bot) system.
 *
 * Indicator formulas are verified against TradingView — DO NOT change parameters.
 */

import yahooFinance from "yahoo-finance2";
import type { Indicators } from "./evaluate-setups";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type BxtState = "HH" | "LH" | "HL" | "LL";

// ─────────────────────────────────────────────────────────────────────────────
// Yahoo Finance Fetch
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDailyBars(ticker: string, count: number): Promise<OHLCV[]> {
  const endDate = new Date();
  // Fetch extra days to account for weekends/holidays
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - Math.ceil(count * 1.5));

  const result = await yahooFinance.chart(ticker, {
    period1: startDate,
    period2: endDate,
    interval: "1d",
  });

  const quotes = result.quotes ?? [];
  const bars: OHLCV[] = [];

  for (const q of quotes) {
    if (
      q.open == null ||
      q.high == null ||
      q.low == null ||
      q.close == null ||
      q.volume == null
    )
      continue;
    bars.push({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    });
  }

  // Sort ascending by date
  bars.sort((a, b) => a.date.getTime() - b.date.getTime());

  return bars;
}

async function fetchHourlyBars(ticker: string, lookbackDays = 60): Promise<OHLCV[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  const result = await yahooFinance.chart(ticker, {
    period1: startDate,
    period2: endDate,
    interval: "1h",
  });

  const quotes = result.quotes ?? [];
  const bars: OHLCV[] = [];

  for (const q of quotes) {
    if (
      q.open == null ||
      q.high == null ||
      q.low == null ||
      q.close == null ||
      q.volume == null
    )
      continue;

    bars.push({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    });
  }

  bars.sort((a, b) => a.date.getTime() - b.date.getTime());
  return bars;
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Resampling (Mon-Fri → weekly OHLCV)
// ─────────────────────────────────────────────────────────────────────────────

function resampleWeekly(daily: OHLCV[]): OHLCV[] {
  const weeks = new Map<string, OHLCV>();

  for (const bar of daily) {
    const d = bar.date;
    // ISO week key: year + ISO week number
    const weekKey = getIsoWeekKey(d);

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        date: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      });
    } else {
      const w = weeks.get(weekKey)!;
      w.high = Math.max(w.high, bar.high);
      w.low = Math.min(w.low, bar.low);
      w.close = bar.close; // last close of the week
      w.volume += bar.volume;
    }
  }

  return Array.from(weeks.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function resample4H(hourlyBars: OHLCV[]): OHLCV[] {
  const buckets = new Map<string, OHLCV[]>();

  for (const bar of hourlyBars) {
    const d = bar.date;
    const bucketHour = Math.floor(d.getUTCHours() / 4) * 4;
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${bucketHour}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(bar);
  }

  const out: OHLCV[] = [];
  for (const group of buckets.values()) {
    if (!group.length) continue;
    out.push({
      date: group[0].date,
      open: group[0].open,
      high: Math.max(...group.map((bar) => bar.high)),
      low: Math.min(...group.map((bar) => bar.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, bar) => sum + bar.volume, 0),
    });
  }

  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getIsoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday in current week decides the year
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Math Primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Exponential Moving Average (Wilder-style seed = SMA of first `period` values) */
function ema(values: number[], period: number): number[] {
  if (values.length < period) return new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);
  const result: number[] = new Array(values.length).fill(NaN);

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

/** Simple Moving Average */
function sma(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    result[i] = sum / period;
  }
  return result;
}

/** Wilder's RSI */
function wilderRsi(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  if (values.length < period + 1) return result;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  gains /= period;
  losses /= period;

  const rs0 = losses === 0 ? Infinity : gains / losses;
  result[period] = losses === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    gains = (gains * (period - 1) + gain) / period;
    losses = (losses * (period - 1) + loss) / period;
    const rs = losses === 0 ? Infinity : gains / losses;
    result[i] = losses === 0 ? 100 : 100 - 100 / (1 + rs);
  }
  return result;
}

/** Highest value over a rolling window */
function highest(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) max = Math.max(max, values[j]);
    result[i] = max;
  }
  return result;
}

/** Lowest value over a rolling window */
function lowest(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) min = Math.min(min, values[j]);
    result[i] = min;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// BX Trender: RSI(EMA(close, 5) - EMA(close, 20), 5) - 50
// ─────────────────────────────────────────────────────────────────────────────

function computeBxt(closes: number[]): number[] {
  const ema5 = ema(closes, 5);
  const ema20 = ema(closes, 20);
  const diff: number[] = closes.map((_, i) => {
    if (isNaN(ema5[i]) || isNaN(ema20[i])) return NaN;
    return ema5[i] - ema20[i];
  });
  const rsiOfDiff = wilderRsi(diff, 5);
  return rsiOfDiff.map((v) => (isNaN(v) ? NaN : v - 50));
}

// ─────────────────────────────────────────────────────────────────────────────
// BXT State: HH/LH/HL/LL
// Compare current vs previous. H = current > prev, L = current < prev
// State: first letter = current direction, second = prev direction
// ─────────────────────────────────────────────────────────────────────────────

function deriveBxtState(curr: number, prev: number, prevState: BxtState): BxtState {
  // H if current > previous, L otherwise
  const currH = curr > prev;
  // The second letter comes from the previous state's first letter
  const prevWasH = prevState[0] === "H";
  if (currH && prevWasH) return "HH";
  if (!currH && prevWasH) return "LH";
  if (currH && !prevWasH) return "HL";
  return "LL";
}

function computeBxtStates(bxt: number[]): BxtState[] {
  const states: BxtState[] = new Array(bxt.length).fill("LL") as BxtState[];
  // Need at least 2 non-NaN values
  let firstValid = -1;
  for (let i = 0; i < bxt.length; i++) {
    if (!isNaN(bxt[i])) {
      firstValid = i;
      break;
    }
  }
  if (firstValid < 0) return states;

  // Seed first state: assume HH if value > 0, LL otherwise
  states[firstValid] = bxt[firstValid] > 0 ? "HH" : "LL";

  for (let i = firstValid + 1; i < bxt.length; i++) {
    if (isNaN(bxt[i])) {
      states[i] = states[i - 1];
      continue;
    }
    const prev = isNaN(bxt[i - 1]) ? bxt[i] : bxt[i - 1];
    states[i] = deriveBxtState(bxt[i], prev, states[i - 1]);
  }
  return states;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMI (Stochastic Momentum Index)
// %K period=10, %D period=3, EMA signal=3
// Range: ~-100 to +100
// ─────────────────────────────────────────────────────────────────────────────

function computeSmi(bars: OHLCV[], kPeriod = 10, dPeriod = 3, emaPeriod = 3): { smi: number[]; signal: number[] } {
  const n = bars.length;
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const closes = bars.map((b) => b.close);

  const highestK = highest(highs, kPeriod);
  const lowestK = lowest(lows, kPeriod);

  // M = (close - midpoint), where midpoint = (HH + LL) / 2
  const m: number[] = closes.map((c, i) => {
    if (isNaN(highestK[i]) || isNaN(lowestK[i])) return NaN;
    return c - (highestK[i] + lowestK[i]) / 2;
  });

  // D = highest - lowest range over kPeriod
  const rangeFull: number[] = highs.map((_, i) => {
    if (isNaN(highestK[i]) || isNaN(lowestK[i])) return NaN;
    return highestK[i] - lowestK[i];
  });

  // Smooth M and D with double EMA (dPeriod then emaPeriod)
  // Replace NaN with 0 for EMA seeding
  const mClean = m.map((v) => (isNaN(v) ? 0 : v));
  const dClean = rangeFull.map((v) => (isNaN(v) ? 0 : v));

  const mSmooth1 = ema(mClean, dPeriod);
  const mSmooth2 = ema(mSmooth1.map((v) => (isNaN(v) ? 0 : v)), emaPeriod);

  const dSmooth1 = ema(dClean, dPeriod);
  const dSmooth2 = ema(dSmooth1.map((v) => (isNaN(v) ? 0 : v)), emaPeriod);

  const smiValues: number[] = new Array(n).fill(NaN);
  for (let i = 0; i < n; i++) {
    if (isNaN(mSmooth2[i]) || isNaN(dSmooth2[i])) continue;
    if (Math.abs(dSmooth2[i]) < 1e-10) {
      smiValues[i] = 0;
    } else {
      smiValues[i] = (mSmooth2[i] / (dSmooth2[i] / 2)) * 100;
    }
  }

  // Signal = EMA(smi, emaPeriod)
  const smiClean = smiValues.map((v) => (isNaN(v) ? 0 : v));
  const signalValues = ema(smiClean, emaPeriod);

  return { smi: smiValues, signal: signalValues };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export async function computeIndicators(
  ticker: string
): Promise<Indicators & { open: number; volume: number; volumes: number[] }> {
  // Suppress deprecation notice about historical()
  yahooFinance.suppressNotices(["ripHistorical"]);

  // Fetch 400 daily bars for enough history (300+ needed after warmup)
  const [dailyBars, vixBars, hourlyBars] = await Promise.all([
    fetchDailyBars(ticker, 400),
    fetchDailyBars("^VIX", 400),
    fetchHourlyBars(ticker, 60).catch(() => []),
  ]);

  if (dailyBars.length < 50) {
    throw new Error(`Insufficient daily data for ${ticker}: got ${dailyBars.length} bars`);
  }

  // Weekly resampling
  const weeklyBars = resampleWeekly(dailyBars);
  const vixWeekly = resampleWeekly(vixBars);
  const bars4h = resample4H(hourlyBars);

  // ── Extract arrays ──────────────────────────────────────────────────────────
  const closes = dailyBars.map((b) => b.close);
  const wCloses = weeklyBars.map((b) => b.close);
  const vixCloses = vixBars.map((b) => b.close);
  const vixWCloses = vixWeekly.map((b) => b.close);

  const n = closes.length;
  const wN = wCloses.length;
  const h4N = bars4h.length;

  // ── BXT Daily ──────────────────────────────────────────────────────────────
  const bxtDaily = computeBxt(closes);
  const bxtDailyStates = computeBxtStates(bxtDaily);

  const bxDailyCurr = bxtDaily[n - 1];
  const bxDailyPrev = bxtDaily[n - 2];
  const bxDailyState = bxtDailyStates[n - 1];
  const bxDailyStatePrev = bxtDailyStates[n - 2];

  // ── BXT Weekly ─────────────────────────────────────────────────────────────
  const bxtWeekly = computeBxt(wCloses);
  const bxtWeeklyStates = computeBxtStates(bxtWeekly);

  const bxWeeklyCurr = bxtWeekly[wN - 1];
  const bxWeeklyPrev = bxtWeekly[wN - 2];
  const bxWeeklyState = bxtWeeklyStates[wN - 1];
  const bxWeeklyStatePrev = bxtWeeklyStates[wN - 2];

  // BXT Weekly Transition (only if it changed this bar)
  let bxWeeklyTransition: string | null = null;
  if (bxWeeklyState !== bxWeeklyStatePrev) {
    const prevKey = bxWeeklyStatePrev.replace("HH", "HH").replace("LH", "LH").replace("HL", "HL").replace("LL", "LL");
    const currKey = bxWeeklyState;
    bxWeeklyTransition = `${prevKey}_to_${currKey}`;
    // Normalize to use underscore: "LL_to_HL" format
    bxWeeklyTransition = `${bxWeeklyStatePrev}_to_${bxWeeklyState}`;
  }

  // ── Daily HH Streak ────────────────────────────────────────────────────────
  let dailyHhStreak = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (bxtDailyStates[i] === "HH") dailyHhStreak++;
    else break;
  }

  // ── RSI ────────────────────────────────────────────────────────────────────
  const rsiArr = wilderRsi(closes, 14);
  const rsiCurr = rsiArr[n - 1];
  const rsiPrev = rsiArr[n - 2];
  const rsiChange3d = rsiCurr - (isNaN(rsiArr[n - 4]) ? rsiCurr : rsiArr[n - 4]);

  // ── SMI ────────────────────────────────────────────────────────────────────
  const { smi: smiArr, signal: smiSignalArr } = computeSmi(dailyBars, 10, 3, 3);
  const smiCurr = smiArr[n - 1];
  const smiSignalCurr = smiSignalArr[n - 1];
  const smiPrev = smiArr[n - 2];
  const smiSignalPrev = smiSignalArr[n - 2];
  const smiChange3d = smiCurr - (isNaN(smiArr[n - 4]) ? smiCurr : smiArr[n - 4]);

  // Weekly / 4H SMI snapshot values
  const { smi: smiWeeklyArr } = computeSmi(weeklyBars, 10, 3, 3);
  const smiWeeklyCurr = wN > 0 ? smiWeeklyArr[wN - 1] : NaN;

  const smi4hCurr = (() => {
    if (h4N < 10) return NaN;
    const { smi: smi4hArr } = computeSmi(bars4h, 10, 3, 3);
    return smi4hArr[h4N - 1];
  })();

  // SMI crosses
  const smiBullCross = smiPrev <= smiSignalPrev && smiCurr > smiSignalCurr;
  const smiBearCross = smiPrev >= smiSignalPrev && smiCurr < smiSignalCurr;

  // ── Daily EMAs ─────────────────────────────────────────────────────────────
  const ema9Arr = ema(closes, 9);
  const ema13Arr = ema(closes, 13);
  const ema21Arr = ema(closes, 21);
  const ema9Curr = ema9Arr[n - 1];
  const ema13Curr = ema13Arr[n - 1];
  const ema21Curr = ema21Arr[n - 1];

  // ── SMA 200 ────────────────────────────────────────────────────────────────
  const sma200Arr = sma(closes, 200);
  const sma200Curr = sma200Arr[n - 1];
  const close = closes[n - 1];

  const priceVsEma9 = ((close - ema9Curr) / ema9Curr) * 100;
  const priceVsEma21 = ((close - ema21Curr) / ema21Curr) * 100;
  const sma200Dist = ((close - sma200Curr) / sma200Curr) * 100;

  // ── Weekly EMAs ────────────────────────────────────────────────────────────
  const wEma9Arr = ema(wCloses, 9);
  const wEma13Arr = ema(wCloses, 13);
  const wEma21Arr = ema(wCloses, 21);
  const wEma9 = wEma9Arr[wN - 1];
  const wEma13 = wEma13Arr[wN - 1];
  const wEma21 = wEma21Arr[wN - 1];

  const weeklyEmasStacked = wEma9 > wEma13 && wEma13 > wEma21;
  const priceAboveWeekly13 = close > wEma13;
  const priceAboveWeekly21 = close > wEma21;
  const priceAboveWeeklyAll = close > wEma9 && close > wEma13 && close > wEma21;

  // ── VIX ────────────────────────────────────────────────────────────────────
  const vixN = vixCloses.length;
  const vixClose = vixN > 0 ? vixCloses[vixN - 1] : 0;

  // Weekly VIX change
  const vixWN = vixWCloses.length;
  let vixWeeklyChangePct = 0;
  if (vixWN >= 2 && vixWCloses[vixWN - 2] > 0) {
    vixWeeklyChangePct = ((vixWCloses[vixWN - 1] - vixWCloses[vixWN - 2]) / vixWCloses[vixWN - 2]) * 100;
  }

  // ── Consecutive Up/Down ───────────────────────────────────────────────────
  let consecutiveDown = 0;
  let consecutiveUp = 0;
  for (let i = n - 1; i >= 1; i--) {
    const chg = closes[i] - closes[i - 1];
    if (consecutiveDown === 0 && chg < 0) consecutiveDown++;
    else if (consecutiveDown > 0 && chg < 0) consecutiveDown++;
    else if (consecutiveDown > 0) break;
  }
  for (let i = n - 1; i >= 1; i--) {
    const chg = closes[i] - closes[i - 1];
    if (consecutiveUp === 0 && chg > 0) consecutiveUp++;
    else if (consecutiveUp > 0 && chg > 0) consecutiveUp++;
    else if (consecutiveUp > 0) break;
  }

  // Stabilization days: consecutive days where low >= prior day's low
  let stabilizationDays = 0;
  for (let i = n - 1; i >= 1; i--) {
    if (dailyBars[i].low >= dailyBars[i - 1].low) stabilizationDays++;
    else break;
  }

  // ── EMA Shield metrics ────────────────────────────────────────────────────

  // ema9_slope_5d: 5-day % change of EMA9 (from 5 bars ago to now)
  const ema9FiveDaysAgo = ema9Arr[n - 6];
  const ema9Slope5d =
    !isNaN(ema9FiveDaysAgo) && ema9FiveDaysAgo !== 0
      ? ((ema9Curr - ema9FiveDaysAgo) / ema9FiveDaysAgo) * 100
      : 0;

  // days_below_ema9: consecutive days where close < ema9
  let daysBelowEma9 = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (closes[i] < ema9Arr[i]) daysBelowEma9++;
    else break;
  }

  // was_full_bull_5d: was close > ema9 AND ema9 > ema21 on any of last 5 days
  let wasFullBull5d = false;
  for (let i = n - 5; i < n; i++) {
    if (i < 0) continue;
    if (closes[i] > ema9Arr[i] && ema9Arr[i] > ema21Arr[i]) {
      wasFullBull5d = true;
      break;
    }
  }

  // ── Date ──────────────────────────────────────────────────────────────────
  const lastBar = dailyBars[n - 1];
  const dateStr = lastBar.date.toISOString().slice(0, 10);

  // ── Today's Open / Volume / Volumes ───────────────────────────────────────
  const todayOpen = lastBar.open;
  const todayVolume = lastBar.volume;
  const volumes = dailyBars.slice(-30).map((b) => b.volume);

  // ── Assemble result ────────────────────────────────────────────────────────
  const indicators: Indicators & { open: number; volume: number; volumes: number[] } = {
    date: dateStr,
    close,
    open: todayOpen,
    volume: todayVolume,
    volumes,

    // VIX
    vix_close: vixClose,
    vix_weekly_change_pct: vixWeeklyChangePct,

    // BXT Daily
    bx_daily: bxDailyCurr,
    bx_daily_prev: bxDailyPrev,
    bx_daily_state: bxDailyState,
    bx_daily_state_prev: bxDailyStatePrev,

    // BXT Weekly
    bx_weekly: bxWeeklyCurr,
    bx_weekly_prev: bxWeeklyPrev,
    bx_weekly_state: bxWeeklyState,
    bx_weekly_state_prev: bxWeeklyStatePrev,
    bx_weekly_transition: bxWeeklyTransition,

    // HH streak
    daily_hh_streak: dailyHhStreak,

    // RSI
    rsi: rsiCurr,
    rsi_prev: rsiPrev,
    rsi_change_3d: rsiChange3d,

    // SMI
    smi: smiCurr,
    smi_signal: smiSignalCurr,
    smi_prev: smiPrev,
    smi_signal_prev: smiSignalPrev,
    smi_change_3d: smiChange3d,
    smi_bull_cross: smiBullCross,
    smi_bear_cross: smiBearCross,
    smi_weekly: smiWeeklyCurr,
    smi_4h: smi4hCurr,

    // Daily EMAs
    ema9: ema9Curr,
    ema13: ema13Curr,
    ema21: ema21Curr,
    price_vs_ema9: priceVsEma9,
    price_vs_ema21: priceVsEma21,

    // SMA 200
    sma200: sma200Curr,
    sma200_dist: sma200Dist,

    // Weekly EMAs
    weekly_ema9: wEma9,
    weekly_ema13: wEma13,
    weekly_ema21: wEma21,
    weekly_emas_stacked: weeklyEmasStacked,
    price_above_weekly_13: priceAboveWeekly13,
    price_above_weekly_21: priceAboveWeekly21,
    price_above_weekly_all: priceAboveWeeklyAll,

    // Consecutive / Stabilization
    consecutive_down: consecutiveDown,
    consecutive_up: consecutiveUp,
    stabilization_days: stabilizationDays,

    // EMA Shield
    ema9_slope_5d: ema9Slope5d,
    days_below_ema9: daysBelowEma9,
    was_full_bull_5d: wasFullBull5d,
  };

  return indicators;
}
