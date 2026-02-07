import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      action_type,
      description,
      status,
      metadata,
      session_id,
      duration_ms,
    } = body;

    // Validate required fields
    if (!action_type || !description || !status) {
      return NextResponse.json(
        { error: "Missing required fields: action_type, description, status" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Store activity in Supabase
    const { data: activity, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: user?.id,
        action_type,
        description,
        status,
        metadata: metadata || {},
        session_id,
        duration_ms,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error storing activity:", error);
      return NextResponse.json(
        { error: "Failed to store activity" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activityId: activity.id });
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch recent activities
    const { data: activities, error } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching activities:", error);
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const transformed = activities?.map(a => ({
      _id: a.id,
      timestamp: new Date(a.created_at).getTime(),
      action_type: a.action_type,
      description: a.description,
      status: a.status,
      metadata: a.metadata,
      session_id: a.session_id,
      duration_ms: a.duration_ms,
    })) || [];

    return NextResponse.json({ activities: transformed });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
