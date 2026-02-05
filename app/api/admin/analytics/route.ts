import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Verify admin
    const userClient = await createClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: userData } = await userClient.from("users").select("is_admin").eq("id", user.id).single();
    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // 1. Subscriber counts by status
    const { data: subCounts } = await supabase
      .from("subscriptions")
      .select("status");

    const statusCounts: Record<string, number> = {};
    for (const sub of subCounts || []) {
      statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
    }

    // 2. Daily active users (last 30 days) - users who visited dashboard
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentVisitors } = await supabase
      .from("users")
      .select("last_dashboard_visit")
      .not("last_dashboard_visit", "is", null)
      .gte("last_dashboard_visit", thirtyDaysAgo.toISOString());

    // Group by date
    const dauMap: Record<string, number> = {};
    for (const u of recentVisitors || []) {
      const date = (u.last_dashboard_visit as string).split("T")[0];
      dauMap[date] = (dauMap[date] || 0) + 1;
    }
    const dau = Object.entries(dauMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    // 3. Chat usage (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: chatUsage } = await supabase
      .from("chat_usage")
      .select("usage_date, message_count, user_id")
      .gte("usage_date", fourteenDaysAgo.toISOString().split("T")[0])
      .order("usage_date", { ascending: false });

    // Aggregate chat stats by date
    const chatMap: Record<string, { users: Set<string>; messages: number }> = {};
    for (const c of chatUsage || []) {
      if (!chatMap[c.usage_date]) {
        chatMap[c.usage_date] = { users: new Set(), messages: 0 };
      }
      chatMap[c.usage_date].users.add(c.user_id);
      chatMap[c.usage_date].messages += c.message_count;
    }
    const chatStats = Object.entries(chatMap)
      .map(([date, data]) => ({
        date,
        uniqueUsers: data.users.size,
        totalMessages: data.messages,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // 4. Alert trigger stats (last 14 days)
    const { data: alertStats } = await supabase
      .from("report_alerts")
      .select("triggered_at")
      .not("triggered_at", "is", null)
      .gte("triggered_at", fourteenDaysAgo.toISOString());

    const alertsByDate: Record<string, number> = {};
    for (const a of alertStats || []) {
      const date = (a.triggered_at as string).split("T")[0];
      alertsByDate[date] = (alertsByDate[date] || 0) + 1;
    }

    // 5. Discord connection rate
    const { data: allUsers } = await supabase
      .from("users")
      .select("discord_user_id, is_admin")
      .eq("is_admin", false);

    const totalNonAdmin = allUsers?.length || 0;
    const discordLinked = allUsers?.filter(u => u.discord_user_id).length || 0;

    // 6. Report open rate proxy (users who visited within 24h of last report)
    const { data: latestReport } = await supabase
      .from("reports")
      .select("report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    let reportDayVisitors = 0;
    if (latestReport) {
      const reportDate = latestReport.report_date;
      const nextDay = new Date(reportDate + "T00:00:00");
      nextDay.setDate(nextDay.getDate() + 1);

      const { data: visitors } = await supabase
        .from("users")
        .select("id")
        .gte("last_dashboard_visit", reportDate + "T00:00:00")
        .lt("last_dashboard_visit", nextDay.toISOString());

      reportDayVisitors = visitors?.length || 0;
    }

    // 7. Recent email delivery stats
    const { data: emailLogs } = await supabase
      .from("email_send_log")
      .select("status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const emailStats = {
      sent: emailLogs?.filter(e => e.status === "sent").length || 0,
      failed: emailLogs?.filter(e => e.status !== "sent").length || 0,
    };

    // 8. Churn: canceled in last 30 days
    const { data: recentCancels } = await supabase
      .from("subscriptions")
      .select("updated_at")
      .eq("status", "canceled")
      .gte("updated_at", thirtyDaysAgo.toISOString());

    return NextResponse.json({
      subscribers: statusCounts,
      dau,
      chatStats,
      alertsByDate,
      discord: {
        totalUsers: totalNonAdmin,
        linked: discordLinked,
        rate: totalNonAdmin > 0 ? Math.round((discordLinked / totalNonAdmin) * 100) : 0,
      },
      reportEngagement: {
        lastReportDate: latestReport?.report_date,
        visitorsOnReportDay: reportDayVisitors,
        activeSubscribers: (statusCounts.active || 0) + (statusCounts.comped || 0),
      },
      emailStats,
      churn: {
        last30Days: recentCancels?.length || 0,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
