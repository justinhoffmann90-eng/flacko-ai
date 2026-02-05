import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { removeRoleFromMember } from "@/lib/discord/bot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Cron job: Clean up expired grace periods
 * Runs daily to:
 * 1. Remove Discord roles from canceled users whose period has ended
 * 2. Ensure access control stays consistent
 *
 * Schedule: Every hour during market hours, or once daily
 */
export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  try {
    // Find canceled subscriptions whose grace period has expired
    const { data: expiredSubs, error } = await supabase
      .from("subscriptions")
      .select(`
        user_id,
        current_period_end,
        users!inner(discord_user_id, email)
      `)
      .eq("status", "canceled")
      .not("current_period_end", "is", null)
      .lt("current_period_end", new Date().toISOString());

    if (error) {
      console.error("Error fetching expired subscriptions:", error);
      return NextResponse.json({ error: "Failed to query" }, { status: 500 });
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      return NextResponse.json({
        message: "No expired grace periods found",
        processed: 0,
      });
    }

    let rolesRemoved = 0;
    let errors = 0;

    for (const sub of expiredSubs) {
      const user = (sub as any).users;
      const discordUserId = user?.discord_user_id;

      if (discordUserId) {
        try {
          const result = await removeRoleFromMember(discordUserId);
          if (result.success) {
            rolesRemoved++;
          } else if (!result.error?.includes("Unknown Member")) {
            errors++;
            console.error(
              `Failed to remove role for ${user.email}:`,
              result.error
            );
          }
        } catch (err) {
          errors++;
          console.error(`Error removing role for ${user.email}:`, err);
        }

        // Rate limit protection
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      message: "Grace period cleanup completed",
      total: expiredSubs.length,
      rolesRemoved,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Grace period cleanup error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}
