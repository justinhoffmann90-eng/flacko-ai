/**
 * Weekly Data Aggregation
 *
 * Aggregates daily accuracy data for a trading week (Mon-Fri).
 * Used by weekly scorecard thread and related endpoints.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getIntradayPriceData } from "@/lib/price/yahoo-finance";
import { compareLevels, calculateAccuracy, LevelResult } from "./compareLevels";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getISOWeek,
  getYear
} from "date-fns";

export interface DayScore {
  date: string;
  dayOfWeek: string;
  mode: "green" | "yellow" | "orange" | "red";
  modeEmoji: string;
  levelsTotal: number;
  levelsHit: number;
  levelsBroken: number;
  levelsNotTested: number;
  accuracy: number;
  grade: number;
  maxGrade: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
    change_pct: number;
  };
  levelResults?: LevelResult[];
}

export interface ModeBreakdown {
  green: { days: number; avgScore: number; totalPoints: number };
  yellow: { days: number; avgScore: number; totalPoints: number };
  orange: { days: number; avgScore: number; totalPoints: number };
  red: { days: number; avgScore: number; totalPoints: number };
}

export interface WeeklyAggregate {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  weekNumber: number;
  year: number;
  tradingDays: number;
  totalGrade: number;
  maxGrade: number;
  weeklyScore: number;
  modeBreakdown: ModeBreakdown;
  bestDay: { date: string; score: number; mode: string } | null;
  worstDay: { date: string; score: number; mode: string } | null;
  dayScores: DayScore[];
  totalLevelsHit: number;
  totalLevelsBroken: number;
  totalLevelsNotTested: number;
  overallLevelAccuracy: number;
}

/**
 * Parse week string (YYYY-WW) to week number and year
 */
export function parseWeekString(weekStr: string): { year: number; week: number } | null {
  const match = weekStr.match(/^(\d{4})-W?(\d{1,2})$/);
  if (!match) return null;
  return { year: parseInt(match[1]), week: parseInt(match[2]) };
}

/**
 * Get the Monday of a given ISO week
 */
export function getWeekStartFromWeekNumber(year: number, weekNum: number): Date {
  // Create Jan 4 of the year (always in week 1 per ISO)
  const jan4 = new Date(year, 0, 4);
  // Get the Monday of that week
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  // Add weeks
  const targetDate = new Date(firstMonday);
  targetDate.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
  return targetDate;
}

/**
 * Get mode emoji from mode string
 */
function getModeEmoji(mode: string): string {
  const modeUpper = mode?.toUpperCase() || "YELLOW";
  if (modeUpper.includes("GREEN") || modeUpper.includes("ACCUMULATION")) return "🟢";
  if (modeUpper.includes("YELLOW")) return "🟡";
  if (modeUpper.includes("ORANGE")) return "🟠";
  if (modeUpper.includes("RED") || modeUpper.includes("DEFENSIVE")) return "🔴";
  return "🟡";
}

/**
 * Normalize mode to standard values
 */
function normalizeMode(mode: string): "green" | "yellow" | "orange" | "red" {
  const modeUpper = mode?.toUpperCase() || "YELLOW";
  if (modeUpper.includes("GREEN") || modeUpper.includes("ACCUMULATION")) return "green";
  if (modeUpper.includes("ORANGE")) return "orange";
  if (modeUpper.includes("RED") || modeUpper.includes("DEFENSIVE")) return "red";
  return "yellow";
}

/**
 * Calculate grade for a single day based on accuracy
 */
function calculateDayGrade(accuracy: number): { grade: number; maxGrade: number } {
  // 5-point grading scale based on accuracy percentage
  // 90-100%: 5 points
  // 75-89%: 4 points
  // 60-74%: 3 points
  // 40-59%: 2 points
  // 0-39%: 1 point
  const maxGrade = 5;
  let grade = 1;

  if (accuracy >= 90) grade = 5;
  else if (accuracy >= 75) grade = 4;
  else if (accuracy >= 60) grade = 3;
  else if (accuracy >= 40) grade = 2;

  return { grade, maxGrade };
}

/**
 * Aggregate weekly data for a given date or week string
 */
