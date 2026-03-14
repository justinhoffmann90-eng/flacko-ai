import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getZoneDisplay } from "@/lib/orb/score";
import { computeRSI, computeSMA } from "@/lib/indicators";

type DailyBarRow = {
  bar_date: string;
  close: number | string | null;
};

type DailyClosePoint = {
  barDate: string;
  close: number;
};

type PeerTickerSnapshot = {
  latestClose: number | null;
  change1dPct: number | null;
  change5dPct: number | null;
  rsi14: number | null;
  aboveSma200: boolean | null;
};

const EMPTY_PEER_TICKER: PeerTickerSnapshot = {
  latestClose: null,
  change1dPct: null,
  change5dPct: null,
  rsi14: null,
  aboveSma200: null,
};

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeDailyBars(rows: DailyBarRow[] | null | undefined): DailyClosePoint[] {
  return (rows || [])
    .map((row) => {
      const close = toNumber(row?.close);
      if (!row?.bar_date || close == null) return null;
      return {
        barDate: row.bar_date,
        close,
      };
    })
    .filter((bar): bar is DailyClosePoint => bar !== null)
    .sort((a, b) => a.barDate.localeCompare(b.barDate));
}

function percentChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  const value = ((current / previous) - 1) * 100;
  return Number.isFinite(value) ? value : null;
}

function summarizePeerTicker(rowsAsc: DailyClosePoint[]): PeerTickerSnapshot {
  if (rowsAsc.length === 0) return { ...EMPTY_PEER_TICKER };

  const closes = rowsAsc.map((row) => row.close);
  const latestIdx = closes.length - 1;
  const latestClose = closes[latestIdx] ?? null;
  const priorClose1d = latestIdx >= 1 ? closes[latestIdx - 1] : null;
  const priorClose5d = latestIdx >= 5 ? closes[latestIdx - 5] : null;

  const rsiSeries = computeRSI(closes, 14);
  const smaSeries = computeSMA(closes, 200);

  const latestRsi = toNumber(rsiSeries[latestIdx]);
  const latestSma200 = toNumber(smaSeries[latestIdx]);

  return {
    latestClose,
    change1dPct: percentChange(latestClose, priorClose1d),
    change5dPct: percentChange(latestClose, priorClose5d),
    rsi14: latestRsi,
    aboveSma200: latestSma200 == null || latestClose == null ? null : latestClose > latestSma200,
  };
}

type DailyReturnPoint = {
  barDate: string;
  value: number;
};

function computeDailyReturns(rowsAsc: DailyClosePoint[]): DailyReturnPoint[] {
  const returns: DailyReturnPoint[] = [];

  for (let i = 1; i < rowsAsc.length; i++) {
    const previous = rowsAsc[i - 1]?.close;
    const current = rowsAsc[i]?.close;

    if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) {
      continue;
    }

    const value = (current - previous) / previous;
    if (!Number.isFinite(value)) continue;

    returns.push({ barDate: rowsAsc[i].barDate, value });
  }

  return returns;
}

function pearsonCorrelation(points: Array<{ x: number; y: number }>): number | null {
  if (points.length < 2) return null;

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (const point of points) {
    const xDelta = point.x - meanX;
    const yDelta = point.y - meanY;
    covariance += xDelta * yDelta;
    varianceX += xDelta * xDelta;
    varianceY += yDelta * yDelta;
  }

  const denominator = Math.sqrt(varianceX * varianceY);
  if (denominator === 0 || !Number.isFinite(denominator)) return null;

  const correlation = covariance / denominator;
  return Number.isFinite(correlation) ? correlation : null;
}

