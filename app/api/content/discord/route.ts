import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";

const CONFIG_PATH = "/Users/trunks/clawd/config/discord-webhooks.json";

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

function loadConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as { channels: Record<string, { id: string; webhook: string; purpose: string }> };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const config = loadConfig();
  const channels = Object.entries(config.channels || {}).map(([key, value]) => ({
    key,
    id: value.id,
    purpose: value.purpose,
  }));

  return NextResponse.json({ channels });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { channelKey, content } = body || {};

  if (!channelKey || !content) {
    return NextResponse.json({ error: "Missing channelKey or content" }, { status: 400 });
  }

  if (channelKey === "alerts") {
    return NextResponse.json({ error: "Posting to #alerts is restricted" }, { status: 400 });
  }

  const config = loadConfig();
  const channel = config.channels?.[channelKey];

  if (!channel?.webhook) {
    return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
  }

  const response = await fetch(channel.webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `Discord error: ${text}` }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
