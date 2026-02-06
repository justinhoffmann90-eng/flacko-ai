/**
 * Weekly Thread API
 *
 * GET /api/content/weekly-thread?week=YYYY-WW or ?date=YYYY-MM-DD
 * Returns formatted tweet thread array with header image URL.
 */

import { NextResponse } from "next/server";
import { aggregateWeeklyData } from "@/lib/accuracy/aggregateWeekly";
import { formatWeeklyThread, formatThreadForCopy } from "@/lib/content/formatThread";
import { format, startOfWeek, getISOWeek, getYear } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week");
    const dateParam = searchParams.get("date");

    let input: string;
    let weekString: string;

    if (weekParam) {
      // Week string provided (e.g., 2025-05 or 2025-W05)
      input = weekParam;
      // Normalize to YYYY-WW format
      weekString = weekParam.replace("W", "");
    } else if (dateParam) {
      // Date provided - calculate week string
      input = dateParam;
      const date = new Date(dateParam);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const year = getYear(weekStart);
      const week = getISOWeek(weekStart);
      weekString = `${year}-${String(week).padStart(2, "0")}`;
    } else {
      // Default to current week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const year = getYear(weekStart);
      const week = getISOWeek(weekStart);
      weekString = `${year}-${String(week).padStart(2, "0")}`;
      input = weekString;
    }

    // Aggregate weekly data
    const weeklyData = await aggregateWeeklyData(input);

    // Format as tweet thread
    const tweets = formatWeeklyThread(weeklyData);

    // Generate thread for copy (concatenated)
    const threadForCopy = formatThreadForCopy(tweets);

    // Generate image URL
    const imageUrl = `/api/cards/weekly-scorecard?week=${weekString}`;

    return NextResponse.json({
      week: weekString,
      weekLabel: weeklyData.weekLabel,
      tweets,
      threadForCopy,
      imageUrl,
      summary: {
        tradingDays: weeklyData.tradingDays,
        weeklyScore: weeklyData.weeklyScore,
        overallLevelAccuracy: weeklyData.overallLevelAccuracy,
        bestDay: weeklyData.bestDay,
        worstDay: weeklyData.worstDay,
      },
    });
  } catch (error) {
    console.error("Weekly thread API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
