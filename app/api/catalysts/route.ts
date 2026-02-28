import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Catalyst } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/catalysts - Fetch upcoming catalysts
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const status = searchParams.get("status"); // confirmed, projected, speculative
    const limit = parseInt(searchParams.get("limit") || "20");
    const upcoming = searchParams.get("upcoming") !== "false"; // default: only future events
    
    let query = supabase
      .from("catalysts")
      .select("*")
      .order("event_date", { ascending: true })
      .limit(limit);
    
    // Filter by status if provided
    if (status) {
      query = query.eq("status", status);
    }
    
    // Filter to upcoming events only (default)
    if (upcoming) {
      const today = new Date().toISOString().split("T")[0];
      query = query.gte("event_date", today);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching catalysts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ catalysts: data as Catalyst[] });
  } catch (error) {
    console.error("Catalysts API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/catalysts - Add new catalyst (service role only, called by Clawd)
export async function POST(request: Request) {
  try {
    // Verify API key for service access
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.CLAWD_API_KEY;
    
    if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const supabase = await createServiceClient();
    const body = await request.json();
    
    const { event_date, name, status, notes, valuation_impact, source_url, notion_page_id } = body;
    
    if (!event_date || !name) {
      return NextResponse.json({ error: "event_date and name are required" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("catalysts")
      .upsert({
        event_date,
        name,
        status: status || "projected",
        notes,
        valuation_impact,
        source_url,
        notion_page_id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "event_date,name",
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating catalyst:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ catalyst: data });
  } catch (error) {
    console.error("Catalysts POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
