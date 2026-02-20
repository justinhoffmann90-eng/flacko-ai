/**
 * Orb Zone Downside Alerts
 * 
 * Sends email when the Orb Score zone transitions DOWN to CAUTION or DEFENSIVE.
 * One alert per day max. No upward transition alerts.
 */
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type OrbZone = "FULL_SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";

const ZONE_RANK: Record<string, number> = {
  FULL_SEND: 3,
  NEUTRAL: 2,
  CAUTION: 1,
  DEFENSIVE: 0,
};

interface ZoneAlertMessage {
  subject: string;
  headline: string;
  body: string;
  action: string;
}

function getAlertMessage(prevZone: OrbZone, newZone: OrbZone): ZoneAlertMessage | null {
  // CAUTION -> DEFENSIVE escalation
  if (prevZone === "CAUTION" && newZone === "DEFENSIVE") {
    return {
      subject: "🔴 Orb escalated from CAUTION to DEFENSIVE",
      headline: "Orb escalated from CAUTION to DEFENSIVE",
      body: "Conditions have worsened. Historically -1.84% avg at 20 days, -6.73% at 60 days.",
      action: "If you haven't already, exit leveraged positions now.",
    };
  }

  // Any higher zone -> DEFENSIVE
  if (newZone === "DEFENSIVE" && ZONE_RANK[prevZone] > ZONE_RANK[newZone]) {
    return {
      subject: "🔴 Orb shifted to DEFENSIVE",
      headline: "Orb shifted to DEFENSIVE",
      body: "Multiple warning signals active. These conditions historically contain the worst TSLA drawdowns.",
      action: "Exit leveraged positions. Preserve capital.",
    };
  }

  // FULL_SEND or NEUTRAL -> CAUTION
  if (newZone === "CAUTION" && (prevZone === "FULL_SEND" || prevZone === "NEUTRAL")) {
    return {
      subject: "🟡 Orb shifted to CAUTION",
      headline: "Orb shifted to CAUTION",
      body: "Warning signals are now active. Conditions historically average -1.24% over the next 20 trading days.",
      action: "Take profits on leveraged positions. No new entries.",
    };
  }

  return null; // No alert for upward transitions
}

function buildEmailHtml(msg: ZoneAlertMessage, zone: OrbZone): string {
  const zoneColor = zone === "DEFENSIVE" ? "#ef4444" : "#eab308";
  const zoneEmoji = zone === "DEFENSIVE" ? "🔴" : "🟡";
  const zoneName = zone === "DEFENSIVE" ? "DEFENSIVE" : "CAUTION";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:14px;letter-spacing:0.12em;color:#666;font-family:monospace;">FLACKO AI</span>
    </div>
    
    <div style="background:${zoneColor}10;border:1px solid ${zoneColor}30;border-radius:12px;padding:24px;margin-bottom:24px;">
      <div style="font-size:28px;font-weight:800;color:${zoneColor};margin-bottom:8px;font-family:monospace;">
        ${zoneEmoji} ${zoneName}
      </div>
      <div style="font-size:16px;color:#e0e0e0;line-height:1.6;margin-bottom:16px;">
        ${msg.body}
      </div>
      <div style="font-size:15px;font-weight:700;color:#fff;background:${zoneColor}20;border:1px solid ${zoneColor}40;border-radius:8px;padding:12px 16px;">
        Action: ${msg.action}
      </div>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://www.flacko.ai/orb" style="display:inline-block;background:${zoneColor};color:#000;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:monospace;">
        Open Orb Dashboard
      </a>
    </div>

    <div style="font-size:13px;color:#666;text-align:center;line-height:1.5;">
      Check tonight's report for levels and context.<br>
      <span style="font-size:11px;color:#444;">Orb Score v3 -- 1,005 trading days validated</span>
    </div>
  </div>
</body>
</html>`;
}

export async function sendDownsideZoneAlert(
  supabase: SupabaseClient,
  prevZone: string,
  newZone: string,
  date: string,
): Promise<{ sent: boolean; reason: string }> {
  // Only alert on downside transitions
  const msg = getAlertMessage(prevZone as OrbZone, newZone as OrbZone);
  if (!msg) return { sent: false, reason: "not_downside_transition" };

  // Frequency protection: max 1 alert per day
  const { data: lastAlert } = await supabase
    .from("orb_signal_log")
    .select("event_date")
    .eq("setup_id", "orb-zone-alert")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastAlert?.event_date === date) {
    return { sent: false, reason: "already_sent_today" };
  }

  // Get all active subscribers with email
  const { data: subscribers } = await supabase
    .from("subscriptions")
    .select("user_id, users!inner(email)")
    .in("status", ["active", "trial", "comped"]);

  if (!subscribers?.length) {
    return { sent: false, reason: "no_subscribers" };
  }

  const emails = subscribers
    .map((s: any) => s.users?.email)
    .filter(Boolean) as string[];

  if (!emails.length) {
    return { sent: false, reason: "no_emails" };
  }

  // Send emails individually to protect subscriber privacy
  const html = buildEmailHtml(msg, newZone as OrbZone);
  let sentCount = 0;

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: msg.subject,
        html,
      });
      sentCount++;
    } catch (err) {
      console.error("[ORB_ZONE_ALERT] Email send failed:", err);
    }
  }

  // Log the alert
  await supabase.from("orb_signal_log").insert({
    setup_id: "orb-zone-alert",
    event_type: "downside_alert",
    event_date: date,
    previous_status: prevZone,
    new_status: newZone,
    notes: `Sent ${sentCount} emails: ${msg.subject}`,
  });

  return { sent: true, reason: `sent_to_${sentCount}_subscribers` };
}
