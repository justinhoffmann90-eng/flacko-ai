/**
 * Backtest candidate AVOID setups for TSLA.
 * Challenge: TSLA has a secular uptrend, so avoid signals must overcome that drift.
 * We need setups where 20D returns are negative on average.
 *
 * Candidates:
 * 1. Parabolic Exhaustion — RSI > 75 + price >15% above 200 SMA + 5+ consecutive up days
 * 2. Volume Dry-Up at Highs — price at 20D high but volume < 60% of 20D avg (no conviction)
 * 3. Weekly BXT Breakdown — weekly BXT transitions from HH to LH (first crack in weekly structure)
 * 4. RSI Ceiling Rejection — RSI hits 70+, then drops 10+ points in 3 days (momentum rollover)
 * 5. EMA Death Cross — daily 9 EMA crosses below 21 EMA after being above for 10+ days
 * 6. Multi-Timeframe Overbought — RSI > 65 AND SMI > 60 AND BXT daily HH (everything hot)
 * 7. Gap Down Reversal Fail — gaps down >3%, bounces intraday, but closes in bottom 25% of range
 * 8. Consecutive New Highs Exhaustion — 8+ consecutive days with HH in close, then reversal bar
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Instance {
  setup: string;
  type: "avoid";
  date: string;
  price: number;
  ret_5d: number | null;
  ret_10d: number | null;
  ret_20d: number | null;
  ret_60d: number | null;
  context?: string;
}

async function fetchBars(ticker: string): Promise<OHLCV[]> {
  console.log(`Fetching ${ticker} from Supabase...`);
  const allBars: OHLCV[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("ohlcv_bars")
      .select("bar_date, open, high, low, close, volume")
      .eq("ticker", ticker)
      .eq("timeframe", "daily")
      .order("bar_date", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row.open == null || row.close == null) continue;
      allBars.push({
        date: new Date(row.bar_date),
        open: row.open, high: row.high, low: row.low,
        close: row.close, volume: row.volume || 0,
      });
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return allBars;
}

// Indicator helpers
function ema(arr: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let prev = arr[0];
  result.push(prev);
  for (let i = 1; i < arr.length; i++) {
    prev = arr[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function sma(arr: number[], period: number): number[] {
  const result: number[] = new Array(arr.length).fill(NaN);
  for (let i = period - 1; i < arr.length; i++) {
    const slice = arr.slice(i - period + 1, i + 1);
    result[i] = slice.reduce((a, b) => a + b, 0) / period;
  }
  return result;
}

function rsi(closes: number[], period = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
  }
  avgGain /= period; avgLoss /= period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

function highest(arr: number[], period: number): number[] {
  const result: number[] = new Array(arr.length).fill(NaN);
  for (let i = period - 1; i < arr.length; i++) {
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) max = Math.max(max, arr[j]);
    result[i] = max;
  }
  return result;
}

function lowest(arr: number[], period: number): number[] {
  const result: number[] = new Array(arr.length).fill(NaN);
  for (let i = period - 1; i < arr.length; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) min = Math.min(min, arr[j]);
    result[i] = min;
  }
  return result;
}

function computeSmi(closes: number[], highs: number[], lows: number[]): number[] {
  const kPeriod = 10, dPeriod = 3, emaPeriod = 3;
  const highestK = highest(highs, kPeriod);
  const lowestK = lowest(lows, kPeriod);
  const m = closes.map((c, i) => isNaN(highestK[i]) || isNaN(lowestK[i]) ? 0 : c - (highestK[i] + lowestK[i]) / 2);
  const d = highestK.map((h, i) => isNaN(h) || isNaN(lowestK[i]) ? 0 : h - lowestK[i]);
  const mEma1 = ema(m, dPeriod);
  const mEma2 = ema(mEma1, emaPeriod);
  const dEma1 = ema(d, dPeriod);
  const dEma2 = ema(dEma1, emaPeriod);
  return mEma2.map((mVal, i) => {
    const dVal = dEma2[i];
    if (dVal === 0) return 0;
    return (mVal / (dVal / 2)) * 100;
  });
}

function computeBxt(closes: number[]): number[] {
  const ema8 = ema(closes, 8);
  const ema21 = ema(closes, 21);
  return ema8.map((e8, i) => ((e8 - ema21[i]) / ema21[i]) * 100);
}

function computeBxtStates(bxt: number[]): string[] {
  const states: string[] = new Array(bxt.length).fill("");
  states[0] = bxt[0] > 0 ? "HH" : "LL";
  for (let i = 1; i < bxt.length; i++) {
    const curr = bxt[i] >= bxt[i - 1] ? "H" : "L";
    const prevFirst = states[i - 1]?.[0] || "H";
    states[i] = curr + prevFirst;
  }
  return states;
}

function resampleWeekly(bars: OHLCV[]): OHLCV[] {
  const weeks: Map<string, OHLCV> = new Map();
  for (const b of bars) {
    const d = new Date(b.date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const existing = weeks.get(key);
    if (!existing) weeks.set(key, { ...b });
    else { existing.high = Math.max(existing.high, b.high); existing.low = Math.min(existing.low, b.low); existing.close = b.close; existing.volume += b.volume; }
  }
  return Array.from(weeks.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function forwardReturn(bars: OHLCV[], idx: number, days: number): number | null {
  const target = idx + days;
  if (target >= bars.length) return null;
  return ((bars[target].close / bars[idx].close) - 1) * 100;
}

function backtest(bars: OHLCV[]): Instance[] {
  const instances: Instance[] = [];
  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const opens = bars.map(b => b.open);
  const volumes = bars.map(b => b.volume);
  const n = bars.length;

  const rsiArr = rsi(closes);
  const smiArr = computeSmi(closes, highs, lows);
  const sma200 = sma(closes, 200);
  const ema9 = ema(closes, 9);
  const ema21d = ema(closes, 21);
  const bxt = computeBxt(closes);
  const bxtStates = computeBxtStates(bxt);

  // Weekly
  const weeklyBars = resampleWeekly(bars);
  const wCloses = weeklyBars.map(b => b.close);
  const wBxt = computeBxt(wCloses);
  const wBxtStates = computeBxtStates(wBxt);

  // Map daily to weekly index
  const dailyToWeekly: number[] = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const d = new Date(bars[i].date);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const wIdx = weeklyBars.findIndex(w => {
      const wd = new Date(w.date);
      const wday = wd.getDay();
      const wMon = new Date(wd);
      wMon.setDate(wd.getDate() - ((wday + 6) % 7));
      return wMon.toISOString().slice(0, 10) === key;
    });
    dailyToWeekly[i] = wIdx;
  }

  // Volume averages
  const volAvg20: number[] = new Array(n).fill(0);
  for (let i = 20; i < n; i++) {
    const slice = volumes.slice(i - 20, i);
    volAvg20[i] = slice.reduce((a, b) => a + b, 0) / 20;
  }

  const cooldowns: Record<string, number> = {};

  for (let i = 210; i < n; i++) {
    const dateStr = bars[i].date.toISOString().slice(0, 10);
    const sma200Val = sma200[i];

    // ── 1. Parabolic Exhaustion ─────────────────────────────────────────────
    // RSI > 75 + price >15% above 200 SMA + 5+ consecutive up days
    {
      let consUp = 0;
      for (let j = i; j > i - 10 && j > 0; j--) {
        if (closes[j] > closes[j - 1]) consUp++; else break;
      }
      const rsiHot = !isNaN(rsiArr[i]) && rsiArr[i] > 75;
      const extended = !isNaN(sma200Val) && sma200Val > 0 && ((closes[i] - sma200Val) / sma200Val) * 100 > 15;
      if (rsiHot && extended && consUp >= 5 && (!cooldowns["parabolic"] || i - cooldowns["parabolic"] >= 20)) {
        cooldowns["parabolic"] = i;
        instances.push({
          setup: "parabolic-exhaustion", type: "avoid", date: dateStr, price: closes[i],
          ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
          ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
          context: `RSI=${rsiArr[i].toFixed(1)}, +${(((closes[i] - sma200Val) / sma200Val) * 100).toFixed(0)}% above 200SMA, ${consUp}d up`,
        });
      }
    }

    // ── 2. Volume Dry-Up at Highs ───────────────────────────────────────────
    // Price at 20D high but volume < 60% of 20D avg
    {
      const high20 = Math.max(...closes.slice(Math.max(0, i - 20), i));
      const atHigh = closes[i] >= high20 * 0.99;
      const dryVol = volAvg20[i] > 0 && volumes[i] < volAvg20[i] * 0.60;
      if (atHigh && dryVol && (!cooldowns["vol-dryup"] || i - cooldowns["vol-dryup"] >= 15)) {
        cooldowns["vol-dryup"] = i;
        const relVol = (volumes[i] / volAvg20[i] * 100).toFixed(0);
        instances.push({
          setup: "volume-dryup-highs", type: "avoid", date: dateStr, price: closes[i],
          ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
          ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
          context: `20D high, rel vol only ${relVol}%`,
        });
      }
    }

    // ── 3. Weekly BXT HH→LH Breakdown ──────────────────────────────────────
    {
      const wIdx = dailyToWeekly[i];
      const wIdxPrev = wIdx > 0 ? wIdx - 1 : -1;
      // Only fire on Fridays (end of week) to avoid intra-week noise
      const isFriday = bars[i].date.getDay() === 5;
      if (wIdx >= 2 && wIdxPrev >= 0 && isFriday) {
        const prevState = wBxtStates[wIdxPrev];
        const currState = wBxtStates[wIdx];
        if (prevState === "HH" && currState === "LH" && (!cooldowns["weekly-bxt-break"] || i - cooldowns["weekly-bxt-break"] >= 20)) {
          cooldowns["weekly-bxt-break"] = i;
          instances.push({
            setup: "weekly-bxt-breakdown", type: "avoid", date: dateStr, price: closes[i],
            ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
            context: `Weekly BXT: HH → LH`,
          });
        }
      }
    }

    // ── 4. RSI Ceiling Rejection ────────────────────────────────────────────
    // RSI was > 70 within last 5 bars, now dropped 10+ points
    {
      if (i >= 5) {
        const recentMaxRsi = Math.max(...rsiArr.slice(i - 5, i).filter(v => !isNaN(v)));
        const rsiDrop = recentMaxRsi - rsiArr[i];
        if (recentMaxRsi > 70 && rsiDrop >= 10 && (!cooldowns["rsi-ceiling"] || i - cooldowns["rsi-ceiling"] >= 15)) {
          cooldowns["rsi-ceiling"] = i;
          instances.push({
            setup: "rsi-ceiling-rejection", type: "avoid", date: dateStr, price: closes[i],
            ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
            context: `RSI peak ${recentMaxRsi.toFixed(1)} → ${rsiArr[i].toFixed(1)} (drop ${rsiDrop.toFixed(1)})`,
          });
        }
      }
    }

    // ── 5. EMA Death Cross ──────────────────────────────────────────────────
    // Daily 9 EMA crosses below 21 EMA after being above for 10+ days
    {
      const cross = ema9[i] < ema21d[i] && ema9[i - 1] >= ema21d[i - 1];
      if (cross) {
        let daysAbove = 0;
        for (let j = i - 1; j > Math.max(0, i - 60); j--) {
          if (ema9[j] >= ema21d[j]) daysAbove++; else break;
        }
        if (daysAbove >= 10 && (!cooldowns["ema-death"] || i - cooldowns["ema-death"] >= 20)) {
          cooldowns["ema-death"] = i;
          instances.push({
            setup: "ema-death-cross", type: "avoid", date: dateStr, price: closes[i],
            ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
            context: `D9 crossed below D21 after ${daysAbove}d above`,
          });
        }
      }
    }

    // ── 6. Multi-Timeframe Overbought ───────────────────────────────────────
    // RSI > 65 AND SMI > 60 AND price > 15% above 200 SMA
    {
      const rsiHot = !isNaN(rsiArr[i]) && rsiArr[i] > 65;
      const smiHot = smiArr[i] > 60;
      const extended = !isNaN(sma200Val) && sma200Val > 0 && ((closes[i] - sma200Val) / sma200Val) * 100 > 15;
      if (rsiHot && smiHot && extended && (!cooldowns["multi-ob"] || i - cooldowns["multi-ob"] >= 20)) {
        cooldowns["multi-ob"] = i;
        instances.push({
          setup: "multi-timeframe-overbought", type: "avoid", date: dateStr, price: closes[i],
          ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
          ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
          context: `RSI=${rsiArr[i].toFixed(1)}, SMI=${smiArr[i].toFixed(1)}, +${(((closes[i] - sma200Val) / sma200Val) * 100).toFixed(0)}% above 200SMA`,
        });
      }
    }

    // ── 7. Gap Down Reversal Fail ───────────────────────────────────────────
    // Gaps down >3%, tries to recover intraday, but closes in bottom 25% of range
    {
      const gapPct = ((opens[i] - closes[i - 1]) / closes[i - 1]) * 100;
      const range = highs[i] - lows[i];
      const closeInRange = range > 0 ? (closes[i] - lows[i]) / range : 0.5;
      if (gapPct <= -3 && closeInRange < 0.25 && range > 0 && (!cooldowns["gap-fail"] || i - cooldowns["gap-fail"] >= 10)) {
        cooldowns["gap-fail"] = i;
        instances.push({
          setup: "gap-down-reversal-fail", type: "avoid", date: dateStr, price: closes[i],
          ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
          ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
          context: `Gap ${gapPct.toFixed(1)}%, close at ${(closeInRange * 100).toFixed(0)}% of range`,
        });
      }
    }

    // ── 8. Consecutive HH Exhaustion ────────────────────────────────────────
    // 8+ consecutive higher closes, then a reversal bar (close < open)
    {
      if (closes[i] < opens[i]) { // reversal bar
        let hhStreak = 0;
        for (let j = i - 1; j > Math.max(0, i - 20); j--) {
          if (closes[j] > closes[j - 1]) hhStreak++; else break;
        }
        if (hhStreak >= 8 && (!cooldowns["hh-exhaust"] || i - cooldowns["hh-exhaust"] >= 15)) {
          cooldowns["hh-exhaust"] = i;
          instances.push({
            setup: "consecutive-hh-exhaustion", type: "avoid", date: dateStr, price: closes[i],
            ret_5d: forwardReturn(bars, i, 5), ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20), ret_60d: forwardReturn(bars, i, 60),
            context: `${hhStreak} consecutive higher closes, then reversal`,
          });
        }
      }
    }
  }

  return instances;
}

function printStats(name: string, instances: Instance[]) {
  const n = instances.length;
  if (n === 0) { console.log(`\n${name}: 0 instances\n`); return; }

  // For AVOID signals, a "win" = price went DOWN
  const stats = (getter: (i: Instance) => number | null) => {
    const vals = instances.map(getter).filter((v): v is number => v !== null);
    if (vals.length === 0) return { n: 0, winRate: 0, avgRet: 0 };
    const wins = vals.filter(v => v < 0).length;
    return { n: vals.length, winRate: (wins / vals.length * 100), avgRet: vals.reduce((a, b) => a + b, 0) / vals.length };
  };

  const s5 = stats(i => i.ret_5d);
  const s10 = stats(i => i.ret_10d);
  const s20 = stats(i => i.ret_20d);
  const s60 = stats(i => i.ret_60d);

  // Grade based on 20D effectiveness for avoid signal
  let grade = "";
  if (s20.avgRet < -3 && s20.winRate > 55) grade = "⭐ STRONG";
  else if (s20.avgRet < -1 && s20.winRate > 50) grade = "✅ VIABLE";
  else if (s20.avgRet < 0) grade = "⚠️ WEAK";
  else grade = "❌ FAILS";

  console.log(`\n${"═".repeat(65)}`);
  console.log(`${name} (AVOID) — N=${n}  ${grade}`);
  console.log(`${"═".repeat(65)}`);
  console.log(`  5D:  ${s5.winRate.toFixed(1)}% decline  avg=${s5.avgRet >= 0 ? '+' : ''}${s5.avgRet.toFixed(2)}%  (n=${s5.n})`);
  console.log(`  10D: ${s10.winRate.toFixed(1)}% decline  avg=${s10.avgRet >= 0 ? '+' : ''}${s10.avgRet.toFixed(2)}%  (n=${s10.n})`);
  console.log(`  20D: ${s20.winRate.toFixed(1)}% decline  avg=${s20.avgRet >= 0 ? '+' : ''}${s20.avgRet.toFixed(2)}%  (n=${s20.n})`);
  console.log(`  60D: ${s60.winRate.toFixed(1)}% decline  avg=${s60.avgRet >= 0 ? '+' : ''}${s60.avgRet.toFixed(2)}%  (n=${s60.n})`);

  const recent = instances.slice(-3);
  console.log(`\n  Recent:`);
  for (const inst of recent) {
    const r20 = inst.ret_20d !== null ? `${inst.ret_20d >= 0 ? '+' : ''}${inst.ret_20d.toFixed(1)}%` : 'n/a';
    console.log(`    ${inst.date}  $${inst.price.toFixed(0)}  20D: ${r20}  ${inst.context || ''}`);
  }
}

async function main() {
  const bars = await fetchBars("TSLA");
  console.log(`Got ${bars.length} bars (${bars[0].date.toISOString().slice(0, 10)} to ${bars[bars.length - 1].date.toISOString().slice(0, 10)})`);

  const instances = backtest(bars);

  const setups = [
    "parabolic-exhaustion", "volume-dryup-highs", "weekly-bxt-breakdown",
    "rsi-ceiling-rejection", "ema-death-cross", "multi-timeframe-overbought",
    "gap-down-reversal-fail", "consecutive-hh-exhaustion",
  ];

  for (const id of setups) {
    printStats(id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      instances.filter(i => i.setup === id));
  }

  console.log(`\n${"═".repeat(65)}`);
  console.log(`TOTAL: ${instances.length} instances across ${setups.length} setups`);
}

main().catch(console.error);
