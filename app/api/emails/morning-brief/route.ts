import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";

export const maxDuration = 60;

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  footer?: { text: string };
}

function buildEmailHtml(embed: DiscordEmbed): string {
  const title = embed.title || "☀️ TSLA Morning Brief";
  const description = embed.description || "";
  const color = embed.color || 16711680;
  const rawModeColor = "#" + color.toString(16).padStart(6, "0");
  const modeColorMap: Record<string, string> = {
    "#ff0000": "#b85c4f",
    "#ff9900": "#c58a4b",
    "#ffff00": "#b8a14a",
    "#00ff00": "#5f8f63",
  };
  const modeColor = modeColorMap[rawModeColor.toLowerCase()] || rawModeColor;
  // Calm morning palette: warm stone shell, soft cream card, easy-on-the-eyes text.
  const shellBg = "#e9e2d6";
  const cardBg = "#f4efe6";
  const bodyText = "#171412";
  const headingText = "#0f0d0b";
  const mutedText = "#6f655a";
  const footerText = "#655b51";
  const divider = "#ddd3c6";
  const buttonText = "#fffaf3";

  // Convert Discord markdown → email HTML
  const parts = description.split(/\*\*(.*?)\*\*/g);
  let body = parts
    .map((p, i) =>
      i % 2 === 1
        ? `<strong style="color:${headingText};font-weight:700;">${p}</strong>`
        : p
    )
    .join("");
  body = body.replace(/━+/g, `<hr style="border:none;border-top:1px solid ${divider};margin:18px 0;">`);
  body = body.replace(/\n\n/g, "</p><p>");
  body = body.replace(/\n/g, "<br>");
  body = `<p style="margin:0 0 14px 0;">${body}</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light only; supported-color-schemes: light; }
    body, table, td, div, p, a, h1, strong {
      color: ${bodyText} !important;
    }
    .flacko-shell { background-color: ${shellBg} !important; }
    .flacko-card { background-color: ${cardBg} !important; }
    .flacko-title { color: ${headingText} !important; }
    .flacko-muted { color: ${mutedText} !important; }
    .flacko-footer { color: ${footerText} !important; }
    .flacko-button {
      color: ${buttonText} !important;
      text-decoration: none !important;
    }
    [data-ogsc] .flacko-shell, [data-ogsb] .flacko-shell { background-color: ${shellBg} !important; }
    [data-ogsc] .flacko-card, [data-ogsb] .flacko-card { background-color: ${cardBg} !important; }
    [data-ogsc] .flacko-title, [data-ogsb] .flacko-title { color: ${headingText} !important; }
    [data-ogsc] .flacko-muted, [data-ogsb] .flacko-muted { color: ${mutedText} !important; }
    [data-ogsc] .flacko-footer, [data-ogsb] .flacko-footer { color: ${footerText} !important; }
    [data-ogsc] .flacko-button, [data-ogsb] .flacko-button { color: ${buttonText} !important; }
  </style>
</head>
<body class="flacko-shell" bgcolor="${shellBg}" style="margin:0;padding:0;background-color:${shellBg} !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${shellBg}" class="flacko-shell" style="background-color:${shellBg} !important;padding:32px 16px;">
  <tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

    <!-- Header -->
    <tr><td bgcolor="${cardBg}" class="flacko-card" style="background-color:${cardBg} !important;border-left:4px solid ${modeColor};border-radius:14px 14px 0 0;padding:24px 28px 18px;">
      <p class="flacko-muted" style="margin:0 0 6px 0;font-size:11px;color:${mutedText} !important;text-transform:uppercase;letter-spacing:1.5px;">Flacko AI</p>
      <h1 class="flacko-title" style="margin:0;font-size:20px;line-height:1.3;font-weight:700;color:${headingText} !important;">${title}</h1>
    </td></tr>

    <!-- Body -->
    <tr><td bgcolor="${cardBg}" class="flacko-card" style="background-color:${cardBg} !important;padding:6px 28px 10px;">
      <div style="color:${bodyText} !important;font-size:16px;line-height:1.82;font-weight:500;">${body}</div>
    </td></tr>

    <!-- CTA -->
    <tr><td bgcolor="${cardBg}" class="flacko-card" style="background-color:${cardBg} !important;padding:18px 28px 28px;border-radius:0 0 14px 14px;text-align:center;">
      <a href="https://flacko.ai/report" class="flacko-button" style="display:inline-block;background-color:${modeColor} !important;color:${buttonText} !important;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:15px;font-weight:700;">View Full Report →</a>
      <p class="flacko-footer" style="margin:16px 0 0;font-size:12px;color:${footerText} !important;line-height:1.6;">
        © 2026 Flacko AI · Not financial advice ·
        <a href="https://flacko.ai/settings" class="flacko-footer" style="color:${footerText} !important;text-decoration:underline;">Manage preferences</a>
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
    const embed = body?.embed as DiscordEmbed | undefined;

    if (!embed) {
      return NextResponse.json({ error: "embed required in request body" }, { status: 400 });
    }

    const color = embed.color || 16711680;
    const modeLabel =
      color === 65280 ? "GREEN" : color === 16776960 ? "YELLOW" : color === 16744448 ? "ORANGE" : "RED";
    const modeEmoji: Record<string, string> = { GREEN: "🟢", YELLOW: "🟡", ORANGE: "🟠", RED: "🔴" };
    const shortDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Chicago",
    });
    const subject = `${modeEmoji[modeLabel] || "🔴"} TSLA Morning Brief — ${modeLabel} MODE — ${shortDate}`;
    const html = buildEmailHtml(embed);

    // TEST MODE: single address only
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
