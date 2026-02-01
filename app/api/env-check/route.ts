import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    DISCORD_BOT_TOKEN: !!process.env.DISCORD_BOT_TOKEN,
    DISCORD_GUILD_ID: !!process.env.DISCORD_GUILD_ID,
    DISCORD_SUBSCRIBER_ROLE_ID: !!process.env.DISCORD_SUBSCRIBER_ROLE_ID,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const allPresent = Object.values(envVars).every(v => v === true);

  return NextResponse.json({
    status: allPresent ? "✅ All critical env vars present" : "❌ Missing env vars",
    vars: envVars,
    discord_ready: envVars.DISCORD_BOT_TOKEN && envVars.DISCORD_GUILD_ID && envVars.DISCORD_SUBSCRIBER_ROLE_ID,
  });
}
