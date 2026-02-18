import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { getNewReportEmailHtml } from "@/lib/resend/templates";
import { ParsedReportData, TrafficLightMode } from "@/types";

// This endpoint is called after a new report is published to notify subscribers
export async function POST(request: Request) {
  try {
    // Verify admin or cron secret
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const extractedData = report.extracted_data as {
      mode?: { current: TrafficLightMode; summary?: string };
      price?: { close: number; change_pct: number };
      position?: { current_stance?: string; daily_cap_pct?: number };
      tiers?: { long?: string; medium?: string; short?: string; hourly?: string };
      key_levels?: {
        gamma_strike?: number;
        put_wall?: number;
        call_wall?: number;
        master_eject?: number;
      };
      hiro?: { reading?: number };
      max_invested_pct?: number;
      correction_risk?: string;
      slow_zone_active?: boolean;
      slow_zone?: number;
    };
    const parsedData = (report.parsed_data || {}) as Partial<ParsedReportData>;

    // Get all subscribers who want new report emails
    // Include active, comped, and valid trial subscriptions
    const { data: subscribers } = await supabase
      .from("subscriptions")
      .select(`
        user_id,
        status,
        trial_ends_at,
        users (email)
      `)
      .or(`status.in.(active,comped),and(status.eq.trial,trial_ends_at.gt.${new Date().toISOString()})`);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify" });
    }

    // Filter subscribers who want email notifications
    const subscribersToNotify = [];
    for (const sub of subscribers) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("email_new_reports")
        .eq("user_id", sub.user_id)
        .single();

      if (settings?.email_new_reports !== false) {
        subscribersToNotify.push(sub);
      }
    }

    // Send emails
    let sentCount = 0;
    for (const sub of subscribersToNotify) {
      const user = sub.users as unknown as { email: string } | null;
      if (!user?.email) continue;

      const html = getNewReportEmailHtml({
        userName: user.email.split("@")[0],
        mode: extractedData?.mode?.current || "yellow",
        reportDate: report.report_date,
        closePrice: extractedData?.price?.close || 0,
        changePct: extractedData?.price?.change_pct || 0,
        modeSummary: extractedData?.mode?.summary,
        currentStance: extractedData?.position?.current_stance,
        dailyCapPct: extractedData?.position?.daily_cap_pct ?? extractedData?.max_invested_pct,
        correctionRisk: extractedData?.correction_risk,
        tiers: extractedData?.tiers,
        keyLevels: extractedData?.key_levels,
        hiroReading: extractedData?.hiro?.reading,
        slowZoneActive: extractedData?.slow_zone_active,
        slowZone: extractedData?.slow_zone,
        gamePlan: parsedData.game_plan,
        spotgammaAnalysis: parsedData.spotgamma_analysis,
        riskAlerts: parsedData.risk_alerts,
      });

      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject: `TSLA Daily Report - ${extractedData?.mode?.current?.toUpperCase() || "NEW"} MODE`,
          html,
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        type: "new_report",
        title: "New Report Available",
        body: `Today's ${extractedData?.mode?.current?.toUpperCase() || ""} MODE report is ready`,
        metadata: {
          report_id: reportId,
          mode: extractedData?.mode?.current,
        },
      });
    }

    return NextResponse.json({
      success: true,
      emailsSent: sentCount,
      notificationsCreated: subscribersToNotify.length,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
