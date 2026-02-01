"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

interface Agent {
  role: string;
  emoji: string;
  status: string;
  lastHeartbeat: string | null;
  currentTask: string | null;
  tasksCompleted: number;
  todayScheduled?: Array<{
    time: string;
    job: string;
    status: string;
  }>;
  weeklyScheduled?: Array<{
    day: string;
    time: string;
    job: string;
  }>;
  todayCompleted?: string[];
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

interface TaskInfo {
  tasks: Array<{
    name: string;
    instructions: string;
    schedule: string;
    enabled: boolean;
    agent: string;
  }>;
}

export default function CommandCenterPage() {
  const [data, setData] = useState<AgentStatus | null>(null);
  const [taskInfo, setTaskInfo] = useState<TaskInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set());

  const tasksPerPage = 20;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [statusRes, tasksRes] = await Promise.all([
        fetch("/api/admin/command-center/status"),
        taskInfo ? Promise.resolve({ json: async () => taskInfo }) : fetch("/api/admin/command-center/tasks")
      ]);

      if (!statusRes.ok) throw new Error("Failed to load status");

      const statusData = await statusRes.json();
      setData(statusData);

      if (!taskInfo) {
        const tasksData = await tasksRes.json();
        setTaskInfo(tasksData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  }

  function formatTime(time24?: string) {
    if (!time24) return time24;
    const [hours, minutes] = time24.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

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

  function showTaskDetails(taskName: string) {
    setSelectedTask(taskName);
  }

  function closeTaskModal() {
    setSelectedTask(null);
  }

  async function resolveAlert(alertId: string) {
    setResolvedAlerts(prev => new Set([...prev, alertId]));
  }

  function toggleAlert(alertId: string) {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(alertId)) {
        next.delete(alertId);
      } else {
        next.add(alertId);
      }
      return next;
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
          resolution: `Check Resend dashboard for specific bounce reasons
Identify which user emails bounced
If "mailbox full" - contact user via alternative method
If "invalid email" - update user record in Supabase
After resolution, resend welcome email`,
          copyPrompt: `Please investigate ${details.emailsBounced} bounced email(s):

1. Query Resend API for bounced emails in the last 24 hours
2. Identify the bounce reason (mailbox full, invalid address, etc.)
3. For each bounced email, determine the appropriate action
4. Update user records in Supabase if needed
5. Resend welcome emails to resolved addresses`
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
          resolution: `Check Resend dashboard for bounce reason
Update user email if invalid
Resend welcome email after fix`,
          copyPrompt: `Please check the bounced email(s) and take appropriate action.`
        });
      }
      if (details.discordRate < 50) {
        alerts.push({
          id: 'p1-discord-rate',
          level: 'P1',
          msg: `Discord connection rate low (${details.discordRate}%)`,
          color: '#fbbf24',
          resolution: `Review Discord bot status
Check for API rate limits
Verify webhook configurations
Monitor connection logs`,
          copyPrompt: `Discord connection rate is at ${details.discordRate}%. Please investigate and resolve.`
        });
      }
      const passwordRate = details.passwordRate || 100;
      if (passwordRate < 80) {
        alerts.push({
          id: 'p1-password-rate',
          level: 'P1',
          msg: `Password set rate below 80% (${passwordRate}%)`,
          color: '#fbbf24',
          resolution: `Review signup flow for issues
Check email delivery of password reset links
Reach out to users who haven't set passwords
Consider sending reminder emails`,
          copyPrompt: `Password set rate is ${passwordRate}%. Please investigate why users aren't setting passwords.`
        });
      }
    }

    return alerts.filter(alert => !resolvedAlerts.has(alert.id));
  }

  const selectedTaskData = selectedTask && taskInfo
    ? taskInfo.tasks.find((t) => t.name === selectedTask)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-gray-100">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-3xl font-bold text-blue-400">🎯 Live Command Center</h1>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div className="text-2xl font-bold text-blue-400">
              {new Date().toLocaleTimeString("en-US", {
                timeZone: "America/Chicago",
                hour12: true,
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
            <div>
              {new Date().toLocaleDateString("en-US", {
                timeZone: "America/Chicago",
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Agents Online</div>
            <div className="text-2xl font-bold text-green-400">{onlineAgents}/{totalAgents}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Tasks Today</div>
            <div className="text-2xl font-bold text-blue-400">
              {data?.dailyStats?.totalCompleted || 0}/{data?.dailyStats?.totalScheduled || 0}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Review Queue</div>
            <div className="text-2xl font-bold text-yellow-400">{data?.reviewQueue?.length || 0}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">System Health</div>
            <div className="text-2xl font-bold text-green-400">
              {data?.systemHealth && Object.values(data.systemHealth).some((s: any) => s.status === "warning" || s.status === "error")
                ? "Issues"
                : "Healthy"}
            </div>
          </div>
        </div>

        {/* System Health Details */}
        {data?.systemHealth && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🏥 System Health</h2>

            {/* Active Alerts */}
            {(() => {
              const alerts = generateAlerts();
              return alerts.length > 0 && (
                <div className="mb-6 bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-gray-400 font-semibold mb-3 text-sm">Active Alerts</div>
                  <div className="space-y-2">
                    {alerts.map(alert => (
                      <div key={alert.id} className="bg-white/5 rounded border-l-2" style={{ borderColor: alert.color }}>
                        <div
                          className="p-3 cursor-pointer hover:bg-white/5"
                          onClick={() => toggleAlert(alert.id)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-bold min-w-[30px]" style={{ color: alert.color }}>
                              {alert.level}
                            </span>
                            <span className="flex-1 text-gray-200">{alert.msg}</span>
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
                          <div className="px-3 pb-3 space-y-3">
                            <div className="bg-black/30 rounded p-3">
                              <div className="text-blue-400 font-semibold text-xs mb-2 uppercase tracking-wide">
                                Resolution Steps:
                              </div>
                              <div className="text-gray-300 text-xs space-y-1">
                                {alert.resolution.split('\n').map((step, idx) => (
                                  <div key={idx} className="pl-3 relative">
                                    <span className="absolute left-0">→</span>
                                    {step}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="relative bg-black/30 rounded p-3">
                              <button
                                className="absolute top-2 right-2 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30"
                                onClick={() => {
                                  navigator.clipboard.writeText(alert.copyPrompt);
                                }}
                              >
                                Copy
                              </button>
                              <div className="text-blue-400 font-semibold text-xs mb-2 uppercase tracking-wide">
                                Claude Prompt:
                              </div>
                              <div className="text-gray-300 text-xs whitespace-pre-wrap pr-16">
                                {alert.copyPrompt}
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

            {/* Health Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.systemHealth).map(([key, health]: [string, any]) => (
                <div
                  key={key}
                  className={`rounded-lg p-4 border ${
                    health.status === "error" ? "bg-red-500/10 border-red-500/30" :
                    health.status === "warning" ? "bg-yellow-500/10 border-yellow-500/30" :
                    "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      health.status === "online" || health.status === "healthy" ? "bg-green-400" :
                      health.status === "warning" ? "bg-yellow-400" :
                      "bg-red-400"
                    }`} />
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    Last check: {formatTimestamp(health.lastCheck)}
                  </div>
                  {health.details && (
                    <div className="text-xs text-gray-300 space-y-1">
                      {health.emailDelivery && <div>Email: {health.emailDelivery}</div>}
                      {health.details.p0Alerts > 0 && (
                        <div className="text-red-400">P0 Alerts: {health.details.p0Alerts}</div>
                      )}
                      {health.details.p1Alerts > 0 && (
                        <div className="text-yellow-400">P1 Alerts: {health.details.p1Alerts}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missed Tasks */}
        {data?.missedTasks && data.missedTasks.length > 0 && (
          <div className="mb-8 bg-red-500/10 border-2 border-red-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Missed Tasks</h2>
            <div className="space-y-4">
              {data.missedTasks.map((task, idx) => (
                <div key={idx} className="bg-white/5 border border-red-500/30 rounded-lg p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-blue-400 font-semibold mb-1">{task.agent}</div>
                    <div
                      className="text-white text-lg mb-2 cursor-pointer hover:text-blue-300 underline decoration-dotted"
                      onClick={() => showTaskDetails(task.taskName)}
                    >
                      {task.taskName}
                    </div>
                    <div className="text-gray-400 text-sm">
                      Scheduled: {formatTime(task.scheduledTime)} • <span className="text-red-400">Overdue: {task.overdue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">👥 Agent Status & Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data && Object.entries(data.agents).map(([id, agent]) => (
              <div key={id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{agent.emoji}</span>
                    <div>
                      <div className="font-semibold text-white">{agent.role}</div>
                      <div className="text-sm text-gray-400">{id}</div>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${agent.status === "online" ? "bg-green-400" : "bg-gray-600"}`} />
                </div>

                {agent.todayScheduled && agent.todayScheduled.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Today</div>
                    <div className="space-y-1">
                      {agent.todayScheduled.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-gray-500 text-xs">{formatTime(task.time)}</span>
                          <span
                            className="flex-1 text-gray-300 cursor-pointer hover:text-blue-300 underline decoration-dotted"
                            onClick={() => showTaskDetails(task.job)}
                          >
                            {task.job}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${task.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {agent.weeklyScheduled && agent.weeklyScheduled.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 mb-2">Weekly</div>
                    <div className="space-y-1">
                      {agent.weeklyScheduled.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-gray-500 text-xs">{task.day.slice(0,3)} {formatTime(task.time)}</span>
                          <span
                            className="flex-1 text-gray-300 cursor-pointer hover:text-blue-300 underline decoration-dotted"
                            onClick={() => showTaskDetails(task.job)}
                          >
                            {task.job}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Completed Tasks */}
        {data?.completedTaskLog && data.completedTaskLog.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">✅ Completed Task Log</h2>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded disabled:opacity-50"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1 text-gray-400">
                  Page {currentPage} of {Math.ceil(data.completedTaskLog.length / tasksPerPage)}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(data.completedTaskLog.length / tasksPerPage), currentPage + 1))}
                  disabled={currentPage === Math.ceil(data.completedTaskLog.length / tasksPerPage)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {data.completedTaskLog
                .slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage)
                .map((task, idx) => (
                  <div key={idx} className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-gray-400">{formatTimestamp(task.completedAt)}</div>
                      <div className="text-blue-400">{task.agent}</div>
                      <div
                        className="text-white cursor-pointer hover:text-blue-300 underline decoration-dotted"
                        onClick={() => showTaskDetails(task.taskName)}
                      >
                        {task.taskName}
                      </div>
                    </div>
                    <div className="text-green-400">✓</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {selectedTask && selectedTaskData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeTaskModal}>
          <div className="bg-gray-800 border border-blue-500/30 rounded-xl max-w-3xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-800 border-b border-white/10 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-blue-400">{selectedTaskData.name}</h3>
              <button onClick={closeTaskModal} className="w-9 h-9 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-2">Agent</div>
                <div className="text-gray-200">{selectedTaskData.agent}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-2">Schedule</div>
                <div className="text-gray-200">{selectedTaskData.schedule}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-2">Status</div>
                <div className="text-gray-200">{selectedTaskData.enabled ? "✅ Enabled" : "❌ Disabled"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-400 font-semibold mb-2">Instructions</div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-gray-200 whitespace-pre-wrap font-mono text-sm">
                  {selectedTaskData.instructions}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 text-xs text-gray-500 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Auto-refresh: 5s • Last: {formatTimestamp(data?.lastUpdated)}
      </div>
    </div>
  );
}
