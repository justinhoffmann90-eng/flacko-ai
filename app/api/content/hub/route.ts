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
    const requestedDate = searchParams.get("date");

    const serviceSupabase = await createServiceClient();

    let report;
    let date: string;

    if (requestedDate) {
      // Specific date requested - fetch that exact report
      const { data, error } = await serviceSupabase
        .from("reports")
        .select("extracted_data, report_date")
        .eq("report_date", requestedDate)
        .single();

      if (error || !data) {
        return NextResponse.json({
          error: `Report not found for ${requestedDate}`,
        }, { status: 404 });
      }
      report = data;
      date = requestedDate;
    } else {
      // No date specified - get the LATEST report
      const { data, error } = await serviceSupabase
        .from("reports")
        .select("extracted_data, report_date")
        .order("report_date", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return NextResponse.json({
          error: "No reports found",
        }, { status: 404 });
      }
      report = data;
      date = data.report_date;
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
      tweetDrafts: [] // Will be populated from tweet_drafts table below
    };

    // Fetch tweet drafts for this date from the database
    try {
      const { data: tweetDrafts } = await serviceSupabase
        .from("tweet_drafts")
        .select("id, date, type, content, status, created_at")
        .eq("date", date)
        .order("created_at", { ascending: false });

      if (tweetDrafts && tweetDrafts.length > 0) {
        response.tweetDrafts = tweetDrafts;
      }
    } catch (tweetDraftError) {
      // Non-critical error - continue without tweet drafts
      console.warn("Failed to fetch tweet drafts:", tweetDraftError);
    }

    // If EOD is available, generate EOD tweet text from accuracy data
    if (isEODAvailable) {
      try {
        const { compareLevels, calculateAccuracy } = await import("@/lib/accuracy/compareLevels");
        const { getIntradayPriceData } = await import("@/lib/price/yahoo-finance");

        const alerts = extracted.alerts || [];
        const priceData = await getIntradayPriceData(date);

        if (priceData && alerts.length > 0) {
          const results = compareLevels(alerts, priceData);
          const accuracy = calculateAccuracy(results);

          const eodTweet = generateEODTweet({
            date,
            accuracy: {
              hit: accuracy.hit,
              total: accuracy.total,
              percentage: accuracy.percentage,
              broken: accuracy.broken,
              notTested: accuracy.notTested,
            },
            results,
            ohlc: { high: priceData.high, low: priceData.low },
          });

          response.eodCard.tweetText = eodTweet;
          response.eodCard.accuracy = accuracy;
        } else {
          response.eodCard.tweetText = `$TSLA Accuracy Check — ${format(new Date(date), "MMM d")}\n\nLevel accuracy results pending.\n\nTrack record → flacko.ai/accuracy`;
        }
      } catch (eodError) {
        console.error("EOD tweet generation error:", eodError);
        response.eodCard.tweetText = `$TSLA Accuracy Check — ${format(new Date(date), "MMM d")}\n\nLevel performance tracking live.\n\nTrack record → flacko.ai/accuracy`;
      }
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
