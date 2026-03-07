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
 * Fetch ALL members who already have the subscriber role.
 * Uses a single paginated endpoint — much faster than 63 individual lookups.
 */
async function getMembersWithRole(): Promise<Set<string>> {
  const memberIds = new Set<string>();
  let after = "0";

  // Discord returns up to 1000 members per request
  for (let page = 0; page < 5; page++) {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=1000&after=${after}`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );
    if (!res.ok) break;
    
    const members = (await res.json()) as Array<{ user: { id: string }; roles: string[] }>;
    if (members.length === 0) break;

    for (const m of members) {
      if (m.roles.includes(DISCORD_SUBSCRIBER_ROLE_ID)) {
        memberIds.add(m.user.id);
      }
    }

    // If fewer than 1000, we got all members
    if (members.length < 1000) break;
    after = members[members.length - 1].user.id;
  }

  return memberIds;
}

/**
 * Cron job: Sync Discord roles for active subscribers
 * 
 * 1. Bulk-fetch guild members who have the role (1-2 API calls)
 * 2. Diff against active subscribers
 * 3. Only add role for those missing it
 */
export async function GET(request: Request) {
  const supabase = await createServiceClient();

  try {
    // Parallel: fetch subscribers + existing role holders at the same time
    const [subResult, existingMembers] = await Promise.all([
      supabase
        .from("subscriptions")
        .select(`
          user_id,
          status,
          users!inner(id, discord_user_id, email)
        `)
        .eq("status", "active")
        .not("users.discord_user_id", "is", null),
      getMembersWithRole(),
    ]);

    if (subResult.error) {
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
    }

    const activeSubscribers = subResult.data || [];
    if (activeSubscribers.length === 0) {
      return NextResponse.json({ message: "No active subscribers with Discord linked", synced: 0 });
    }

    // Find subscribers who DON'T already have the role
    const needsSync = activeSubscribers
      .map((sub) => {
        const user = (sub as any).users;
        return { discordUserId: user.discord_user_id as string, email: user.email as string };
      })
      .filter((u) => u.discordUserId && !existingMembers.has(u.discordUserId));

    if (needsSync.length === 0) {
      return NextResponse.json({
        message: "All roles already synced",
        total: activeSubscribers.length,
        alreadySynced: existingMembers.size,
        needsSync: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Add role only for those who need it (usually 0-3 users)
    let successCount = 0;
    let errorCount = 0;
    const errorSamples: string[] = [];

    const results = await Promise.allSettled(
      needsSync.map(async ({ discordUserId, email }) => {
        const result = await addRoleToMember(discordUserId);
        if (result.success) return { success: true };
        if (result.error?.includes("Unknown Member")) return { skipped: true };
        return { success: false, error: `${email}: ${result.error}` };
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
        if (errorSamples.length < 3) errorSamples.push(r.reason?.message || "Unknown");
      }
    }

    return NextResponse.json({
      message: "Discord role sync completed",
      total: activeSubscribers.length,
      alreadySynced: activeSubscribers.length - needsSync.length,
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
