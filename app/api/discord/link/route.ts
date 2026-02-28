import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember } from "@/lib/discord/bot";
import { hasSubscriptionAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/discord/callback`;

// Redirect user to Discord OAuth
export async function GET() {
  if (!DISCORD_CLIENT_ID) {
    return NextResponse.json({ error: "Discord not configured" }, { status: 500 });
  }

  const scope = "identify";
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${scope}`;

  return NextResponse.redirect(url);
}

// Handle Discord OAuth callback
export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
    }

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      return NextResponse.json({ error: "Discord not configured" }, { status: 500 });
    }

    // Exchange code for token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    // Get Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Failed to get Discord user" }, { status: 400 });
    }

    const discordUser = await userResponse.json() as { id: string; username: string };

    // Get authenticated Supabase user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Update user record with Discord info (use service client to bypass RLS)
    const serviceSupabase = await createServiceClient();
    const { error: updateError } = await serviceSupabase
      .from("users")
      .update({
        discord_user_id: discordUser.id,
        discord_username: discordUser.username,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to link Discord account" }, { status: 500 });
    }

    // If user has active subscription, add Discord role
    const { data: subscription } = await serviceSupabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    if (hasSubscriptionAccess(subscription)) {
      await addRoleToMember(discordUser.id);
    }

    return NextResponse.json({
      success: true,
      discord: {
        id: discordUser.id,
        username: discordUser.username,
      },
    });
  } catch (error) {
    console.error("Discord link error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
