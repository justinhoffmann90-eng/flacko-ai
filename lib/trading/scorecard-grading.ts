/**
 * Scorecard Grading (Step 3)
 * 
 * Next-day grading that:
 * 1. Pulls actual next-day OHLC prices (Yahoo Finance)
 * 2. Compares against previous day's scorecard (levels accuracy, mode call, scenario accuracy)
 * 3. Uses the 6-factor rubric from the scorecard schema:
 *    - mode_grade (/25)
 *    - buy_levels_grade (/20)
 *    - trim_levels_grade (/20)
 *    - risk_mgmt_grade (/15)
 *    - scenario_grade (/10)
 *    - outcome_grade (/10)
 * 4. Writes grade back to scorecard row
 */

import { createClient } from "@supabase/supabase-js";
import { parseISO, format, addDays, isWeekend } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface DailyOHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ScorecardRow {
  date: string;
  orb_zone: string;
  mode: string;
  s1_level: number | null;
  s2_level: number | null;
  t1_level: number | null;
  t2_level: number | null;
  t3_level: number | null;
  t4_level: number | null;
  slow_zone: number | null;
  kill_leverage: number | null;
  close_price: number;
  primary_scenario: string | null;
}

interface GradeResult {
  mode_grade: number;
  buy_levels_grade: number;
  trim_levels_grade: number;
  risk_grade: number;
  scenario_grade: number;
  outcome_grade: number;
  total_grade: number;
  grade_notes: string;
  scenario_played_out: string;
}

/**
 * Fetch next-day OHLC from Yahoo Finance
 */
