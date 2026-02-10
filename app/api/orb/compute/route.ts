import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { computeIndicators } from "@/lib/orb/compute-indicators";
import { evaluateAllSetups, PreviousState, suggestMode } from "@/lib/orb/evaluate-setups";
import { sendAlert } from "@/lib/orb/alerts";

export const maxDuration = 30;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendOrbComputeFailureAlert(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
  if (!botToken || !chatId) {
    console.error("[ORB][TELEGRAM_NOT_CONFIGURED]", message);
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `ORB compute failure:\n${message}`,
      }),
    });
  } catch (e) {
    console.error("[ORB][TELEGRAM_ALERT_FAILED]", e);
  }
}

async function runCompute() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let indicators: Awaited<ReturnType<typeof computeIndicators>>;

    // Yahoo Finance fetch with one retry (5s) and explicit failure alerting
    try {
      indicators = await computeIndicators("TSLA");
    } catch (firstError) {
      console.error("[ORB][YAHOO_FETCH_FAILED_FIRST]", firstError);
      await sleep(5000);
      try {
        indicators = await computeIndicators("TSLA");
      } catch (secondError) {
        const errMsg = `Yahoo Finance fetch failed twice for TSLA. First: ${String(firstError)} | Second: ${String(secondError)}`;
        console.error("[ORB][YAHOO_FETCH_FAILED_FINAL]", errMsg);
        await sendOrbComputeFailureAlert(errMsg);
        return NextResponse.json({ error: errMsg }, { status: 500 });
      }
    }

    const supabase = await createServiceClient();

    const { data: prevStates } = await supabase.from("orb_setup_states").select("*");

    const prevMap = new Map<string, PreviousState>(
      (prevStates || []).map((s: any) => [
        s.setup_id,
        {
          setup_id: s.setup_id,
          status: s.status,
          gauge_entry_value: s.gauge_entry_value,
          entry_price: s.entry_price,
          active_since: s.active_since,
        },
      ])
    );

    const results = evaluateAllSetups(indicators, prevMap);

    for (const result of results) {
      const prev = prevMap.get(result.setup_id);
      const prevStatus = prev?.status || "inactive";
      const newStatus = result.is_active ? "active" : result.is_watching ? "watching" : "inactive";
      const statusChanged = prevStatus !== newStatus;
      const existing = (prevStates || []).find((s: any) => s.setup_id === result.setup_id);

      const stateUpdate: Record<string, unknown> = {
        setup_id: result.setup_id,
        status: newStatus,
        current_indicators: indicators,
        current_price: indicators.close,
        conditions_met: result.conditions_met,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "active" && prevStatus !== "active") {
        stateUpdate.active_since = indicators.date;
        stateUpdate.active_day = 1;
        stateUpdate.entry_price = indicators.close;
        stateUpdate.entry_indicator_values = indicators;
        if (result.gauge_entry_value !== undefined) {
          stateUpdate.gauge_entry_value = result.gauge_entry_value;
          stateUpdate.gauge_target_value = result.gauge_target_value;
        }
      } else if (newStatus === "active") {
        stateUpdate.active_day = (existing?.active_day || 0) + 1;
        stateUpdate.active_since = prev?.active_since;
        stateUpdate.entry_price = prev?.entry_price;
        stateUpdate.gauge_entry_value = prev?.gauge_entry_value ?? null;
      }

      if (result.gauge_current_value !== undefined) {
        stateUpdate.gauge_current_value = result.gauge_current_value;
        const entry = (result.gauge_entry_value ?? prev?.gauge_entry_value ?? 0) as number;
        const target = (result.gauge_target_value ?? 30) as number;
        stateUpdate.gauge_target_value = target;
        stateUpdate.gauge_progress_pct = target === entry ? 100 : ((result.gauge_current_value - entry) / (target - entry)) * 100;
      }

      if (newStatus === "watching") stateUpdate.watching_reason = result.reason;
      if (newStatus === "inactive") stateUpdate.inactive_reason = result.reason;

      await supabase.from("orb_setup_states").upsert(stateUpdate, { onConflict: "setup_id" });

      if (statusChanged) {
        const eventType =
          newStatus === "active"
            ? "activated"
            : newStatus === "watching"
            ? "watching_started"
            : prevStatus === "active"
            ? "deactivated"
            : "watching_ended";

        await supabase.from("orb_signal_log").insert({
          setup_id: result.setup_id,
          event_type: eventType,
          event_date: indicators.date,
          event_price: indicators.close,
          indicator_snapshot: indicators,
          previous_status: prevStatus,
          new_status: newStatus,
          notes: result.reason,
        });

        if (newStatus === "active" && prevStatus !== "active") {
          // Flicker protection: if same setup was closed within 5 trading days, reopen it
          const { data: recentClosed } = await supabase
            .from("orb_tracker")
            .select("*")
            .eq("setup_id", result.setup_id)
            .eq("status", "closed")
            .order("exit_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          const fiveDaysAgo = new Date();
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 7); // ~5 trading days
          const recentlyClosedDate = recentClosed?.exit_date ? new Date(recentClosed.exit_date) : null;

          if (recentClosed && recentlyClosedDate && recentlyClosedDate >= fiveDaysAgo) {
            // Reopen the recent trade instead of creating a new one
            await supabase.from("orb_tracker").update({
              exit_date: null,
              exit_price: null,
              exit_reason: null,
              exit_indicators: null,
              final_return_pct: null,
              is_win: null,
              status: "open",
              updated_at: new Date().toISOString(),
            }).eq("id", recentClosed.id);
          } else {
            await supabase.from("orb_tracker").insert({
              setup_id: result.setup_id,
              entry_date: indicators.date,
              entry_price: indicators.close,
              entry_indicators: indicators,
              current_return_pct: 0,
              max_return_pct: 0,
              max_drawdown_pct: 0,
              days_active: 1,
              status: "open",
            });
          }
        }

        if (prevStatus === "active" && newStatus !== "active") {
          const { data: openTrade } = await supabase
            .from("orb_tracker")
            .select("*")
            .eq("setup_id", result.setup_id)
            .eq("status", "open")
            .order("entry_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (openTrade) {
            const finalReturn = ((indicators.close / openTrade.entry_price) - 1) * 100;
            await supabase
              .from("orb_tracker")
              .update({
                exit_date: indicators.date,
                exit_price: indicators.close,
                exit_reason: result.reason.toLowerCase().includes("target") ? "target_reached" : "conditions_lost",
                exit_indicators: indicators,
                final_return_pct: finalReturn,
                is_win: finalReturn > 0,
                status: "closed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", openTrade.id);
          }
        }

        if (newStatus === "active" || (prevStatus === "active" && !result.is_active)) {
          await sendAlert(result.setup_id, newStatus, result.reason, indicators);
        }
      }

      if (newStatus === "active") {
        const { data: openTrade } = await supabase
          .from("orb_tracker")
          .select("*")
          .eq("setup_id", result.setup_id)
          .eq("status", "open")
          .order("entry_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (openTrade) {
          const currentReturn = ((indicators.close / openTrade.entry_price) - 1) * 100;
          const newDaysActive = (openTrade.days_active || 0) + 1;

          // Gauge timeout: close after 60 trading days
          const isGauge = ["smi-oversold-gauge", "smi-overbought"].includes(result.setup_id);
          if (isGauge && newDaysActive >= 60) {
            await supabase
              .from("orb_tracker")
              .update({
                exit_date: indicators.date,
                exit_price: indicators.close,
                exit_reason: "timeout",
                final_return_pct: currentReturn,
                is_win: result.setup_id === "smi-oversold-gauge" ? currentReturn > 0 : currentReturn < 0,
                status: "closed",
                days_active: newDaysActive,
                current_return_pct: currentReturn,
                max_return_pct: Math.max(openTrade.max_return_pct || 0, currentReturn),
                max_drawdown_pct: Math.min(openTrade.max_drawdown_pct || 0, currentReturn),
                updated_at: new Date().toISOString(),
              })
              .eq("id", openTrade.id);
          } else {
            await supabase
              .from("orb_tracker")
              .update({
                current_return_pct: currentReturn,
                max_return_pct: Math.max(openTrade.max_return_pct || 0, currentReturn),
                max_drawdown_pct: Math.min(openTrade.max_drawdown_pct || 0, currentReturn),
                days_active: newDaysActive,
                updated_at: new Date().toISOString(),
              })
              .eq("id", openTrade.id);
          }
        }
      }
    }

    const modeSuggestion = suggestMode(
      indicators,
      results.filter((r) => r.is_active)
    );

    await supabase.from("orb_daily_indicators").upsert(
      {
        date: indicators.date,
        close_price: indicators.close,
        bx_daily: indicators.bx_daily,
        bx_daily_prev: indicators.bx_daily_prev,
        bx_daily_state: indicators.bx_daily_state,
        bx_weekly: indicators.bx_weekly,
        bx_weekly_state: indicators.bx_weekly_state,
        rsi: indicators.rsi,
        rsi_prev: indicators.rsi_prev,
        rsi_change_3d: indicators.rsi_change_3d,
        smi: indicators.smi,
        smi_signal: indicators.smi_signal,
        smi_prev: indicators.smi_prev,
        smi_change_3d: indicators.smi_change_3d,
        smi_bull_cross: indicators.smi_bull_cross,
        smi_bear_cross: indicators.smi_bear_cross,
        ema9: indicators.ema9,
        ema21: indicators.ema21,
        sma200: indicators.sma200,
        sma200_dist_pct: indicators.sma200_dist,
        price_vs_ema9_pct: indicators.price_vs_ema9,
        price_vs_ema21_pct: indicators.price_vs_ema21,
        consecutive_down: indicators.consecutive_down,
        consecutive_up: indicators.consecutive_up,
        weekly_ema9: indicators.weekly_ema9,
        weekly_ema13: indicators.weekly_ema13,
        weekly_ema21: indicators.weekly_ema21,
        weekly_emas_stacked: indicators.weekly_emas_stacked,
        price_above_weekly_13: indicators.price_above_weekly_13,
        price_above_weekly_21: indicators.price_above_weekly_21,
        suggested_mode: modeSuggestion.suggestion,
        mode_confidence: modeSuggestion.confidence,
        mode_reasoning: modeSuggestion.reasoning,
      },
      { onConflict: "date" }
    );

    return NextResponse.json({
      success: true,
      date: indicators.date,
      suggested_mode: modeSuggestion,
      results: results.map((r) => ({
        id: r.setup_id,
        status: r.is_active ? "active" : r.is_watching ? "watching" : "inactive",
      })),
    });
  } catch (error) {
    console.error("Orb compute error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return runCompute();
}

export async function POST() {
  return runCompute();
}
