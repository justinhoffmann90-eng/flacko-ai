import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Check auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Read agent status from Supabase
    const { data: dashboardData, error: dbError } = await supabase
      .from("dashboard_data")
      .select("value")
      .eq("key", "agent-status")
      .single();

    if (dbError) {
      console.error("Error reading agent status from DB:", dbError);
      return NextResponse.json(
        { error: "Failed to load agent status" },
        { status: 500 }
      );
    }

    return NextResponse.json(dashboardData.value || {});
  } catch (error) {
    console.error("Error reading agent status:", error);
    return NextResponse.json(
      { error: "Failed to load agent status" },
      { status: 500 }
    );
  }
}
