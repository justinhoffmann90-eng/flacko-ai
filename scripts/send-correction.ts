import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendCorrection() {
  // Get all active subscribers with email alerts
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("user_id, users!inner(id, email)")
    .eq("status", "active");

  if (!subs || subs.length === 0) {
    console.log("No active subscribers found");
    return;
  }

  const emails = subs.map((s: any) => s.users?.email).filter(Boolean);
  console.log(`Sending correction to ${emails.length} subscribers`);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
</head>
<body style="background-color: #0a0a0a; color: #e5e5e5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 24px; background-color: #1a1a2e; border: 1px solid #f97316; border-radius: 8px;">
        <h2 style="color: #f97316; margin: 0 0 16px 0; font-size: 18px;">
          ⚠️ CORRECTION — Previous Alert Error
        </h2>
        <p style="color: #e5e5e5; margin: 0 0 16px 0; line-height: 1.6;">
          The alert you received for TSLA at <strong>$423.75</strong> incorrectly stated <strong>"Exit all positions if breached."</strong>
        </p>
        <p style="color: #e5e5e5; margin: 0 0 16px 0; line-height: 1.6;">
          This was a system error. The correct action per today's report is:
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
          <tr>
            <td style="background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 16px;">
              <p style="color: #fbbf24; margin: 0 0 8px 0; font-weight: bold;">$423.75 (Weekly 21 EMA) — Step 2: Cut leverage, hold shares</p>
              <p style="color: #94a3b8; margin: 0; font-size: 14px;">This is NOT a full exit level. It means reduce leveraged positions only.</p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
          <tr>
            <td style="background-color: #450a0a; border: 1px solid #ef4444; border-radius: 6px; padding: 16px;">
              <p style="color: #fca5a5; margin: 0; font-weight: bold;">Actual Full Exit Level: $380 (Put Wall)</p>
              <p style="color: #fca5a5; margin: 4px 0 0 0; font-size: 14px;">This is where the report calls for trimming to 50%.</p>
            </td>
          </tr>
        </table>
        <p style="color: #94a3b8; margin: 0; font-size: 13px; line-height: 1.5;">
          We sincerely apologize for the confusion. The bug has been fixed and this will not happen again. 
          Please refer to the <a href="https://www.flacko.ai/dashboard" style="color: #60a5fa;">daily report</a> for the full breakdown.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 0 0 0; text-align: center;">
        <p style="color: #525252; font-size: 12px; margin: 0;">Flacko AI — flacko.ai</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "alerts@flacko.ai",
        to: email,
        subject: "⚠️ CORRECTION — Previous TSLA Alert Was Incorrect",
        html,
      });
      sent++;
      console.log(`✅ Sent to ${email}`);
    } catch (e: any) {
      failed++;
      console.error(`❌ Failed: ${email} — ${e.message}`);
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed`);
}

sendCorrection().catch(console.error);
