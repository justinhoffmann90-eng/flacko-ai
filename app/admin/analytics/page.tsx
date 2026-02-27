"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface AnalyticsData {
  subscribers: Record<string, number>;
  dau: { date: string; count: number }[];
  chatStats: { date: string; uniqueUsers: number; totalMessages: number }[];
  alertsByDate: Record<string, number>;
  discord: { totalUsers: number; linked: number; rate: number };
  reportEngagement: {
    lastReportDate: string | null;
    visitorsOnReportDay: number;
    activeSubscribers: number;
  };
  emailStats: { sent: number; failed: number };
  churn: { last30Days: number };
}

interface TrafficAnalyticsData {
  dailyViews: { date: string; views: number; uniqueVisitors: number }[];
  topPages: { path: string; views: number; uniqueVisitors: number }[];
  topReferrers: { referrer: string; views: number }[];
  topLandingPages: { path: string; count: number }[];
  utmBreakdown: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    views: number;
    uniqueVisitors: number;
  }[];
  countryBreakdown: { country: string; views: number }[];
  bounceRate: number;
  avgSessionDuration: number;
  conversionFunnel: { visitors: number; signups: number; subscribers: number };
  totals: { views: number; uniqueVisitors: number; avgDailyViews: number };
}

function StatCard({
  label,
  value,
  sublabel,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}) {
  return (
    <Card className="p-4 bg-white/5 border-white/10">
      <p className="text-xs text-white/50 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sublabel && (
        <p className="text-xs text-white/40 mt-1">{sublabel}</p>
      )}
    </Card>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function formatDuration(ms: number) {
  if (!ms || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [traffic, setTraffic] = useState<TrafficAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const [analyticsRes, trafficRes] = await Promise.all([
          fetch("/api/admin/analytics"),
          fetch("/api/admin/analytics/traffic"),
        ]);

        if (!analyticsRes.ok) throw new Error("Failed to load analytics");
        if (!trafficRes.ok) throw new Error("Failed to load traffic analytics");

        const [analyticsData, trafficData] = await Promise.all([
          analyticsRes.json(),
          trafficRes.json(),
        ]);

        if (!isActive) return;
        setData(analyticsData);
        setTraffic(trafficData);
      } catch (e) {
        if (!isActive) return;
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white/50">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data || !traffic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-red-400">{error || "Failed to load"}</p>
      </div>
    );
  }

  const activeCount = (data.subscribers.active || 0) + (data.subscribers.comped || 0);
  const totalSubs = Object.values(data.subscribers).reduce((a, b) => a + b, 0);
  const maxDau = Math.max(...data.dau.map((d) => d.count), 1);
  const maxChat = Math.max(...data.chatStats.map((d) => d.totalMessages), 1);
  const maxDailyViews = Math.max(...traffic.dailyViews.map((d) => d.views), 1);

  const funnelVisitors = traffic.conversionFunnel.visitors;
  const funnelSignups = traffic.conversionFunnel.signups;
  const funnelSubscribers = traffic.conversionFunnel.subscribers;
  const visitorToSignupRate =
    funnelVisitors > 0 ? Math.round((funnelSignups / funnelVisitors) * 100) : 0;
  const signupToSubscriberRate =
    funnelSignups > 0 ? Math.round((funnelSubscribers / funnelSignups) * 100) : 0;
  const visitorToSubscriberRate =
    funnelVisitors > 0 ? Math.round((funnelSubscribers / funnelVisitors) * 100) : 0;

  // Report engagement rate
  const engagementRate =
    data.reportEngagement.activeSubscribers > 0
      ? Math.round(
          (data.reportEngagement.visitorsOnReportDay /
            data.reportEngagement.activeSubscribers) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">Subscriber Analytics</h1>
              <p className="text-xs text-white/50">Engagement metrics & growth tracking</p>
            </div>
            <nav className="flex gap-2">
              <Link
                href="/admin/command-center"
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              >
                Command Center
              </Link>
              <Link
                href="/admin/subscribers"
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              >
                Subscribers
              </Link>
              <Link
                href="/admin/analytics"
                className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg"
              >
                Analytics
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Website Traffic Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Website Traffic Overview</h2>
            <p className="text-xs text-white/40">Last 30 days</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Page Views (30d)"
              value={traffic.totals.views}
              color="text-cyan-400"
            />
            <StatCard
              label="Unique Visitors"
              value={traffic.totals.uniqueVisitors}
              color="text-blue-400"
            />
            <StatCard
              label="Avg Daily Views"
              value={traffic.totals.avgDailyViews}
              color="text-purple-400"
            />
            <StatCard
              label="Bounce Rate"
              value={`${traffic.bounceRate}%`}
              sublabel="Single-page sessions"
              color={traffic.bounceRate > 60 ? "text-red-400" : "text-yellow-400"}
            />
            <StatCard
              label="Avg Session Duration"
              value={formatDuration(traffic.avgSessionDuration)}
              color="text-green-400"
            />
          </div>
        </div>

        {/* Daily Page Views */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Page Views (30 days)</h2>
          {traffic.totals.views === 0 ? (
            <p className="text-white/40 text-center py-8">No page views yet</p>
          ) : (
            <div className="space-y-2">
              {traffic.dailyViews.slice(0, 14).map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20 font-mono">
                    {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1">
                    <MiniBar value={day.views} max={maxDailyViews} color="bg-cyan-500" />
                  </div>
                  <div className="text-right w-28">
                    <span className="text-sm font-medium text-white">{day.views}</span>
                    <span className="text-xs text-white/40 ml-1">
                      ({day.uniqueVisitors} visitors)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Conversion Funnel */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Conversion Funnel (30 days)</h2>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 p-4 rounded-lg bg-white/5">
              <p className="text-xs text-white/50 uppercase tracking-wider">Visitors</p>
              <p className="text-2xl font-bold text-white mt-1">{funnelVisitors}</p>
            </div>
            <div className="flex items-center justify-center text-white/50 text-sm lg:w-24">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider">→</p>
                <p className="text-sm font-semibold text-white">{visitorToSignupRate}%</p>
              </div>
            </div>
            <div className="flex-1 p-4 rounded-lg bg-white/5">
              <p className="text-xs text-white/50 uppercase tracking-wider">Signups</p>
              <p className="text-2xl font-bold text-white mt-1">{funnelSignups}</p>
            </div>
            <div className="flex items-center justify-center text-white/50 text-sm lg:w-24">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider">→</p>
                <p className="text-sm font-semibold text-white">{signupToSubscriberRate}%</p>
              </div>
            </div>
            <div className="flex-1 p-4 rounded-lg bg-white/5">
              <p className="text-xs text-white/50 uppercase tracking-wider">Subscribers</p>
              <p className="text-2xl font-bold text-white mt-1">{funnelSubscribers}</p>
            </div>
          </div>
          <p className="text-xs text-white/40 mt-4">
            Visitor → Subscriber conversion: {visitorToSubscriberRate}%
          </p>
        </Card>

        {/* Top Pages */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Top Pages</h2>
          {traffic.topPages.length === 0 ? (
            <p className="text-white/40 text-center py-8">No page view data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                    <th className="text-left py-2 pr-4">Path</th>
                    <th className="text-right py-2 pr-4">Views</th>
                    <th className="text-right py-2">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.topPages.map((page) => (
                    <tr key={page.path} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-4 text-white/80 break-all">{page.path}</td>
                      <td className="py-2 pr-4 text-right text-white">{page.views}</td>
                      <td className="py-2 text-right text-white/70">{page.uniqueVisitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Referrers */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Top Referrers</h2>
          {traffic.topReferrers.length === 0 ? (
            <p className="text-white/40 text-center py-8">No referrer data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                    <th className="text-left py-2 pr-4">Referrer</th>
                    <th className="text-right py-2">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.topReferrers.map((referrer) => (
                    <tr key={referrer.referrer} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-4 text-white/80 break-all">{referrer.referrer}</td>
                      <td className="py-2 text-right text-white">{referrer.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* UTM Campaign Performance */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">UTM Campaign Performance</h2>
          {traffic.utmBreakdown.length === 0 ? (
            <p className="text-white/40 text-center py-8">No UTM data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                    <th className="text-left py-2 pr-4">Source</th>
                    <th className="text-left py-2 pr-4">Medium</th>
                    <th className="text-left py-2 pr-4">Campaign</th>
                    <th className="text-right py-2 pr-4">Views</th>
                    <th className="text-right py-2">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.utmBreakdown.map((utm, index) => (
                    <tr key={`${utm.source}-${utm.medium}-${utm.campaign}-${index}`} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-4 text-white/80">{utm.source || "—"}</td>
                      <td className="py-2 pr-4 text-white/80">{utm.medium || "—"}</td>
                      <td className="py-2 pr-4 text-white/80">{utm.campaign || "—"}</td>
                      <td className="py-2 pr-4 text-right text-white">{utm.views}</td>
                      <td className="py-2 text-right text-white/70">{utm.uniqueVisitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Landing Pages */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Top Landing Pages</h2>
          {traffic.topLandingPages.length === 0 ? (
            <p className="text-white/40 text-center py-8">No landing page data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                    <th className="text-left py-2 pr-4">Path</th>
                    <th className="text-right py-2">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.topLandingPages.map((page) => (
                    <tr key={page.path} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-4 text-white/80 break-all">{page.path}</td>
                      <td className="py-2 text-right text-white">{page.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Country Breakdown */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Country Breakdown</h2>
          {traffic.countryBreakdown.length === 0 ? (
            <p className="text-white/40 text-center py-8">No country data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                    <th className="text-left py-2 pr-4">Country</th>
                    <th className="text-right py-2">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {traffic.countryBreakdown.map((country) => (
                    <tr key={country.country} className="border-b border-white/5 last:border-b-0">
                      <td className="py-2 pr-4 text-white/80">{country.country}</td>
                      <td className="py-2 text-right text-white">{country.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard
            label="Active Subscribers"
            value={activeCount}
            sublabel={`of ${totalSubs} total`}
            color="text-green-400"
          />
          <StatCard
            label="Canceled (30d)"
            value={data.churn.last30Days}
            color={data.churn.last30Days > 0 ? "text-red-400" : "text-white"}
          />
          <StatCard
            label="Discord Rate"
            value={`${data.discord.rate}%`}
            sublabel={`${data.discord.linked}/${data.discord.totalUsers} linked`}
            color={data.discord.rate > 70 ? "text-green-400" : "text-yellow-400"}
          />
          <StatCard
            label="Report Engagement"
            value={`${engagementRate}%`}
            sublabel={`${data.reportEngagement.visitorsOnReportDay} visited on report day`}
            color={engagementRate > 50 ? "text-green-400" : "text-yellow-400"}
          />
          <StatCard
            label="Emails Sent"
            value={data.emailStats.sent}
            sublabel={data.emailStats.failed > 0 ? `${data.emailStats.failed} failed` : "All delivered"}
            color="text-blue-400"
          />
          <StatCard
            label="Trial"
            value={data.subscribers.trial || 0}
            sublabel="In trial period"
            color="text-purple-400"
          />
        </div>

        {/* Subscriber Breakdown */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Subscription Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(data.subscribers)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => {
                const colors: Record<string, string> = {
                  active: "bg-green-500",
                  comped: "bg-blue-500",
                  trial: "bg-purple-500",
                  canceled: "bg-red-500",
                  past_due: "bg-orange-500",
                  pending: "bg-yellow-500",
                };
                return (
                  <div key={status} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <div className={`w-3 h-3 rounded-full ${colors[status] || "bg-gray-500"}`} />
                    <div>
                      <p className="text-lg font-bold text-white">{count}</p>
                      <p className="text-xs text-white/50 capitalize">{status.replace("_", " ")}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* DAU Chart */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Daily Active Users (30 days)</h2>
          {data.dau.length === 0 ? (
            <p className="text-white/40 text-center py-8">No visit data yet</p>
          ) : (
            <div className="space-y-2">
              {data.dau.slice(0, 14).map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20 font-mono">
                    {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1">
                    <MiniBar value={day.count} max={maxDau} color="bg-green-500" />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Chat Usage */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Chat Usage (14 days)</h2>
          {data.chatStats.length === 0 ? (
            <p className="text-white/40 text-center py-8">No chat data yet</p>
          ) : (
            <div className="space-y-2">
              {data.chatStats.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-xs text-white/50 w-20 font-mono">
                    {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="flex-1">
                    <MiniBar value={day.totalMessages} max={maxChat} color="bg-blue-500" />
                  </div>
                  <div className="text-right w-28">
                    <span className="text-sm font-medium text-white">
                      {day.totalMessages} msgs
                    </span>
                    <span className="text-xs text-white/40 ml-1">
                      ({day.uniqueUsers} users)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alerts Triggered */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Alerts Triggered (14 days)</h2>
          {Object.keys(data.alertsByDate).length === 0 ? (
            <p className="text-white/40 text-center py-8">No alerts triggered recently</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(data.alertsByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 14)
                .map(([date, count]) => (
                  <div
                    key={date}
                    className="text-center p-2 rounded-lg bg-white/5"
                  >
                    <p className="text-xs text-white/40">
                      {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-lg font-bold text-amber-400">{count}</p>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
