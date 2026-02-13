/**
 * Test Grading Function
 * 
 * Tests the grading logic with a simulated past scorecard
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testGrading() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("🧪 Testing grading function with simulated data...\n");

  // Create a test scorecard for 2026-02-10 (fake historical date)
  const testDate = "2026-02-10";
  
  console.log("1. Creating test scorecard for", testDate);
  
  const testScorecard = {
    date: testDate,
    recorded_at: new Date(testDate + "T16:30:00Z").toISOString(),
    orb_score: 65.5,
    orb_zone: "NEUTRAL",
    mode: "YELLOW_IMP",
    mode_confidence: "medium",
    active_buy_setups: [],
    active_avoid_signals: [],
    override_active: false,
    close_price: 415.00,
    
    // Pre-enriched levels
    s1_level: 410.00,
    s2_level: 400.00,
    t1_level: 425.00,
    t2_level: 435.00,
    t3_level: 445.00,
    t4_level: 455.00,
    slow_zone: 408.00,
    kill_leverage: 395.00,
    
    // SpotGamma data
    sg_call_wall: 440.00,
    sg_put_wall: 400.00,
    sg_key_gamma_strike: 420.00,
    sg_hedge_wall: 415.00,
    sg_gamma_regime: "positive",
    sg_iv_rank: 38.5,
    
    // HIRO data
    hiro_value: 120000000,
    hiro_30d_low: 85000000,
    hiro_30d_high: 155000000,
    hiro_capture_time: "15:45",
    hiro_stale: false,
    hiro_flow_quality: "mixed",
    hiro_flow_alert_fired: false,
    
    // Scenario
    primary_scenario: "Base: Range $410-$430, consolidation week",
  };

  // Insert or update
  const { error: upsertError } = await supabase
    .from("orb_daily_scorecard")
    .upsert(testScorecard, { onConflict: "date" });

  if (upsertError) {
    console.error("❌ Failed to create test scorecard:", upsertError);
    return;
  }

  console.log("✅ Test scorecard created\n");

  // Now manually add "next day" data to simulate what would happen
  console.log("2. Simulating next-day data (2026-02-11)");
  console.log("   Simulated scenario: Stock went up modestly to $422\n");

  const { error: updateError } = await supabase
    .from("orb_daily_scorecard")
    .update({
      open_next: 416.50,
      high_next: 423.75,
      low_next: 414.25,
      close_next: 422.00,
    })
    .eq("date", testDate);

  if (updateError) {
    console.error("❌ Failed to add next-day data:", updateError);
    return;
  }

  console.log("✅ Next-day data added\n");

  // Now grade it
  console.log("3. Running grading function...\n");

  const { gradeScorecard } = require("../lib/trading/scorecard-grading");
  
  const result = await gradeScorecard(testDate);

  if (result.success) {
    console.log("✅ Grading completed successfully!\n");
    
    // Fetch and display the graded scorecard
    const { data: graded } = await supabase
      .from("orb_daily_scorecard")
      .select("*")
      .eq("date", testDate)
      .single();

    if (graded) {
      console.log("📊 GRADING RESULTS:");
      console.log("  Total Grade:", graded.total_grade, "/ 100");
      console.log("");
      console.log("  Component Scores:");
      console.log("    - Mode:", graded.mode_grade, "/ 25");
      console.log("    - Buy Levels:", graded.buy_levels_grade, "/ 20");
      console.log("    - Trim Levels:", graded.trim_levels_grade, "/ 20");
      console.log("    - Risk Mgmt:", graded.risk_grade, "/ 15");
      console.log("    - Scenario:", graded.scenario_grade, "/ 10");
      console.log("    - Outcome:", graded.outcome_grade, "/ 10");
      console.log("");
      console.log("  Scenario Called:", graded.primary_scenario);
      console.log("  Scenario Played Out:", graded.scenario_played_out);
      console.log("");
      console.log("  Grade Notes:");
      console.log("  " + (graded.grade_notes || "").split("\n").join("\n  "));
      console.log("");
      
      // Clean up
      console.log("4. Cleaning up test data...");
      await supabase.from("orb_daily_scorecard").delete().eq("date", testDate);
      console.log("✅ Test data removed\n");
    }
  } else {
    console.error("❌ Grading failed:", result.error);
  }
}

testGrading().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
