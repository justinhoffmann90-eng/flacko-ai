import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { computeIndicators } from "@/lib/orb/compute-indicators";
import { evaluateAllSetups, PreviousState, suggestMode } from "@/lib/orb/evaluate-setups";
import { sendAlert } from "@/lib/orb/alerts";
import { computeOrbScore, assignZone, transitionMessage } from "@/lib/orb/score";
import { sendDownsideZoneAlert } from "@/lib/orb/zone-alerts";

export const maxDuration = 30;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface VolumeMetrics {
  volume: number;
  volume_20d_avg: number;
  relative_volume_pct: number;
  volume_price_alignment: "confirmed" | "divergent" | "neutral";
  volume_signal: "climactic" | "above_avg" | "normal" | "below_avg" | "dry";
}

function computeVolumeMetrics(
  todayVolume: number,
  volumes: number[],
  todayClose: number,
  todayOpen: number,
  prevDayVolume: number
): VolumeMetrics {
  const prior20 = volumes.slice(-21, -1).filter((v) => Number.isFinite(v) && v > 0);
  const avgVolume = prior20.length > 0 ? prior20.reduce((sum, v) => sum + v, 0) / prior20.length : 0;
  const relativeVolumePct = avgVolume > 0 ? (todayVolume / avgVolume) * 100 : 0;

  const priceChange = todayClose - todayOpen;
  const volumeChange = todayVolume - prevDayVolume;

  let alignment: "confirmed" | "divergent" | "neutral";
  if (!todayOpen || Math.abs(priceChange / todayOpen) < 0.002) {
    alignment = "neutral";
  } else if ((priceChange > 0 && volumeChange > 0) || (priceChange < 0 && volumeChange > 0)) {
    alignment = "confirmed";
  } else if ((priceChange > 0 && volumeChange < 0) || (priceChange < 0 && volumeChange < 0)) {
    alignment = "divergent";
  } else {
    alignment = "neutral";
  }

  let signal: "climactic" | "above_avg" | "normal" | "below_avg" | "dry";
  if (relativeVolumePct >= 200) signal = "climactic";
  else if (relativeVolumePct >= 130) signal = "above_avg";
  else if (relativeVolumePct >= 70) signal = "normal";
  else if (relativeVolumePct >= 40) signal = "below_avg";
  else signal = "dry";

  return {
    volume: todayVolume,
    volume_20d_avg: Math.round(avgVolume),
    relative_volume_pct: Math.round(relativeVolumePct * 10) / 10,
    volume_price_alignment: alignment,
    volume_signal: signal,
  };
}

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

    const volumeMetrics = computeVolumeMetrics(
      indicators.volume,
      indicators.volumes,
      indicators.close,
      indicators.open,
      indicators.volumes[Math.max(0, indicators.volumes.length - 2)] ?? indicators.volume
    );

    const supabase = await createServiceClient();

    const { data: prevStates } = await supabase.from("orb_setup_states").select("*");
    const { data: definitions } = await supabase
      .from("orb_setup_definitions")
      .select("id, public_name, stance, grade, framework");

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
            // Fixed-horizon setups: keep trade open for minimum 20 days
            // even after conditions are no longer met. This lets us track
            // actual performance over the backtest horizons (5/10/20/60d).
            const setupDef = definitions?.find((d: any) => d.id === result.setup_id);
            const isFixedHorizon = setupDef?.framework === "fixed-horizon";
            const MIN_TRACKING_DAYS = 20;

            if (isFixedHorizon && openTrade.days_active < MIN_TRACKING_DAYS) {
              // Don't close -- just update current return and mark conditions lost
              const currentReturn = ((indicators.close / openTrade.entry_price) - 1) * 100;
              await supabase
                .from("orb_tracker")
                .update({
                  current_return_pct: currentReturn,
                  max_return_pct: Math.max(openTrade.max_return_pct || 0, currentReturn),
                  max_drawdown_pct: Math.min(openTrade.max_drawdown_pct || 0, currentReturn),
                  days_active: openTrade.days_active + 1,
                  exit_reason: "tracking_horizon",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", openTrade.id);
            } else {
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

    // Update tracking-horizon trades that are still open but setup is no longer active
    // These trades need daily return updates until they hit MIN_TRACKING_DAYS
    const { data: trackingTrades } = await supabase
      .from("orb_tracker")
      .select("*")
      .eq("status", "open")
      .eq("exit_reason", "tracking_horizon");

    for (const trade of trackingTrades || []) {
      const setupDef = definitions?.find((d: any) => d.id === trade.setup_id);
      const MIN_TRACKING_DAYS = 20;
      const newDaysActive = (trade.days_active || 0) + 1;
      const currentReturn = ((indicators.close / trade.entry_price) - 1) * 100;

      if (newDaysActive >= MIN_TRACKING_DAYS) {
        // Horizon reached — close the trade with final stats
        await supabase
          .from("orb_tracker")
          .update({
            exit_date: indicators.date,
            exit_price: indicators.close,
            exit_reason: "horizon_reached",
            exit_indicators: indicators,
            final_return_pct: currentReturn,
            is_win: currentReturn > 0,
            status: "closed",
            days_active: newDaysActive,
            current_return_pct: currentReturn,
            max_return_pct: Math.max(trade.max_return_pct || 0, currentReturn),
            max_drawdown_pct: Math.min(trade.max_drawdown_pct || 0, currentReturn),
            updated_at: new Date().toISOString(),
          })
          .eq("id", trade.id);
      } else {
        // Still tracking — update daily returns
        await supabase
          .from("orb_tracker")
          .update({
            current_return_pct: currentReturn,
            max_return_pct: Math.max(trade.max_return_pct || 0, currentReturn),
            max_drawdown_pct: Math.min(trade.max_drawdown_pct || 0, currentReturn),
            days_active: newDaysActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", trade.id);
      }
    }

    // Store daily atoms: one row per setup per day (append-only, never overwritten)
    const snapshotRows = results.map((result) => {
      const prev = prevMap.get(result.setup_id);
      const newStatus = result.is_active ? "active" : result.is_watching ? "watching" : "inactive";
      return {
        date: indicators.date,
        setup_id: result.setup_id,
        status: newStatus,
        entry_price: newStatus === "active" ? (prev?.entry_price ?? indicators.close) : null,
        active_day: newStatus === "active" ? ((prevStates || []).find((s: any) => s.setup_id === result.setup_id)?.active_day || 0) + (prev?.status === "active" ? 1 : 1) : null,
        conditions_met: result.conditions_met ?? null,
        reason: result.reason || null,
        gauge_current_value: result.gauge_current_value ?? null,
        gauge_progress_pct: result.gauge_current_value !== undefined
          ? (() => {
              const entry = (result.gauge_entry_value ?? prev?.gauge_entry_value ?? 0) as number;
              const target = (result.gauge_target_value ?? 30) as number;
              return target === entry ? 100 : ((result.gauge_current_value! - entry) / (target - entry)) * 100;
            })()
          : null,
      };
    });
    await supabase.from("orb_daily_snapshots").upsert(snapshotRows, { onConflict: "date,setup_id" });

    // Compute Orb Score
    const setupStates = snapshotRows.map(r => ({ setup_id: r.setup_id, status: r.status }));
    const orbScore = computeOrbScore(setupStates);
    const orbZone = assignZone(orbScore);

    // Get previous zone for transition detection
    const { data: prevIndicator } = await supabase
      .from("orb_daily_indicators")
      .select("orb_zone")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const prevZone = prevIndicator?.orb_zone || null;

    // Send transition alert if zone changed
    if (prevZone && prevZone !== orbZone) {
      const msg = transitionMessage(prevZone as any, orbZone);
      // Log transition
      await supabase.from("orb_signal_log").insert({
        setup_id: "orb-score",
        event_type: "zone_transition",
        event_date: indicators.date,
        event_price: indicators.close,
        previous_status: prevZone,
        new_status: orbZone,
        notes: msg,
      });

      // Send downside zone alert email to subscribers
      const alertResult = await sendDownsideZoneAlert(supabase, prevZone, orbZone, indicators.date);
      if (alertResult.sent) {
        console.log(`[ORB_ZONE_ALERT] ${alertResult.reason}`);
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
        orb_score: orbScore,
        orb_zone: orbZone,
        orb_zone_prev: prevZone,
        volume: volumeMetrics.volume,
        volume_20d_avg: volumeMetrics.volume_20d_avg,
        relative_volume_pct: volumeMetrics.relative_volume_pct,
        volume_price_alignment: volumeMetrics.volume_price_alignment,
        volume_signal: volumeMetrics.volume_signal,
      },
      { onConflict: "date" }
    );

    const writeScorecard = async () => {
      try {
        const normalizeZone = (zone: string) => {
          const normalized = zone.toUpperCase().replace(/\s+/g, "_");
          const allowed = ["FULL_SEND", "NEUTRAL", "CAUTION", "DEFENSIVE"];
          return allowed.includes(normalized) ? normalized : "NEUTRAL";
        };

        const activeBuySetups = results
          .filter((r) => r.is_active && definitions?.find((d: any) => d.id === r.setup_id)?.stance === "buy")
          .map((r) => ({
            setup_id: r.setup_id,
            public_name: definitions?.find((d: any) => d.id === r.setup_id)?.public_name || r.setup_id,
            grade: definitions?.find((d: any) => d.id === r.setup_id)?.grade || "B",
            day_active: snapshotRows.find((s) => s.setup_id === r.setup_id)?.active_day || 1,
          }));

        const activeAvoidSignals = results
          .filter((r) => r.is_active && definitions?.find((d: any) => d.id === r.setup_id)?.stance === "avoid")
          .map((r) => ({
            setup_id: r.setup_id,
            public_name: definitions?.find((d: any) => d.id === r.setup_id)?.public_name || r.setup_id,
            grade: definitions?.find((d: any) => d.id === r.setup_id)?.grade || "B",
            day_active: snapshotRows.find((s) => s.setup_id === r.setup_id)?.active_day || 1,
          }));

        await supabase.from("orb_daily_scorecard").upsert(
          {
            date: indicators.date,
            recorded_at: new Date().toISOString(),
            orb_score: orbScore,
            orb_zone: normalizeZone(orbZone),
            mode: (modeSuggestion.suggestion || "").toUpperCase(),
            mode_confidence: modeSuggestion.confidence,
            active_buy_setups: activeBuySetups,
            active_avoid_signals: activeAvoidSignals,
            close_price: indicators.close,
            volume: volumeMetrics.volume,
            relative_volume_pct: volumeMetrics.relative_volume_pct,
            volume_price_alignment: volumeMetrics.volume_price_alignment,
          },
          { onConflict: "date" }
        );
      } catch (scorecardError) {
        console.error("[ORB][SCORECARD_WRITE_FAILED]", scorecardError);
      }
    };

    await writeScorecard();

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
