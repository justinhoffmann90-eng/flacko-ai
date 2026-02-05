import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";

/**
 * Backfill job: Sync Discord roles for all active subscribers
 * Catches cases where user subscribed before linking Discord
 * 
 * Run via: POST /api/admin/sync-discord-roles
 * Or schedule as daily cron job
 */
export async function POST(request: Request) {
  // Verify admin auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const hasBearerAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!hasBearerAuth) {
    // Fall back to checking admin session
    const { createClient } = await import("@/lib/supabase/server");
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: userData } = await userClient.from("users").select("is_admin").eq("id", user.id).single();
    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  const supabase = await createServiceClient();

  try {
    // Find all users with:
    // 1. Active subscription
    // 2. Discord linked (discord_user_id NOT NULL)
    const { data: activeSubscribers, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        user_id,
        status,
        users!inner(id, discord_user_id, email)
      `)
      .eq("status", "active")
      .not("users.discord_user_id", "is", null);

    if (subError) {
      console.error("Error fetching active subscribers:", subError);
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

    if (!activeSubscribers || activeSubscribers.length === 0) {
      return NextResponse.json({ 
        message: "No active subscribers with Discord linked",
        synced: 0 
      });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Attempt to add role for each user
    for (const sub of activeSubscribers) {
      const user = (sub as any).users;
      const discordUserId = user.discord_user_id;

      if (!discordUserId) {
        continue;
      }

      try {
        await addRoleToMember(discordUserId);
        successCount++;
        results.push({
          user_id: user.id,
          email: user.email,
          discord_user_id: discordUserId,
          status: "success"
        });
      } catch (error: any) {
        errorCount++;
        results.push({
          user_id: user.id,
          email: user.email,
          discord_user_id: discordUserId,
          status: "error",
          error: error.message
        });
        console.error(`Failed to add role for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Discord role sync completed",
      total: activeSubscribers.length,
      success: successCount,
      errors: errorCount,
      results
    });

  } catch (error) {
    console.error("Discord role sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
