import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  // Verify cron secret for security
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();

    // Test 1: Can we query subscriptions?
    const { data: subscribers, error: subsError } = await supabase
      .from("subscriptions")
      .select("user_id, status")
      .in("status", ["active", "comped"]);

    // Test 2: Can we query user_settings?
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id, alerts_enabled");

    // Test 3: Get latest report
    const { data: latestReport, error: reportError } = await supabase
      .from("reports")
      .select("id, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    // Test 4: Count alerts for latest report
    let alertCount = 0;
    let alertUserCount = 0;
    if (latestReport) {
      const { data: alerts } = await supabase
        .from("report_alerts")
        .select("user_id")
        .eq("report_id", latestReport.id);
      
      if (alerts) {
        alertCount = alerts.length;
        alertUserCount = new Set(alerts.map(a => a.user_id)).size;
      }
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        subscribers: {
          count: subscribers?.length || 0,
          error: subsError?.message || null,
        },
        userSettings: {
          count: settings?.length || 0,
          alertsEnabledCount: settings?.filter(s => s.alerts_enabled !== false).length || 0,
          error: settingsError?.message || null,
        },
        latestReport: {
          id: latestReport?.id || null,
          date: latestReport?.report_date || null,
          error: reportError?.message || null,
        },
        alertsForLatestReport: {
          totalAlerts: alertCount,
          uniqueUsers: alertUserCount,
        },
        env: {
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + "...",
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
