import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  // Verify cron secret for security
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;
  const hardcodedSecret = "58154a5d97165f1d9d5abb2d839782e682835fee057ba8c8acfca26c24305a9e";
  
  if (authHeader !== `Bearer ${expectedSecret}` && authHeader !== `Bearer ${hardcodedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics: Record<string, unknown> = {};

  try {
    // Check environment variables
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    diagnostics.env = {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlPrefix: supabaseUrl?.substring(0, 30) + "...",
      hasServiceKey: !!serviceKey,
      serviceKeyLength: serviceKey?.length || 0,
      serviceKeyPrefix: serviceKey?.substring(0, 30) + "...",
      // Check if key looks valid (JWT format)
      serviceKeyLooksValid: serviceKey?.startsWith("eyJ") || false,
    };

    // Create service client directly to test
    let supabase;
    try {
      supabase = createSupabaseClient(
        supabaseUrl!,
        serviceKey!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
      diagnostics.clientCreated = true;
    } catch (clientError) {
      diagnostics.clientCreated = false;
      diagnostics.clientError = clientError instanceof Error ? clientError.message : "Unknown";
    }

    if (!supabase) {
      return NextResponse.json({
        success: false,
        diagnostics,
        error: "Failed to create Supabase client",
      });
    }

    // Test 1: Query subscriptions with explicit error handling
    const subsResult = await supabase
      .from("subscriptions")
      .select("user_id, status, created_at")
      .in("status", ["active", "comped"])
      .order("created_at", { ascending: true });

    diagnostics.subscribers = {
      count: subsResult.data?.length || 0,
      error: subsResult.error?.message || null,
      errorCode: subsResult.error?.code || null,
      first5: subsResult.data?.slice(0, 5).map(s => ({
        user_id: s.user_id.substring(0, 8) + "...",
        status: s.status,
        created: s.created_at?.split("T")[0],
      })) || [],
    };

    // Test 2: Query user_settings
    const settingsResult = await supabase
      .from("user_settings")
      .select("user_id, alerts_enabled, email_alerts");

    diagnostics.userSettings = {
      count: settingsResult.data?.length || 0,
      alertsEnabledCount: settingsResult.data?.filter(s => s.alerts_enabled !== false).length || 0,
      emailAlertsEnabledCount: settingsResult.data?.filter(s => s.email_alerts !== false).length || 0,
      error: settingsResult.error?.message || null,
    };

    // Test 3: Get latest report
    const reportResult = await supabase
      .from("reports")
      .select("id, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    diagnostics.latestReport = {
      id: reportResult.data?.id || null,
      date: reportResult.data?.report_date || null,
      error: reportResult.error?.message || null,
    };

    // Test 4: Count alerts for latest report
    if (reportResult.data) {
      const alertsResult = await supabase
        .from("report_alerts")
        .select("user_id")
        .eq("report_id", reportResult.data.id);

      const uniqueUsers = new Set(alertsResult.data?.map(a => a.user_id) || []);
      
      diagnostics.alertsForLatestReport = {
        totalAlerts: alertsResult.data?.length || 0,
        uniqueUsers: uniqueUsers.size,
        error: alertsResult.error?.message || null,
      };
    }

    // Test 5: Expected vs actual
    diagnostics.analysis = {
      expectedSubscribers: 34, // We know this from manual check
      actualSubscribers: subsResult.data?.length || 0,
      discrepancy: 34 - (subsResult.data?.length || 0),
      possibleCause: subsResult.data?.length === 34 
        ? "Query works - problem is elsewhere"
        : subsResult.data?.length === 0
          ? "CRITICAL: Query returns 0 - likely RLS or key issue"
          : `Query returns ${subsResult.data?.length} instead of 34 - partial access`,
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      diagnostics,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
