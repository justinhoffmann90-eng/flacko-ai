/**
 * Backtest 4 proposed new setups against historical TSLA data.
 * Uses the same indicator computation as the existing Orb engine.
 *
 * 1. Climactic Volume Reversal — 200%+ relative volume + RSI < 35
 * 2. Weekly EMA Reclaim — price reclaims weekly 9 EMA after being below all 3
 * 3. Bearish Divergence — price HH while SMI makes LH (avoid signal)
 * 4. Bollinger Band Squeeze — 20-period BB width at 6-month low, then expansion
 *
 * Usage: npx tsx scripts/backtest-new-setups.ts
 */

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
  type: "buy" | "avoid";
  date: string;
  price: number;
  ret_5d: number | null;
  ret_10d: number | null;
  ret_20d: number | null;
  ret_60d: number | null;
  context?: string;
}

// ─── Data fetch ────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
// Load .env.local manually
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

async function fetchBars(ticker: string): Promise<OHLCV[]> {
  console.log(`Fetching ${ticker} from Supabase ohlcv_bars...`);
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

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.open == null || row.close == null) continue;
      allBars.push({
        date: new Date(row.bar_date),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume || 0,
      });
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return allBars;
}

// ─── Indicator helpers ─────────────────────────────────────────────────────────

function sma(arr: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) { result.push(null); continue; }
    const slice = arr.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

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

function rsi(closes: number[], period = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;
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

function computeSmi(closes: number[], highs: number[], lows: number[], kPeriod = 10, dPeriod = 3, emaPeriod = 3): number[] {
  const highestK = highest(highs, kPeriod);
  const lowestK = lowest(lows, kPeriod);
  const m = closes.map((c, i) => isNaN(highestK[i]) || isNaN(lowestK[i]) ? NaN : c - (highestK[i] + lowestK[i]) / 2);
  const d = highestK.map((h, i) => isNaN(h) || isNaN(lowestK[i]) ? NaN : h - lowestK[i]);

  // Double EMA smoothing
  const mClean = m.map(v => isNaN(v) ? 0 : v);
  const dClean = d.map(v => isNaN(v) ? 0 : v);
  const mEma1 = ema(mClean, dPeriod);
  const mEma2 = ema(mEma1, emaPeriod);
  const dEma1 = ema(dClean, dPeriod);
  const dEma2 = ema(dEma1, emaPeriod);

  return mEma2.map((mVal, i) => {
    const dVal = dEma2[i];
    if (dVal === 0 || isNaN(dVal)) return 0;
    return (mVal / (dVal / 2)) * 100;
  });
}

function bollingerBandWidth(closes: number[], period = 20, mult = 2): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    const upper = mean + mult * stdDev;
    const lower = mean - mult * stdDev;
    result[i] = ((upper - lower) / mean) * 100; // Width as % of mean
  }
  return result;
}

// ─── Weekly resampling ─────────────────────────────────────────────────────────

