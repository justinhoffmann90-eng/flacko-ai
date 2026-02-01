import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";

// Password reset via Resend (replaces Supabase's broken email)
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Check if user exists
    const { data: users, error: lookupError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (lookupError || !users?.length) {
      // Log the failure internally (but don't reveal to client)
      console.error("Password reset requested for non-existent email:", email, lookupError?.message);
      
      // Alert via Telegram if lookup error (not just "user doesn't exist")
      if (lookupError) {
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: `⚠️ **Password Reset DB Error**\n\nEmail: ${email}\nError: ${lookupError.message}`,
              parse_mode: 'Markdown'
            })
          });
        } catch (e) {
          console.error('Failed to send Telegram alert:', e);
        }
      }
      
      // Don't reveal if email exists or not (security)
      return NextResponse.json({ success: true });
    }

    // Generate recovery link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: "https://www.flacko.ai/reset-password",
      },
    });

    if (linkError) {
      console.error("Failed to generate recovery link:", linkError);
      
      // Alert via Telegram
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🚨 **Password Reset Link Generation Failed**\n\nEmail: ${email}\nError: ${JSON.stringify(linkError)}`,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error('Failed to send Telegram alert:', e);
      }
      
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    if (!linkData?.properties?.action_link) {
      console.error("No action_link in response");
      
      // Alert via Telegram
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🚨 **Password Reset No Link Generated**\n\nEmail: ${email}\nNo action_link in response`,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error('Failed to send Telegram alert:', e);
      }
      
      return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
    }

    // Send via Resend
    const { error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Reset Your Password | Flacko AI",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #18181b; border-radius: 12px; border: 1px solid #27272a;">
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #27272a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Flacko AI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Reset Your Password</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                Click the button below to reset your password and access your trading dashboard.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${linkData.properties.action_link}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #0a0a0a; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Reset Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                This link expires in 24 hours. If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                © 2026 Flacko AI · TSLA Trading Intelligence
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (emailError) {
      console.error("Failed to send email via Resend:", emailError);
      
      // Alert via Telegram
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🚨 **Password Reset Email Send Failed**\n\nEmail: ${email}\nResend Error: ${JSON.stringify(emailError)}`,
            parse_mode: 'Markdown'
          })
        });
      } catch (e) {
        console.error('Failed to send Telegram alert:', e);
      }
      
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Password reset error:", error);
    
    // Alert via Telegram
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🚨 **Password Reset Exception**\n\nError: ${errorMsg}`,
          parse_mode: 'Markdown'
        })
      });
    } catch (e) {
      console.error('Failed to send Telegram alert:', e);
    }
    
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
