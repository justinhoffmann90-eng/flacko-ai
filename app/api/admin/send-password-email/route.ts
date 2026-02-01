import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";

// Admin-only endpoint to manually send password setup email
// DELETE THIS FILE after use - it's a one-time fix
export async function POST(request: Request) {
  try {
    const { email, adminSecret } = await request.json();

    // Simple protection - must know the secret
    if (adminSecret !== "flacko-admin-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Generate magic link - direct to reset-password (client handles hash tokens)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://www.flacko.ai/reset-password",
      },
    });

    if (linkError) {
      console.error("Failed to generate link:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    if (!linkData?.properties?.action_link) {
      return NextResponse.json({ error: "No link generated" }, { status: 500 });
    }

    // Send via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Set Your Password | Flacko AI",
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
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Set Your Password</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                Welcome to Flacko AI! Click the button below to set your password and access your trading dashboard.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${linkData.properties.action_link}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #0a0a0a; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Set Password →
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
      console.error("Failed to send email:", emailError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Debug: log the actual link being sent
    console.log("Generated action_link:", linkData.properties.action_link);
    
    return NextResponse.json({ 
      success: true, 
      emailId: emailData?.id,
      debug_link: linkData.properties.action_link 
    });
  } catch (error) {
    console.error("Admin email error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
