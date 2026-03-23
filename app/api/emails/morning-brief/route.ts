import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { getMorningBriefEmailHtml } from "@/lib/resend/morning-brief-template";
import { TrafficLightMode, ParsedReportData } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Verify admin secret
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const supabase = await createServiceClient();

    // Get today's report (most recent)
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: "No report found" }, { status: 404 });
    }

    const extractedData = report.extracted_data as {
      mode?: { current: TrafficLightMode; summary?: string };
      price?: { close: number; change_pct: number };
      position?: { current_stance?: string; daily_cap_pct?: number };
      correction_risk?: string;
      max_invested_pct?: number;
      key_levels?: {
        gamma_strike?: number;
        put_wall?: number;
        call_wall?: number;
        hedge_wall?: number;
        master_eject?: number;
      };
      master_eject?: { price: number; action: string };
      emas?: { ema8?: number; ema21?: number; ema50?: number; ema200?: number };
      gamma_regime?: string;
      hiro?: { reading?: number };
      entry_quality?: { score: number };
      alerts?: { type: "upside" | "downside"; level_name: string; price: number; action: string; reason?: string }[];
    };
    const parsedData = (report.parsed_data || {}) as Partial<ParsedReportData>;

    // Get subscribers who opted in to morning brief
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
      return NextResponse.json({ sent: 0, errors: [] });
    }

    // Filter to users who have morning_brief_email=true
    const optedInUsers = [];
    for (const sub of subscribers) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("morning_brief_email")
        .eq("user_id", sub.user_id)
        .single();

      if (settings?.morning_brief_email === true) {
        optedInUsers.push(sub);
      }
    }

    if (optedInUsers.length === 0) {
      return NextResponse.json({ sent: 0, errors: [] });
    }

    // Collect recipient emails
    const recipientEmails = optedInUsers
      .map(sub => (sub.users as unknown as { email: string } | null)?.email)
      .filter(Boolean) as string[];

    // Hard cap: reject if too many recipients
    if (recipientEmails.length > 500) {
      return NextResponse.json(
        { error: 'Too many recipients', count: recipientEmails.length },
        { status: 400 }
      );
    }

    // Dry-run mode: log and return without sending
    if (dryRun) {
      console.log('MORNING_BRIEF_DRY_RUN', { count: recipientEmails.length, recipientEmails });
      return NextResponse.json({ dryRun: true, recipients: recipientEmails, count: recipientEmails.length });
    }

    // Audit log before sending
    const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
    console.log('MORNING_BRIEF_SEND', {
      count: recipientEmails.length,
      recipientEmails,
      date,
      timestamp: new Date().toISOString(),
    });

    // Extract catalyst watch from parsed data
    let catalystWatch = "";
    const positionGuidance = parsedData.position_guidance || "";
    const catalystMatch = positionGuidance.match(/\*\*Catalyst watch:\*\*\s*(.*?)(?:\n\n|---)/s);
    if (catalystMatch) {
      catalystWatch = catalystMatch[1].trim();
    }

    // Extract macro context from parsed data
    const macroContext = parsedData.qqq_context || "";

    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: "America/Chicago",
    });

    const mode = extractedData?.mode?.current || "yellow";
    const subject = `☀️ TSLA Morning Brief — ${mode.toUpperCase()} MODE — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })}`;

    // Send emails
    let sentCount = 0;
    const errors: string[] = [];

    for (const sub of optedInUsers) {
      const user = sub.users as unknown as { email: string } | null;
      if (!user?.email) continue;

      const html = getMorningBriefEmailHtml({
        userName: user.email.split("@")[0],
        mode,
        reportDate,
        closePrice: extractedData?.price?.close || 0,
        changePct: extractedData?.price?.change_pct || 0,
        modeSummary: extractedData?.mode?.summary,
        currentStance: extractedData?.position?.current_stance,
        dailyCapPct: extractedData?.position?.daily_cap_pct ?? extractedData?.max_invested_pct,
        correctionRisk: extractedData?.correction_risk,
        macroContext: macroContext || undefined,
        keyLevels: extractedData?.key_levels,
        masterEject: extractedData?.master_eject,
        emas: extractedData?.emas,
        gammaRegime: extractedData?.gamma_regime,
        hiroReading: extractedData?.hiro?.reading,
        catalystWatch: catalystWatch || undefined,
        todayGameplan: parsedData.game_plan || undefined,
        alerts: extractedData?.alerts,
        entryQualityScore: extractedData?.entry_quality?.score,
      });

      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: user.email,
          subject,
          html,
        });
        sentCount++;
      } catch (error) {
        const msg = `Failed to send to ${user.email}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(msg);
        errors.push(msg);
      }
    }

    return NextResponse.json({ sent: sentCount, errors });
  } catch (error) {
    console.error("Morning brief error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
