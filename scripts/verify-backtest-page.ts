import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { evaluateAllSetups, suggestMode } from '../lib/orb/evaluate-setups';

type OhlcvRow = {
  bar_date: string; open: number; high: number; low: number; close: number; volume: number;
  rsi: number | null; bxt: number | null; bxt_state: string | null;
  ema_9: number | null; ema_13: number | null; ema_21: number | null; sma_200: number | null;
};
type BxtState = 'HH'|'LH'|'HL'|'LL';

type VerificationResult = {
  ticker: string;
  date: string;
  mode: string;
  checks: Array<{ name: string; pass: boolean; actual: unknown; expected?: unknown; note?: string }>;
  summary: { passed: number; failed: number };
};

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).replace(/^['"]|['"]$/g, '')];
    })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function normalizeBxtState(value: string | null): BxtState | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return upper === 'HH' || upper === 'LH' || upper === 'HL' || upper === 'LL' ? (upper as BxtState) : null;
}
function deriveBxtState(curr: number, prev: number, prevState: BxtState): BxtState {
  const currentHigh = curr > prev;
  const previousWasHigh = prevState[0] === 'H';
  if (currentHigh && previousWasHigh) return 'HH';
  if (!currentHigh && previousWasHigh) return 'LH';
  if (currentHigh && !previousWasHigh) return 'HL';
  return 'LL';
}
function inferBxtStates(values: number[]): BxtState[] {
  const states: BxtState[] = new Array(values.length).fill('LL') as BxtState[];
  let firstValidIndex = -1;
  for (let i = 0; i < values.length; i++) {
    if (Number.isFinite(values[i])) {
      firstValidIndex = i;
      break;
    }
  }
  if (firstValidIndex < 0) return states;
  states[firstValidIndex] = values[firstValidIndex] > 0 ? 'HH' : 'LL';
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
  for (let i = period; i < values.length; i++) result[i] = values[i] * k + result[i - 1] * (1 - k);
  return result;
}
function highest(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(Number.NaN);
  for (let i = period - 1; i < values.length; i++) {
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) if (values[j] > max) max = values[j];
    result[i] = max;
  }
  return result;
}
function lowest(values: number[], period: number): number[] {
  const result = new Array(values.length).fill(Number.NaN);
  for (let i = period - 1; i < values.length; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) if (values[j] < min) min = values[j];
    result[i] = min;
  }
  return result;
}
function computeSmi(highs: number[], lows: number[], closes: number[], kPeriod = 10, dPeriod = 3, emaPeriod = 3) {
  const upper = highest(highs, kPeriod);
  const lower = lowest(lows, kPeriod);
  const midpointDiff = closes.map((close, index) => !Number.isFinite(upper[index]) || !Number.isFinite(lower[index]) ? Number.NaN : close - (upper[index] + lower[index]) / 2);
  const fullRange = highs.map((_, index) => !Number.isFinite(upper[index]) || !Number.isFinite(lower[index]) ? Number.NaN : upper[index] - lower[index]);
  const diffSmooth1 = ema(midpointDiff.map((value) => Number.isFinite(value) ? value : 0), dPeriod);
  const diffSmooth2 = ema(diffSmooth1.map((value) => Number.isFinite(value) ? value : 0), emaPeriod);
  const rangeSmooth1 = ema(fullRange.map((value) => Number.isFinite(value) ? value : 0), dPeriod);
  const rangeSmooth2 = ema(rangeSmooth1.map((value) => Number.isFinite(value) ? value : 0), emaPeriod);
  const smiValues = new Array(closes.length).fill(Number.NaN);
  for (let i = 0; i < closes.length; i++) {
    if (!Number.isFinite(diffSmooth2[i]) || !Number.isFinite(rangeSmooth2[i])) continue;
    smiValues[i] = Math.abs(rangeSmooth2[i]) < 1e-10 ? 0 : (diffSmooth2[i] / (rangeSmooth2[i] / 2)) * 100;
  }
  const signal = ema(smiValues.map((value) => Number.isFinite(value) ? value : 0), emaPeriod);
  return { smi: smiValues, signal };
}
async function fetchRows(ticker: string, timeframe: 'daily' | 'weekly', limit: number): Promise<OhlcvRow[]> {
  let offset = 0;
  const pageSize = 1000;
  const rows: OhlcvRow[] = [];
  while (offset < limit) {
    const end = Math.min(offset + pageSize - 1, limit - 1);
    const { data, error } = await supabase
      .from('ohlcv_bars')
      .select('bar_date, open, high, low, close, volume, rsi, bxt, bxt_state, ema_9, ema_13, ema_21, sma_200')
      .eq('ticker', ticker)
      .eq('timeframe', timeframe)
      .lte('bar_date', '2026-04-04')
      .order('bar_date', { ascending: false })
      .range(offset, end);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...(data as any));
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return rows.reverse() as OhlcvRow[];
}

