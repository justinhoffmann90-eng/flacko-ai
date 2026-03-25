import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import * as fs from "fs";
import * as path from "path";

export const maxDuration = 60;

// Renders the Discord embed description (markdown-like) as clean email HTML
function discordToEmailHtml(description: string, title: string, modeColor: string): string {
  // Convert Discord markdown to email-safe HTML
  const body = description
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/━+/g, '<hr style="border:none;border-top:1px solid #374151;margin:16px 0;">')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^<\/p>/, "")
    .replace(/<p>$/, "");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <style>
    body, table, td, div { background-color: #0a0a0a !important; color: #f9fafb !important; }
    @media (prefers-color-scheme: light) {
      body, table, td, div { background-color: #0a0a0a !important; color: #f9fafb !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

      <!-- Header -->
      <tr><td style="background-color:#18181b;border-radius:12px 12px 0 0;border-left:4px solid ${modeColor};padding:24px 28px 20px;">
        <p style="margin:0 0 4px 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1.5px;">Flacko AI</p>
        <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${title}</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="background-color:#18181b;padding:0 28px 8px;border-radius:0;">
        <div style="color:#d1d5db;font-size:14px;line-height:1.75;">
          <p>${body}</p>
        </div>
      </td></tr>

      <!-- CTA -->
      <tr><td style="background-color:#18181b;padding:20px 28px 28px;border-radius:0 0 12px 12px;text-align:center;">
        <a href="https://flacko.ai/report" style="display:inline-block;background-color:${modeColor};color:#ffffff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:15px;font-weight:700;">
          View Full Report →
        </a>
        <p style="margin:16px 0 0;font-size:12px;color:#52525b;">
          © 2026 Flacko AI · Not financial advice ·
          <a href="https://flacko.ai/settings" style="color:#52525b;">Manage preferences</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

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
    const testTo = body?.testTo as string | undefined;
    const requestEmbed = body?.embed;

    // Load today's morning brief from request body first (for Vercel), fallback to local archive
    let embed = requestEmbed;
    if (!embed) {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }); // YYYY-MM-DD
      const archivePath = path.join(
        process.env.HOME || "/Users/trunks",
        "clawd/posts/discord/morning-brief",
        `${today}.md`
      );

      if (!fs.existsSync(archivePath)) {
        return NextResponse.json({ error: `Archive not found: ${archivePath}` }, { status: 404 });
      }

      const raw = fs.readFileSync(archivePath, "utf-8");
      const parsed = JSON.parse(raw);
      embed = parsed?.embeds?.[0];
    }
    if (!embed) {
      return NextResponse.json({ error: "No embed found in archive" }, { status: 500 });
    }

    const title = embed.title || "☀️ TSLA Morning Brief";
    const description = embed.description || "";
    const embedColor: number = embed.color || 16711680;

    // Convert Discord color int to hex
    const modeColor = "#" + embedColor.toString(16).padStart(6, "0");

    // Derive mode label + short date for subject
    const modeLabel = embedColor === 65280 ? "GREEN" : embedColor === 16776960 ? "YELLOW" : embedColor === 16744448 ? "ORANGE" : "RED";
    const shortDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
    const modeEmoji: Record<string, string> = { GREEN: "🟢", YELLOW: "🟡", ORANGE: "🟠", RED: "🔴" };
    const subject = `${modeEmoji[modeLabel] || "🔴"} TSLA Morning Brief — ${modeLabel} MODE — ${shortDate}`;

    const html = discordToEmailHtml(description, title, modeColor);

    // TEST MODE: send only to one address
    if (testTo) {
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: testTo,
        subject: `[TEST] ${subject}`,
        html,
      });
      if (error) return NextResponse.json({ error: "Failed to send test", detail: error }, { status: 500 });
      return NextResponse.json({ success: true, testSent: true, to: testTo });
    }

    // PRODUCTION: only subscribers with morning_brief_email=true
    const supabase = await createServiceClient();
    const { data: subscribers } = await supabase
      .from("subscriptions")
      .select("user_id, status, trial_ends_at, users (email)")
      .or(`status.in.(active,comped),and(status.eq.trial,trial_ends_at.gt.${new Date().toISOString()})`);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers", emailsSent: 0 });
    }

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
      return NextResponse.json({ message: "No opted-in subscribers", emailsSent: 0 });
    }

    const batchPayload = toNotify.map((email) => ({ from: EMAIL_FROM, to: email, subject, html }));

    let sentCount = 0;
    const BATCH_SIZE = 100;
    for (let i = 0; i < batchPayload.length; i += BATCH_SIZE) {
      const chunk = batchPayload.slice(i, i + BATCH_SIZE);
      const { error } = await resend.batch.send(chunk);
      if (!error) sentCount += chunk.length;
      else console.error("Resend batch error:", error);
    }

    return NextResponse.json({ success: true, emailsSent: sentCount, total: toNotify.length });

  } catch (error) {
    console.error("Morning brief email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
