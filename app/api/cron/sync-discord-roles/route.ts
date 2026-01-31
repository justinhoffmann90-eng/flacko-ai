import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";

/**
 * Cron job: Sync Discord roles for all active subscribers
 * Runs every 2 minutes to catch users who just joined Discord
 * 
 * This handles the timing gap where users:
 * 1. Subscribe
 * 2. Link Discord (role assignment fails - not in server yet)
 * 3. Join Discord server
 * 4. Need role assigned (happens here)
 */
export async function GET(request: Request) {
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

    let successCount = 0;
    let errorCount = 0;

    // Attempt to add role for each user
    // Discord API will return success if role already assigned (idempotent)
    for (const sub of activeSubscribers) {
      const user = (sub as any).users;
      const discordUserId = user.discord_user_id;

      if (!discordUserId) {
        continue;
      }

      try {
        const result = await addRoleToMember(discordUserId);
        if (result.success) {
          successCount++;
        } else {
          // Only log if it's not "Unknown Member" (user hasn't joined yet)
          if (!result.error?.includes("Unknown Member")) {
            errorCount++;
            console.error(`Failed to add role for user ${user.id}:`, result.error);
          }
          // Unknown Member is expected - they'll get role on next run after joining
        }
      } catch (error: any) {
        errorCount++;
        console.error(`Failed to add role for user ${user.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Discord role sync completed",
      total: activeSubscribers.length,
      success: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Discord role sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
