import { NextRequest, NextResponse } from "next/server";

// In-memory store for activities (will be replaced with Convex when deployed)
const activities: any[] = [];

export async function POST(request: NextRequest) {
  try {
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

    // Store activity (in-memory for now, Convex later)
    const activity = {
      _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action_type,
      description,
      status,
      metadata,
      session_id,
      duration_ms,
    };
    
    activities.unshift(activity);
    
    // Keep only last 1000 activities
    if (activities.length > 1000) {
      activities.length = 1000;
    }

    return NextResponse.json({ success: true, activityId: activity._id });
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ activities: activities.slice(0, 100) });
}
