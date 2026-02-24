/**
 * Scorecard Enrichment (Step 2)
 * 
 * After daily report generation, update the orb_daily_scorecard row with:
 * - Alert levels (T1-T4 trim levels, S1-S2 buy levels)
 * - SpotGamma data (Key Gamma Strike, High Vol Point, Low Vol Point, IV rank)
 * - HIRO snapshot (final reading, 30-day range)
 * - Scenario call (bull/base/bear targets)
 * - Mode and tier signals
 * 
 * This is called AFTER the daily report is generated and all data is available.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface ScorecardEnrichmentData {
  date: string;
  
  // Alert Levels
  s1_level?: number;
  s2_level?: number;
  t1_level?: number;
  t2_level?: number;
  t3_level?: number;
  t4_level?: number;
  slow_zone?: number;
  kill_leverage?: number;
  
  // SpotGamma Data
  sg_call_wall?: number;
  sg_put_wall?: number;
  sg_key_gamma_strike?: number;
  sg_hedge_wall?: number;
  sg_gamma_regime?: "positive" | "negative";
  sg_iv_rank?: number;
  
  // HIRO Snapshot
  hiro_value?: number;
  hiro_30d_low?: number;
  hiro_30d_high?: number;
  hiro_capture_time?: string; // HH:MM format
  hiro_stale?: boolean;
  hiro_flow_quality?: "short_dated" | "longer_dated" | "mixed" | "unknown";
  hiro_flow_alert_fired?: boolean;
  
  // Scenario Call
  primary_scenario?: string; // e.g., "Bull: Break $450", "Base: Range $420-440", "Bear: Test $400"
  
  // Report Link
  report_link?: string;
}

/**
 * Enrich a scorecard row with levels, SpotGamma data, HIRO snapshot, and scenario
 */
export async function enrichScorecard(
  enrichmentData: ScorecardEnrichmentData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Verify the row exists
    const { data: existing, error: fetchError } = await supabase
      .from("orb_daily_scorecard")
      .select("id, date")
      .eq("date", enrichmentData.date)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        error: `No scorecard row found for date ${enrichmentData.date}`,
      };
    }

    // Update the row with enrichment data
    const { error: updateError } = await supabase
      .from("orb_daily_scorecard")
      .update({
        // Alert Levels
        ...(enrichmentData.s1_level !== undefined && { s1_level: enrichmentData.s1_level }),
        ...(enrichmentData.s2_level !== undefined && { s2_level: enrichmentData.s2_level }),
        ...(enrichmentData.t1_level !== undefined && { t1_level: enrichmentData.t1_level }),
        ...(enrichmentData.t2_level !== undefined && { t2_level: enrichmentData.t2_level }),
        ...(enrichmentData.t3_level !== undefined && { t3_level: enrichmentData.t3_level }),
        ...(enrichmentData.t4_level !== undefined && { t4_level: enrichmentData.t4_level }),
        ...(enrichmentData.slow_zone !== undefined && { slow_zone: enrichmentData.slow_zone }),
        ...(enrichmentData.kill_leverage !== undefined && {
          kill_leverage: enrichmentData.kill_leverage,
        }),

        // SpotGamma Data
        ...(enrichmentData.sg_call_wall !== undefined && {
          sg_call_wall: enrichmentData.sg_call_wall,
        }),
        ...(enrichmentData.sg_put_wall !== undefined && {
          sg_put_wall: enrichmentData.sg_put_wall,
        }),
        ...(enrichmentData.sg_key_gamma_strike !== undefined && {
          sg_key_gamma_strike: enrichmentData.sg_key_gamma_strike,
        }),
        ...(enrichmentData.sg_hedge_wall !== undefined && {
          sg_hedge_wall: enrichmentData.sg_hedge_wall,
        }),
        ...(enrichmentData.sg_gamma_regime !== undefined && {
          sg_gamma_regime: enrichmentData.sg_gamma_regime,
        }),
        ...(enrichmentData.sg_iv_rank !== undefined && {
          sg_iv_rank: enrichmentData.sg_iv_rank,
        }),

        // HIRO Snapshot
        ...(enrichmentData.hiro_value !== undefined && {
          hiro_value: enrichmentData.hiro_value,
        }),
        ...(enrichmentData.hiro_30d_low !== undefined && {
          hiro_30d_low: enrichmentData.hiro_30d_low,
        }),
        ...(enrichmentData.hiro_30d_high !== undefined && {
          hiro_30d_high: enrichmentData.hiro_30d_high,
        }),
        ...(enrichmentData.hiro_capture_time !== undefined && {
          hiro_capture_time: enrichmentData.hiro_capture_time,
        }),
        ...(enrichmentData.hiro_stale !== undefined && {
          hiro_stale: enrichmentData.hiro_stale,
        }),
        ...(enrichmentData.hiro_flow_quality !== undefined && {
          hiro_flow_quality: enrichmentData.hiro_flow_quality,
        }),
        ...(enrichmentData.hiro_flow_alert_fired !== undefined && {
          hiro_flow_alert_fired: enrichmentData.hiro_flow_alert_fired,
        }),

        // Scenario
        ...(enrichmentData.primary_scenario !== undefined && {
          primary_scenario: enrichmentData.primary_scenario,
        }),

        // Report Link
        ...(enrichmentData.report_link !== undefined && {
          report_link: enrichmentData.report_link,
        }),

        // Update timestamp
        updated_at: new Date().toISOString(),
      })
      .eq("date", enrichmentData.date);

    if (updateError) {
      return {
        success: false,
        error: `Failed to update scorecard: ${updateError.message}`,
      };
    }

    console.log(`✅ Enriched scorecard for ${enrichmentData.date}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch enrich multiple scorecard rows (e.g., backfilling historical data)
 */
export async function batchEnrichScorecards(
  enrichments: ScorecardEnrichmentData[]
): Promise<{ successCount: number; errors: string[] }> {
  const results = await Promise.allSettled(
    enrichments.map((data) => enrichScorecard(data))
  );

  const successCount = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;

  const errors = results
    .filter((r) => r.status === "fulfilled" && !r.value.success)
    .map((r) => (r as PromiseFulfilledResult<{ success: boolean; error?: string }>).value.error!)
    .concat(
      results
        .filter((r) => r.status === "rejected")
        .map((r) => (r as PromiseRejectedResult).reason)
    );

  return { successCount, errors };
}

/**
 * Helper: Get unenriched scorecard rows (missing key fields)
 */
export async function getUnenrichedScorecards(limit = 10) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("orb_daily_scorecard")
    .select("date, s1_level, sg_key_gamma_strike, hiro_value")
    .or("s1_level.is.null,sg_key_gamma_strike.is.null,hiro_value.is.null")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching unenriched scorecards:", error);
    return [];
  }

  return data || [];
}
