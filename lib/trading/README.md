# Trading Library - Track Record System

Implementation of Steps 2 and 3 from the Live Track Record + Gamma Regime Integration spec.

## Overview

This library provides scorecard enrichment and automated grading for the Orb trading system.

**Step 2: Scorecard Enrichment** - After daily report generation, enrich the scorecard row with:
- Alert levels (T1-T4 trim levels, S1-S2 buy levels)
- SpotGamma data (Key Gamma Strike, High Vol Point, Low Vol Point, IV rank)
- HIRO snapshot (final reading, 30-day range)
- Scenario call (bull/base/bear targets)

**Step 3: Next-Day Grading** - Automated grading that:
- Pulls actual next-day OHLC prices from Yahoo Finance
- Compares against previous day's scorecard
- Uses 6-factor rubric (mode/25, buy_levels/20, trim_levels/20, risk_mgmt/15, scenario/10, outcome/10)
- Writes grades back to scorecard row

## Files

- **scorecard-enrichment.ts** - Enrichment functions for adding levels, SpotGamma, HIRO data
- **scorecard-grading.ts** - Grading functions for evaluating next-day performance
- **index.ts** - Public exports

## Usage

### Enrichment

```typescript
import { enrichScorecard } from "./lib/trading";

const result = await enrichScorecard({
  date: "2026-02-12",
  
  // Alert Levels
  s1_level: 428.50,
  s2_level: 420.00,
  t1_level: 445.00,
  t2_level: 455.00,
  t3_level: 465.00,
  t4_level: 475.00,
  slow_zone: 425.00,
  kill_leverage: 410.00,
  
  // SpotGamma Data
  sg_call_wall: 460.00,
  sg_put_wall: 420.00,
  sg_key_gamma_strike: 440.00,
  sg_hedge_wall: 435.00,
  sg_gamma_regime: "positive",
  sg_iv_rank: 42.5,
  
  // HIRO Snapshot
  hiro_value: 135000000,
  hiro_30d_low: 95000000,
  hiro_30d_high: 165000000,
  hiro_capture_time: "15:45",
  hiro_stale: false,
  hiro_flow_quality: "longer_dated",
  
  // Scenario
  primary_scenario: "Bull: Break $445 to test $460 Call Wall",
  
  // Report Link
  report_link: "https://flacko.ai/reports/daily-2026-02-12",
});

if (result.success) {
  console.log("✅ Scorecard enriched");
} else {
  console.error("❌ Error:", result.error);
}
```

### Grading

```typescript
import { gradeScorecard } from "./lib/trading";

// Grade a specific date (after next trading day closes)
const result = await gradeScorecard("2026-02-11");

if (result.success) {
  console.log("✅ Scorecard graded");
}
```

### Batch Operations

```typescript
import { 
  batchEnrichScorecards, 
  batchGradeScorecards,
  getUnenrichedScorecards,
  getUngradedScorecards 
} from "./lib/trading";

// Find scorecards needing enrichment
const unenriched = await getUnenrichedScorecards(10);

// Find scorecards needing grading
const ungraded = await getUngradedScorecards(10);

// Grade all ungraded scorecards
const { successCount, errors } = await batchGradeScorecards(ungraded);
console.log(`Graded ${successCount} scorecards`);
```

## CLI Tool

A command-line wrapper is provided for manual operations:

```bash
# List scorecards needing grading
node scripts/scorecard-cli.js list-ungraded

# List scorecards missing enrichment data
node scripts/scorecard-cli.js list-unenriched

# Grade a specific date
node scripts/scorecard-cli.js grade 2026-02-11

# Grade all ungraded scorecards
node scripts/scorecard-cli.js grade-all

# Enrich a specific date (manual - see scripts/test-enrich-2026-02-12.ts)
node scripts/scorecard-cli.js enrich 2026-02-12
```

## Grading Rubric

The grading system uses a 100-point scale:

### Mode Grade (/25)
Was the mode correct for what happened?
- **GREEN**: Should see upside. Grades well if next-day up.
- **YELLOW/YELLOW_IMP**: Neutral. Grades on avoiding big losses.
- **ORANGE/ORANGE_IMP**: Caution warranted. Grades well if flat or down.
- **RED**: Defense mode. Grades well if protected capital.

### Buy Levels Grade (/20)
Did S1/S2 hold as support?
- **S1 held** (low >= S1 * 0.995): +10 pts
- **S2 held** if reached: +10 pts

### Trim Levels Grade (/20)
Did T1-T4 work as resistance or were they hit?
- **T1 hit**: +5 pts
- **T2 hit**: +5 pts
- **T3 hit**: +5 pts
- **T4 hit**: +5 pts

