/**
 * Weekly Accuracy API
 *
 * GET /api/accuracy/weekly?week=YYYY-WW or ?date=YYYY-MM-DD
 * Returns weekly aggregated accuracy data.
 */

import { NextResponse } from "next/server";
import { aggregateWeeklyData } from "@/lib/accuracy/aggregateWeekly";
import { format, startOfWeek, getISOWeek, getYear } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week");
    const dateParam = searchParams.get("date");

    let input: string;

    if (weekParam) {
      // Week string provided (e.g., 2025-05 or 2025-W05)
      input = weekParam;
    } else if (dateParam) {
      // Date provided - use as is
      input = dateParam;
    } else {
      // Default to current week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const year = getYear(weekStart);
      const week = getISOWeek(weekStart);
      input = `${year}-${String(week).padStart(2, "0")}`;
    }

    const data = await aggregateWeeklyData(input);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Weekly accuracy API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
