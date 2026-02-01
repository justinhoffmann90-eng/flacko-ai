import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readFile } from "fs/promises";
import { join } from "path";

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

    // Read agent-status.json from clawd dashboard
    const statusPath = join(process.env.HOME || "", "clawd", "dashboard", "agent-status.json");
    const statusData = await readFile(statusPath, "utf-8");
    const data = JSON.parse(statusData);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading agent status:", error);
    return NextResponse.json(
      { error: "Failed to load agent status" },
      { status: 500 }
    );
  }
}