### Risk Management Grade (/15)
Did Slow Zone / Kill Leverage protect if triggered?
- **No risk zones breached**: +15 pts
- **Slow Zone hit but Kill Leverage held**: +10 pts
- **Kill Leverage breached**: 0 pts

### Scenario Grade (/10)
Which scenario actually played out?
- **Bull**: Close up >2%, tested upside
- **Base**: Close within ±2%, rangebound
- **Bear**: Close down >2%, tested downside

If scenario prediction matches actual: +10 pts

### Outcome Grade (/10)
If you followed the system perfectly, what was the result?
- **FULL_SEND zone + up >3%**: 10 pts
- **NEUTRAL zone + flat**: 10 pts
- **CAUTION zone + down**: 10 pts (avoided loss)
- Mismatches: 0-5 pts

## Testing

Run the test suite:

```bash
# Test grading with simulated data
node scripts/scorecard-cli.js grade-test

# Test enrichment for today's scorecard
cd ~/Flacko_AI/flacko-ai && npx tsx scripts/test-enrich-2026-02-12.ts

# Full grading test
cd ~/Flacko_AI/flacko-ai && npx tsx scripts/test-grading.ts
```

## Integration Points

### Daily Report Generation (Step 2)
After the daily report is generated and levels are calculated, call `enrichScorecard()` to update the row:

```typescript
// In your daily report generation workflow
import { enrichScorecard } from "./lib/trading";

async function generateDailyReport() {
  // ... existing report generation ...
  
  // After report is done, enrich the scorecard
  await enrichScorecard({
    date: today,
    s1_level: calculatedLevels.s1,
    s2_level: calculatedLevels.s2,
    t1_level: calculatedLevels.t1,
    // ... etc
  });
}
```

### Daily Grading (Step 3)
After each trading day closes, run grading for the previous day:

```typescript
// In a cron job or daily assessment workflow
import { gradeScorecard } from "./lib/trading";

async function runDailyGrading() {
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  await gradeScorecard(yesterday);
}
```

Or use the batch function to catch up on any ungraded days:

```typescript
import { getUngradedScorecards, batchGradeScorecards } from "./lib/trading";

async function gradeAllPending() {
  const ungraded = await getUngradedScorecards(50);
  const result = await batchGradeScorecards(ungraded);
  console.log(`Graded ${result.successCount} scorecards`);
}
```

## Database Schema

The `orb_daily_scorecard` table includes:

**Enrichment Fields:**
- `s1_level`, `s2_level` - Buy support levels
- `t1_level`, `t2_level`, `t3_level`, `t4_level` - Trim targets
- `slow_zone`, `kill_leverage` - Risk management levels
- `sg_call_wall`, `sg_put_wall`, `sg_key_gamma_strike`, `sg_hedge_wall` - SpotGamma levels
- `sg_gamma_regime`, `sg_iv_rank` - Gamma regime data
- `hiro_value`, `hiro_30d_low`, `hiro_30d_high` - HIRO snapshot
- `primary_scenario` - Scenario call

**Grading Fields:**
- `open_next`, `high_next`, `low_next`, `close_next` - Next-day OHLC
- `mode_grade`, `buy_levels_grade`, `trim_levels_grade` - Component grades
- `risk_grade`, `scenario_grade`, `outcome_grade` - More component grades
- `total_grade` - Sum of all components (/100)
- `grade_notes` - Detailed breakdown
- `scenario_played_out` - Which scenario actually happened

## Next Steps

1. **Integrate with Daily Report Workflow** - Add `enrichScorecard()` call to the end of report generation
2. **Automate Daily Grading** - Set up a cron job to run `gradeScorecard()` after market close
3. **Build Dashboard** - Create `/track-record` page to display rolling accuracy (Step 8 from spec)
4. **Backfill Historical Data** - If you have historical reports, enrich past scorecards

## Notes

- Enrichment should happen same-day (before next session opens) to maintain timestamp credibility
- Grading requires next trading day's OHLC data from Yahoo Finance
- The grading rubric is calibrated for TSLA volatility (2-3% moves are "normal")
- Scenario detection uses ±2% thresholds (Bull >2%, Bear <-2%, Base within ±2%)
- Support/resistance tolerance is 0.5% (accounts for brief wicks)

## Spec Reference

This implementation follows:
- **Spec**: `~/clawd/specs/live-track-record-gamma-regime-v1.md`
- **Step 2**: Section 1.3 (Enrichment)
- **Step 3**: Section 1.3 (Grading)
- **Schema**: Section 1.2 (orb_daily_scorecard table)

---

**Status**: ✅ Steps 2 and 3 complete and tested
**Commit**: Pending
**Next**: Integrate with daily workflow and create track record dashboard (Step 8)
