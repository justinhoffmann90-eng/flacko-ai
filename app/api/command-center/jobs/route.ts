import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const DAILY_JOBS = [
  { id: "daily-checkin", time: "7:00a", name: "Daily Check-in" },
  { id: "morning-news-scan", time: "7:30a", name: "Morning News Scan" },
  { id: "morning-brief", time: "8:00a", name: "Morning Brief", note: "→ Discord #morning-brief" },
  { id: "hiro-alert-0900", time: "9:00a", name: "HIRO Alert 9AM", note: "→ #hiro-intraday" },
  { id: "hiro-alert-1100", time: "11:00a", name: "HIRO Alert 11AM", note: "→ #hiro-intraday" },
  { id: "hiro-alert-1300", time: "1:00p", name: "HIRO Alert 1PM", note: "→ #hiro-intraday" },
  { id: "trading-capture", time: "3:00p", name: "Trading Capture" },
  { id: "afternoon-news-scan", time: "3:30p", name: "Afternoon News Scan" },
  { id: "daily-journal", time: "4:30p", name: "Daily Journal" },
  { id: "eod-wrap", time: "8:00p", name: "EOD Wrap", note: "→ Discord #market-pulse" },
];

// GET - fetch current job status
export async function GET() {
  try {
    const supabase = await createServiceClient();
    const today = new Date().toISOString().split("T")[0];
    
    // Get job status from system_config
    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "daily_job_status")
      .single();
    
    let jobStatus = config?.value || { date: today, jobs: {} };
    
    // Reset if new day
    if (jobStatus.date !== today) {
      jobStatus = { date: today, jobs: {}, lastUpdated: new Date().toISOString() };
    }
    
    // Merge with job definitions
    const jobs = DAILY_JOBS.map(job => ({
      ...job,
      status: jobStatus.jobs[job.id]?.status || "pending",
      completedAt: jobStatus.jobs[job.id]?.completedAt || null,
    }));
    
    const completed = jobs.filter(j => j.status === "completed").length;
    const pending = jobs.filter(j => j.status === "pending").length;
    const failed = jobs.filter(j => j.status === "failed").length;
    
    return NextResponse.json({
      date: jobStatus.date,
      lastUpdated: jobStatus.lastUpdated,
      summary: {
        total: jobs.length,
        completed,
        pending,
        failed,
      },
      jobs,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json({ error: "Failed to fetch job status" }, { status: 500 });
  }
}

// POST - update job status (called by Clawd)
export async function POST(request: Request) {
  try {
    const { jobId, status = "completed" } = await request.json();
    
    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }
    
    const supabase = await createServiceClient();
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    
    // Get current status
    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "daily_job_status")
      .single();
    
    let jobStatus = config?.value || { date: today, jobs: {} };
    
    // Reset if new day
    if (jobStatus.date !== today) {
      jobStatus = { date: today, jobs: {} };
    }
    
    // Update the specific job
    jobStatus.jobs[jobId] = {
      status,
      completedAt: status === "completed" ? now : null,
    };
    jobStatus.lastUpdated = now;
    
    // Upsert to database
    await supabase
      .from("system_config")
      .upsert({
        key: "daily_job_status",
        value: jobStatus,
        updated_at: now,
      });
    
    return NextResponse.json({ 
      success: true, 
      jobId, 
      status,
      date: today,
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
