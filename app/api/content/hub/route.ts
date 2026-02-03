import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateMorningTweet, generateEODTweet, generateModeTweet } from "@/lib/content/tweetTextGenerator";
import { format } from "date-fns";

const MODE_DAILY_CAP: Record<string, number> = {
  GREEN: 25,
  YELLOW: 15,
  ORANGE: 10,
  RED: 5,
};

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

    const serviceSupabase = await createServiceClient();

    // Get report for the date
    const { data: report, error: reportError } = await serviceSupabase
      .from("reports")
      .select("extracted_data, report_date")
      .eq("report_date", date)
      .single();

    if (reportError || !report) {
      return NextResponse.json({
        error: `Report not found for ${date}`,
      }, { status: 404 });
    }

    const extracted = report.extracted_data as any;

    // Prepare morning card data
    const mode = extracted.mode?.current || "YELLOW";
    const modeEmoji = getModeEmoji(mode);
    const modeKey = String(mode).toUpperCase();
    const dailyCapValue =
      extracted.position?.daily_cap_pct ||
      extracted.mode?.daily_cap ||
      MODE_DAILY_CAP[modeKey] ||
      15;
    const dailyCap = String(dailyCapValue);
    
    // Extract key levels for morning card
    const levels = extracted.alerts || [];
    const resistanceLevels = levels.filter((l: any) => l.type === "above").slice(0, 2);
    const supportLevels = levels.filter((l: any) => l.type === "below").slice(0, 2);

    const morningTweetText = generateMorningTweet({
      date,
      mode,
      modeEmoji,
      dailyCap,
      levels: extracted.alerts || []
    });

    // Check if EOD data is available (market closed)
    const now = new Date();
    const marketCloseTime = new Date(date + "T20:00:00Z"); // 4pm CT = 10pm UTC
    const isEODAvailable = now >= marketCloseTime;

    // Prepare response
    const response: any = {
      date,
      mode,
      modeEmoji,
      modeCard: {
        status: "ready",
        imageUrl: `/api/cards/mode?date=${date}`,
        tweetText: generateModeTweet({
          date,
          mode,
          dailyCap: dailyCapValue,
          levels: extracted.key_levels || {},
        }),
      },
      morningCard: {
        status: "ready",
        imageUrl: `/api/content/preview?type=daily-mode-card&date=${date}`,
        tweetText: morningTweetText,
        levels: {
          R1: resistanceLevels[0]?.price,
          R2: resistanceLevels[1]?.price,
          S1: supportLevels[0]?.price,
          S2: supportLevels[1]?.price,
        }
      },
      eodCard: {
        status: isEODAvailable ? "ready" : "pending",
        imageUrl: isEODAvailable ? `/api/content/preview?type=eod-accuracy-card&date=${date}` : null,
        tweetText: null,
        accuracy: null
      },
      tweetDrafts: [] // TODO: Implement tweet drafts storage
    };

    // If EOD is available, generate EOD tweet text
    if (isEODAvailable) {
      // We'll need to fetch the accuracy data to generate the tweet
      // For now, just provide a placeholder
      response.eodCard.tweetText = `$TSLA Accuracy Check — ${format(new Date(date), "MMM d")}\n\nCheck out today's level performance\n\nTrack record: flacko.ai/accuracy ⚔️`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Content hub error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

function getModeEmoji(mode: string): string {
  const modeUpper = mode.toUpperCase();
  if (modeUpper.includes('GREEN') || modeUpper.includes('ACCUMULATION')) return '🟢';
  if (modeUpper.includes('YELLOW')) return '🟡';
  if (modeUpper.includes('ORANGE')) return '🟠';
  if (modeUpper.includes('RED') || modeUpper.includes('DEFENSIVE')) return '🔴';
  return '🟡';
}
