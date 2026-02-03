import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateDailyModeCard } from "@/lib/content/daily-mode-card";
import { generateHiroRecap } from "@/lib/content/hiro-recap";
import { generateForecastVsActual } from "@/lib/content/forecast-vs-actual";
import { generateWeeklyScorecard } from "@/lib/content/weekly-scorecard";
import { generateEODAccuracyCard } from "@/lib/content/eod-accuracy-card";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, date } = await request.json();

    if (!type || !date) {
      return NextResponse.json(
        { error: "Missing required fields: type, date" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "daily-mode-card":
        result = await generateDailyModeCard(date);
        break;
      case "eod-accuracy-card":
        result = await generateEODAccuracyCard(date);
        break;
      case "hiro-recap":
        result = await generateHiroRecap(date);
        break;
      case "forecast-vs-actual":
        result = await generateForecastVsActual(date);
        break;
      case "weekly-scorecard":
        result = await generateWeeklyScorecard(date);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown content type: ${type}` },
          { status: 400 }
        );
    }

    // Return error status if generator returned an error
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
