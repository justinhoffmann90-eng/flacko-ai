import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "1245751580058456104";
const DISCORD_SUBSCRIBER_ROLE_ID = process.env.DISCORD_SUBSCRIBER_ROLE_ID || "1465763216956068113";

/**
 * Check if a member already has the subscriber role (fast HEAD-style check)
 */
async function memberAlreadyHasRole(discordUserId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );
    if (!res.ok) return false; // Unknown Member or error — needs sync attempt
    const member = (await res.json()) as { roles: string[] };
    return member.roles.includes(DISCORD_SUBSCRIBER_ROLE_ID);
  } catch {
    return false;
  }
}

/**
 * Cron job: Sync Discord roles for active subscribers
 * 
 * Optimization: fetches member list first, skips users who already have the role.
 * Only calls addRoleToMember for users missing the role.
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
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

    if (!activeSubscribers || activeSubscribers.length === 0) {
      return NextResponse.json({ message: "No active subscribers with Discord linked", synced: 0 });
    }

    // Phase 1: Check who already has the role (parallel, fast)
    const needsSync: Array<{ discordUserId: string; email: string }> = [];
    const BATCH = 10;
    
    for (let i = 0; i < activeSubscribers.length; i += BATCH) {
      const batch = activeSubscribers.slice(i, i + BATCH);
      const checks = await Promise.allSettled(
        batch.map(async (sub) => {
          const user = (sub as any).users;
          if (!user.discord_user_id) return null;
          const hasRole = await memberAlreadyHasRole(user.discord_user_id);
          if (!hasRole) return { discordUserId: user.discord_user_id, email: user.email };
          return null;
        })
      );
      for (const c of checks) {
        if (c.status === "fulfilled" && c.value) needsSync.push(c.value);
      }
    }

    if (needsSync.length === 0) {
      return NextResponse.json({
        message: "All roles already synced",
        total: activeSubscribers.length,
        needsSync: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Phase 2: Add role only for those who need it
    let successCount = 0;
    let errorCount = 0;
    const errorSamples: string[] = [];

    const syncResults = await Promise.allSettled(
      needsSync.map(async ({ discordUserId, email }) => {
        const result = await addRoleToMember(discordUserId);
        if (result.success) return { success: true };
        if (result.error?.includes("Unknown Member")) return { skipped: true };
        return { success: false, error: `${email}: ${result.error}` };
      })
    );

    for (const r of syncResults) {
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

    return NextResponse.json({
      message: "Discord role sync completed",
      total: activeSubscribers.length,
      needsSync: needsSync.length,
      success: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
      debug: { errorSamples },
    });

  } catch (error) {
    console.error("Discord role sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
