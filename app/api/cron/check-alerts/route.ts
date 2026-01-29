import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchRealtimePrice } from "@/lib/price/fetcher";
import { sendAlertMessage } from "@/lib/discord/client";
import { getAlertDiscordMessage } from "@/lib/discord/templates";
import { TrafficLightMode, ReportAlert } from "@/types";

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

    // Send Discord alert (single message to channel)
    const discordMessage = getAlertDiscordMessage({
      alerts: Array.from(uniqueAlerts.values()),
      mode: extractedData?.mode?.current || "yellow",
      positioning: extractedData?.positioning?.posture || "",
    });

    const discordSent = await sendAlertMessage(discordMessage);

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

    return NextResponse.json({
      success: true,
      price: currentPrice,
      triggeredCount: triggeredAlerts.length,
      discordSent,
    });
  } catch (error) {
    console.error("Alert check error:", error);
    return NextResponse.json({ error: "Alert check failed" }, { status: 500 });
  }
}