async function fetchNextDayOHLC(date: string): Promise<DailyOHLC | null> {
  try {
    const targetDate = parseISO(date);
    let nextDay = addDays(targetDate, 1);

    // Skip weekends
    while (isWeekend(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }

    const nextDayStr = format(nextDay, "yyyy-MM-dd");
    const startTime = Math.floor(new Date(nextDayStr + "T00:00:00Z").getTime() / 1000);
    const endTime = Math.floor(new Date(nextDayStr + "T23:59:59Z").getTime() / 1000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${startTime}&period2=${endTime}&interval=1d`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      console.error("No data returned from Yahoo Finance");
      return null;
    }

    const quote = data.chart.result[0].indicators.quote[0];
    
    // Get the last available values (in case of intraday data)
    const open = quote.open.find((v: number | null) => v !== null);
    const close = [...quote.close].reverse().find((v: number | null) => v !== null);
    const high = Math.max(...quote.high.filter((v: number | null) => v !== null));
    const low = Math.min(...quote.low.filter((v: number | null) => v !== null));
    const volume = quote.volume.find((v: number | null) => v !== null);

    if (!open || !close || !high || !low) {
      console.error("Incomplete OHLC data");
      return null;
    }

    return { open, high, low, close, volume };
  } catch (error) {
    console.error("Error fetching next-day OHLC:", error);
    return null;
  }
}

/**
 * Grade mode accuracy (/25 points)
 * 
 * Was the mode correct for what happened?
 * - GREEN: Should see upside. Grades well if close_next > close
 * - YELLOW/YELLOW_IMP: Neutral. Grades on avoiding big losses
 * - ORANGE/ORANGE_IMP: Caution warranted. Grades well if flat or down
 * - RED: Defense mode. Grades well if protected capital (didn't drop >5%)
 */
function gradeModeAccuracy(
  mode: string,
  zone: string,
  closePrice: number,
  ohlc: DailyOHLC
): { grade: number; note: string } {
  const nextDayReturn = ((ohlc.close - closePrice) / closePrice) * 100;
  const intraRange = ((ohlc.high - ohlc.low) / closePrice) * 100;

  if (mode === "GREEN") {
    if (nextDayReturn > 3) return { grade: 25, note: "GREEN ✅: Strong upside as expected" };
    if (nextDayReturn > 0) return { grade: 20, note: "GREEN: Positive but modest gains" };
    if (nextDayReturn > -2) return { grade: 12, note: "GREEN ⚠️: Flat when upside was expected" };
    return { grade: 5, note: "GREEN ❌: Down when mode called upside" };
  }

  if (mode === "YELLOW_IMP" || mode === "YELLOW") {
    if (Math.abs(nextDayReturn) < 2) return { grade: 25, note: `${mode} ✅: Range-bound as expected` };
    if (nextDayReturn > 2) return { grade: 22, note: `${mode}: Unexpected upside (still good)` };
    if (nextDayReturn < -5) return { grade: 10, note: `${mode} ❌: Large drop not anticipated` };
    return { grade: 18, note: `${mode}: Moderate move, acceptable` };
  }

  if (mode === "ORANGE_IMP" || mode === "ORANGE") {
    if (nextDayReturn < -3) return { grade: 25, note: `${mode} ✅: Downside risk realized` };
    if (Math.abs(nextDayReturn) < 2) return { grade: 20, note: `${mode}: Stayed cautious correctly` };
    if (nextDayReturn > 3) return { grade: 8, note: `${mode} ❌: Missed upside being too cautious` };
    return { grade: 15, note: `${mode}: Mixed outcome` };
  }

  if (mode === "RED") {
    if (nextDayReturn < -5) return { grade: 25, note: "RED ✅: Full defense mode justified" };
    if (nextDayReturn < 0) return { grade: 20, note: "RED: Caution warranted" };
    if (nextDayReturn < 3) return { grade: 12, note: "RED ⚠️: Overly defensive, missed modest gains" };
    return { grade: 5, note: "RED ❌: Too defensive, missed strong rally" };
  }

  return { grade: 12, note: "Mode: Unable to assess" };
}

/**
 * Grade buy levels accuracy (/20 points)
 * 
 * Did S1/S2 hold as support?
 * - 10 pts: S1 held (low >= S1 * 0.995)
 * - 10 pts: S2 held if reached (low >= S2 * 0.995)
 */
function gradeBuyLevels(
  s1: number | null,
  s2: number | null,
  ohlc: DailyOHLC
): { grade: number; note: string } {
  let grade = 0;
  let notes: string[] = [];

  if (s1) {
    const s1Tolerance = s1 * 0.995; // 0.5% tolerance
    if (ohlc.low >= s1Tolerance) {
      grade += 10;
      notes.push("S1 held ✅");
    } else if (ohlc.low < s1) {
      notes.push(`S1 broken (low $${ohlc.low.toFixed(2)} < $${s1.toFixed(2)}) ❌`);
    } else {
      grade += 10;
      notes.push("S1 held (within tolerance)");
    }
  } else {
    notes.push("S1 not set");
  }

  if (s2 && ohlc.low <= s2 * 1.02) {
    // S2 was reached
    const s2Tolerance = s2 * 0.995;
    if (ohlc.low >= s2Tolerance) {
      grade += 10;
      notes.push("S2 held ✅");
    } else {
      notes.push(`S2 broken (low $${ohlc.low.toFixed(2)} < $${s2.toFixed(2)}) ❌`);
    }
  } else if (s2) {
    grade += 10; // S2 wasn't tested = levels worked
    notes.push("S2 not tested");
  } else {
    notes.push("S2 not set");
  }

  return { grade, note: notes.join("; ") };
}

/**
 * Grade trim levels accuracy (/20 points)
 * 
 * Did T1-T4 work as resistance or were they hit?
 * - If high reached T1: +5 pts
 * - If high reached T2: +5 pts
 * - If high reached T3: +5 pts
 * - If high reached T4: +5 pts
 */
function gradeTrimLevels(
  t1: number | null,
  t2: number | null,
  t3: number | null,
  t4: number | null,
  ohlc: DailyOHLC
): { grade: number; note: string } {
  let grade = 0;
  let notes: string[] = [];

  if (t1) {
    if (ohlc.high >= t1 * 0.995) {
      grade += 5;
      notes.push("T1 hit ✅");
    } else {
      notes.push(`T1 not reached (high $${ohlc.high.toFixed(2)} < $${t1.toFixed(2)})`);
    }
  } else {
    notes.push("T1 not set");
  }

  if (t2) {
    if (ohlc.high >= t2 * 0.995) {
      grade += 5;
      notes.push("T2 hit ✅");
    } else {
      notes.push(`T2 not reached`);
    }
  } else {
    notes.push("T2 not set");
  }

  if (t3) {
    if (ohlc.high >= t3 * 0.995) {
      grade += 5;
      notes.push("T3 hit ✅");
    }
  }

  if (t4) {
    if (ohlc.high >= t4 * 0.995) {
      grade += 5;
      notes.push("T4 hit ✅");
    }
  }

  // If no T-levels were set, give partial credit
  if (!t1 && !t2 && !t3 && !t4) {
    grade = 10;
    notes.push("No trim levels set (neutral)");
  }

  return { grade, note: notes.join("; ") };
}

/**
 * Grade risk management (/15 points)
 * 
 * Did Slow Zone / Kill Leverage protect if triggered?
 * - If low > Kill Leverage: +15 pts (didn't need protection)
 * - If low < Kill Leverage: 0 pts (protection should have triggered)
 * - If low < Slow Zone but > Kill Leverage: +10 pts (warning worked)
 */
function gradeRiskManagement(
  slowZone: number | null,
  killLeverage: number | null,
  ohlc: DailyOHLC
): { grade: number; note: string } {
  if (!killLeverage) {
    return { grade: 10, note: "Kill Leverage not set (neutral)" };
  }

  if (ohlc.low >= slowZone!) {
    return { grade: 15, note: "No risk zones breached ✅" };
  }

  if (ohlc.low >= killLeverage) {
    return { grade: 10, note: "Slow Zone hit but Kill Leverage held ⚠️" };
  }

  return { grade: 0, note: `Kill Leverage breached (low $${ohlc.low.toFixed(2)} < $${killLeverage.toFixed(2)}) ❌` };
}

/**
 * Grade scenario accuracy (/10 points)
 * 
 * Which scenario actually played out?
 * - Bull: Close up >2%, tested upside
 * - Base: Close within ±2%, rangebound
 * - Bear: Close down >2%, tested downside
 */
function gradeScenario(
  primaryScenario: string | null,
  closePrice: number,
  ohlc: DailyOHLC
): { grade: number; note: string; scenarioPlayedOut: string } {
  const returnPct = ((ohlc.close - closePrice) / closePrice) * 100;

  let actualScenario = "Base";
  if (returnPct > 2) {
    actualScenario = "Bull";
  } else if (returnPct < -2) {
    actualScenario = "Bear";
  }

  if (!primaryScenario) {
    return {
      grade: 5,
      note: `No scenario called. Actual: ${actualScenario} (${returnPct.toFixed(1)}%)`,
      scenarioPlayedOut: actualScenario,
    };
  }

  const calledScenario = primaryScenario.toLowerCase().includes("bull")
    ? "Bull"
    : primaryScenario.toLowerCase().includes("bear")
    ? "Bear"
    : "Base";

  if (calledScenario === actualScenario) {
    return {
      grade: 10,
      note: `Scenario correct ✅: Called ${calledScenario}, got ${actualScenario} (${returnPct.toFixed(1)}%)`,
      scenarioPlayedOut: actualScenario,
    };
  }

  return {
    grade: 3,
    note: `Scenario miss: Called ${calledScenario}, got ${actualScenario} (${returnPct.toFixed(1)}%)`,
    scenarioPlayedOut: actualScenario,
  };
}

/**
 * Grade outcome (/10 points)
 * 
 * If you followed the system perfectly, what was the result?
 * - FULL_SEND zone + up >3%: 10 pts
 * - NEUTRAL zone + flat: 10 pts
 * - CAUTION zone + down: 10 pts (avoided loss)
 * - Mismatch: 0-5 pts
 */
function gradeOutcome(
  zone: string,
  closePrice: number,
  ohlc: DailyOHLC
): { grade: number; note: string } {
  const returnPct = ((ohlc.close - closePrice) / closePrice) * 100;

  if (zone === "FULL_SEND") {
    if (returnPct > 3) return { grade: 10, note: `FULL_SEND ✅: Up ${returnPct.toFixed(1)}%` };
    if (returnPct > 0) return { grade: 7, note: `FULL_SEND: Modest gain ${returnPct.toFixed(1)}%` };
    if (returnPct > -2) return { grade: 4, note: `FULL_SEND ⚠️: Flat ${returnPct.toFixed(1)}%` };
    return { grade: 0, note: `FULL_SEND ❌: Down ${returnPct.toFixed(1)}%` };
  }

  if (zone === "NEUTRAL") {
    if (Math.abs(returnPct) < 2) return { grade: 10, note: `NEUTRAL ✅: Range-bound ${returnPct.toFixed(1)}%` };
    if (returnPct > 2) return { grade: 7, note: `NEUTRAL: Upside surprise ${returnPct.toFixed(1)}%` };
    return { grade: 5, note: `NEUTRAL: Larger move than expected ${returnPct.toFixed(1)}%` };
  }

  if (zone === "CAUTION") {
    if (returnPct < -2) return { grade: 10, note: `CAUTION ✅: Avoided drop ${returnPct.toFixed(1)}%` };
    if (Math.abs(returnPct) < 2) return { grade: 8, note: `CAUTION: Stayed safe ${returnPct.toFixed(1)}%` };
    return { grade: 3, note: `CAUTION ⚠️: Missed upside ${returnPct.toFixed(1)}%` };
  }

  if (zone === "DEFENSIVE") {
    if (returnPct < -3) return { grade: 10, note: `DEFENSIVE ✅: Protected capital ${returnPct.toFixed(1)}%` };
    if (returnPct < 0) return { grade: 8, note: `DEFENSIVE: Small loss avoided ${returnPct.toFixed(1)}%` };
    return { grade: 2, note: `DEFENSIVE ❌: Missed rally ${returnPct.toFixed(1)}%` };
  }

  return { grade: 5, note: `Outcome unclear: ${returnPct.toFixed(1)}%` };
}

/**
 * Grade a scorecard for a given date
 */
export async function gradeScorecard(date: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Fetch the scorecard row
    const { data: scorecard, error: fetchError } = await supabase
      .from("orb_daily_scorecard")
      .select("*")
      .eq("date", date)
      .single();

    if (fetchError || !scorecard) {
      return { success: false, error: `No scorecard found for ${date}` };
    }

    // 2. Check if already graded
    if (scorecard.total_grade !== null) {
      console.log(`⚠️ Scorecard for ${date} already graded (${scorecard.total_grade}/100). Skipping.`);
      return { success: true };
    }

    // 3. Fetch next-day OHLC
    const ohlc = await fetchNextDayOHLC(date);
    if (!ohlc) {
      return { success: false, error: `Could not fetch next-day OHLC for ${date}` };
    }

    // 4. Grade each component
    const modeResult = gradeModeAccuracy(scorecard.mode, scorecard.orb_zone, scorecard.close_price, ohlc);
    const buyLevelsResult = gradeBuyLevels(scorecard.s1_level, scorecard.s2_level, ohlc);
    const trimLevelsResult = gradeTrimLevels(
      scorecard.t1_level,
      scorecard.t2_level,
      scorecard.t3_level,
      scorecard.t4_level,
      ohlc
    );
    const riskResult = gradeRiskManagement(scorecard.slow_zone, scorecard.kill_leverage, ohlc);
    const scenarioResult = gradeScenario(scorecard.primary_scenario, scorecard.close_price, ohlc);
    const outcomeResult = gradeOutcome(scorecard.orb_zone, scorecard.close_price, ohlc);

    const totalGrade =
      modeResult.grade +
      buyLevelsResult.grade +
      trimLevelsResult.grade +
      riskResult.grade +
      scenarioResult.grade +
      outcomeResult.grade;

    const gradeNotes = [
      `Mode (${modeResult.grade}/25): ${modeResult.note}`,
      `Buy Levels (${buyLevelsResult.grade}/20): ${buyLevelsResult.note}`,
      `Trim Levels (${trimLevelsResult.grade}/20): ${trimLevelsResult.note}`,
      `Risk Mgmt (${riskResult.grade}/15): ${riskResult.note}`,
      `Scenario (${scenarioResult.grade}/10): ${scenarioResult.note}`,
      `Outcome (${outcomeResult.grade}/10): ${outcomeResult.note}`,
    ].join("\n");

    // 5. Update the scorecard
    const { error: updateError } = await supabase
      .from("orb_daily_scorecard")
      .update({
        open_next: ohlc.open,
        high_next: ohlc.high,
        low_next: ohlc.low,
        close_next: ohlc.close,
        mode_grade: modeResult.grade,
        buy_levels_grade: buyLevelsResult.grade,
        trim_levels_grade: trimLevelsResult.grade,
        risk_grade: riskResult.grade,
        scenario_grade: scenarioResult.grade,
        outcome_grade: outcomeResult.grade,
        total_grade: totalGrade,
        grade_notes: gradeNotes,
        scenario_played_out: scenarioResult.scenarioPlayedOut,
        updated_at: new Date().toISOString(),
      })
      .eq("date", date);

    if (updateError) {
      return { success: false, error: `Failed to update grades: ${updateError.message}` };
    }

    console.log(`✅ Graded ${date}: ${totalGrade}/100`);
    console.log(gradeNotes);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Batch grade multiple scorecards
 */
export async function batchGradeScorecards(
  dates: string[]
): Promise<{ successCount: number; errors: string[] }> {
  const results = await Promise.allSettled(dates.map((date) => gradeScorecard(date)));

  const successCount = results.filter((r) => r.status === "fulfilled" && r.value.success).length;

  const errors = results
    .filter((r) => r.status === "fulfilled" && !r.value.success)
    .map((r) => (r as PromiseFulfilledResult<{ success: boolean; error?: string }>).value.error!)
    .concat(
      results.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason)
    );

  return { successCount, errors };
}

/**
 * Helper: Get ungraded scorecard dates
 */
export async function getUngradedScorecards(limit = 10): Promise<string[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("orb_daily_scorecard")
    .select("date")
    .is("total_grade", null)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching ungraded scorecards:", error);
    return [];
  }

  return data?.map((row) => row.date) || [];
}
