import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchRealtimePrice } from "@/lib/price/fetcher";
import { sendAlertMessage } from "@/lib/discord/client";
import { getAlertDiscordMessage } from "@/lib/discord/templates";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { getAlertEmailHtml } from "@/lib/resend/templates";
import { TrafficLightMode, ReportAlert } from "@/types";

// Telegram backup notification for critical failures
async function sendTelegramBackup(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID; // Justin's chat ID
  
  if (!botToken || !chatId) {
    console.error("Telegram backup not configured - TELEGRAM_BOT_TOKEN or TELEGRAM_ALERT_CHAT_ID missing");
    return false;
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Telegram backup failed:", error);
    return false;
  }
}

// Log alert delivery attempt to database
async function logAlertDelivery(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  channelName: string,
  success: boolean,
  alertCount: number,
  price: number,
  errorMessage?: string
) {
  try {
    await supabase.from("discord_alert_log").insert({
      job_name: "check-alerts",
      channel_name: channelName,
      status: success ? "success" : "failed",
      message_preview: `${alertCount} alerts triggered at $${price.toFixed(2)}`,
      error_message: errorMessage || null,
    });
  } catch (error) {
    console.error("Failed to log alert delivery:", error);
  }
}

export async function GET(request: Request) {
  // Verify cron secret (temporary: also allow hardcoded secret for debugging)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;
  const hardcodedSecret = "58154a5d97165f1d9d5abb2d839782e682835fee057ba8c8acfca26c24305a9e";

  if (authHeader !== `Bearer ${expectedSecret}` && authHeader !== `Bearer ${hardcodedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // Fetch current TSLA price
    const currentPrice = await fetchRealtimePrice();

    // Update system config with last price
    const configToSave = {
      key: "alert_system_status",
      value: {
        enabled: true,
        last_run: new Date().toISOString(),
        last_price: currentPrice,
      },
    };
    await (supabase.from("system_config") as unknown as { upsert: (data: typeof configToSave) => Promise<unknown> })
      .upsert(configToSave);

    // Get the LATEST report for context (not just today's - reports may be for next trading day)
    const { data: report } = await supabase
      .from("reports")
      .select("id, extracted_data, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (!report) {
      return NextResponse.json({
        message: "No reports found",
        price: currentPrice,
      });
    }

    // Get untriggered alerts for today's report
    const { data: pendingAlerts } = await supabase
      .from("report_alerts")
      .select(`
        *,
        users (email)
      `)
      .eq("report_id", report.id)
      .is("triggered_at", null);

    if (!pendingAlerts || pendingAlerts.length === 0) {
      return NextResponse.json({
        message: "No pending alerts",
        price: currentPrice,
      });
    }

    // Check each alert
    const triggeredAlerts: typeof pendingAlerts = [];

    for (const alert of pendingAlerts) {
      const shouldTrigger =
        (alert.type === "upside" && currentPrice >= alert.price) ||
        (alert.type === "downside" && currentPrice <= alert.price);

      if (shouldTrigger) {
        triggeredAlerts.push(alert);

        // Mark as triggered
        await supabase
          .from("report_alerts")
          .update({
            triggered_at: new Date().toISOString(),
          })
          .eq("id", alert.id);
      }
    }

    if (triggeredAlerts.length === 0) {
      return NextResponse.json({
        message: "No alerts triggered",
        price: currentPrice,
      });
    }

    const extractedData = report.extracted_data as {
      mode?: { current: TrafficLightMode };
      positioning?: { posture?: string };
    };

    // Get unique alerts (deduplicate by price/type since multiple users may have same alert)
    const uniqueAlerts = new Map<string, ReportAlert>();
    for (const alert of triggeredAlerts) {
      const key = `${alert.type}-${alert.price}`;
      if (!uniqueAlerts.has(key)) {
        uniqueAlerts.set(key, {
          type: alert.type as "upside" | "downside",
          level_name: alert.level_name,
          price: alert.price,
          action: alert.action,
          reason: alert.reason || "",
        });
      }
    }

    // Send Discord alert (single message to #alerts channel)
    const discordMessage = getAlertDiscordMessage({
      alerts: Array.from(uniqueAlerts.values()),
      mode: extractedData?.mode?.current || "yellow",
      positioning: extractedData?.positioning?.posture || "",
    });

    const discordSent = await sendAlertMessage(discordMessage);
    
    // Log the delivery attempt
    await logAlertDelivery(
      supabase,
      "alerts",
      discordSent,
      triggeredAlerts.length,
      currentPrice,
      discordSent ? undefined : "Discord webhook failed"
    );

    // CRITICAL: If Discord failed, send backup via Telegram
    if (!discordSent) {
      const alertList = Array.from(uniqueAlerts.values())
        .map(a => `• $${a.price} - ${a.level_name}`)
        .join("\n");
      
      const backupMessage = `🚨 <b>DISCORD ALERT FAILED</b> 🚨\n\nTSLA: $${currentPrice.toFixed(2)}\n\nAlerts that should have fired:\n${alertList}\n\n⚠️ Discord webhook is broken. Check Vercel env vars.`;
      
      const telegramSent = await sendTelegramBackup(backupMessage);
      
      console.error(`Discord alert failed! Telegram backup: ${telegramSent ? "sent" : "also failed"}`);
      
      return NextResponse.json({
        success: false,
        price: currentPrice,
        triggeredCount: triggeredAlerts.length,
        discordSent: false,
        telegramBackup: telegramSent,
        error: "Discord delivery failed - backup notification attempted",
      });
    }

    // Create in-app notifications for all affected users
    const userIds = new Set(triggeredAlerts.map((a) => a.user_id));
    for (const userId of userIds) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "alert_triggered",
        title: `Alert Triggered`,
        body: `TSLA hit $${currentPrice.toFixed(2)}`,
        metadata: {
          price: currentPrice,
          alerts: triggeredAlerts
            .filter((a) => a.user_id === userId)
            .map((a) => a.level_name),
        },
      });
    }

    // Send email alerts to users who have email_alerts enabled
    let emailsSent = 0;
    for (const userId of userIds) {
      // Check if user has email_alerts enabled (defaults to true if not set)
      const { data: settings } = await supabase
        .from("user_settings")
        .select("email_alerts")
        .eq("user_id", userId)
        .single();

      // Default to true if no settings or email_alerts not explicitly set
      const emailAlertsEnabled = settings?.email_alerts !== false;

      if (!emailAlertsEnabled) {
        continue;
      }

      // Get user email
      const { data: userData } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (!userData?.email) {
        continue;
      }

      // Get this user's triggered alerts
      const userAlerts = triggeredAlerts
        .filter((a) => a.user_id === userId)
        .map((a) => ({
          type: a.type as "upside" | "downside",
          level_name: a.level_name,
          price: a.price,
          action: a.action,
          reason: a.reason || "",
        }));

      try {
        const html = getAlertEmailHtml({
          userName: userData.email.split("@")[0],
          alerts: userAlerts,
          currentPrice,
          mode: extractedData?.mode?.current || "yellow",
          reportDate: report.report_date,
        });

        await resend.emails.send({
          from: EMAIL_FROM,
          to: userData.email,
          subject: `🚨 TSLA Alert: $${currentPrice.toFixed(2)} - ${userAlerts.map(a => a.level_name).join(", ")}`,
          html,
        });

        emailsSent++;
        console.log(`Email alert sent to ${userData.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${userData.email}:`, emailError);
      }
    }

    return NextResponse.json({
      success: true,
      price: currentPrice,
      triggeredCount: triggeredAlerts.length,
      discordSent: true,
      emailsSent,
    });
  } catch (error) {
    console.error("Alert check error:", error);
    
    // Try to send Telegram notification about the crash
    await sendTelegramBackup(`🚨 <b>ALERT SYSTEM CRASHED</b> 🚨\n\nError: ${error instanceof Error ? error.message : "Unknown error"}\n\nCheck Vercel logs immediately.`);
    
    return NextResponse.json({ error: "Alert check failed" }, { status: 500 });
  }
}
