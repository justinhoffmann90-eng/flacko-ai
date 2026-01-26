import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is OK
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cash_available, alerts_enabled, email_new_reports } = body;

    // Check if settings exist
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const settingsData = {
      user_id: user.id,
      cash_available: cash_available !== undefined ? cash_available : null,
      alerts_enabled: alerts_enabled !== undefined ? alerts_enabled : true,
      email_new_reports: email_new_reports !== undefined ? email_new_reports : true,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing
      result = await supabase
        .from("user_settings")
        .update(settingsData)
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      // Insert new
      result = await supabase
        .from("user_settings")
        .insert(settingsData)
        .select()
        .single();
    }

    if (result.error) {
      console.error("Settings save error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: result.data });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
