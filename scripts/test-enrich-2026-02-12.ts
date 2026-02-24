/**
 * Test Enrichment for 2026-02-12
 * 
 * This enriches the scorecard with sample data to test the enrichment flow
 */

import { enrichScorecard, type ScorecardEnrichmentData } from "../lib/trading";

async function main() {
  console.log("🔧 Testing scorecard enrichment for 2026-02-12...\n");

  // Sample enrichment data - using realistic TSLA values
  const enrichmentData: ScorecardEnrichmentData = {
    date: "2026-02-12",
    
    // Alert Levels (sample values)
    s1_level: 428.50,   // Support 1
    s2_level: 420.00,   // Support 2
    t1_level: 445.00,   // Trim target 1
    t2_level: 455.00,   // Trim target 2
    t3_level: 465.00,   // Trim target 3
    t4_level: 475.00,   // Trim target 4
    slow_zone: 425.00,  // D21 * 0.98
    kill_leverage: 410.00, // W21 * 0.99
    
    // SpotGamma Data (sample values)
    sg_call_wall: 460.00,
    sg_put_wall: 420.00,
    sg_key_gamma_strike: 440.00,
    sg_hedge_wall: 435.00,
    sg_gamma_regime: "positive", // Price above Key Gamma Strike
    sg_iv_rank: 42.5,
    
    // HIRO Snapshot (sample values)
    hiro_value: 135000000,   // $135M
    hiro_30d_low: 95000000,  // $95M
    hiro_30d_high: 165000000, // $165M
    hiro_capture_time: "15:45",
    hiro_stale: false,
    hiro_flow_quality: "longer_dated",
    hiro_flow_alert_fired: false,
    
    // Scenario Call
    primary_scenario: "Bull: Break $445 resistance to test $460 Call Wall",
    
    // Report Link (sample)
    report_link: "https://flacko.ai/reports/daily-2026-02-12",
  };

  const result = await enrichScorecard(enrichmentData);
  
  if (result.success) {
    console.log("✅ Successfully enriched scorecard for 2026-02-12");
    console.log("\nEnriched data:");
    console.log("  - S1: $", enrichmentData.s1_level);
    console.log("  - S2: $", enrichmentData.s2_level);
    console.log("  - T1-T4: $", enrichmentData.t1_level, "-", enrichmentData.t4_level);
    console.log("  - Gamma Regime:", enrichmentData.sg_gamma_regime);
    console.log("  - Key Gamma Strike: $", enrichmentData.sg_key_gamma_strike);
    console.log("  - HIRO: $", (enrichmentData.hiro_value! / 1000000).toFixed(0), "M");
    console.log("  - Scenario:", enrichmentData.primary_scenario);
  } else {
    console.error("❌ Enrichment failed:", result.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