async function computeSeasonality(ticker: string) {
  const allDaily = await fetchRows(ticker, 'daily', 5100);
  const monthBuckets = new Map<string, { first: number; last: number }>();
  for (const bar of allDaily) {
    const key = bar.bar_date.substring(0, 7);
    const existing = monthBuckets.get(key);
    if (!existing) monthBuckets.set(key, { first: bar.close, last: bar.close });
    else existing.last = bar.close;
  }
  const monthReturnsByMonth = new Map<number, number[]>();
  for (let m = 1; m <= 12; m++) monthReturnsByMonth.set(m, []);
  const sortedKeys = [...monthBuckets.keys()].sort();
  const latestCompleteMonthKey = sortedKeys.length >= 2 ? sortedKeys[sortedKeys.length - 2] : null;
  for (let i = 1; i < sortedKeys.length; i++) {
    const prevKey = sortedKeys[i - 1];
    const currKey = sortedKeys[i];
    if (latestCompleteMonthKey && currKey > latestCompleteMonthKey) continue;
    const prevBucket = monthBuckets.get(prevKey)!;
    const currBucket = monthBuckets.get(currKey)!;
    const monthNum = parseInt(currKey.split('-')[1], 10);
    const ret = ((currBucket.last - prevBucket.last) / prevBucket.last) * 100;
    monthReturnsByMonth.get(monthNum)!.push(ret);
  }
  const april = monthReturnsByMonth.get(4)!;
  const aprilStats = {
    avg_return: round(april.reduce((s, v) => s + v, 0) / april.length),
    median_return: round(median(april)),
    win_rate: round((april.filter((v) => v > 0).length / april.length) * 100),
    n: april.length,
  };

  const closeByDate = new Map<string, number>(allDaily.map((b) => [b.bar_date, b.close]));
  const years = new Set<number>(allDaily.map((b) => parseInt(b.bar_date.substring(0, 4), 10)));
  const forwardResults: Record<number, number[]> = { 5: [], 10: [], 30: [], 60: [] };
  for (const year of years) {
    if (year === 2026) continue;
    let anchorDate: string | null = null;
    let anchorClose: number | null = null;
    for (let offset = 0; offset <= 5; offset++) {
      const adjustments = offset === 0 ? [0] : [offset, -offset];
      for (const adj of adjustments) {
        const tryDate = new Date(Date.UTC(year, 3, 4 + adj));
        const tryKey = tryDate.toISOString().split('T')[0];
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
    const futureBars = allDaily.filter((b) => b.bar_date > anchorDate! && parseInt(b.bar_date.substring(0, 4), 10) <= year + 1);
    for (const window of [5, 10, 30, 60] as const) {
      if (futureBars.length >= window) {
        const futureClose = futureBars[window - 1].close;
        forwardResults[window].push(((futureClose - anchorClose) / anchorClose) * 100);
      }
    }
  }
  const stat = (vals: number[]) => ({ avg_return: round(vals.reduce((s, v) => s + v, 0) / vals.length), median_return: round(median(vals)), win_rate: round((vals.filter((v) => v > 0).length / vals.length) * 100), n: vals.length });
  return { april: aprilStats, d5: stat(forwardResults[5]), d10: stat(forwardResults[10]), d30: stat(forwardResults[30]), d60: stat(forwardResults[60]) };
}

async function verifyTicker(ticker: string): Promise<VerificationResult> {
  const [dailyRows, weeklyRows, vixDailyRows, vixWeeklyRows] = await Promise.all([
    fetchRows(ticker, 'daily', 450), fetchRows(ticker, 'weekly', 150), fetchRows('^VIX', 'daily', 120), fetchRows('^VIX', 'weekly', 30),
  ]);
  const latest = dailyRows[dailyRows.length - 1];
  const prev = dailyRows[dailyRows.length - 2];
  const prev3 = dailyRows[Math.max(0, dailyRows.length - 4)];
  const weeklyLatest = weeklyRows[weeklyRows.length - 1];
  const weeklyPrev = weeklyRows[weeklyRows.length - 2];
  const closes = dailyRows.map((r) => r.close);
  const highs = dailyRows.map((r) => r.high);
  const lows = dailyRows.map((r) => r.low);
  const volumes = dailyRows.map((r) => r.volume);
  const smiResult = computeSmi(highs, lows, closes);
  const dailyBxtSeries = dailyRows.map((r) => toNumber(r.bxt) ?? Number.NaN);
  const dailyInferredStates = inferBxtStates(dailyBxtSeries);
  const weeklyBxtSeries = weeklyRows.map((r) => toNumber(r.bxt) ?? Number.NaN);
  const weeklyInferredStates = inferBxtStates(weeklyBxtSeries);
  let dailyHhStreak = 0;
  for (let i = dailyRows.length - 1; i >= 0; i--) {
    const state = normalizeBxtState(dailyRows[i].bxt_state) ?? dailyInferredStates[i] ?? 'LL';
    if (state === 'HH') dailyHhStreak += 1; else break;
  }
  let daysBelowEma9 = 0;
  for (let i = dailyRows.length - 1; i >= 0; i--) {
    const barEma9 = toNumber(dailyRows[i].ema_9); if (barEma9 == null) break;
    if (dailyRows[i].close < barEma9) daysBelowEma9 += 1; else break;
  }
  let wasFullBull5d = false;
  for (let i = Math.max(0, dailyRows.length - 5); i < dailyRows.length; i++) {
    const barEma9 = toNumber(dailyRows[i].ema_9); const barEma21 = toNumber(dailyRows[i].ema_21);
    if (barEma9 != null && barEma21 != null && dailyRows[i].close > barEma9 && barEma9 > barEma21) { wasFullBull5d = true; break; }
  }
  const ema9 = toNumber(latest.ema_9)!;
  const ema9FiveDaysAgo = toNumber(dailyRows[Math.max(0, dailyRows.length - 6)]?.ema_9);
  const ema9Slope5d = ema9FiveDaysAgo != null && ema9FiveDaysAgo !== 0 ? ((ema9 - ema9FiveDaysAgo) / ema9FiveDaysAgo) * 100 : 0;

  const indicators: any = {
    date: latest.bar_date,
    close: latest.close,
    open: latest.open,
    volume: latest.volume,
    volumes: volumes.slice(-30),
    vix_close: toNumber(vixDailyRows[vixDailyRows.length - 1]?.close) ?? 0,
    vix_weekly_change_pct: (() => {
      const lv = toNumber(vixWeeklyRows[vixWeeklyRows.length - 1]?.close);
      const pv = toNumber(vixWeeklyRows[vixWeeklyRows.length - 2]?.close);
      return lv != null && pv != null && pv !== 0 ? ((lv - pv) / pv) * 100 : 0;
    })(),
    bx_daily: toNumber(latest.bxt)!,
    bx_daily_prev: toNumber(prev?.bxt)!,
    bx_daily_state: normalizeBxtState(latest.bxt_state) ?? dailyInferredStates[dailyRows.length - 1] ?? 'LL',
    bx_daily_state_prev: normalizeBxtState(prev?.bxt_state ?? null) ?? dailyInferredStates[dailyRows.length - 2] ?? 'LL',
    bx_weekly: toNumber(weeklyLatest.bxt)!,
    bx_weekly_prev: toNumber(weeklyPrev?.bxt)!,
    bx_weekly_state: normalizeBxtState(weeklyLatest.bxt_state) ?? weeklyInferredStates[weeklyRows.length - 1] ?? 'LL',
    bx_weekly_state_prev: normalizeBxtState(weeklyPrev?.bxt_state ?? null) ?? weeklyInferredStates[weeklyRows.length - 2] ?? 'LL',
    bx_weekly_transition: null,
    rsi: toNumber(latest.rsi)!,
    rsi_prev: toNumber(prev?.rsi)!,
    rsi_change_3d: toNumber(latest.rsi)! - (toNumber(prev3?.rsi) ?? toNumber(prev?.rsi)!),
    smi: smiResult.smi[smiResult.smi.length - 1],
    smi_signal: smiResult.signal[smiResult.signal.length - 1],
    smi_prev: smiResult.smi[smiResult.smi.length - 2],
    smi_signal_prev: smiResult.signal[smiResult.signal.length - 2],
    smi_change_3d: smiResult.smi[smiResult.smi.length - 1] - smiResult.smi[Math.max(0, smiResult.smi.length - 4)],
    smi_bull_cross: smiResult.smi[smiResult.smi.length - 2] <= smiResult.signal[smiResult.signal.length - 2] && smiResult.smi[smiResult.smi.length - 1] > smiResult.signal[smiResult.signal.length - 1],
    smi_bear_cross: smiResult.smi[smiResult.smi.length - 2] >= smiResult.signal[smiResult.signal.length - 2] && smiResult.smi[smiResult.smi.length - 1] < smiResult.signal[smiResult.signal.length - 1],
    ema9,
    ema21: toNumber(latest.ema_21)!,
    sma200: toNumber(latest.sma_200)!,
    sma200_dist: ((latest.close - toNumber(latest.sma_200)!) / toNumber(latest.sma_200)!) * 100,
    price_vs_ema9: ((latest.close - ema9) / ema9) * 100,
    price_vs_ema21: ((latest.close - toNumber(latest.ema_21)!) / toNumber(latest.ema_21)!) * 100,
    consecutive_down: 0,
    consecutive_up: 0,
    stabilization_days: 0,
    weekly_ema9: toNumber(weeklyLatest.ema_9)!,
    weekly_ema13: toNumber(weeklyLatest.ema_13)!,
    weekly_ema21: toNumber(weeklyLatest.ema_21)!,
    weekly_emas_stacked: toNumber(weeklyLatest.ema_9)! > toNumber(weeklyLatest.ema_13)! && toNumber(weeklyLatest.ema_13)! > toNumber(weeklyLatest.ema_21)!,
    price_above_weekly_all: latest.close > toNumber(weeklyLatest.ema_9)! && latest.close > toNumber(weeklyLatest.ema_13)! && latest.close > toNumber(weeklyLatest.ema_21)!,
    price_above_weekly_13: latest.close > toNumber(weeklyLatest.ema_13)!,
    price_above_weekly_21: latest.close > toNumber(weeklyLatest.ema_21)!,
    daily_hh_streak: dailyHhStreak,
    ema9_slope_5d: ema9Slope5d,
    days_below_ema9: daysBelowEma9,
    was_full_bull_5d: wasFullBull5d,
    bx_weekly_consec_ll: 0,
  };

  const setups = evaluateAllSetups(indicators, new Map());
  const active = setups.filter((s) => s.is_active).map((s) => s.setup_id);
  const watching = setups.filter((s) => s.is_watching).map((s) => s.setup_id);
  const mode = suggestMode(indicators, setups.filter((s) => s.is_active));
  const seasonality = await computeSeasonality(ticker);

  const checks = [
    { name: 'close finite', pass: Number.isFinite(indicators.close), actual: round(indicators.close) },
    { name: 'RSI finite', pass: Number.isFinite(indicators.rsi), actual: round(indicators.rsi) },
    { name: 'SMI finite', pass: Number.isFinite(indicators.smi), actual: round(indicators.smi) },
    { name: 'below Weekly 21 EMA implies RED/EJECTED', pass: !indicators.price_above_weekly_21 ? mode.suggestion === 'RED / EJECTED' : true, actual: { price_above_weekly_21: indicators.price_above_weekly_21, mode: mode.suggestion } },
    { name: 'QQQ/NVDA expected active setup count', pass: active.length === 0, actual: active, expected: [] },
    { name: 'QQQ/NVDA expected watching count', pass: watching.length === 3, actual: watching, expected: ['trend-confirm', 'goldilocks', 'dual-ll'] },
    { name: 'April seasonality sample size', pass: seasonality.april.n === 20, actual: seasonality.april.n, expected: 20 },
    { name: 'Forward 30D sample size', pass: seasonality.d30.n === 20, actual: seasonality.d30.n, expected: 20 },
  ];
  const passed = checks.filter((c) => c.pass).length;
  return { ticker, date: indicators.date, mode: mode.suggestion, checks, summary: { passed, failed: checks.length - passed } };
}

async function main() {
  const tickers = process.argv.slice(2);
  const targets = tickers.length > 0 ? tickers : ['QQQ', 'NVDA'];
  const results: VerificationResult[] = [];
  for (const ticker of targets) results.push(await verifyTicker(ticker));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