function resampleWeekly(bars: OHLCV[]): OHLCV[] {
  const weeks: Map<string, OHLCV> = new Map();
  for (const b of bars) {
    const d = new Date(b.date);
    // ISO week start (Monday)
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const existing = weeks.get(key);
    if (!existing) {
      weeks.set(key, { ...b });
    } else {
      existing.high = Math.max(existing.high, b.high);
      existing.low = Math.min(existing.low, b.low);
      existing.close = b.close;
      existing.volume += b.volume;
    }
  }
  return Array.from(weeks.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── BXT computation ───────────────────────────────────────────────────────────

function computeBxt(closes: number[]): number[] {
  const ema8 = ema(closes, 8);
  const ema21 = ema(closes, 21);
  return ema8.map((e8, i) => {
    const e21 = ema21[i];
    if (e21 === 0) return 0;
    return ((e8 - e21) / e21) * 100;
  });
}

function computeBxtStates(bxt: number[]): string[] {
  const states: string[] = new Array(bxt.length).fill("");
  if (bxt.length < 2) return states;
  states[0] = bxt[0] > 0 ? "HH" : "LL";
  for (let i = 1; i < bxt.length; i++) {
    const curr = bxt[i] >= bxt[i - 1] ? "H" : "L";
    const prevFirst = states[i - 1]?.[0] || "H";
    states[i] = curr + prevFirst;
  }
  return states;
}

// ─── Forward return calculator ─────────────────────────────────────────────────

function forwardReturn(bars: OHLCV[], idx: number, days: number): number | null {
  const target = idx + days;
  if (target >= bars.length) return null;
  return ((bars[target].close / bars[idx].close) - 1) * 100;
}

// ─── Setup evaluators ──────────────────────────────────────────────────────────

function backtest(bars: OHLCV[]): Instance[] {
  const instances: Instance[] = [];
  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const volumes = bars.map(b => b.volume);
  const n = bars.length;

  // Precompute indicators
  const rsiArr = rsi(closes);
  const smiArr = computeSmi(closes, highs, lows);
  const bbWidth = bollingerBandWidth(closes);
  const ema9 = ema(closes, 9);
  const ema21d = ema(closes, 21);

  // Weekly data
  const weeklyBars = resampleWeekly(bars);
  const wCloses = weeklyBars.map(b => b.close);
  const wEma9 = ema(wCloses, 9);
  const wEma13 = ema(wCloses, 13);
  const wEma21 = ema(wCloses, 21);

  // Map daily bars to their weekly bar index
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

  // BXT for divergence detection
  const bxt = computeBxt(closes);
  const bxtStates = computeBxtStates(bxt);

  // Volume 20-day average
  const volAvg20: number[] = new Array(n).fill(0);
  for (let i = 20; i < n; i++) {
    const slice = volumes.slice(i - 20, i);
    volAvg20[i] = slice.reduce((a, b) => a + b, 0) / 20;
  }

  // Track cooldowns to avoid duplicate signals
  const cooldowns: Record<string, number> = {};

  for (let i = 200; i < n; i++) {
    const dateStr = bars[i].date.toISOString().slice(0, 10);

    // ── SETUP 1: Climactic Volume Reversal ──────────────────────────────────
    // Buy signal: 200%+ relative volume + RSI < 35
    {
      const relVol = volAvg20[i] > 0 ? (volumes[i] / volAvg20[i]) * 100 : 0;
      const rsiVal = rsiArr[i];
      if (
        relVol >= 200 &&
        !isNaN(rsiVal) && rsiVal < 35 &&
        (!cooldowns["climactic-vol"] || i - cooldowns["climactic-vol"] >= 10)
      ) {
        cooldowns["climactic-vol"] = i;
        instances.push({
          setup: "climactic-volume-reversal",
          type: "buy",
          date: dateStr,
          price: closes[i],
          ret_5d: forwardReturn(bars, i, 5),
          ret_10d: forwardReturn(bars, i, 10),
          ret_20d: forwardReturn(bars, i, 20),
          ret_60d: forwardReturn(bars, i, 60),
          context: `relVol=${relVol.toFixed(0)}%, RSI=${rsiVal.toFixed(1)}`,
        });
      }
    }

    // ── SETUP 2: Weekly EMA Reclaim ─────────────────────────────────────────
    // Buy signal: price reclaims weekly 9 EMA after being below all 3
    {
      const wIdx = dailyToWeekly[i];
      const wIdxPrev = dailyToWeekly[Math.max(0, i - 5)]; // ~1 week ago
      if (wIdx >= 2 && wIdxPrev >= 0) {
        const prevBelowAll = closes[i - 5] < wEma9[wIdxPrev] && closes[i - 5] < wEma13[wIdxPrev] && closes[i - 5] < wEma21[wIdxPrev];
        const nowAbove9 = closes[i] > wEma9[wIdx];

        if (
          prevBelowAll && nowAbove9 &&
          (!cooldowns["weekly-ema-reclaim"] || i - cooldowns["weekly-ema-reclaim"] >= 20)
        ) {
          cooldowns["weekly-ema-reclaim"] = i;
          instances.push({
            setup: "weekly-ema-reclaim",
            type: "buy",
            date: dateStr,
            price: closes[i],
            ret_5d: forwardReturn(bars, i, 5),
            ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20),
            ret_60d: forwardReturn(bars, i, 60),
            context: `was below all 3 weekly EMAs, reclaimed W9`,
          });
        }
      }
    }

    // ── SETUP 3: Bearish Divergence ─────────────────────────────────────────
    // Avoid signal: price making HH (20-day) while SMI making LH
    {
      if (i >= 220) {
        const priceHigh20 = Math.max(...closes.slice(i - 20, i));
        const priceHigh40 = Math.max(...closes.slice(i - 40, i - 20));
        const priceHH = closes[i] > priceHigh20 * 0.99 && priceHigh20 > priceHigh40;

        const smiHigh20 = Math.max(...smiArr.slice(i - 20, i));
        const smiHigh40 = Math.max(...smiArr.slice(i - 40, i - 20));
        const smiLH = smiArr[i] > 30 && smiHigh20 < smiHigh40 * 0.95; // SMI peaked lower

        if (
          priceHH && smiLH &&
          smiArr[i] > 40 && // Only when SMI is elevated (avoid false positives in downtrends)
          (!cooldowns["bearish-divergence"] || i - cooldowns["bearish-divergence"] >= 20)
        ) {
          cooldowns["bearish-divergence"] = i;
          instances.push({
            setup: "bearish-divergence",
            type: "avoid",
            date: dateStr,
            price: closes[i],
            ret_5d: forwardReturn(bars, i, 5),
            ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20),
            ret_60d: forwardReturn(bars, i, 60),
            context: `price HH, SMI peak lower (curr=${smiArr[i].toFixed(1)})`,
          });
        }
      }
    }

    // ── SETUP 4: Bollinger Band Squeeze ─────────────────────────────────────
    // Buy signal: BB width at 120-day low, then expands 20%+ next bar
    {
      if (i >= 320 && !isNaN(bbWidth[i]) && !isNaN(bbWidth[i - 1])) {
        const recentMin = Math.min(...bbWidth.slice(i - 120, i).filter(v => !isNaN(v)));
        const isAtLow = bbWidth[i - 1] <= recentMin * 1.05; // Within 5% of 120-day low
        const expanding = bbWidth[i] > bbWidth[i - 1] * 1.20; // 20% expansion

        if (
          isAtLow && expanding &&
          (!cooldowns["bb-squeeze"] || i - cooldowns["bb-squeeze"] >= 20)
        ) {
          // Direction: if close > ema21, bullish squeeze; else bearish
          const direction = closes[i] > ema21d[i] ? "buy" : "avoid";
          cooldowns["bb-squeeze"] = i;
          instances.push({
            setup: direction === "buy" ? "bb-squeeze-bull" : "bb-squeeze-bear",
            type: direction,
            date: dateStr,
            price: closes[i],
            ret_5d: forwardReturn(bars, i, 5),
            ret_10d: forwardReturn(bars, i, 10),
            ret_20d: forwardReturn(bars, i, 20),
            ret_60d: forwardReturn(bars, i, 60),
            context: `BB width=${bbWidth[i].toFixed(2)}%, prev=${bbWidth[i-1].toFixed(2)}%, 120d low=${recentMin.toFixed(2)}%`,
          });
        }
      }
    }
  }

  return instances;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

function printStats(name: string, type: string, instances: Instance[]) {
  const n = instances.length;
  if (n === 0) { console.log(`\n${name}: 0 instances\n`); return; }

  const stats = (horizon: string, getter: (i: Instance) => number | null) => {
    const vals = instances.map(getter).filter((v): v is number => v !== null);
    if (vals.length === 0) return { n: 0, winRate: 0, avgRet: 0 };
    const isAvoid = type === "avoid";
    const wins = isAvoid ? vals.filter(v => v < 0).length : vals.filter(v => v > 0).length;
    return {
      n: vals.length,
      winRate: (wins / vals.length * 100),
      avgRet: vals.reduce((a, b) => a + b, 0) / vals.length,
    };
  };

  const s5 = stats("5D", i => i.ret_5d);
  const s10 = stats("10D", i => i.ret_10d);
  const s20 = stats("20D", i => i.ret_20d);
  const s60 = stats("60D", i => i.ret_60d);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`${name} (${type.toUpperCase()}) — N=${n}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  5D:  win=${s5.winRate.toFixed(1)}%  avg=${s5.avgRet.toFixed(2)}%  (n=${s5.n})`);
  console.log(`  10D: win=${s10.winRate.toFixed(1)}%  avg=${s10.avgRet.toFixed(2)}%  (n=${s10.n})`);
  console.log(`  20D: win=${s20.winRate.toFixed(1)}%  avg=${s20.avgRet.toFixed(2)}%  (n=${s20.n})`);
  console.log(`  60D: win=${s60.winRate.toFixed(1)}%  avg=${s60.avgRet.toFixed(2)}%  (n=${s60.n})`);
  
  // Show recent instances
  const recent = instances.slice(-5);
  console.log(`\n  Recent instances:`);
  for (const inst of recent) {
    const r20 = inst.ret_20d !== null ? `${inst.ret_20d >= 0 ? '+' : ''}${inst.ret_20d.toFixed(1)}%` : 'n/a';
    console.log(`    ${inst.date}  $${inst.price.toFixed(0)}  20D: ${r20}  ${inst.context || ''}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching TSLA data from Supabase...");
  const bars = await fetchBars("TSLA");
  console.log(`Got ${bars.length} daily bars (${bars[0].date.toISOString().slice(0, 10)} to ${bars[bars.length - 1].date.toISOString().slice(0, 10)})`);

  console.log("\nRunning backtests...");
  const instances = backtest(bars);

  const setups = [
    { name: "Climactic Volume Reversal", id: "climactic-volume-reversal", type: "buy" },
    { name: "Weekly EMA Reclaim", id: "weekly-ema-reclaim", type: "buy" },
    { name: "Bearish Divergence", id: "bearish-divergence", type: "avoid" },
    { name: "BB Squeeze (Bullish)", id: "bb-squeeze-bull", type: "buy" },
    { name: "BB Squeeze (Bearish)", id: "bb-squeeze-bear", type: "avoid" },
  ];

  for (const s of setups) {
    const filtered = instances.filter(i => i.setup === s.id);
    printStats(s.name, s.type, filtered);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`TOTAL INSTANCES: ${instances.length}`);
  console.log(`${"═".repeat(60)}`);
}

main().catch(console.error);
