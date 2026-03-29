import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";
import { hasSubscriptionAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

/**
 * POST /api/discord/fix-role
 *
 * Bot-only role assignment — no OAuth token required.
 * Used when the initial guild join during OAuth callback failed.
 * The user is already in the server (joined via invite or retry), we just
 * need to assign the Subscriber role using the bot token.
 *
 * Also handles the case where the user is already in the server but
 * the guild join attempt during OAuth silently failed.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's Discord ID
    const { data: userData } = await serviceSupabase
      .from("users")
      .select("discord_user_id, discord_username, discord_guild_join_pending")
      .eq("id", user.id)
      .single();

    if (!userData?.discord_user_id) {
      return NextResponse.json({ error: "No Discord account linked" }, { status: 400 });
    }

    // Verify active subscription
    const { data: subscription } = await serviceSupabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (!hasSubscriptionAccess(subscription)) {
      return NextResponse.json({ error: "No active subscription" }, { status: 403 });
    }

    // Assign role via bot (no user token needed)
    const roleResult = await addRoleToMember(userData.discord_user_id);

    if (!roleResult.success) {
      return NextResponse.json({
        error: `Failed to assign role: ${roleResult.error}`,
        hint: "Make sure you have joined the Discord server first, then try again."
      }, { status: 500 });
    }

    // Clear the pending flag
    await serviceSupabase
      .from("users")
      .update({ discord_guild_join_pending: false })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: `Subscriber role assigned to @${userData.discord_username}`,
    });
  } catch (error) {
    console.error("fix-role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
