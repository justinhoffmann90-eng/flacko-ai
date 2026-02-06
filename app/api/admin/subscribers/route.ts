import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // First check if user is logged in and is admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    // Check if user is admin using regular client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Now use service client to fetch all data (bypasses RLS)
    const serviceClient = await createServiceClient();

    // Fetch all non-admin users using service client
    const { data: usersData, error: usersError } = await serviceClient
      .from("users")
      .select("id, email, x_handle, discord_user_id, discord_username, created_at")
      .eq("is_admin", false)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error loading users:", usersError);
      return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
    }

    // Fetch all subscriptions using service client
    const { data: subsData } = await serviceClient
      .from("subscriptions")
      .select("id, user_id, status, stripe_subscription_id, current_period_end, locked_price_cents");

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
