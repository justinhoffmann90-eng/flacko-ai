import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { getMorningBriefEmailHtml } from "@/lib/resend/morning-brief-template";
import { TrafficLightMode } from "@/types";

export const maxDuration = 60;

// Called by cron after morning brief is posted to Discord
// Only sends to subscribers with morning_brief_email=true toggle
export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.ADMIN_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const testTo = body?.testTo as string | undefined; // if set, only send to this address

    const supabase = await createServiceClient();

    // Get today's most recent report for all email content
    const { data: report } = await supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    const extractedData = report?.extracted_data as {
      mode?: { current: TrafficLightMode; summary?: string };
      price?: { close: number; change_pct: number };
      position?: { current_stance?: string; daily_cap_pct?: number };
      correction_risk?: string;
      slow_zone_active?: boolean;
      slow_zone?: number;
      master_eject?: { price: number; action: string };
      gamma_regime?: string;
      hiro?: { reading?: number };
      key_levels?: {
        gamma_strike?: number;
        put_wall?: number;
        call_wall?: number;
        hedge_wall?: number;
        master_eject?: number;
      };
      alerts?: { type: "upside" | "downside"; level_name: string; price: number; action: string; reason?: string }[];
      entry_quality?: { score: number };
    } | null;

    const parsedData = (report?.parsed_data || {}) as {
      macro_context?: string;
      catalyst_watch?: string;
      today_gameplan?: string;
      emas?: { ema8?: number; ema21?: number; ema50?: number; ema200?: number };
    };

    const mode = (extractedData?.mode?.current || "red") as TrafficLightMode;
    const closePrice = extractedData?.price?.close || 0;
    const changePct = extractedData?.price?.change_pct || 0;

    const reportDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Chicago",
    });
    const shortDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Chicago",
    });

    const modeEmoji: Record<string, string> = { green: "🟢", yellow: "🟡", orange: "🟠", red: "🔴" };
    const subject = `${modeEmoji[mode] || "🔴"} TSLA Morning Brief — ${mode.toUpperCase()} MODE — ${shortDate}`;

    const html = getMorningBriefEmailHtml({
      userName: "",
      mode,
      reportDate,
      closePrice,
      changePct,
      modeSummary: extractedData?.mode?.summary,
      currentStance: extractedData?.position?.current_stance,
      dailyCapPct: extractedData?.position?.daily_cap_pct,
      correctionRisk: extractedData?.correction_risk,
      macroContext: parsedData?.macro_context,
      keyLevels: extractedData?.key_levels,
      masterEject: extractedData?.master_eject,
      emas: parsedData?.emas,
      gammaRegime: extractedData?.gamma_regime,
      hiroReading: extractedData?.hiro?.reading,
      catalystWatch: parsedData?.catalyst_watch,
      todayGameplan: parsedData?.today_gameplan,
      alerts: extractedData?.alerts,
      entryQualityScore: extractedData?.entry_quality?.score,
    });

    // TEST MODE: only send to one address
    if (testTo) {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: testTo,
        subject: `[TEST] ${subject}`,
        html,
      });
      if (error) return NextResponse.json({ error: "Failed to send test email", detail: error }, { status: 500 });
      return NextResponse.json({ success: true, testSent: true, to: testTo });
    }

    // PRODUCTION: only send to subscribers with morning_brief_email=true
    const { data: subscribers } = await supabase
      .from("subscriptions")
      .select(`
        user_id,
        status,
        trial_ends_at,
        users (email)
      `)
      .or(
        `status.in.(active,comped),and(status.eq.trial,trial_ends_at.gt.${new Date().toISOString()})`
      );

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers", emailsSent: 0 });
    }

    // Only include users who explicitly opted in to morning brief emails
    const toNotify: string[] = [];
    for (const sub of subscribers) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("morning_brief_email")
        .eq("user_id", sub.user_id)
        .single();

      if (settings?.morning_brief_email === true) {
        const user = sub.users as unknown as { email: string } | null;
        if (user?.email) toNotify.push(user.email);
      }
    }

    if (toNotify.length === 0) {
      return NextResponse.json({ message: "No subscribers with morning_brief_email=true", emailsSent: 0 });
    }

    const batchPayload = toNotify.map((email) => ({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    }));

    let sentCount = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < batchPayload.length; i += BATCH_SIZE) {
      const chunk = batchPayload.slice(i, i + BATCH_SIZE);
      const { error } = await resend.batch.send(chunk);
      if (!error) sentCount += chunk.length;
      else console.error("Resend batch error:", error);
    }

    console.log(`Morning brief email: sent ${sentCount}/${toNotify.length} (morning_brief_email=true only)`);
    return NextResponse.json({ success: true, emailsSent: sentCount, total: toNotify.length });

  } catch (error) {
    console.error("Morning brief email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
