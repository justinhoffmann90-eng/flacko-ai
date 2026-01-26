import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Clawdbot Gateway health check
async function checkClawdbot(): Promise<{
  gateway: { status: string; lastHeartbeat?: string };
  telegram: { status: string };
  whatsapp: { status: string };
}> {
  try {
    // Try to read from Clawd's dashboard data
    // In production, this would be an internal API call to Clawdbot
    // For now, we'll return status based on what we can infer
    return {
      gateway: { status: "unknown", lastHeartbeat: undefined },
      telegram: { status: "unknown" },
      whatsapp: { status: "unknown" }
    };
  } catch {
    return {
      gateway: { status: "error" },
      telegram: { status: "unknown" },
      whatsapp: { status: "unknown" }
    };
  }
}

// Database health check
async function checkDatabase(): Promise<{
  connected: boolean;
  latestReport: { date: string; id: string } | null;
  reportCount: number;
  latestCatalyst: { date: string; name: string } | null;
  catalystCount: number;
}> {
  try {
    const supabase = await createServiceClient();
    
    // Get latest report
    const { data: latestReport, error: reportError } = await supabase
      .from("reports")
      .select("id, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();
    
    // Get report count
    const { count: reportCount } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });
    
    // Get upcoming catalysts count
    const today = new Date().toISOString().split('T')[0];
    const { data: catalysts, count: catalystCount } = await supabase
      .from("catalysts")
      .select("id, event_date, name", { count: "exact" })
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(1);
    
    return {
      connected: !reportError,
      latestReport: latestReport ? { 
        date: latestReport.report_date, 
        id: latestReport.id 
      } : null,
      reportCount: reportCount || 0,
      latestCatalyst: catalysts?.[0] ? {
        date: catalysts[0].event_date,
        name: catalysts[0].name
      } : null,
      catalystCount: catalystCount || 0
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      connected: false,
      latestReport: null,
      reportCount: 0,
      latestCatalyst: null,
      catalystCount: 0
    };
  }
}

export async function GET() {
  const [clawdbot, database] = await Promise.all([
    checkClawdbot(),
    checkDatabase()
  ]);
  
  // Calculate days since last report
  let daysSinceReport: number | null = null;
  if (database.latestReport) {
    const reportDate = new Date(database.latestReport.date + 'T12:00:00');
    const now = new Date();
    daysSinceReport = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  // Determine overall health
  const issues: string[] = [];
  if (!database.connected) issues.push("Database connection failed");
  if (daysSinceReport !== null && daysSinceReport > 1) {
    // Allow for weekends
    const lastReportDay = new Date(database.latestReport!.date + 'T12:00:00').getDay();
    const today = new Date().getDay();
    // If it's Monday (1) or Sunday (0) and last report was Friday (5), that's okay
    const isWeekendGap = (today === 0 || today === 1 || today === 6) && lastReportDay === 5;
    if (!isWeekendGap && daysSinceReport > 3) {
      issues.push(`No report for ${daysSinceReport} days`);
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: issues.length === 0 ? "healthy" : "degraded",
    issues,
    clawdbot,
    database: {
      ...database,
      daysSinceReport
    }
  });
}
