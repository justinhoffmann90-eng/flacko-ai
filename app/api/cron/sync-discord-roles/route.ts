import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";

// Disable Vercel caching - this must run fresh every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  // Force redeploy - check env vars
  console.log('Sync starting at:', new Date().toISOString());
  
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
    const errorSamples: string[] = [];

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
            if (errorSamples.length < 3) {
              errorSamples.push(`${user.email}: ${result.error}`);
            }
            console.error(`Failed to add role for user ${user.id}:`, result.error);
          }
          // Unknown Member is expected - they'll get role on next run after joining
        }
      } catch (error: any) {
        errorCount++;
        if (errorSamples.length < 3) {
          errorSamples.push(`${user.email}: ${error.message}`);
        }
        console.error(`Failed to add role for user ${user.id}:`, error);
      }
      
      // Rate limit protection: 500ms delay between Discord API calls
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Collect error details for debugging
    const errorDetails: string[] = [];
    
    return NextResponse.json({
      message: "Discord role sync completed",
      total: activeSubscribers.length,
      success: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
      // Debug: show first 3 error messages
      debug: {
        botTokenSet: !!process.env.DISCORD_BOT_TOKEN,
        guildIdSet: !!process.env.DISCORD_GUILD_ID,
        roleIdSet: !!process.env.DISCORD_SUBSCRIBER_ROLE_ID,
        errorSamples,
      }
    });

  } catch (error) {
    console.error("Discord role sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
