import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET - fetch pipeline status from Supabase
export async function GET() {
  try {
    const supabase = await createServiceClient();
    const today = new Date().toISOString().split("T")[0];
    
    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "pipeline_status")
      .single();
    
    let status = config?.value || { date: today, steps: {} };
    
    // Reset if new day
    if (status.date !== today) {
      status = { date: today, steps: {}, lastUpdated: new Date().toISOString() };
    }
    
    // Define all pipeline steps
    const stepDefs = [
      { id: "screenshots", name: "Screenshots Captured", expectedTime: "3:00p CT" },
      { id: "report-saved", name: "MD File Saved", expectedTime: "After Claude generates" },
      { id: "key-levels", name: "Key Levels Extracted", expectedTime: "After MD upload" },
      { id: "price-alerts", name: "Price Alerts Active", expectedTime: "Every 1 min" },
    ];
    
    const steps = stepDefs.map(def => ({
      ...def,
      status: status.steps[def.id]?.status || "pending",
      timestamp: status.steps[def.id]?.timestamp || null,
      details: status.steps[def.id]?.details || "Waiting...",
    }));
    
    // Check price alerts from Supabase directly
    try {
      const { data: alertConfig } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "alert_system_status")
        .single();
      
      if (alertConfig?.value) {
        const lastRun = new Date(alertConfig.value.last_run);
        const minutesAgo = Math.floor((Date.now() - lastRun.getTime()) / 1000 / 60);
        const priceStep = steps.find(s => s.id === "price-alerts");
        if (priceStep) {
          priceStep.status = minutesAgo <= 5 ? "complete" : "stale";
          priceStep.timestamp = alertConfig.value.last_run;
          priceStep.details = `Last: ${minutesAgo}m ago, Price: $${alertConfig.value.last_price}`;
        }
      }
    } catch (e) {
      // Ignore price alert check errors
    }
    
    const complete = steps.filter(s => s.status === "complete").length;
    const pending = steps.filter(s => s.status === "pending").length;
    const blocked = steps.filter(s => ["stale", "failed", "out-of-sync"].includes(s.status)).length;
    
    return NextResponse.json({
      date: status.date,
      lastUpdated: status.lastUpdated,
      steps,
      summary: { total: steps.length, complete, pending, blocked },
      verification: status.verification || null,
    });
  } catch (error) {
    console.error("Error fetching pipeline status:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST - update pipeline step status (called by Clawd)
export async function POST(request: Request) {
  try {
    const { stepId, status = "complete", details, verification } = await request.json();
    
    const supabase = await createServiceClient();
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString();
    
    // Get current status
    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "pipeline_status")
      .single();
    
    let pipelineStatus = config?.value || { date: today, steps: {} };
    
    // Reset if new day
    if (pipelineStatus.date !== today) {
      pipelineStatus = { date: today, steps: {} };
    }
    
    // Update the specific step
    if (stepId) {
      pipelineStatus.steps[stepId] = {
        status,
        timestamp: now,
        details: details || `Completed at ${new Date().toLocaleTimeString()}`,
      };
    }
    
    // Update verification data if provided
    if (verification) {
      pipelineStatus.verification = verification;
    }
    
    pipelineStatus.lastUpdated = now;
    
    // Upsert to database
    await supabase
      .from("system_config")
      .upsert({
        key: "pipeline_status",
        value: pipelineStatus,
        updated_at: now,
      });
    
    return NextResponse.json({ success: true, stepId, status, date: today });
  } catch (error) {
    console.error("Error updating pipeline status:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
