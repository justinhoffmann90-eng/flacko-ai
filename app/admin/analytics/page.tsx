"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load analytics");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white/50">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
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
