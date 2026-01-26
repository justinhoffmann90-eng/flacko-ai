import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Log a Discord alert attempt
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job_name, channel_id, channel_name, status, message_preview, error_message, response_code } = body;
    
    if (!job_name || !status) {
      return NextResponse.json({ error: "job_name and status required" }, { status: 400 });
    }
    
    const supabase = await createServiceClient();
    
    const { error } = await supabase
      .from("discord_alert_log")
      .insert({
        job_name,
        channel_id,
        channel_name,
        status,
        message_preview: message_preview?.substring(0, 200), // Truncate
        error_message,
        response_code
      });
    
    if (error) {
      console.error("Failed to log alert:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Alert log error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Get recent alert logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const job_name = searchParams.get("job_name");
    
    const supabase = await createServiceClient();
    
    let query = supabase
      .from("discord_alert_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (job_name) {
      query = query.eq("job_name", job_name);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Failed to fetch alert logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Calculate stats
    const total = data?.length || 0;
    const successful = data?.filter(d => d.status === 'success').length || 0;
    const failed = data?.filter(d => d.status === 'failed').length || 0;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    return NextResponse.json({
      logs: data || [],
      stats: {
        total,
        successful,
        failed,
        successRate
      }
    });
  } catch (err) {
    console.error("Alert log fetch error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