export async function aggregateWeeklyData(
  input: string // Either YYYY-MM-DD date or YYYY-WW week string
): Promise<WeeklyAggregate> {
  const supabase = await createServiceClient();

  let weekStart: Date;
  let weekEnd: Date;

  // Determine if input is a week string or date
  const weekParsed = parseWeekString(input);
  if (weekParsed) {
    weekStart = getWeekStartFromWeekNumber(weekParsed.year, weekParsed.week);
    weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  } else {
    // Assume it's a date string
    const targetDate = parseISO(input);
    weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday
  }

  const weekNumber = getISOWeek(weekStart);
  const year = getYear(weekStart);
  const weekLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

  // Get all days in the week
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter to trading days (Mon-Fri)
  const tradingDays = daysInWeek.filter(day => {
    const dayOfWeek = day.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Friday = 5
  });

  const dayScores: DayScore[] = [];

  // Process each trading day
  for (const day of tradingDays) {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayOfWeek = format(day, "EEEE");

    // Fetch report for this day
    const { data: report } = await supabase
      .from("reports")
      .select("extracted_data, report_date")
      .eq("report_date", dateStr)
      .single();

    if (!report) {
      continue; // Skip if no report for this day
    }

    const extracted = report.extracted_data as any;

    // Get price data
    const priceData = await getIntradayPriceData(dateStr);

    if (!priceData || priceData.close === 0) {
      continue; // Skip if no price data
    }

    // Get alerts/levels from report
    const alerts = extracted.alerts || [];

    // Compare levels
    let levelResults: LevelResult[] = [];
    let accuracyData = { hit: 0, broken: 0, notTested: 0, total: 0, percentage: 0 };

    if (alerts.length > 0) {
      levelResults = compareLevels(alerts, priceData);
      accuracyData = calculateAccuracy(levelResults);
    }

    // Get mode
    const modeRaw = extracted.mode?.current || extracted.tiers?.long || "yellow";
    const mode = normalizeMode(modeRaw);
    const modeEmoji = getModeEmoji(modeRaw);

    // Calculate grade
    const { grade, maxGrade } = calculateDayGrade(accuracyData.percentage);

    dayScores.push({
      date: dateStr,
      dayOfWeek,
      mode,
      modeEmoji,
      levelsTotal: accuracyData.total,
      levelsHit: accuracyData.hit,
      levelsBroken: accuracyData.broken,
      levelsNotTested: accuracyData.notTested,
      accuracy: accuracyData.percentage,
      grade,
      maxGrade,
      ohlc: {
        open: priceData.open,
        high: priceData.high,
        low: priceData.low,
        close: priceData.close,
        change_pct: priceData.change_pct,
      },
      levelResults,
    });
  }

  // Calculate aggregates
  const totalGrade = dayScores.reduce((sum, day) => sum + day.grade, 0);
  const maxGrade = dayScores.reduce((sum, day) => sum + day.maxGrade, 0);
  const weeklyScore = maxGrade > 0 ? Math.round((totalGrade / maxGrade) * 100) : 0;

  // Mode breakdown
  const modeBreakdown: ModeBreakdown = {
    green: { days: 0, avgScore: 0, totalPoints: 0 },
    yellow: { days: 0, avgScore: 0, totalPoints: 0 },
    orange: { days: 0, avgScore: 0, totalPoints: 0 },
    red: { days: 0, avgScore: 0, totalPoints: 0 },
  };

  dayScores.forEach(day => {
    modeBreakdown[day.mode].days++;
    modeBreakdown[day.mode].totalPoints += day.accuracy;
  });

  // Calculate averages
  (Object.keys(modeBreakdown) as Array<keyof ModeBreakdown>).forEach(mode => {
    if (modeBreakdown[mode].days > 0) {
      modeBreakdown[mode].avgScore = Math.round(
        modeBreakdown[mode].totalPoints / modeBreakdown[mode].days
      );
    }
  });

  // Find best and worst days
  let bestDay: { date: string; score: number; mode: string } | null = null;
  let worstDay: { date: string; score: number; mode: string } | null = null;

  if (dayScores.length > 0) {
    const sorted = [...dayScores].sort((a, b) => b.accuracy - a.accuracy);
    bestDay = {
      date: sorted[0].date,
      score: sorted[0].accuracy,
      mode: sorted[0].mode,
    };
    worstDay = {
      date: sorted[sorted.length - 1].date,
      score: sorted[sorted.length - 1].accuracy,
      mode: sorted[sorted.length - 1].mode,
    };
  }

  // Total level stats
  const totalLevelsHit = dayScores.reduce((sum, day) => sum + day.levelsHit, 0);
  const totalLevelsBroken = dayScores.reduce((sum, day) => sum + day.levelsBroken, 0);
  const totalLevelsNotTested = dayScores.reduce((sum, day) => sum + day.levelsNotTested, 0);
  const totalLevels = totalLevelsHit + totalLevelsBroken + totalLevelsNotTested;
  const overallLevelAccuracy = totalLevels > 0
    ? Math.round(((totalLevelsHit + totalLevelsNotTested) / totalLevels) * 100)
    : 0;

  return {
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
    weekLabel,
    weekNumber,
    year,
    tradingDays: dayScores.length,
    totalGrade,
    maxGrade,
    weeklyScore,
    modeBreakdown,
    bestDay,
    worstDay,
    dayScores,
    totalLevelsHit,
    totalLevelsBroken,
    totalLevelsNotTested,
    overallLevelAccuracy,
  };
}
