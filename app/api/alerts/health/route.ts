import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Alert System Health Check
 * 
 * Returns:
 * - Last price check time
 * - Current TSLA price
 * - Pending alert count
 * - Recent trigger history
 * - System health status
 * 
 * Use this to verify the alert system is functioning correctly.
 */
export async function GET() {
  try {
    const supabase = await createServiceClient();
    
    // Get alert system status
    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "alert_system_status")
      .single();
    
    const status = config?.value as {
      enabled?: boolean;
      last_run?: string;
      last_price?: number;
      pending_alerts?: number;
    } | null;
    
    // Calculate staleness
    const lastRun = status?.last_run ? new Date(status.last_run) : null;
    const now = new Date();
    const staleMs = lastRun ? now.getTime() - lastRun.getTime() : null;
    const staleMinutes = staleMs ? Math.round(staleMs / 60000) : null;
    
    // Check if we're in market hours (9:30am - 4pm ET, Mon-Fri)
    const etHour = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false });
    const etMinute = new Date().toLocaleString("en-US", { timeZone: "America/New_York", minute: "numeric" });
    const dayOfWeek = new Date().toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short" });
    const isWeekday = !["Sat", "Sun"].includes(dayOfWeek);
    const hourNum = parseInt(etHour);
    const minuteNum = parseInt(etMinute);
    const isMarketHours = isWeekday && (
      (hourNum > 9 || (hourNum === 9 && minuteNum >= 30)) && hourNum < 16
    );
    
    // Get pending alerts
    const { data: pendingAlerts, count: pendingCount } = await supabase
      .from("report_alerts")
      .select("price, level_name, type, created_at", { count: "exact" })
      .is("triggered_at", null)
      .order("price", { ascending: false })
      .limit(20);
    
    // Get recent triggers (last 24h)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentTriggers, count: triggerCount } = await supabase
      .from("report_alerts")
      .select("price, level_name, type, triggered_at", { count: "exact" })
      .not("triggered_at", "is", null)
      .gte("triggered_at", yesterday)
      .order("triggered_at", { ascending: false })
      .limit(10);
    
    // Determine health status
    let healthStatus: "healthy" | "warning" | "critical" = "healthy";
    let healthMessage = "Alert system operating normally";
    
    if (!status?.enabled) {
      healthStatus = "critical";
      healthMessage = "Alert system is DISABLED";
    } else if (isMarketHours && staleMinutes && staleMinutes > 5) {
      healthStatus = "critical";
      healthMessage = `Price checks are STALE - last run ${staleMinutes} minutes ago`;
    } else if (isMarketHours && staleMinutes && staleMinutes > 2) {
      healthStatus = "warning";
      healthMessage = `Price checks may be delayed - last run ${staleMinutes} minutes ago`;
    } else if (pendingCount === 0) {
      healthStatus = "warning";
      healthMessage = "No pending alerts - verify report was uploaded";
    }
    
    return NextResponse.json({
      health: {
        status: healthStatus,
        message: healthMessage,
        isMarketHours,
        timestamp: now.toISOString(),
      },
      priceMonitor: {
        lastRun: status?.last_run || null,
        lastPrice: status?.last_price || null,
        staleMinutes,
        enabled: status?.enabled ?? false,
      },
      alerts: {
        pending: pendingCount || 0,
        pendingLevels: pendingAlerts?.map(a => ({
          price: a.price,
          level: a.level_name,
          type: a.type,
        })) || [],
        triggeredLast24h: triggerCount || 0,
        recentTriggers: recentTriggers?.map(a => ({
          price: a.price,
          level: a.level_name,
          type: a.type,
          triggeredAt: a.triggered_at,
        })) || [],
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({
      health: {
        status: "critical",
        message: `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      },
    }, { status: 500 });
  }
}
