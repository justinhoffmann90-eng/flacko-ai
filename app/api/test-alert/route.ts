import { NextResponse } from "next/server";
import { sendDiscordMessage } from "@/lib/discord/client";
import { getAlertDiscordMessage } from "@/lib/discord/templates";
import { createServiceClient } from "@/lib/supabase/server";
import { ReportAlert, TrafficLightMode } from "@/types";

export async function POST(request: Request) {
  // Only allow in dev
  if (process.env.NODE_ENV === "production" && process.env.DEV_BYPASS_AUTH !== "true") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    // Fetch latest report data for defaults
    const supabase = await createServiceClient();
    const { data: report } = await supabase
      .from("reports")
      .select("extracted_data")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    const extractedData = report?.extracted_data as {
      mode?: { current: TrafficLightMode };
      positioning?: { posture?: string };
      alerts?: ReportAlert[];
    } | null;

    // Get mode and positioning from report or body
    const mode = body.mode || extractedData?.mode?.current || "yellow";
    const positioning = body.positioning || extractedData?.positioning?.posture || "";

    // Build alert from body or use first downside alert from report
    let testAlert: ReportAlert;
    if (body.level_name && body.alert_price) {
      testAlert = {
        type: body.type || "downside",
        level_name: body.level_name,
        price: body.alert_price,
        action: body.action || "Nibble 25% of your daily cap",
        reason: body.reason || "",
      };
    } else {
      // Find first downside alert from report
      const downsideAlert = extractedData?.alerts?.find(a => a.type === "downside");
      testAlert = downsideAlert || {
        type: "downside",
        level_name: "Daily 21 EMA",
        price: 441,
        action: "Nibble 25% of your daily cap",
        reason: "Key moving average support level",
      };
    }

    const discordMessage = getAlertDiscordMessage({
      alerts: [testAlert],
      mode,
      positioning,
    });

    const sent = await sendDiscordMessage(discordMessage);

    if (!sent) {
      return NextResponse.json({
        error: "Failed to send Discord message. Check DISCORD_WEBHOOK_URL env var."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Test alert sent to Discord",
      alert: testAlert,
      mode,
      positioning,
    });
  } catch (error) {
    console.error("Test alert error:", error);
    return NextResponse.json({ error: "Failed to send test alert" }, { status: 500 });
  }
}
