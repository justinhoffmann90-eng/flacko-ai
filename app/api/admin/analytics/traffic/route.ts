import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TRAFFIC_DAYS = 30;

type PageViewRow = {
  session_id: string | null;
  path: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  country: string | null;
  duration_ms: number | null;
  created_at: string;
};

export async function GET() {
  try {
    // Verify admin
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: userData } = await userClient
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const supabase = await createServiceClient();

    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - TRAFFIC_DAYS);
    rangeStart.setHours(0, 0, 0, 0);

    const [pageViewsRes, signupsRes, subsRes] = await Promise.all([
      supabase
        .from("page_views")
        .select(
          "session_id, path, referrer, utm_source, utm_medium, utm_campaign, country, duration_ms, created_at"
        )
        .gte("created_at", rangeStart.toISOString()),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", rangeStart.toISOString()),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "comped"]),
    ]);

    if (pageViewsRes.error) {
      throw pageViewsRes.error;
    }
    if (signupsRes.error) {
      throw signupsRes.error;
    }
    if (subsRes.error) {
      throw subsRes.error;
    }

    const pageViews = (pageViewsRes.data || []) as PageViewRow[];

    const dailyMap: Record<string, { views: number; visitors: Set<string> }> = {};
    const pathMap: Record<string, { views: number; visitors: Set<string> }> = {};
    const referrerMap: Record<string, number> = {};
    const utmMap: Record<
      string,
      {
        source: string | null;
        medium: string | null;
        campaign: string | null;
        views: number;
        visitors: Set<string>;
      }
    > = {};
    const countryMap: Record<string, number> = {};
    const sessionStats: Record<
      string,
      { pages: number; duration: number; landingPath: string; landingAt: string }
    > = {};
    const uniqueSessions = new Set<string>();

    for (const view of pageViews) {
      const sessionId = view.session_id;
      const path = view.path || "/";
      const createdAt = view.created_at;
      const dateKey = createdAt.split("T")[0];

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { views: 0, visitors: new Set() };
      }
      dailyMap[dateKey].views += 1;
      if (sessionId) {
        dailyMap[dateKey].visitors.add(sessionId);
      }

      if (!pathMap[path]) {
        pathMap[path] = { views: 0, visitors: new Set() };
      }
      pathMap[path].views += 1;
      if (sessionId) {
        pathMap[path].visitors.add(sessionId);
      }

      const referrer = view.referrer?.trim() || "Direct / None";
      referrerMap[referrer] = (referrerMap[referrer] || 0) + 1;

      const source = view.utm_source?.trim() || null;
      const medium = view.utm_medium?.trim() || null;
      const campaign = view.utm_campaign?.trim() || null;
      if (source || medium || campaign) {
        const key = `${source || ""}|||${medium || ""}|||${campaign || ""}`;
        if (!utmMap[key]) {
          utmMap[key] = {
            source,
            medium,
            campaign,
            views: 0,
            visitors: new Set(),
          };
        }
        utmMap[key].views += 1;
        if (sessionId) {
          utmMap[key].visitors.add(sessionId);
        }
      }

      const country = view.country?.trim() ? view.country.trim().toUpperCase() : "Unknown";
      countryMap[country] = (countryMap[country] || 0) + 1;

      if (sessionId) {
        uniqueSessions.add(sessionId);
        if (!sessionStats[sessionId]) {
          sessionStats[sessionId] = {
            pages: 0,
            duration: 0,
            landingPath: path,
            landingAt: createdAt,
          };
        }
        sessionStats[sessionId].pages += 1;
        if (typeof view.duration_ms === "number" && view.duration_ms > 0) {
          sessionStats[sessionId].duration += view.duration_ms;
        }
        if (createdAt < sessionStats[sessionId].landingAt) {
          sessionStats[sessionId].landingAt = createdAt;
          sessionStats[sessionId].landingPath = path;
        }
      }
    }

    const dateKeys: string[] = [];
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < TRAFFIC_DAYS; i += 1) {
      const day = new Date(todayUtc);
      day.setUTCDate(day.getUTCDate() - i);
      dateKeys.push(day.toISOString().split("T")[0]);
    }

    const dailyViews = dateKeys.map((date) => ({
      date,
      views: dailyMap[date]?.views || 0,
      uniqueVisitors: dailyMap[date]?.visitors.size || 0,
    }));

    const topPages = Object.entries(pathMap)
      .map(([path, info]) => ({
        path,
        views: info.views,
        uniqueVisitors: info.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    const topReferrers = Object.entries(referrerMap)
      .map(([referrer, views]) => ({ referrer, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    const landingMap: Record<string, number> = {};
    for (const session of Object.values(sessionStats)) {
      if (!session.landingPath) continue;
      landingMap[session.landingPath] = (landingMap[session.landingPath] || 0) + 1;
    }

    const topLandingPages = Object.entries(landingMap)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const utmBreakdown = Object.values(utmMap)
      .map((entry) => ({
        source: entry.source,
        medium: entry.medium,
        campaign: entry.campaign,
        views: entry.views,
        uniqueVisitors: entry.visitors.size,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    const countryBreakdown = Object.entries(countryMap)
      .map(([country, views]) => ({ country, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    const totalSessions = Object.keys(sessionStats).length;
    const singlePageSessions = Object.values(sessionStats).filter((s) => s.pages <= 1).length;
    const bounceRate = totalSessions > 0 ? Math.round((singlePageSessions / totalSessions) * 100) : 0;

    let totalDuration = 0;
    let durationSessions = 0;
    for (const session of Object.values(sessionStats)) {
      if (session.duration > 0) {
        totalDuration += session.duration;
        durationSessions += 1;
      }
    }
    const avgSessionDuration = durationSessions > 0
      ? Math.round(totalDuration / durationSessions)
      : 0;

    const totalViews = pageViews.length;
    const uniqueVisitors = uniqueSessions.size;
    const avgDailyViews = Math.round(totalViews / TRAFFIC_DAYS);

    return NextResponse.json({
      dailyViews,
      topPages,
      topReferrers,
      topLandingPages,
      utmBreakdown,
      countryBreakdown,
      bounceRate,
      avgSessionDuration,
      conversionFunnel: {
        visitors: uniqueVisitors,
        signups: signupsRes.count || 0,
        subscribers: subsRes.count || 0,
      },
      totals: {
        views: totalViews,
        uniqueVisitors,
        avgDailyViews,
      },
    });
  } catch (error) {
    console.error("Traffic analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
