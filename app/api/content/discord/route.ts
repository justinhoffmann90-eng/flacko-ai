import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Discord webhook configuration — stored here instead of a local file path
// so it works in production (Vercel) and local dev
const DISCORD_CHANNELS: Record<string, { id: string; webhook: string; purpose: string }> = {
  reports: {
    id: "reports",
    webhook: process.env.DISCORD_REPORTS_WEBHOOK_URL || "",
    purpose: "New daily report announcements",
  },
  "morning-brief": {
    id: "morning-brief",
    webhook: process.env.DISCORD_MORNING_BRIEF_WEBHOOK_URL || "",
    purpose: "Daily morning brief before market open",
  },
  "market-pulse": {
    id: "market-pulse",
    webhook: process.env.DISCORD_MARKET_PULSE_WEBHOOK_URL || "",
    purpose: "Intraday updates and EOD wrap",
  },
  "tesla-research": {
    id: "tesla-research",
    webhook: process.env.DISCORD_RESEARCH_WEBHOOK_URL || "",
    purpose: "Weekly deep dives and research",
  },
  "hiro-intraday": {
    id: "hiro-intraday",
    webhook: process.env.DISCORD_HIRO_WEBHOOK_URL || "",
    purpose: "Dealer flow alerts and HIRO updates",
  },
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new NextResponse("Unauthorized", { status: 401 }) };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) {
    return { error: new NextResponse("Forbidden", { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const channels = Object.entries(DISCORD_CHANNELS)
    .filter(([key]) => key !== "alerts")
    .map(([key, value]) => ({
      key,
      id: value.id,
      purpose: value.purpose,
      configured: !!value.webhook,
    }));

  return NextResponse.json({ channels });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { channelKey, content, embeds } = body || {};

  if (!channelKey || (!content && !embeds)) {
    return NextResponse.json({ error: "Missing channelKey or content" }, { status: 400 });
  }

  if (channelKey === "alerts") {
    return NextResponse.json({ error: "Posting to #alerts is restricted" }, { status: 400 });
  }

  const channel = DISCORD_CHANNELS[channelKey];

  if (!channel?.webhook) {
    return NextResponse.json(
      { error: `Channel "${channelKey}" not configured. Set the webhook URL in environment variables.` },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {};
  if (content) payload.content = content;
  if (embeds) payload.embeds = embeds;

  const response = await fetch(channel.webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Discord error: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
