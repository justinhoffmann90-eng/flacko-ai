import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ChatUsage {
  message_count: number;
}

export async function GET() {
  try {
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";

    // In dev mode, return 0 usage (full 15 messages available)
    if (devBypass) {
      return NextResponse.json({ count: 0 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: usageData } = await supabase
      .from("chat_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single();

    const usage = usageData as ChatUsage | null;
    return NextResponse.json({ count: usage?.message_count || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
