import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { getNewReportEmailHtml } from "@/lib/resend/templates";
import { TrafficLightMode, ParsedReportData } from "@/types";

// This endpoint is called after a new report is published to notify subscribers
export async function POST(request: Request) {
  try {
    // Verify admin or cron secret
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId, todayGameplan, yesterdayRecap, dryRun } = await request.json() as {
      reportId?: string;
      todayGameplan?: string;
      yesterdayRecap?: string;
      dryRun?: boolean;
    };

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
        hedge_wall?: number;
        master_eject?: number;
      };
      hiro?: { reading?: number };
      max_invested_pct?: number;
      correction_risk?: string;
      slow_zone_active?: boolean;
      slow_zone?: number;
      master_eject?: { price: number; action: string };
      gamma_regime?: string;
      entry_quality?: { score: number };
      alerts?: { type: "upside" | "downside"; level_name: string; price: number; action: string; reason?: string }[];
      levels_map?: { type?: string; level: string; price: number; action: string }[];
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

    // Batch-fetch all user_settings in a single query instead of N sequential queries
    const { data: settingsRows } = await supabase
      .from("user_settings")
      .select("user_id, email_new_reports")
      .in("user_id", subscribers.map(s => s.user_id));

    const settingsMap = new Map<string, boolean>();
    if (settingsRows) {
      for (const row of settingsRows) {
        settingsMap.set(row.user_id, row.email_new_reports);
      }
    }

    // Filter subscribers who want email notifications (default true if no settings row)
    const subscribersToNotify = subscribers.filter(sub => {
      const pref = settingsMap.get(sub.user_id);
      return pref !== false;
    });

    // Hard cap: refuse to send to more than 500 recipients
    if (subscribersToNotify.length > 500) {
      return NextResponse.json(
        { error: "Too many recipients", count: subscribersToNotify.length },
        { status: 400 }
      );
    }

    // Build recipient list with emails
    const recipients = subscribersToNotify
      .map(sub => {
        const user = sub.users as unknown as { email: string } | null;
        return { userId: sub.user_id, email: user?.email };
      })
      .filter((r): r is { userId: string; email: string } => !!r.email);

    // Dry-run support: return recipient info without sending
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        recipients: recipients.map(r => r.email),
        count: recipients.length,
      });
    }

    // Audit log before sending
    console.log("REPORT_NOTIFY_SEND", {
      count: recipients.length,
      date: report.report_date,
      reportId,
      timestamp: new Date().toISOString(),
    });

    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago",
    });
    const subjectDate = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", timeZone: "America/Chicago",
    });
    const subject = `TSLA Morning Gameplan — ${extractedData?.mode?.current?.toUpperCase() || "NEW"} MODE — ${subjectDate}`;

    // Build all emails for Resend batch send
    const emailBatch = recipients.map(r => ({
      from: EMAIL_FROM,
      to: r.email,
      subject,
      html: getNewReportEmailHtml({
        userName: r.email.split("@")[0],
        mode: extractedData?.mode?.current || "yellow",
        reportDate,
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
        masterEject: extractedData?.master_eject,
        gammaRegime: extractedData?.gamma_regime,
        entryQualityScore: extractedData?.entry_quality?.score,
        alerts: extractedData?.alerts,
        levelsMap: extractedData?.levels_map,
        positionGuidance: parsedData.position_guidance,
        todayGameplan: todayGameplan || undefined,
        yesterdayRecap: yesterdayRecap || undefined,
      }),
    }));

    // Send all emails in one batch call
    let sentCount = 0;
    try {
      await resend.batch.send(emailBatch);
      sentCount = emailBatch.length;
    } catch (error) {
      console.error("Batch email send failed:", error);
    }

    // Batch-insert notifications for all recipients
    const notifications = recipients.map(r => ({
      user_id: r.userId,
      type: "new_report" as const,
      title: "New Report Available",
      body: `Today's ${extractedData?.mode?.current?.toUpperCase() || ""} MODE report is ready`,
      metadata: {
        report_id: reportId,
        mode: extractedData?.mode?.current,
      },
    }));

    await supabase.from("notifications").insert(notifications);

    return NextResponse.json({
      success: true,
      emailsSent: sentCount,
      notificationsCreated: recipients.length,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
