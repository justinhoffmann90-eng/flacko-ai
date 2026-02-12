import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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
      .select("date, orb_score, orb_zone, orb_zone_prev")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

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

    return NextResponse.json({
      score: latestIndicator ? {
        value: latestIndicator.orb_score,
        zone: latestIndicator.orb_zone,
        prevZone: latestIndicator.orb_zone_prev,
        date: latestIndicator.date,
        zoneChangedAt: lastTransition?.event_date || null,
      } : null,
      setups: merged,
      trackingTrades: trackingTrades || [],
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
