import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
      const { conditions, eval_logic, ...publicDef } = def;

      return {
        ...publicDef,
        state: state
          ? {
              status: state.status,
              active_since: state.active_since,
              active_day: state.active_day,
              entry_price: state.entry_price,
              gauge_progress_pct: state.gauge_progress_pct,
              watching_reason: state.watching_reason,
              current_price: state.current_price,
              updated_at: state.updated_at,
              inactive_reason: state.inactive_reason,
              gauge_current_value: state.gauge_current_value,
              gauge_target_value: state.gauge_target_value,
              gauge_entry_value: state.gauge_entry_value,
            }
          : null,
        livePerformance: live || null,
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
