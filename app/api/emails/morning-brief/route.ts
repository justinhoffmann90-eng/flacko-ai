import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";

// Called by cron after morning brief is posted to Discord
// Sends today's morning brief to all subscribers with email_new_reports=true
export async function POST() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (
      authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.ADMIN_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServiceClient();

    // Get today's report (most recent) for mode + price context
    const { data: report } = await supabase
      .from("reports")
      .select("extracted_data, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    const extractedData = report?.extracted_data as {
      mode?: { current: string; summary?: string };
      price?: { close: number; change_pct: number };
      position?: { current_stance?: string; daily_cap_pct?: number };
    } | null;

    const mode = extractedData?.mode?.current?.toUpperCase() || "ACTIVE";
    const modeEmoji =
      mode === "GREEN" ? "🟢" : mode === "YELLOW" ? "🟡" : mode === "ORANGE" ? "🟠" : "🔴";
    const todayStr = new Date().toLocaleDateString("en-US", {
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

    // Get all active subscribers who want email notifications
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

    // Filter to those with email_new_reports enabled (default: true)
    const toNotify: { email: string; userId: string }[] = [];
    for (const sub of subscribers) {
      const { data: settings } = await supabase
        .from("user_settings")
        .select("email_new_reports")
        .eq("user_id", sub.user_id)
        .single();

      if (settings?.email_new_reports !== false) {
        const user = sub.users as unknown as { email: string } | null;
        if (user?.email) {
          toNotify.push({ email: user.email, userId: sub.user_id });
        }
      }
    }

    if (toNotify.length === 0) {
      return NextResponse.json({ message: "No opted-in subscribers", emailsSent: 0 });
    }

    const subject = `${modeEmoji} TSLA Morning Brief — ${mode} MODE — ${shortDate}`;

    const html = getMorningBriefEmailHtml({
      mode,
      modeEmoji,
      todayStr,
      modeSummary: extractedData?.mode?.summary,
      currentStance: extractedData?.position?.current_stance,
      dailyCapPct: extractedData?.position?.daily_cap_pct,
    });

    // Batch send via Resend
    const batchPayload = toNotify.map(({ email }) => ({
      from: EMAIL_FROM,
      to: email,
      subject,
      html,
    }));

    let sentCount = 0;
    // Resend batch limit is 100/call
    const BATCH_SIZE = 100;
    for (let i = 0; i < batchPayload.length; i += BATCH_SIZE) {
      const chunk = batchPayload.slice(i, i + BATCH_SIZE);
      const { error } = await resend.batch.send(chunk);
      if (!error) sentCount += chunk.length;
      else console.error("Resend batch error:", error);
    }

    console.log(`Morning brief email: sent ${sentCount}/${toNotify.length}`);

    return NextResponse.json({ success: true, emailsSent: sentCount, total: toNotify.length });
  } catch (error) {
    console.error("Morning brief email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getMorningBriefEmailHtml({
  mode,
  modeEmoji,
  todayStr,
  modeSummary,
  currentStance,
  dailyCapPct,
}: {
  mode: string;
  modeEmoji: string;
  todayStr: string;
  modeSummary?: string;
  currentStance?: string;
  dailyCapPct?: number;
}) {
  const modeColor =
    mode === "GREEN" ? "#22c55e" : mode === "YELLOW" ? "#eab308" : mode === "ORANGE" ? "#f97316" : "#ef4444";

  const capText = dailyCapPct != null ? `Daily Cap: ${dailyCapPct}%` : "";
  const stanceText = currentStance ? `Stance: ${currentStance}` : "";
  const summaryText = modeSummary || "Today's morning brief is live on the dashboard.";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#18181b;border-radius:12px;border:1px solid #27272a;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #27272a;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1px;">Flacko AI</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">☀️ Morning Brief</h1>
              <p style="margin:6px 0 0 0;font-size:13px;color:#a1a1aa;">${todayStr}</p>
            </td>
          </tr>
          <!-- Mode badge -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${modeColor}20;border:1px solid ${modeColor}40;border-radius:8px;padding:12px 20px;">
                    <span style="font-size:20px;font-weight:700;color:${modeColor};">${modeEmoji} ${mode} MODE</span>
                    ${capText ? `<p style="margin:4px 0 0 0;font-size:13px;color:#a1a1aa;">${capText}${stanceText ? ` · ${stanceText}` : ""}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Summary -->
          <tr>
            <td style="padding:20px 32px 24px 32px;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#d4d4d8;">${summaryText}</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 28px 32px;">
              <a href="https://flacko.ai/report" style="display:inline-block;padding:13px 28px;background-color:#ffffff;color:#0a0a0a;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
                View Full Report →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                © 2026 Flacko AI · TSLA Trading Intelligence<br>
                <span style="color:#3f3f46;">Not financial advice · Educational content</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
