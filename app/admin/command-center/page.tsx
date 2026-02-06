"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, FileText, Users, LayoutDashboard, Calendar, Search, Activity } from "lucide-react";
import { ActivityFeed, CalendarView, GlobalSearch } from "@/components/command-center";

interface Agent {
  role: string;
  emoji: string;
  status: string;
  description?: string;
  lastHeartbeat: string | null;
  currentTask: string | null;
  tasksCompleted: number;
}

interface AgentStatus {
  agents: Record<string, Agent>;
  reviewQueue: any[];
  completedTaskLog?: Array<{
    agent: string;
    taskName: string;
    completedAt: string;
  }>;
  missedTasks?: Array<{
    agent: string;
    taskName: string;
    scheduledTime: string;
    overdue: string;
    detectedAt: string;
  }>;
  systemHealth?: any;
  dailyStats?: {
    date: string;
    totalScheduled: number;
    totalCompleted: number;
    pendingReviews: number;
    failedJobs: number;
  };
  lastUpdated?: string;
}

type Tab = "overview" | "activity" | "calendar";

export default function CommandCenterPage() {
  const [data, setData] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const statusRes = await fetch("/api/admin/command-center/status");
      
      if (!statusRes.ok) throw new Error("Failed to load status");

      const statusData = await statusRes.json();
      setData(statusData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s refresh (reduced from 5s for performance)
    return () => clearInterval(interval);
  }, [loadData]);

  function formatTimestamp(isoString?: string) {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour12: true,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function generateAlerts() {
    const alerts: Array<{id: string, level: string, msg: string, color: string, resolution: string, copyPrompt: string}> = [];

    if (!data?.systemHealth?.subscriberOnboarding?.details) return alerts;

    const details = data.systemHealth.subscriberOnboarding.details;

    // P0 Alerts
    if (details.p0Alerts > 0) {
      if (details.emailsBounced > 2) {
        alerts.push({
          id: 'p0-bounced-emails',
          level: 'P0',
          msg: `${details.emailsBounced} emails failed to send`,
          color: '#f87171',
          resolution: `Check Resend dashboard for specific bounce reasons`,
          copyPrompt: `CRITICAL: ${details.emailsBounced} bounced emails detected`
        });
      }
    }

    // P1 Alerts
    if (details.p1Alerts > 0) {
      if (details.emailsBounced > 0 && details.emailsBounced <= 2) {
        alerts.push({
          id: 'p1-bounced-emails',
          level: 'P1',
          msg: `${details.emailsBounced} email(s) bounced`,
          color: '#fbbf24',
          resolution: `Check Resend dashboard for bounce reason`,
          copyPrompt: `PRIORITY: ${details.emailsBounced} bounced email(s)`
        });
      }
      if (details.discordRate < 50) {
        alerts.push({
          id: 'p1-discord-rate',
          level: 'P1',
          msg: `Discord connection rate low (${details.discordRate}%)`,
          color: '#fbbf24',
          resolution: `Review Discord bot status`,
          copyPrompt: `PRIORITY: Discord connection rate at ${details.discordRate}%`
        });
      }
    }

    return alerts.filter(alert => !resolvedAlerts.has(alert.id));
  }

  const resolveAlert = (alertId: string) => {
    setResolvedAlerts(prev => new Set([...prev, alertId]));
  };

  const toggleAlert = (alertId: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p>Loading command center...</p>
        </div>
      </div>
    );
  }

  const totalAgents = data ? Object.keys(data.agents).length : 0;
  const onlineAgents = data
    ? Object.values(data.agents).filter((a) => a.status === "online").length
    : 0;

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative bg-black/40 border-b border-purple-500/20 sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Mission Control
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link href="/admin/productivity" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Productivity
                </Link>
                <Link href="/admin/content" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Content
                </Link>
                <Link href="/admin/subscribers" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Subscribers
                </Link>
                <Link href="/admin/backlog" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Backlog
                </Link>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {new Date().toLocaleTimeString("en-US", {
                    timeZone: "America/Chicago",
                    hour12: true,
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-4 md:p-8 mb-8">
        
        {/* Global Search Bar */}
        <div className="mb-8">
          <GlobalSearch />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 shadow-lg shadow-green-500/5 overflow-hidden group hover:border-green-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-gray-400 text-sm mb-1">Agents Online</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {onlineAgents}/{totalAgents}
              </div>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 shadow-lg shadow-blue-500/5 overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-gray-400 text-sm mb-1">Tasks Today</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {data?.dailyStats?.totalCompleted || 0}/{data?.dailyStats?.totalScheduled || 0}
              </div>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 shadow-lg shadow-yellow-500/5 overflow-hidden group hover:border-yellow-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-gray-400 text-sm mb-1">Review Queue</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {data?.reviewQueue?.length || 0}
              </div>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 shadow-lg shadow-purple-500/5 overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-gray-400 text-sm mb-1">System Health</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {data?.systemHealth && Object.values(data.systemHealth).some((s: any) => s?.status === "warning" || s?.status === "error")
                  ? "Issues"
                  : "Healthy"}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "overview"
                ? "text-blue-400 border-blue-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "activity"
                ? "text-blue-400 border-blue-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            <Activity className="w-4 h-4" />
            Activity Feed
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "calendar"
                ? "text-blue-400 border-blue-400"
                : "text-gray-400 border-transparent hover:text-gray-300"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <>
              {/* Alerts */}
              {(() => {
                const alerts = generateAlerts();
                return alerts.length > 0 && (
                  <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-gray-400 font-semibold mb-3 text-sm">Active Alerts</div>
                    <div className="space-y-2">
                      {alerts.map(alert => (
                        <div key={alert.id} className="bg-white/5 rounded-lg border-l-2" style={{ borderColor: alert.color }}>
                          <div
                            className="p-3 cursor-pointer hover:bg-white/5 flex items-center justify-between"
                            onClick={() => toggleAlert(alert.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-bold min-w-[30px]" style={{ color: alert.color }}>
                                {alert.level}
                              </span>
                              <span className="text-gray-200">{alert.msg}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resolveAlert(alert.id);
                                }}
                              >
                                Resolved
                              </button>
                              <span className="text-gray-500 text-xs">
                                {expandedAlerts.has(alert.id) ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>
                          {expandedAlerts.has(alert.id) && (
                            <div className="px-3 pb-3">
                              <div className="bg-black/30 rounded p-3">
                                <div className="text-blue-400 font-semibold text-xs mb-2 uppercase tracking-wide">
                                  Resolution Steps:
                                </div>
                                <div className="text-gray-300 text-xs">
                                  {alert.resolution}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Agent Status */}
              <div>
                <h2 className="text-xl font-bold mb-4">👥 Agent Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data && Object.entries(data.agents).map(([id, agent]) => (
                    <div key={id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{agent.emoji}</span>
                          <div>
                            <div className="font-semibold text-white">{agent.role}</div>
                            <div className="text-xs text-gray-500">{id}</div>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${agent.status === "online" ? "bg-green-400" : "bg-gray-600"}`} />
                      </div>
                      {agent.description && (
                        <p className="text-sm text-gray-400">{agent.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">
                        Last heartbeat: {formatTimestamp(agent.lastHeartbeat || undefined)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Queue */}
              <div>
                <h2 className="text-xl font-bold mb-4">📋 Review Queue</h2>
                {data?.reviewQueue && data.reviewQueue.length > 0 ? (
                  <div className="space-y-3">
                    {data.reviewQueue.map((item: any, idx: number) => (
                      <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-yellow-400 font-semibold text-sm mb-1">{item.agent}</div>
                            <div className="text-white">{item.taskName || item.type}</div>
                            <div className="text-gray-500 text-sm mt-1">
                              Created: {formatTimestamp(item.createdAt || item.timestamp)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30">
                              Approve
                            </button>
                            <button className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30">
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-400">
                    No items pending review
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "activity" && (
            <ActivityFeed />
          )}

          {activeTab === "calendar" && (
            <CalendarView />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Auto-refresh: 30s • Last: {formatTimestamp(data?.lastUpdated)}
      </div>
    </div>
  );
}
