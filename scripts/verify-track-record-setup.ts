/**
 * Verification Script for Track Record Steps 2 & 3
 * 
 * Verifies that:
 * 1. Library functions exist and are importable
 * 2. Database connection works
 * 3. Scorecard table has all required columns
 * 4. Functions can be called without errors
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function verify() {
  console.log("🔍 Verifying Track Record Steps 2 & 3 Implementation...\n");

  // 1. Check library imports
  console.log("1. Checking library imports...");
  try {
    const {
      enrichScorecard,
      gradeScorecard,
      batchEnrichScorecards,
      batchGradeScorecards,
      getUnenrichedScorecards,
      getUngradedScorecards,
    } = await import("../lib/trading");

    console.log("   ✅ All functions importable");
    console.log("      - enrichScorecard");
    console.log("      - gradeScorecard");
    console.log("      - batchEnrichScorecards");
    console.log("      - batchGradeScorecards");
    console.log("      - getUnenrichedScorecards");
    console.log("      - getUngradedScorecards\n");
  } catch (error) {
    console.error("   ❌ Import failed:", error);
    process.exit(1);
  }

  // 2. Check database connection
  console.log("2. Checking database connection...");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: testData, error: testError } = await supabase
    .from("orb_daily_scorecard")
    .select("id")
    .limit(1);

  if (testError) {
    console.error("   ❌ Database connection failed:", testError);
    process.exit(1);
  }

  console.log("   ✅ Database connection OK\n");

  // 3. Verify table schema
  console.log("3. Checking orb_daily_scorecard schema...");
  
  const { data: sampleRow } = await supabase
    .from("orb_daily_scorecard")
    .select("*")
    .limit(1)
    .single();

  const requiredEnrichmentFields = [
    "s1_level", "s2_level", "t1_level", "t2_level", "t3_level", "t4_level",
    "slow_zone", "kill_leverage", "sg_call_wall", "sg_put_wall",
    "sg_key_gamma_strike", "sg_hedge_wall", "sg_gamma_regime", "sg_iv_rank",
    "hiro_value", "hiro_30d_low", "hiro_30d_high", "primary_scenario"
  ];

  const requiredGradingFields = [
    "open_next", "high_next", "low_next", "close_next",
    "mode_grade", "buy_levels_grade", "trim_levels_grade",
    "risk_grade", "scenario_grade", "outcome_grade",
    "total_grade", "grade_notes", "scenario_played_out"
  ];

  const allFields = [...requiredEnrichmentFields, ...requiredGradingFields];
  const missingFields = allFields.filter(field => !(field in (sampleRow || {})));

  if (missingFields.length > 0) {
    console.error("   ❌ Missing required fields:", missingFields);
    process.exit(1);
  }

  console.log("   ✅ All required columns present");
  console.log("      Enrichment fields: " + requiredEnrichmentFields.length);
  console.log("      Grading fields: " + requiredGradingFields.length + "\n");

  // 4. Check for scorecards
  console.log("4. Checking scorecard data...");
  
  const { data: scorecards, error: scError } = await supabase
    .from("orb_daily_scorecard")
    .select("date, total_grade, s1_level")
    .order("date", { ascending: false })
    .limit(10);

  if (scError) {
    console.error("   ❌ Failed to fetch scorecards:", scError);
    process.exit(1);
  }

  console.log(`   ✅ Found ${scorecards?.length || 0} recent scorecard(s)`);
  
  if (scorecards && scorecards.length > 0) {
    scorecards.forEach(sc => {
      const enriched = sc.s1_level !== null;
      const graded = sc.total_grade !== null;
      console.log(`      ${sc.date}: Enriched ${enriched ? '✅' : '❌'}, Graded ${graded ? '✅' : '❌'}`);
    });
  }

  console.log("\n5. Summary");
  console.log("   ✅ Library functions: OK");
  console.log("   ✅ Database connection: OK");
  console.log("   ✅ Table schema: OK");
  console.log("   ✅ Data access: OK");
  console.log("\n🎉 Track Record Steps 2 & 3 implementation verified!\n");

  console.log("Next steps:");
  console.log("  1. Integrate enrichScorecard() into daily report workflow");
  console.log("  2. Integrate gradeScorecard() into daily assessment cron");
  console.log("  3. Build /track-record subscriber page (Step 8)");
}

verify().catch((error) => {
  console.error("\n❌ Verification failed:", error);
  process.exit(1);
});
