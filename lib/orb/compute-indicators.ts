// BX-Trender: RSI(EMA(close,5) - EMA(close,20), 15) - 50
// SMI: Stochastic Momentum Index (K=10, D=3, Smooth=3)
// RSI: 14-period, EMA-smoothed (matches TradingView)

function ema(data: number[], span: number): number[] {
  const k = 2 / (span + 1);
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

  const avgGain = ema(gains, period);
  const avgLoss = ema(losses, period);

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

export async function computeIndicators(ticker: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 600);

  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  });
  if (!resp.ok) throw new Error(`Yahoo Finance HTTP ${resp.status}: ${await resp.text()}`);
  const json = await resp.json();
  const chart = json.chart?.result?.[0];
  if (!chart) throw new Error("No chart data returned from Yahoo Finance");
  
  const timestamps = chart.timestamp || [];
  const q = chart.indicators?.quote?.[0] || {};
  const rawQuotes = timestamps.map((t: number, i: number) => ({
    date: new Date(t * 1000),
    open: q.open?.[i],
    high: q.high?.[i],
    low: q.low?.[i],
    close: q.close?.[i],
    volume: q.volume?.[i],
  }));
  
  const quotes = rawQuotes.filter((r: any) => r.close != null && r.high != null && r.low != null && r.open != null);
  if (quotes.length < 220) {
    throw new Error("Not enough OHLCV data to compute Orb indicators");
  }

  const n = quotes.length;
  const closes = quotes.map((q: any) => q.close as number);
  const highs = quotes.map((q: any) => q.high as number);
  const lows = quotes.map((q: any) => q.low as number);

  const bx = bxTrender(closes, 5, 20, 5);
  const rsiValues = rsi(closes, 14);
  const smiResult = smi(closes, highs, lows, 10, 3, 3);
  const ema9 = ema(closes, 9);
  const ema21 = ema(closes, 21);
  const sma200 = sma(closes, 200);

  const weeklyBars: { close: number; high: number; low: number; open: number; date: Date }[] = [];
  let weekStart = 0;

  for (let i = 1; i <= n; i++) {
    const isLast = i === n;
    const isNewWeek =
      !isLast && new Date(quotes[i].date as Date).getDay() < new Date(quotes[i - 1].date as Date).getDay();

    if (isNewWeek || isLast) {
      const slice = quotes.slice(weekStart, i);
      weeklyBars.push({
        open: slice[0].open as number,
        high: Math.max(...slice.map((q: any) => q.high as number)),
        low: Math.min(...slice.map((q: any) => q.low as number)),
        close: slice[slice.length - 1].close as number,
        date: slice[slice.length - 1].date as Date,
      });
      weekStart = i;
    }
  }

  const wCloses = weeklyBars.map((w) => w.close);
  const wBx = bxTrender(wCloses, 5, 20, 5);
  const wEma9 = ema(wCloses, 9);
  const wEma13 = ema(wCloses, 13);
  const wEma21 = ema(wCloses, 21);

  const lastWeekIdx = weeklyBars.length - 1;
  const prevWeekIdx = Math.max(0, lastWeekIdx - 1);

  const wBxState = classifyBxState(wBx[lastWeekIdx], wBx[prevWeekIdx]);
  const wBxStatePrev = prevWeekIdx > 0 ? classifyBxState(wBx[prevWeekIdx], wBx[Math.max(0, prevWeekIdx - 1)]) : "LL";
  const wTransition = wBxStatePrev !== wBxState ? `${wBxStatePrev}_to_${wBxState}` : null;

  const i = n - 1;
  const prev = n - 2;
  const prev3 = Math.max(0, n - 4);

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

  const dailyState = classifyBxState(bx[i], bx[prev]);
  const dailyStatePrev = classifyBxState(bx[prev], bx[Math.max(0, prev - 1)]);

  return {
    date: new Date(quotes[i].date as Date).toISOString().split("T")[0],
    close: closes[i],

    bx_daily: bx[i],
    bx_daily_prev: bx[prev],
    bx_daily_state: dailyState,
    bx_daily_state_prev: dailyStatePrev,

    bx_weekly: wBx[lastWeekIdx],
    bx_weekly_prev: wBx[prevWeekIdx],
    bx_weekly_state: wBxState,
    bx_weekly_state_prev: wBxStatePrev,
    bx_weekly_transition: wTransition,

    rsi: rsiValues[i],
    rsi_prev: rsiValues[prev],
    rsi_change_3d: rsiValues[i] - (rsiValues[prev3] || rsiValues[0]),

    smi: smiResult.smi[i],
    smi_signal: smiResult.signal[i],
    smi_prev: smiResult.smi[prev],
    smi_signal_prev: smiResult.signal[prev],
    smi_change_3d: smiResult.smi[i] - (smiResult.smi[prev3] || 0),
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

    weekly_ema9: wEma9[lastWeekIdx],
    weekly_ema13: wEma13[lastWeekIdx],
    weekly_ema21: wEma21[lastWeekIdx],
    weekly_emas_stacked: wEma9[lastWeekIdx] > wEma13[lastWeekIdx] && wEma13[lastWeekIdx] > wEma21[lastWeekIdx],
    price_above_weekly_all:
      closes[i] > wEma9[lastWeekIdx] && closes[i] > wEma13[lastWeekIdx] && closes[i] > wEma21[lastWeekIdx],
    price_above_weekly_13: closes[i] > wEma13[lastWeekIdx],
    price_above_weekly_21: closes[i] > wEma21[lastWeekIdx],
  };
}