function computeRollingCorrelation(
  sourceRowsAsc: DailyClosePoint[],
  targetRowsAsc: DailyClosePoint[],
  windowSize: number
): number | null {
  const sourceReturns = computeDailyReturns(sourceRowsAsc);
  const targetReturns = computeDailyReturns(targetRowsAsc);
  const targetByDate = new Map(targetReturns.map((point) => [point.barDate, point.value]));

  const alignedPoints: Array<{ x: number; y: number }> = [];

  for (const sourcePoint of sourceReturns) {
    const targetValue = targetByDate.get(sourcePoint.barDate);
    if (targetValue == null || !Number.isFinite(targetValue)) continue;
    alignedPoints.push({ x: sourcePoint.value, y: targetValue });
  }

  if (alignedPoints.length < windowSize) return null;

  return pearsonCorrelation(alignedPoints.slice(-windowSize));
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();

    const { data: definitions, error: definitionsError } = await supabase
      .from("orb_setup_definitions")
      .select("*")
      .order("type", { ascending: true })
      .order("number", { ascending: true });

    if (definitionsError) {
      return NextResponse.json({ error: definitionsError.message }, { status: 500 });
    }

    const { data: states, error: statesError } = await supabase
      .from("orb_setup_states")
      .select("*");

    if (statesError) {
      return NextResponse.json({ error: statesError.message }, { status: 500 });
    }

    const { data: liveStats } = await supabase
      .from("orb_tracker")
      .select("setup_id, is_win, final_return_pct")
      .eq("status", "closed");

    const livePerformance: Record<string, { wins: number; total: number; avgReturn: number }> = {};

    for (const trade of liveStats || []) {
      if (!livePerformance[trade.setup_id]) {
        livePerformance[trade.setup_id] = { wins: 0, total: 0, avgReturn: 0 };
      }
      const lp = livePerformance[trade.setup_id];
      lp.total += 1;
      if (trade.is_win) lp.wins += 1;
      lp.avgReturn = ((lp.avgReturn * (lp.total - 1)) + (trade.final_return_pct || 0)) / lp.total;
    }

    const merged = (definitions || []).map((def) => {
      const state = (states || []).find((s) => s.setup_id === def.id);
      const live = livePerformance[def.id];

      return {
        ...def,
        conditions: def.conditions ?? null,
        state: state
          ? {
              status: state.status,
              active_since: state.active_since,
              active_day: state.active_day,
              entry_price: state.entry_price,
              gauge_progress_pct: state.gauge_progress_pct,
              watching_reason: state.watching_reason,
              conditions_met: state.conditions_met,
              current_price: state.current_price,
              updated_at: state.updated_at,
              inactive_reason: state.inactive_reason,
              gauge_current_value: state.gauge_current_value,
              gauge_target_value: state.gauge_target_value,
              gauge_entry_value: state.gauge_entry_value,
              entry_indicator_values: state.entry_indicator_values,
            }
          : null,
        livePerformance: live || null,
      };
    });

    // Fetch latest Orb Score
    const { data: latestIndicator } = await supabase
      .from("orb_daily_indicators")
      .select("date, orb_score, orb_zone, orb_zone_prev, bx_daily, bx_weekly, rsi, smi, ema9, ema21, weekly_ema13")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const latestStateWithIndicators = [...(states || [])]
      .filter((state: any) => state?.current_indicators)
      .sort((a: any, b: any) => {
        const aTs = new Date(a?.updated_at || 0).getTime();
        const bTs = new Date(b?.updated_at || 0).getTime();
        return bTs - aTs;
      })[0];

    const currentIndicators = latestStateWithIndicators?.current_indicators || {};

    const indicatorSnapshot = {
      date: (currentIndicators?.date as string | undefined) || (latestIndicator?.date as string | undefined) || null,
      smiDaily: toNumber(currentIndicators?.smi ?? latestIndicator?.smi),
      smiWeekly: toNumber(currentIndicators?.smi_weekly),
      smi4h: toNumber(currentIndicators?.smi_4h),
      bxtDaily: toNumber(currentIndicators?.bx_daily ?? latestIndicator?.bx_daily),
      bxtWeekly: toNumber(currentIndicators?.bx_weekly ?? latestIndicator?.bx_weekly),
      rsi: toNumber(currentIndicators?.rsi ?? latestIndicator?.rsi),
      ema9: toNumber(currentIndicators?.ema9 ?? latestIndicator?.ema9),
      ema13: toNumber(currentIndicators?.ema13 ?? currentIndicators?.weekly_ema13 ?? latestIndicator?.weekly_ema13),
      ema21: toNumber(currentIndicators?.ema21 ?? latestIndicator?.ema21),
      vixClose: toNumber(currentIndicators?.vix_close),
      vixWeeklyChangePct: toNumber(currentIndicators?.vix_weekly_change_pct),
    };

    const [qqqBarsResult, spyBarsResult, tslaBarsResult] = await Promise.all([
      supabase
        .from("ohlcv_bars")
        .select("bar_date, close")
        .eq("ticker", "QQQ")
        .eq("timeframe", "daily")
        .order("bar_date", { ascending: false })
        .limit(210),
      supabase
        .from("ohlcv_bars")
        .select("bar_date, close")
        .eq("ticker", "SPY")
        .eq("timeframe", "daily")
        .order("bar_date", { ascending: false })
        .limit(210),
      supabase
        .from("ohlcv_bars")
        .select("bar_date, close")
        .eq("ticker", "TSLA")
        .eq("timeframe", "daily")
        .order("bar_date", { ascending: false })
        .limit(210),
    ]);

    if (qqqBarsResult.error) {
      return NextResponse.json({ error: qqqBarsResult.error.message }, { status: 500 });
    }
    if (spyBarsResult.error) {
      return NextResponse.json({ error: spyBarsResult.error.message }, { status: 500 });
    }
    if (tslaBarsResult.error) {
      return NextResponse.json({ error: tslaBarsResult.error.message }, { status: 500 });
    }

    const qqqBars = normalizeDailyBars(qqqBarsResult.data as DailyBarRow[] | null);
    const spyBars = normalizeDailyBars(spyBarsResult.data as DailyBarRow[] | null);
    const tslaBars = normalizeDailyBars(tslaBarsResult.data as DailyBarRow[] | null);

    const peerComparison = {
      qqq: summarizePeerTicker(qqqBars),
      spy: summarizePeerTicker(spyBars),
      correlation: {
        tsla_qqq_20d: computeRollingCorrelation(tslaBars, qqqBars, 20),
        tsla_spy_20d: computeRollingCorrelation(tslaBars, spyBars, 20),
      },
    };

    // Fetch open tracking-horizon trades (signals that fired recently but conditions no longer met)
    const { data: trackingTrades } = await supabase
      .from("orb_tracker")
      .select("*")
      .eq("status", "open")
      .eq("exit_reason", "tracking_horizon");

    // Fetch last zone transition timestamp
    const { data: lastTransition } = await supabase
      .from("orb_signal_log")
      .select("event_date, notes")
      .eq("setup_id", "orb-score")
      .eq("event_type", "zone_transition")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const zoneDisplay = latestIndicator ? getZoneDisplay(Number(latestIndicator.orb_score ?? 0)) : null;

    return NextResponse.json({
      score: latestIndicator ? {
        value: latestIndicator.orb_score,
        zone: latestIndicator.orb_zone,
        zone_display: zoneDisplay,
        prevZone: latestIndicator.orb_zone_prev,
        date: latestIndicator.date,
        zoneChangedAt: lastTransition?.event_date || null,
      } : null,
      setups: merged,
      trackingTrades: trackingTrades || [],
      indicatorSnapshot,
      peerComparison,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
