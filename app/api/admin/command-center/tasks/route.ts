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

    // Read tasks-info.json from clawd dashboard
    const tasksPath = join(process.env.HOME || "", "clawd", "dashboard", "tasks-info.json");
    const tasksData = await readFile(tasksPath, "utf-8");
    const data = JSON.parse(tasksData);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading tasks info:", error);
    return NextResponse.json(
      { error: "Failed to load tasks info" },
      { status: 500 }
    );
  }
}
