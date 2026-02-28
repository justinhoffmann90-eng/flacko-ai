import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// GET /api/command-center - Fetch dashboard data (admin only)
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if user is admin (skip in dev mode)
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";
    
    if (!devBypass) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      
      if (!userData?.is_admin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }
    
    // Try to read from local data.json (for local dev)
    // In production, this would come from an API or database
    const dashboardData = {
      lastUpdated: new Date().toISOString(),
      status: {
        gateway: "online",
        telegram: "online",
        whatsapp: "online",
        discord: "online"
      },
      employees: [
        {
          id: "trading-analyst",
          name: "Trading Analyst",
          emoji: "🎯",
          status: "active",
          mission: "Protect capital and surface actionable intelligence"
        },
        {
          id: "content-creator",
          name: "Content Creator",
          emoji: "✍️",
          status: "active",
          mission: "Turn trading activity into high-signal content"
        },
        {
          id: "community-manager",
          name: "Community Manager",
          emoji: "💬",
          status: "active",
          mission: "Grow engagement and maintain Catalyst Calendar"
        },
        {
          id: "ops",
          name: "Ops",
          emoji: "⚙️",
          status: "active",
          mission: "Keep the desk running smoothly"
        }
      ],
      cronJobs: [
        { name: "daily-checkin", schedule: "0 7 * * 1-5", nextRun: "Mon 7:00 AM", role: "ops" },
        { name: "morning-news-scan", schedule: "30 7 * * 1-5", nextRun: "Mon 7:30 AM", role: "trading-analyst" },
        { name: "morning-brief", schedule: "0 8 * * 1-5", nextRun: "Mon 8:00 AM", role: "content-creator" },
        { name: "market-pulse-0815", schedule: "15 8 * * 1-5", nextRun: "Mon 8:15 AM", role: "community-manager" },
        { name: "trading-alert-0900", schedule: "0 9 * * 1-5", nextRun: "Mon 9:00 AM", role: "trading-analyst" },
        { name: "trading-alert-1100", schedule: "0 11 * * 1-5", nextRun: "Mon 11:00 AM", role: "trading-analyst" },
        { name: "trading-capture-3pm", schedule: "0 15 * * 1-5", nextRun: "Mon 3:00 PM", role: "trading-analyst" },
        { name: "content-drafts", schedule: "0 16 * * 1-5", nextRun: "Mon 4:00 PM", role: "content-creator" },
        { name: "daily-journal", schedule: "30 16 * * 1-5", nextRun: "Mon 4:30 PM", role: "trading-analyst" }
      ],
      stats: {
        scheduled: 14,
        completed: 0,
        pending: 0,
        blockers: 1
      },
      activity: [
        { type: "success", title: "Catalyst Calendar deployed", description: "Tesla + Macro events with filtering", time: "Just now", role: "ops" },
        { type: "success", title: "Knowledge base created", description: "SG Report Guide + Rulebook loaded", time: "5 min ago", role: "community-manager" },
        { type: "info", title: "Security guardrails added", description: "Anti-prompt-injection rules for Discord", time: "10 min ago", role: "ops" }
      ]
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Command center API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
