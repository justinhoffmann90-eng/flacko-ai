/**
 * Manual Script: Enrich and Grade Scorecards
 * 
 * Usage:
 *   # Enrich a specific date
 *   npx tsx scripts/enrich-and-grade-scorecard.ts enrich 2026-02-12
 * 
 *   # Grade a specific date (after next trading day)
 *   npx tsx scripts/enrich-and-grade-scorecard.ts grade 2026-02-11
 * 
 *   # Grade all ungraded scorecards
 *   npx tsx scripts/enrich-and-grade-scorecard.ts grade-all
 * 
 *   # List unenriched scorecards
 *   npx tsx scripts/enrich-and-grade-scorecard.ts list-unenriched
 * 
 *   # List ungraded scorecards
 *   npx tsx scripts/enrich-and-grade-scorecard.ts list-ungraded
 */

import {
  enrichScorecard,
  gradeScorecard,
  batchGradeScorecards,
  getUnenrichedScorecards,
  getUngradedScorecards,
  type ScorecardEnrichmentData,
} from "../lib/trading";

const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  if (!command) {
    console.error("❌ No command specified");
    console.log("\nUsage:");
    console.log("  enrich <date>          - Enrich scorecard for a specific date");
    console.log("  grade <date>           - Grade scorecard for a specific date");
    console.log("  grade-all              - Grade all ungraded scorecards");
    console.log("  list-unenriched        - List scorecards missing enrichment data");
    console.log("  list-ungraded          - List scorecards that need grading");
    process.exit(1);
  }

  if (command === "enrich") {
    if (!arg) {
      console.error("❌ Please specify a date (YYYY-MM-DD)");
      process.exit(1);
    }

    console.log(`🔧 Enriching scorecard for ${arg}...`);
    console.log("\n⚠️  This is a manual entry example. You'll need to provide actual data.\n");

    // Example enrichment data - replace with actual values
    const enrichmentData: ScorecardEnrichmentData = {
      date: arg,
      
      // Alert Levels - REPLACE THESE WITH ACTUAL VALUES
      s1_level: 420.50,
      s2_level: 410.00,
      t1_level: 435.00,
      t2_level: 445.00,
      t3_level: 455.00,
      t4_level: 465.00,
      slow_zone: 415.00,
      kill_leverage: 400.00,
      
      // SpotGamma Data - REPLACE THESE WITH ACTUAL VALUES
      sg_call_wall: 450.00,
      sg_put_wall: 410.00,
      sg_key_gamma_strike: 430.00,
      sg_hedge_wall: 440.00,
      sg_gamma_regime: "positive", // or "negative"
      sg_iv_rank: 45.5,
      
      // HIRO Snapshot - REPLACE THESE WITH ACTUAL VALUES
      hiro_value: 125000000,
      hiro_30d_low: 95000000,
      hiro_30d_high: 150000000,
      hiro_capture_time: "15:45",
      hiro_stale: false,
      hiro_flow_quality: "longer_dated",
      hiro_flow_alert_fired: false,
      
      // Scenario Call - REPLACE WITH ACTUAL VALUE
      primary_scenario: "Bull: Break $445 to test $460",
      
      // Report Link - REPLACE WITH ACTUAL VALUE
      report_link: "https://flacko.ai/reports/daily-2026-02-12",
    };

    const result = await enrichScorecard(enrichmentData);
    
    if (result.success) {
      console.log(`✅ Successfully enriched scorecard for ${arg}`);
    } else {
      console.error(`❌ Enrichment failed: ${result.error}`);
      process.exit(1);
    }
  } else if (command === "grade") {
    if (!arg) {
      console.error("❌ Please specify a date (YYYY-MM-DD)");
      process.exit(1);
    }

    console.log(`📊 Grading scorecard for ${arg}...`);
    
    const result = await gradeScorecard(arg);
    
    if (result.success) {
      console.log(`✅ Successfully graded scorecard for ${arg}`);
    } else {
      console.error(`❌ Grading failed: ${result.error}`);
      process.exit(1);
    }
  } else if (command === "grade-all") {
    console.log("📊 Finding ungraded scorecards...");
    
    const ungradedDates = await getUngradedScorecards(50);
    
    if (ungradedDates.length === 0) {
      console.log("✅ No scorecards need grading!");
      return;
    }

    console.log(`Found ${ungradedDates.length} scorecards to grade:`);
    ungradedDates.forEach((date) => console.log(`  - ${date}`));
    console.log("\nGrading...\n");

    const result = await batchGradeScorecards(ungradedDates);
    
    console.log(`\n✅ Graded ${result.successCount}/${ungradedDates.length} scorecards`);
    
    if (result.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
  } else if (command === "list-unenriched") {
    console.log("🔍 Finding scorecards missing enrichment data...\n");
    
    const unenriched = await getUnenrichedScorecards(20);
    
    if (unenriched.length === 0) {
      console.log("✅ All scorecards are enriched!");
      return;
    }

    console.log(`Found ${unenriched.length} scorecards missing data:\n`);
    unenriched.forEach((row) => {
      const missing: string[] = [];
      if (!row.s1_level) missing.push("levels");
      if (!row.sg_key_gamma_strike) missing.push("SpotGamma");
      if (!row.hiro_value) missing.push("HIRO");
      
      console.log(`  ${row.date}: Missing ${missing.join(", ")}`);
    });
  } else if (command === "list-ungraded") {
    console.log("🔍 Finding scorecards that need grading...\n");
    
    const ungraded = await getUngradedScorecards(20);
    
    if (ungraded.length === 0) {
      console.log("✅ All scorecards are graded!");
      return;
    }

    console.log(`Found ${ungraded.length} scorecards to grade:\n`);
    ungraded.forEach((date) => console.log(`  - ${date}`));
    console.log("\n💡 Run 'grade-all' to grade them automatically");
  } else {
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
