import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchRealtimePrice } from "@/lib/price/fetcher";
import { sendAlertMessage, DiscordSendResult } from "@/lib/discord/client";
import { getAlertDiscordMessage } from "@/lib/discord/templates";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { getAlertEmailHtml } from "@/lib/resend/templates";
import { TrafficLightMode, ReportAlert } from "@/types";

export const maxDuration = 30;

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
  errorMessage?: string,
  discordMessageId?: string,
  discordChannelId?: string,
) {
  try {
    await supabase.from("discord_alert_log").insert({
      job_name: "check-alerts",
      channel_name: channelName,
      status: success ? "success" : "failed",
      message_preview: `${alertCount} alerts triggered at $${price.toFixed(2)}`,
      error_message: errorMessage || null,
      discord_message_id: discordMessageId || null,
      discord_channel_id: discordChannelId || null,
    });
    if (discordMessageId) {
      console.log(`[ALERT LOG] message_id=${discordMessageId} stored — alert can be deleted/edited if needed`);
    }
  } catch (error) {
    console.error("Failed to log alert delivery:", error);
  }
}

export async function GET(request: Request) {
  // Verify cron secret
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if within market hours (9:30 AM - 4:00 PM ET, Mon-Fri, excluding holidays)
  // Convert to ET for market hours check
  const now = new Date();
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = etTime.getHours();
  const minute = etTime.getMinutes();
  const day = etTime.getDay(); // 0=Sun, 6=Sat
  
  // US stock market holidays (NYSE/NASDAQ) — MM-DD format for fixed dates
  // Floating holidays use helper function below
  const year = etTime.getFullYear();
  const month = etTime.getMonth(); // 0-indexed
  const date = etTime.getDate();
  const dayOfWeek = etTime.getDay();
  
  function isMarketHoliday(): boolean {
    // New Year's Day — Jan 1 (or observed on nearest weekday)
    if (month === 0 && date === 1) return true;
    if (month === 0 && date === 2 && dayOfWeek === 1) return true; // observed Monday
    if (month === 11 && date === 31 && dayOfWeek === 5) return true; // observed Friday
    
    // MLK Day — 3rd Monday of January
    if (month === 0 && dayOfWeek === 1 && date >= 15 && date <= 21) return true;
    
    // Presidents' Day — 3rd Monday of February
    if (month === 1 && dayOfWeek === 1 && date >= 15 && date <= 21) return true;
    
    // Good Friday — varies (approximate: skip for now, add specific dates per year)
    // 2025: Apr 18, 2026: Apr 3, 2027: Mar 26
    const goodFridays: Record<number, string> = {
      2025: "4-18", 2026: "4-3", 2027: "3-26", 2028: "4-14", 2029: "3-30",
    };
    if (goodFridays[year] === `${month + 1}-${date}`) return true;
    
    // Memorial Day — last Monday of May
    if (month === 4 && dayOfWeek === 1 && date >= 25) return true;
    
    // Juneteenth — June 19 (or observed)
    if (month === 5 && date === 19) return true;
    if (month === 5 && date === 20 && dayOfWeek === 1) return true;
    if (month === 5 && date === 18 && dayOfWeek === 5) return true;
    
    // Independence Day — July 4 (or observed)
    if (month === 6 && date === 4) return true;
    if (month === 6 && date === 5 && dayOfWeek === 1) return true;
    if (month === 6 && date === 3 && dayOfWeek === 5) return true;
    
    // Labor Day — 1st Monday of September
    if (month === 8 && dayOfWeek === 1 && date <= 7) return true;
    
    // Thanksgiving — 4th Thursday of November
    if (month === 10 && dayOfWeek === 4 && date >= 22 && date <= 28) return true;
    
    // Christmas — Dec 25 (or observed)
    if (month === 11 && date === 25) return true;
    if (month === 11 && date === 26 && dayOfWeek === 1) return true;
    if (month === 11 && date === 24 && dayOfWeek === 5) return true;
    
    return false;
  }
  
  const isWeekday = day >= 1 && day <= 5;
  const isHoliday = isMarketHoliday();
  const timeInMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;  // 9:30 AM ET
  const marketClose = 16 * 60;      // 4:00 PM ET
  const isMarketHours = timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
  
  if (!isWeekday || !isMarketHours || isHoliday) {
    return NextResponse.json({ 
      status: "skipped", 
      reason: isHoliday ? "market holiday" : "outside market hours",
      time: etTime.toISOString(),
      isWeekday,
      isMarketHours,
      isHoliday,
    });
  }

  try {
    const supabase = await createServiceClient();

    // Fetch current TSLA price
    const currentPrice = await fetchRealtimePrice();

    // Update system config with last price and pending alert count
    const { data: pendingCount } = await supabase
      .from("report_alerts")
      .select("id", { count: "exact", head: true })
      .is("triggered_at", null);
    
    const configToSave = {
      key: "alert_system_status",
      value: {
        enabled: true,
        last_run: new Date().toISOString(),
        last_price: currentPrice,
        pending_alerts: pendingCount || 0,
      },
    };
    await (supabase.from("system_config") as unknown as { upsert: (data: typeof configToSave) => Promise<unknown> })
      .upsert(configToSave);

    // Get the LATEST report for context (not just today's - reports may be for next trading day)
    const { data: report } = await supabase
      .from("reports")
      .select("id, extracted_data, report_date")
      .or("report_type.is.null,report_type.eq.daily")
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
    const missedAlerts: typeof pendingAlerts = [];
    const now = Date.now();

    for (const alert of pendingAlerts) {
      const shouldTrigger =
        (alert.type === "upside" && currentPrice >= alert.price) ||
        (alert.type === "downside" && currentPrice <= alert.price);

      if (shouldTrigger) {
        // SAFEGUARD: Check if this is a "stale" alert from a recent parser update
        // If alert was created in the last 5 minutes AND price has already moved
        // significantly past the level, mark as missed instead of triggering
        const alertCreatedAt = alert.created_at ? new Date(alert.created_at).getTime() : 0;
        const alertAgeMs = now - alertCreatedAt;
        const isRecentlyCreated = alertAgeMs < 5 * 60 * 1000; // Less than 5 minutes old
        
        // Calculate how far price has moved past the alert level
        const priceDiff = Math.abs(currentPrice - alert.price);
        const priceDiffPercent = (priceDiff / alert.price) * 100;
        const hasMovedPastSignificantly = priceDiffPercent > 0.75; // More than 0.75% past level
        
        if (isRecentlyCreated && hasMovedPastSignificantly) {
          // This alert was just created but price already blew past it
          // Mark as missed to prevent late/stale alerts
          missedAlerts.push(alert);
          console.log(`[STALE ALERT] Marking as missed: ${alert.level_name} @ $${alert.price} (price: $${currentPrice.toFixed(2)}, diff: ${priceDiffPercent.toFixed(2)}%, age: ${Math.round(alertAgeMs / 1000)}s)`);
          
          await supabase
            .from("report_alerts")
            .update({
              triggered_at: new Date().toISOString(),
            })
            .eq("id", alert.id);
          
          continue;
        }

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
    
    // Log missed alerts for monitoring
    if (missedAlerts.length > 0) {
      console.log(`[ALERT SYSTEM] ${missedAlerts.length} stale alerts marked as missed (not sent to Discord)`);
    }
    
    // CRITICAL: Detect alerts that SHOULD have triggered but didn't
    // This catches logic bugs where price crossed through a level but trigger failed
    const possiblyMissedAlerts: typeof pendingAlerts = [];
    
    for (const alert of pendingAlerts) {
      // Skip if we already processed this alert above
      if (triggeredAlerts.includes(alert) || missedAlerts.includes(alert)) continue;
      
      const alertAgeMs = now - (alert.created_at ? new Date(alert.created_at).getTime() : now);
      const isOldAlert = alertAgeMs > 30 * 60 * 1000; // More than 30 minutes old
      
      // Check if price has moved significantly PAST this alert level
      // This suggests price crossed through but alert didn't fire
      const priceDiff = currentPrice - alert.price;
      const priceDiffPercent = Math.abs(priceDiff / alert.price) * 100;
      
      // For UPSIDE alerts: price should be BELOW the level, waiting to rise
      // If price is significantly ABOVE an old upside alert, it was missed
      const missedUpside = alert.type === "upside" && priceDiff > 0 && priceDiffPercent > 1.5;
      
      // For DOWNSIDE alerts: price should be ABOVE the level, waiting to fall
      // If price is significantly BELOW an old downside alert, it was missed  
      const missedDownside = alert.type === "downside" && priceDiff < 0 && priceDiffPercent > 1.5;
      
      if (isOldAlert && (missedUpside || missedDownside)) {
        possiblyMissedAlerts.push(alert);
      }
    }
    
    // ALERT JUSTIN if we detect possibly missed alerts
    if (possiblyMissedAlerts.length > 0) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
      
      if (botToken && chatId) {
        const alertList = possiblyMissedAlerts
          .map(a => `• $${a.price} ${a.level_name} (${a.type}) — price is now $${currentPrice.toFixed(2)}`)
          .join("\n");
        
        const message = `🚨 <b>POSSIBLY MISSED ALERTS DETECTED</b> 🚨\n\nThese alerts are >30 min old and price has moved >1.5% past the level without triggering:\n\n${alertList}\n\n<b>Action needed:</b> Check if these should have fired. May indicate a bug in alert type classification.`;
        
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "HTML",
            }),
          });
        } catch (e) {
          console.error("Failed to send missed alert notification:", e);
        }
      }
      
      console.error(`[CRITICAL] Possibly missed alerts detected: ${possiblyMissedAlerts.map(a => `${a.level_name}@$${a.price}`).join(", ")}`);
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
      key_levels?: {
        hedge_wall?: number;
        gamma_strike?: number;
        put_wall?: number;
        call_wall?: number;
        master_eject?: number;
      };
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

    // Build key levels for Discord message
    const discordKeyLevels = extractedData?.key_levels ? {
      callWall: extractedData.key_levels.call_wall,
      hedgeWall: extractedData.key_levels.hedge_wall,
      gammaStrike: extractedData.key_levels.gamma_strike,
      putWall: extractedData.key_levels.put_wall,
    } : undefined;

    // Create in-app notifications for all affected users (batched)
    const userIds = new Set(triggeredAlerts.map((a) => a.user_id));
    const notificationsToInsert = Array.from(userIds).map((userId) => ({
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
    }));
    
    if (notificationsToInsert.length > 0) {
      await supabase.from("notifications").insert(notificationsToInsert);
    }

    // Build the alerts array once (same for all users)
    const alertsToSend = Array.from(uniqueAlerts.values());

    // Build key levels from report data (once, not per-user)
    const masterEjectData = (report.extracted_data as any)?.master_eject;
    const keyLevels = extractedData?.key_levels ? {
      hedgeWall: extractedData.key_levels.hedge_wall,
      gammaStrike: extractedData.key_levels.gamma_strike,
      putWall: extractedData.key_levels.put_wall,
      callWall: extractedData.key_levels.call_wall,
      masterEject: extractedData.key_levels.master_eject,
      masterEjectAction: masterEjectData?.action,
    } : undefined;

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send email alerts to ALL active subscribers with email_alerts enabled
    // Batch query to avoid N+1: fetch subscribers with their settings and email in one go
    try {
      // Query subscribers and their emails (user_settings queried separately - no FK to subscriptions)
      const { data: subscribersWithDetails } = await supabase
        .from("subscriptions")
        .select(`
          user_id,
          users!inner(id, email)
        `)
        .in("status", ["active", "comped", "trial"]);

      // Get all user_settings to check email_alerts preference
      const userIds = (subscribersWithDetails || []).map((s: any) => s.user_id);
      const { data: allSettings } = await supabase
        .from("user_settings")
        .select("user_id, email_alerts")
        .in("user_id", userIds);
      
      const settingsMap = new Map((allSettings || []).map((s: any) => [s.user_id, s]));

      // Filter to subscribers with email alerts enabled
      const eligibleSubscribers = (subscribersWithDetails || []).filter((sub) => {
        const settings = settingsMap.get((sub as any).user_id);
        // Default to true if no settings or email_alerts not explicitly set
        const emailAlertsEnabled = !settings || (settings as any).email_alerts !== false;
        const email = (sub as any).users?.email;
        return emailAlertsEnabled && email;
      });

      console.log(`Checking email alerts for ${eligibleSubscribers.length} eligible subscribers`);

      // Build batch email array (max 100 per batch for Resend)
      const emailBatch = eligibleSubscribers.map((sub) => {
        const userEmail = (sub as any).users?.email as string;
        const html = getAlertEmailHtml({
          userName: userEmail.split("@")[0],
          alerts: alertsToSend,
          currentPrice,
          mode: extractedData?.mode?.current || "yellow",
          reportDate: report.report_date,
          keyLevels,
          positioning: extractedData?.positioning?.posture,
        });

        return {
          from: EMAIL_FROM,
          to: userEmail,
          subject: `TSLA Alert: $${currentPrice.toFixed(2)} - ${alertsToSend.map(a => a.level_name).join(", ")}`,
          html,
        };
      });

      // Send all emails in a single batch request
      if (emailBatch.length > 0) {
        try {
          const batchResult = await resend.batch.send(emailBatch);
          
          if (batchResult.data) {
            emailsSent = batchResult.data.length;
            console.log(`📧 Batch sent ${emailsSent} email alerts`);
            
            // Bulk update email_sent_at for all triggered alerts
            const allTriggeredAlertIds = triggeredAlerts.map((a) => a.id);
            if (allTriggeredAlertIds.length > 0) {
              await supabase
                .from("report_alerts")
                .update({
                  email_sent_at: new Date().toISOString(),
                })
                .in("id", allTriggeredAlertIds);
            }
          } else {
            emailsFailed = emailBatch.length;
            console.error("Batch email send returned no data");
          }
        } catch (batchError) {
          emailsFailed = emailBatch.length;
          console.error("Batch email send failed:", batchError);
        }
      }

      console.log(`📧 Email delivery: ${emailsSent} sent, ${emailsFailed} failed`);

      // ALERT if email delivery had failures
      if (emailsFailed > 0) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
        if (botToken && chatId) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `⚠️ <b>EMAIL ALERTS PARTIALLY FAILED</b>\n\n${emailsSent} sent, ${emailsFailed} failed\n\nCheck Vercel logs for details.`,
              parse_mode: "HTML",
            }),
          }).catch(e => console.error("Failed to send email failure notification:", e));
        }
      }
    } catch (emailDeliveryError) {
      emailsFailed++;
      console.error("Email delivery section failed:", emailDeliveryError);
    }

    // Send Discord alert (single message to #alerts channel)
    const discordMessage = getAlertDiscordMessage({
      alerts: alertsToSend,
      mode: extractedData?.mode?.current || "yellow",
      positioning: extractedData?.positioning?.posture || "",
      keyLevels: discordKeyLevels,
      masterEject: extractedData?.key_levels?.master_eject,
    });

    let discordSent = false;
    let discordMessageId: string | undefined;
    let telegramBackup = false;

    try {
      const discordResult: DiscordSendResult = await sendAlertMessage(discordMessage);
      discordSent = discordResult.success;
      discordMessageId = discordResult.messageId;

      // Log the delivery attempt — now includes message ID so we can delete/edit if needed
      await logAlertDelivery(
        supabase,
        "alerts",
        discordSent,
        triggeredAlerts.length,
        currentPrice,
        discordSent ? undefined : (discordResult.error || "Discord webhook failed"),
        discordMessageId,
        process.env.DISCORD_ALERTS_CHANNEL_ID,
      );

      // CRITICAL: If Discord failed, send backup via Telegram
      if (!discordSent) {
        const alertList = alertsToSend
          .map(a => `• $${a.price} - ${a.level_name}`)
          .join("\n");

        const backupMessage = `🚨 <b>DISCORD ALERT FAILED</b> 🚨\n\nTSLA: $${currentPrice.toFixed(2)}\n\nAlerts that should have fired:\n${alertList}\n\n⚠️ Discord webhook is broken. Check Vercel env vars.`;

        telegramBackup = await sendTelegramBackup(backupMessage);
        console.error(`Discord alert failed! Telegram backup: ${telegramBackup ? "sent" : "also failed"}`);
      }
    } catch (discordError) {
      console.error("Discord delivery section failed:", discordError);
    }

    return NextResponse.json({
      success: true,
      price: currentPrice,
      triggeredCount: triggeredAlerts.length,
      discordSent,
      discordMessageId: discordMessageId || null,
      telegramBackup,
      emailsSent,
      emailsFailed,
    });
  } catch (error) {
    console.error("Alert check error:", error);
    
    // Try to send Telegram notification about the crash
    await sendTelegramBackup(`🚨 <b>ALERT SYSTEM CRASHED</b> 🚨\n\nError: ${error instanceof Error ? error.message : "Unknown error"}\n\nCheck Vercel logs immediately.`);
    
    return NextResponse.json({ error: "Alert check failed" }, { status: 500 });
  }
}
