import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
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

    // Fetch all non-admin users
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, email, x_handle, discord_user_id, discord_username, created_at")
      .eq("is_admin", false)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error loading users:", usersError);
      return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
    }

    // Fetch all subscriptions
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, stripe_subscription_id, current_period_end");

    // Map subscriptions to users
    const subsByUser = new Map();
    for (const sub of subsData || []) {
      const existing = subsByUser.get(sub.user_id);
      if (!existing || sub.status === 'active' || sub.status === 'comped') {
        subsByUser.set(sub.user_id, sub);
      }
    }

    // Attach subscription to each user
    const users = (usersData || []).map(user => ({
      ...user,
      subscription: subsByUser.get(user.id) || null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in subscribers API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
