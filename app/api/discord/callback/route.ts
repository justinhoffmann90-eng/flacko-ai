import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { addMemberToGuild } from "@/lib/discord/bot";
import { hasSubscriptionAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    
    // Use the actual request origin to match what the client sent
    const origin = url.origin;
    const redirectUri = `${origin}/api/discord/callback`;

    // User denied permissions
    if (error) {
      return NextResponse.redirect(`${origin}/settings?discord_error=denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/settings?discord_error=no_code`);
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return NextResponse.redirect(`${origin}/settings?discord_error=not_configured`);
    }

    // Exchange code for token - use same redirect_uri that client used
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Discord token exchange failed:", tokenResponse.status, errorText);
      console.error("Used redirect_uri:", redirectUri);
      return NextResponse.redirect(`${origin}/settings?discord_error=token_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Get Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${origin}/settings?discord_error=user_failed`);
    }

    const discordUser = await userResponse.json() as { id: string; username: string };

    // Get authenticated Supabase user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login?next=/settings`);
    }

    // Update user record with Discord info
    const serviceSupabase = await createServiceClient();
    const { error: updateError } = await serviceSupabase
      .from("users")
      .update({
        discord_user_id: discordUser.id,
        discord_username: discordUser.username,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Discord update error:", updateError);
      return NextResponse.redirect(`${origin}/settings?discord_error=update_failed`);
    }

    // If user has active subscription, join them to the guild + assign Subscriber role
    const { data: subscription } = await serviceSupabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    if (hasSubscriptionAccess(subscription)) {
      const guildResult = await addMemberToGuild(discordUser.id, tokenData.access_token);
      if (!guildResult.success) {
        console.error(`Discord guild join failed for user ${user.id} (${discordUser.username}):`, guildResult.error);
        // Store the pending join so it can be retried without a new OAuth flow
        await serviceSupabase
          .from("users")
          .update({ discord_guild_join_pending: true })
          .eq("id", user.id);
        await serviceSupabase.from("discord_alert_log").insert({
          user_id: user.id,
          event_type: "guild_join_failed_on_link",
          status: "error",
          error_message: guildResult.error || "Unknown error joining guild during Discord link",
        });
        // Redirect with flag so Settings page can show a retry prompt
        return NextResponse.redirect(`${origin}/settings?discord_linked=true&guild_join_pending=true`);
      } else {
        // Clear any stale pending flag
        await serviceSupabase
          .from("users")
          .update({ discord_guild_join_pending: false })
          .eq("id", user.id);
        console.log(`Discord guild join+role for user ${user.id} (${discordUser.username}): alreadyMember=${guildResult.alreadyMember}`);
      }
    } else {
      console.log(`User ${user.id} linked Discord but has no active subscription - skipping guild join`);
    }

    return NextResponse.redirect(`${origin}/settings?discord_linked=true`);
  } catch (error) {
    console.error("Discord callback error:", error);
    // Fallback to env var for error case since url may not be parsed yet
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.flacko.ai";
    return NextResponse.redirect(`${fallbackUrl}/settings?discord_error=unknown`);
  }
}
