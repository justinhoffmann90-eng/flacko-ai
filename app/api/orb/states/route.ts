import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getZoneDisplay } from "@/lib/orb/score";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const toNumber = (value: unknown): number | null => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

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
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
