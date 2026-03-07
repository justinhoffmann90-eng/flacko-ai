import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

/**
 * Cron job: Sync Discord roles for all active subscribers
 * 
 * Processes in parallel batches of 10 to stay within Vercel timeout
 * and Discord rate limits (~50 req/sec).
 */
export async function GET(request: Request) {
  const supabase = await createServiceClient();

  try {
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

    // Process in parallel batches of 10
    const BATCH_SIZE = 10;
    for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
      const batch = activeSubscribers.slice(i, i + BATCH_SIZE);
      
      const results = await Promise.allSettled(
        batch.map(async (sub) => {
          const user = (sub as any).users;
          const discordUserId = user.discord_user_id;
          if (!discordUserId) return { skipped: true };

          const result = await addRoleToMember(discordUserId);
          if (result.success) {
            return { success: true };
          } else {
            if (!result.error?.includes("Unknown Member")) {
              return { success: false, error: `${user.email}: ${result.error}` };
            }
            return { skipped: true }; // Unknown Member = not in server yet
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          if (r.value.success) successCount++;
          else if (r.value.error) {
            errorCount++;
            if (errorSamples.length < 3) errorSamples.push(r.value.error);
          }
        } else {
          errorCount++;
          if (errorSamples.length < 3) errorSamples.push(r.reason?.message || "Unknown error");
        }
      }

      // Small delay between batches for rate limiting
      if (i + BATCH_SIZE < activeSubscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      message: "Discord role sync completed",
      total: activeSubscribers.length,
      success: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
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
