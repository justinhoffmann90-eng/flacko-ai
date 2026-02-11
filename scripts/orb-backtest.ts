import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { evaluateAllSetups, type Indicators, type PreviousState } from "../lib/orb/evaluate-setups";

type Quote = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type WeeklyBar = { close: number; high: number; low: number; open: number; date: string };

type Instance = {
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
  bar_index?: number;
};

const ID_MAP: Record<string, string> = {
  smi_oversold_gauge: "smi-oversold-gauge",
  oversold_extreme: "oversold-extreme",
  regime_shift: "regime-shift",
  deep_value: "deep-value",
  green_shoots: "green-shoots",
  momentum_flip: "momentum-flip",
  trend_confirmation: "trend-confirm",
  trend_ride: "trend-ride",
  trend_continuation: "trend-continuation",
  goldilocks: "goldilocks",
  capitulation_bounce: "capitulation",
  smi_overbought_gauge: "smi-overbought",
  double_downtrend: "dual-ll",
  overextended: "overextended",
  momentum_crack: "momentum-crack",
};

function mapSetupId(id: string) {
  return ID_MAP[id] || id;
}

function ema(data: number[], span: number): number[] {
  const k = 2 / (span + 1);
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

/** Wilder's smoothing (RMA) — alpha = 1/span. Matches TradingView ta.rsi(). */
function rma(data: number[], span: number): number[] {
  const k = 1 / span;
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

function sma(data: number[], period: number): number[] {
  return data.map((_, i) => {
    if (i < period - 1) return Number.NaN;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function rsi(data: number[], period = 14): number[] {
  const deltas = data.map((v, i) => (i === 0 ? 0 : v - data[i - 1]));
  const gains = deltas.map((d) => (d > 0 ? d : 0));
  const losses = deltas.map((d) => (d < 0 ? -d : 0));

  const avgGain = rma(gains, period);
  const avgLoss = rma(losses, period);

  return avgGain.map((g, i) => {
    if (avgLoss[i] === 0) return 100;
    const rs = g / avgLoss[i];
    return 100 - 100 / (1 + rs);
  });
}

function smi(close: number[], high: number[], low: number[], kLength = 10, dLength = 3, smooth = 3) {
  const n = close.length;
  const ll: number[] = [];
  const hh: number[] = [];

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - kLength + 1);
    ll.push(Math.min(...low.slice(start, i + 1)));
    hh.push(Math.max(...high.slice(start, i + 1)));
  }

  const relDiff = close.map((c, i) => c - (hh[i] + ll[i]) / 2);
  const relRange = hh.map((h, i) => h - ll[i]);

  const d1 = ema(relDiff, dLength);
  const d2 = ema(d1, smooth);
  const r1 = ema(relRange, dLength);
  const r2 = ema(r1, smooth);

  const smiValues = d2.map((d, i) => (r2[i] !== 0 ? (100 * d) / (r2[i] / 2) : 0));
  const smiSignal = ema(smiValues, smooth);

  return { smi: smiValues, signal: smiSignal };
}

function bxTrender(close: number[], l1 = 5, l2 = 20, l3 = 5): number[] {
  const emaFast = ema(close, l1);
  const emaSlow = ema(close, l2);
  const diff = emaFast.map((f, i) => f - emaSlow[i]);
  const bxRsi = rsi(diff, l3);
  return bxRsi.map((v) => v - 50);
}

function classifyBxState(curr: number, prev: number): "HH" | "LH" | "HL" | "LL" {
  if (curr > 0 && curr > prev) return "HH";
  if (curr > 0) return "LH";
  if (curr > prev) return "HL";
  return "LL";
}

async function fetchTslaDaily(): Promise<Quote[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 5);

  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${period1}&period2=${period2}&interval=1d`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  });
  if (!resp.ok) throw new Error(`Yahoo Finance HTTP ${resp.status}: ${await resp.text()}`);

  const json = await resp.json();
  const chart = json.chart?.result?.[0];
  if (!chart) throw new Error("No chart data returned from Yahoo Finance");

  const timestamps = chart.timestamp || [];
  const q = chart.indicators?.quote?.[0] || {};

  return timestamps
    .map((t: number, i: number) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      open: q.open?.[i],
      high: q.high?.[i],
      low: q.low?.[i],
      close: q.close?.[i],
      volume: q.volume?.[i],
    }))
    .filter((r: Quote) => r.close != null && r.high != null && r.low != null && r.open != null);
}

function getEnv() {
  const env = readFileSync(".env.local", "utf-8");
  const g = (k: string) => {
    const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
    return m?.[1]?.trim().replace(/^['\"]|['\"]$/g, "");
  };

  const url = g("NEXT_PUBLIC_SUPABASE_URL");
  const key = g("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  return { url, key };
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const quotes = await fetchTslaDaily();
  if (quotes.length < 260) throw new Error(`Not enough bars: ${quotes.length}`);

  const closes = quotes.map((q) => q.close);
  const highs = quotes.map((q) => q.high);
  const lows = quotes.map((q) => q.low);

  const bx = bxTrender(closes, 5, 20, 5);
  const rsiValues = rsi(closes, 14);
  const smiResult = smi(closes, highs, lows, 10, 3, 3);
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const sma200 = sma(closes, 200);

  const weeklyBars: WeeklyBar[] = [];
  let weekStart = 0;
  for (let i = 1; i <= quotes.length; i++) {
    const isLast = i === quotes.length;
    const prevDay = new Date(quotes[i - 1].date).getDay();
    const currDay = isLast ? prevDay : new Date(quotes[i].date).getDay();
    const isNewWeek = !isLast && currDay < prevDay;

    if (isNewWeek || isLast) {
      const slice = quotes.slice(weekStart, i);
      weeklyBars.push({
        open: slice[0].open,
        high: Math.max(...slice.map((q) => q.high)),
        low: Math.min(...slice.map((q) => q.low)),
        close: slice[slice.length - 1].close,
        date: slice[0].date, // Use FIRST day (Monday) to match TradingView request.security("W")
      });
      weekStart = i;
    }
  }

  const wCloses = weeklyBars.map((w) => w.close);
  const wBx = bxTrender(wCloses, 5, 20, 5);
  const wEma9 = ema(wCloses, 9);
  const wEma13 = ema(wCloses, 13);
  const wEma21 = ema(wCloses, 21);

  const instances: Instance[] = [];
  const previousStates = new Map<string, PreviousState>();

  let weeklyCursor = 0;

  for (let i = 250; i < quotes.length; i++) {
    while (weeklyCursor + 1 < weeklyBars.length && weeklyBars[weeklyCursor + 1].date <= quotes[i].date) {
      weeklyCursor++;
    }

    const wIdx = weeklyCursor;
    const wPrev = Math.max(0, wIdx - 1);
    const wPrev2 = Math.max(0, wIdx - 2);

    const prev = i - 1;
    const prev2 = i - 2;
    const prev3 = Math.max(0, i - 3);

    let consDown = 0;
    let consUp = 0;
    for (let j = i; j > 0; j--) {
      if (closes[j] < closes[j - 1]) consDown++;
      else break;
    }
    for (let j = i; j > 0; j--) {
      if (closes[j] > closes[j - 1]) consUp++;
      else break;
    }

    const wState = classifyBxState(wBx[wIdx], wBx[wPrev]);
    const wStatePrev = classifyBxState(wBx[wPrev], wBx[wPrev2]);

    const indicators: Indicators = {
      date: quotes[i].date,
      close: closes[i],
      bx_daily: bx[i],
      bx_daily_prev: bx[prev],
      bx_daily_state: classifyBxState(bx[i], bx[prev]),
      bx_daily_state_prev: classifyBxState(bx[prev], bx[Math.max(0, prev2)]),
      bx_weekly: wBx[wIdx],
      bx_weekly_prev: wBx[wPrev],
      bx_weekly_state: wState,
      bx_weekly_state_prev: wStatePrev,
      bx_weekly_transition: wStatePrev !== wState ? `${wStatePrev}_to_${wState}` : null,
      rsi: rsiValues[i],
      rsi_prev: rsiValues[prev],
      rsi_change_3d: rsiValues[i] - rsiValues[prev3],
      smi: smiResult.smi[i],
      smi_signal: smiResult.signal[i],
      smi_prev: smiResult.smi[prev],
      smi_signal_prev: smiResult.signal[prev],
      smi_change_3d: smiResult.smi[i] - smiResult.smi[prev3],
      smi_bull_cross: smiResult.smi[prev] <= smiResult.signal[prev] && smiResult.smi[i] > smiResult.signal[i],
      smi_bear_cross: smiResult.smi[prev] >= smiResult.signal[prev] && smiResult.smi[i] < smiResult.signal[i],
      ema9: ema9[i],
      ema21: ema21[i],
      sma200: sma200[i],
      sma200_dist: ((closes[i] - sma200[i]) / sma200[i]) * 100,
      price_vs_ema9: ((closes[i] - ema9[i]) / ema9[i]) * 100,
      price_vs_ema21: ((closes[i] - ema21[i]) / ema21[i]) * 100,
      consecutive_down: consDown,
      consecutive_up: consUp,
      stabilization_days: (() => {
        let days = 0;
        for (let j = i; j > 0; j--) {
          if (lows[j] >= lows[j - 1]) days++;
          else break;
        }
        return days;
      })(),
      weekly_ema9: wEma9[wIdx],
      weekly_ema13: wEma13[wIdx],
      weekly_ema21: wEma21[wIdx],
      weekly_emas_stacked: wEma9[wIdx] > wEma13[wIdx] && wEma13[wIdx] > wEma21[wIdx],
      price_above_weekly_all: closes[i] > wEma9[wIdx] && closes[i] > wEma13[wIdx] && closes[i] > wEma21[wIdx],
      price_above_weekly_13: closes[i] > wEma13[wIdx],
      price_above_weekly_21: closes[i] > wEma21[wIdx],
    };

    const before = new Map(previousStates);
    const results = evaluateAllSetups(indicators, previousStates);

    for (const result of results) {
      const setupId = mapSetupId(result.setup_id);
      const prevStatus = before.get(setupId)?.status;
      const active = !!result.is_active;

      if (active && prevStatus !== "active") {
        instances.push({
          setup_id: setupId,
          signal_date: quotes[i].date,
          signal_price: closes[i],
          ret_5d: null,
          ret_10d: null,
          ret_20d: null,
          ret_60d: null,
          is_win_5d: null,
          is_win_10d: null,
          is_win_20d: null,
          is_win_60d: null,
          bar_index: i,
        });
      }

      previousStates.set(setupId, {
        setup_id: setupId,
        status: active ? "active" : result.is_watching ? "watching" : "inactive",
        gauge_entry_value: result.gauge_entry_value,
      });
    }
  }

  for (const inst of instances) {
    const i = inst.bar_index!;
    inst.ret_5d = i + 5 < closes.length ? ((closes[i + 5] - closes[i]) / closes[i]) * 100 : null;
    inst.ret_10d = i + 10 < closes.length ? ((closes[i + 10] - closes[i]) / closes[i]) * 100 : null;
    inst.ret_20d = i + 20 < closes.length ? ((closes[i + 20] - closes[i]) / closes[i]) * 100 : null;
    inst.ret_60d = i + 60 < closes.length ? ((closes[i + 60] - closes[i]) / closes[i]) * 100 : null;
    inst.is_win_5d = inst.ret_5d != null ? inst.ret_5d > 0 : null;
    inst.is_win_10d = inst.ret_10d != null ? inst.ret_10d > 0 : null;
    inst.is_win_20d = inst.ret_20d != null ? inst.ret_20d > 0 : null;
    inst.is_win_60d = inst.ret_60d != null ? inst.ret_60d > 0 : null;
    delete inst.bar_index;
  }

  const { url, key } = getEnv();
  const supabase = createClient(url, key);

  const { error: delErr } = await supabase.from("orb_backtest_instances").delete().neq("id", 0);
  if (delErr) throw delErr;

  for (const c of chunk(instances, 100)) {
    const { error } = await supabase.from("orb_backtest_instances").upsert(c, { onConflict: "setup_id,signal_date" });
    if (error) throw error;
  }

  const counts: Record<string, number> = {};
  for (const inst of instances) counts[inst.setup_id] = (counts[inst.setup_id] || 0) + 1;

  console.log(`Inserted ${instances.length} backtest instances`);
  console.log(counts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
