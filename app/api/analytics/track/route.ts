import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEDUP_SECONDS = 30;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCountry(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === "unknown" || normalized === "XX") {
    return null;
  }
  return normalized;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = normalizeText(body?.path);
    const sessionId = normalizeText(body?.sessionId);
    const referrer = normalizeText(body?.referrer);
    const utmSource = normalizeText(body?.utm_source);
    const utmMedium = normalizeText(body?.utm_medium);
    const utmCampaign = normalizeText(body?.utm_campaign);

    if (!path || !sessionId) {
      return NextResponse.json({ error: "path and sessionId required" }, { status: 400 });
    }

    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();

    const supabase = await createServiceClient();

    const dedupSince = new Date(Date.now() - DEDUP_SECONDS * 1000).toISOString();
    const { data: existing } = await supabase
      .from("page_views")
      .select("id")
      .eq("session_id", sessionId)
      .eq("path", path)
      .gte("created_at", dedupSince)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const countryHeader =
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-vercel-ip-country");
    const country = normalizeCountry(countryHeader);
    const userAgent = request.headers.get("user-agent") || null;

    const { error } = await supabase
      .from("page_views")
      .insert({
        user_id: user?.id || null,
        path,
        referrer: referrer || null,
        user_agent: userAgent,
        session_id: sessionId,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        country,
      });

    if (error) {
      console.error("Page view insert error:", error);
      return NextResponse.json({ error: "Failed to track" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Page view tracking error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const path = normalizeText(body?.path);
    const sessionId = normalizeText(body?.sessionId);
    const durationMs = Number(body?.duration_ms);

    if (!path || !sessionId || !Number.isFinite(durationMs) || durationMs <= 0) {
      return NextResponse.json({ error: "path, sessionId, duration_ms required" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { data: views } = await supabase
      .from("page_views")
      .select("id")
      .eq("session_id", sessionId)
      .eq("path", path)
      .order("created_at", { ascending: false })
      .limit(1);

    const viewId = views?.[0]?.id;
    if (!viewId) {
      return NextResponse.json({ ok: false });
    }

    const { error } = await supabase
      .from("page_views")
      .update({ duration_ms: Math.round(durationMs) })
      .eq("id", viewId);

    if (error) {
      console.error("Page view duration update error:", error);
      return NextResponse.json({ error: "Failed to update duration" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Page view duration error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
