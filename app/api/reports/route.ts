import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseReport, PARSER_VERSION, validateReport } from "@/lib/parser";
import { sendReportNotification } from "@/lib/discord/client";
import { getNewReportDiscordMessage } from "@/lib/discord/templates";
import { logReportGeneration, logApiError } from "@/lib/api-logger";
import fs from "fs";
import path from "path";
import os from "os";

export async function GET() {
  try {
    const supabase = await createClient();
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";

    if (!devBypass) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";

    if (!devBypass) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if admin
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!userData?.is_admin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    const { markdown } = await request.json();

    if (!markdown) {
      return NextResponse.json({ error: "Markdown content required" }, { status: 400 });
    }

    // Parse the report
    const { parsed_data, extracted_data, warnings } = parseReport(markdown);

    // Validate
    const validationErrors = validateReport(extracted_data);
    if (validationErrors.length > 0) {
      await logReportGeneration({
        reportDate: new Date().toISOString().split("T")[0],
        status: 'failed',
        source: 'api',
        errorMessage: validationErrors.join(', '),
      });
      return NextResponse.json({
        error: "Validation failed",
        errors: validationErrors,
      }, { status: 400 });
    }

    // CRITICAL: Validate alerts were extracted
    // This prevents silent failures where report format doesn't match parser
    const alertCount = extracted_data.alerts?.length || 0;
    if (alertCount === 0) {
      const alertWarning = "⚠️ NO ALERTS EXTRACTED - Parser may not support this report format";
      warnings.push(alertWarning);
      
      // Send Telegram notification about missing alerts
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
      if (botToken && chatId) {
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `🚨 <b>ALERT EXTRACTION FAILED</b> 🚨\n\nReport uploaded but <b>0 alerts</b> were extracted!\n\nThis means price alerts will NOT work for this report.\n\n<b>Possible causes:</b>\n• Report format doesn't match parser\n• Missing "Alert Levels" or "Alerts to Set" section\n• Table format changed\n\nCheck parser warnings and report format immediately.`,
              parse_mode: "HTML",
            }),
          });
        } catch (e) {
          console.error("Failed to send Telegram alert about missing alerts:", e);
        }
      }
      
      console.error("⚠️ CRITICAL: Report uploaded with 0 alerts extracted!");
    } else if (alertCount < 4) {
      // Warn if fewer alerts than expected (typical reports have 6-10 levels)
      const lowAlertWarning = `⚠️ Only ${alertCount} alerts extracted (expected 4+) - some levels may have been missed`;
      warnings.push(lowAlertWarning);
      console.warn(lowAlertWarning);
      
      // Log extracted alerts for debugging
      console.log("Extracted alerts:", JSON.stringify(extracted_data.alerts, null, 2));
    } else {
      console.log(`✅ Extracted ${alertCount} alerts from report`);
      // Log alert summary
      const alertSummary = extracted_data.alerts?.map(a => `${a.type}: $${a.price} (${a.level_name})`).join(', ');
      console.log(`Alert summary: ${alertSummary}`);
    }

    // Get report date (today's date)
    const today = new Date().toISOString().split("T")[0];

    // Insert report
    const { data: report, error: insertError } = await serviceSupabase
      .from("reports")
      .upsert({
        report_date: today,
        raw_markdown: markdown,
        parsed_data,
        extracted_data,
        parser_version: PARSER_VERSION,
        parser_warnings: warnings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "report_date",
      })
      .select()
      .single();

    if (insertError) {
      await logReportGeneration({
        reportDate: today,
        status: 'failed',
        source: 'api',
        errorMessage: insertError.message,
      });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log successful report generation
    await logReportGeneration({
      reportDate: today,
      status: warnings.length > 0 ? 'partial' : 'success',
      source: 'api',
      parseWarnings: warnings,
      fieldsParsed: Object.keys(extracted_data).length,
    });

    // Save MD file to ~/trading_inputs/daily-reports/ for Clawd's workflows
    try {
      const homeDir = os.homedir();
      const dailyReportsDir = path.join(homeDir, "trading_inputs", "daily-reports");
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(dailyReportsDir)) {
        fs.mkdirSync(dailyReportsDir, { recursive: true });
      }
      
      // Save file with standard naming: TSLA_Daily_Report_YYYY-MM-DD.md
      const filename = `TSLA_Daily_Report_${today}.md`;
      const filepath = path.join(dailyReportsDir, filename);
      fs.writeFileSync(filepath, markdown, 'utf-8');
      
      console.log(`✅ Saved report to ${filepath} for Clawd workflows`);
    } catch (fsError) {
      console.error("Failed to save MD file locally:", fsError);
      // Don't fail the whole request if local save fails
    }

    // Create alerts for all active subscribers
    const { data: subscribers, error: subsError } = await serviceSupabase
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "comped"]);

    if (subsError) {
      console.error("❌ Failed to fetch subscribers:", subsError);
      // Alert via Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🚨 <b>ALERT CREATION FAILED</b>\n\nCould not fetch subscribers:\n${subsError.message}\n\nNo alerts were created for this report!`,
            parse_mode: "HTML",
          }),
        }).catch(e => console.error("Telegram alert failed:", e));
      }
    }

    console.log(`📊 Found ${subscribers?.length || 0} active subscribers for alerts`);

    if (subscribers && subscribers.length > 0 && extracted_data.alerts) {
      const alertInserts = [];
      let skippedCount = 0;
      
      for (const sub of subscribers) {
        // Check if user has alerts enabled - use maybeSingle to handle missing rows gracefully
        const { data: settings, error: settingsError } = await serviceSupabase
          .from("user_settings")
          .select("alerts_enabled")
          .eq("user_id", sub.user_id)
          .maybeSingle();

        if (settingsError) {
          console.error(`Failed to fetch settings for user ${sub.user_id}:`, settingsError);
          // Continue with next user instead of breaking
          continue;
        }

        // Default to true if no settings row exists or alerts_enabled is not explicitly false
        const alertsEnabled = settings?.alerts_enabled !== false;
        
        if (alertsEnabled) {
          for (const alert of extracted_data.alerts) {
            alertInserts.push({
              report_id: report.id,
              user_id: sub.user_id,
              price: alert.price,
              type: alert.type,
              level_name: alert.level_name,
              action: alert.action,
              reason: alert.reason,
            });
          }
        } else {
          skippedCount++;
        }
      }

      console.log(`📝 Prepared ${alertInserts.length} alerts for ${subscribers.length - skippedCount} users (${skippedCount} skipped - alerts disabled)`);

      if (alertInserts.length > 0) {
        const { error: insertError } = await serviceSupabase
          .from("report_alerts")
          .upsert(alertInserts, {
            onConflict: "report_id,user_id,price,type",
            ignoreDuplicates: false // Update existing records on conflict
          });
        if (insertError) {
          console.error("❌ Failed to insert alerts:", insertError);
          // Alert via Telegram
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
          if (botToken && chatId) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `🚨 <b>ALERT INSERT FAILED</b>\n\nPrepared ${alertInserts.length} alerts but insert failed:\n${insertError.message}`,
                parse_mode: "HTML",
              }),
            }).catch(e => console.error("Telegram alert failed:", e));
          }
        } else {
          console.log(`✅ Successfully inserted ${alertInserts.length} alerts`);
        }
      }
    } else if (!subscribers || subscribers.length === 0) {
      console.error("⚠️ No subscribers found - this is likely a bug!");
      // Alert via Telegram
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;
      if (botToken && chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🚨 <b>NO SUBSCRIBERS FOUND</b>\n\nReport uploaded but 0 subscribers returned from database.\n\nThis is likely a bug - check SUPABASE_SERVICE_ROLE_KEY in Vercel!`,
            parse_mode: "HTML",
          }),
        }).catch(e => console.error("Telegram alert failed:", e));
      }
    }

    // Send Discord notification for new report (full template)
    const discordMessage = getNewReportDiscordMessage({
      mode: extracted_data.mode?.current || "yellow",
      reportDate: today,
      closePrice: extracted_data.price?.close || 0,
      changePct: extracted_data.price?.change_pct || 0,
      alerts: extracted_data.alerts || [],
      positioning: extracted_data.positioning,
      tiers: extracted_data.tiers,
      masterEject: extracted_data.master_eject?.price,
      modeSummary: extracted_data.mode?.summary,
      flackoTake: extracted_data.flacko_take,
      scenarios: extracted_data.scenarios,
      gammaRegime: extracted_data.gamma_regime,
      hiro: extracted_data.hiro,
    });
    await sendReportNotification(discordMessage);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Report upload error:", error);
    await logApiError({
      endpoint: '/api/reports',
      method: 'POST',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
