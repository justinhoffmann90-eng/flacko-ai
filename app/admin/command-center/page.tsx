"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, FileText, Users } from "lucide-react";

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
    days?: string;
  }>;
  weeklyScheduled?: Array<{
    time: string;
    job: string;
    status: string;
  }>;
  nightlyScheduled?: Array<{
    time: string;
    job: string;
    status: string;
    note?: string;
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

  const loadData = useCallback(async () => {
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
  }, [taskInfo]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  function formatTime(time24?: string) {
    if (!time24) return time24;

    // Handle recurring format: "Every 2h" or "Every 30m"
    if (time24.startsWith("Every ")) {
      return time24; // Already human-readable
    }

    // Handle already-formatted times: "7:00 AM", "Monday 6:00 AM", "10:00 PM - 5:00 AM"
    if (time24.includes("AM") || time24.includes("PM") || time24.includes("-")) {
      return time24;
    }

    // Handle standard time format: "14:30"
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
          copyPrompt: `**CRITICAL: ${details.emailsBounced} bounced emails detected**

Context:
- Service: Resend transactional email
- Time window: Last 24 hours
- Impact: New subscribers not receiving welcome emails
- Data available: ${details.emailsSent24h} sent, ${details.emailsDelivered} delivered, ${details.emailsBounced} bounced

Your task:
1. Query Resend API for bounced emails in the last 24 hours
   - Use Resend API key from environment
   - Filter by status: "bounced"
   - Get bounce reason codes (hard bounce, soft bounce, mailbox full, invalid)

2. For each bounced email:
   - Log the email address and bounce reason
   - Check Supabase users table for user details
   - Determine bounce type:
     * Hard bounce (invalid address) → Mark email as invalid in DB
     * Soft bounce (temporary) → Retry after 2 hours
     * Mailbox full → Contact via Discord if connected

3. Take action based on findings:
   - Invalid emails: Update user record, send Discord notification if connected
   - Temporary issues: Schedule retry
   - Systemic issues: Alert me if >5 emails have same pattern

4. Generate summary report:
   - List of affected users
   - Bounce reasons breakdown
   - Actions taken
   - Recommended follow-ups

Files to check:
- ~/Flacko_AI/flacko-ai/.env.local (Resend API key)
- Database: public.users table
- Scripts: ~/clawd/scripts/subscriber-health-check.sh`
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
          copyPrompt: `**PRIORITY: ${details.emailsBounced} bounced email(s)**

Context:
- Recent signups: ${details.recentSignups} in last 24h
- Email delivery rate: ${details.emailDelivery}
- Bounced: ${details.emailsBounced} (low volume, but needs attention)

Task:
1. Access Resend dashboard or use API to get bounce details
2. Identify the specific email(s) and bounce reason
3. Check user record in Supabase:
   - Is the email typo'd? (common: gmail → gmial)
   - Is it a temporary issue?
4. If invalid email:
   - Search for user in Discord by username
   - Send DM asking for correct email
   - Update Supabase once confirmed
5. If temporary issue:
   - Schedule re-send in 2 hours
   - Monitor for success
6. Document findings in ~/clawd/logs/email-issues.md

API endpoints:
- Resend: GET /emails?status=bounced&limit=10
- Supabase: users table filtered by email`
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
          copyPrompt: `**PRIORITY: Discord connection rate at ${details.discordRate}%**

Context:
- Signups (7 days): ${details.signups7d}
- Discord connected: ~${Math.round(details.signups7d * details.discordRate / 100)} users
- Password set rate: ${details.passwordRate}% (for comparison)
- Expected rate: >70% for healthy onboarding

Problem indicators:
- Bot offline? Check if Discord bot is responding
- OAuth flow broken? Test Discord OAuth locally
- Webhook issues? Check Supabase webhooks firing correctly
- User friction? Maybe CTA unclear in onboarding flow

Investigation steps:
1. Test Discord OAuth flow:
   - Try connecting your own test account
   - Check for error messages in browser console
   - Verify redirect URIs match in Discord app settings

2. Check Discord bot status:
   - Visit Discord Developer Portal
   - Confirm bot token is valid
   - Check bot has proper permissions (roles, channels)

3. Review recent user feedback:
   - Check #support channel in Discord
   - Look for reports of connection issues
   - Review Telegram messages from clawdbot

4. Analyze onboarding flow:
   - Check database for users stuck at Discord connection step
   - Query: SELECT * FROM users WHERE discord_username IS NULL AND created_at > NOW() - INTERVAL '7 days'

5. If technical issue found:
   - Fix immediately
   - Document in ~/clawd/logs/discord-issues.md
   - Send announcement in Discord about fix

6. If user experience issue:
   - Draft improved copy for Discord CTA
   - A/B test with next cohort
   - Monitor improvement

Files to check:
- Discord bot config: ~/.clawdbot/clawdbot.json
- OAuth settings: Supabase Auth providers
- User flow: ~/Flacko_AI/flacko-ai/app/(auth)/signup/page.tsx`
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
          copyPrompt: `**PRIORITY: Password set rate at ${passwordRate}%**

Context:
- Signups (7 days): ${details.signups7d}
- Users without passwords: ~${Math.round(details.signups7d * (100 - passwordRate) / 100)}
- Expected rate: >95% for healthy onboarding
- Related metrics:
  * Email delivery: ${details.emailDelivery}
  * Discord rate: ${details.discordRate}%

This is unusual and needs investigation.

Possible causes:
1. Email delivery issue (password reset emails not arriving)
2. Broken reset password link
3. Confusing UX in signup flow
4. Email going to spam
5. User abandonment (signed up but lost interest)

Investigation plan:
1. Test password reset flow yourself:
   - Create test account
   - Request password reset
   - Check email delivery time
   - Verify link works and UX is clear

2. Check email logs in Resend:
   - Are password reset emails being sent?
   - What's the open rate?
   - Any bounces or spam reports?

3. Query database for users without passwords:
   \`\`\`sql
   SELECT id, email, created_at, discord_username
   FROM public.users
   WHERE encrypted_password IS NULL
   AND created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC
   \`\`\`

4. For each user without password:
   - Check if they connected Discord (engaged but forgot password)
   - Check Stripe events (paid but can't access)
   - Send personalized follow-up via Discord or email

5. If systemic issue found:
   - Fix immediately (broken link, email template, etc.)
   - Bulk re-send password reset emails to affected users
   - Send apology message explaining the issue

6. If user friction/abandonment:
   - Review signup flow UX
   - Consider auto-generating temp passwords
   - Add "Set Password" reminder in Discord welcome message

7. Document findings and actions taken in:
   ~/clawd/logs/onboarding-issues.md

API/Database access needed:
- Resend API for email logs
- Supabase DB for user queries
- Discord API for DM outreach

Report back with:
- Root cause identified
- Number of affected users
- Actions taken
- Recommended process improvements`
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
    <div className="min-h-screen bg-black text-gray-100">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative bg-black/40 border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-xl shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Command Center
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link href="/admin/reports" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Upload Report
                </Link>
                <Link href="/admin/subscribers" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Subscribers
                </Link>
                <Link href="/admin/command-center/updates" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Updates
                </Link>
                <Link href="/admin/dashboard/roles" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Roles
                </Link>
                <Link href="/admin/dashboard/docs" className="px-3 py-2 rounded-lg hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-all">
                  Docs
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

      <div className="relative max-w-7xl mx-auto p-4 md:p-8 mb-8">

        {/* Stats */}
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
                {data?.systemHealth && Object.values(data.systemHealth).some((s: any) => s.status === "warning" || s.status === "error")
                  ? "Issues"
                  : "Healthy"}
              </div>
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
                            {task.days && <span className="text-xs text-gray-500 ml-2">({task.days})</span>}
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
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Weekly</div>
                    <div className="space-y-1">
                      {agent.weeklyScheduled.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-gray-500 text-xs w-32">{formatTime(task.time)}</span>
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

                {agent.nightlyScheduled && agent.nightlyScheduled.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-400 mb-2">Nightly</div>
                    <div className="space-y-1">
                      {agent.nightlyScheduled.map((task, idx) => (
                        <div key={idx} className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-gray-500 text-xs w-32">{formatTime(task.time)}</span>
                            <span
                              className="flex-1 text-gray-300 cursor-pointer hover:text-blue-300 underline decoration-dotted"
                              onClick={() => showTaskDetails(task.job)}
                            >
                              {task.job}
                            </span>
                          </div>
                          {task.note && (
                            <span className="text-xs text-gray-500 ml-34">{task.note}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Review Queue */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">📋 Review Queue</h2>
          {data?.reviewQueue && data.reviewQueue.length > 0 ? (
            <div className="space-y-3">
              {data.reviewQueue.map((item: any, idx: number) => (
                <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-yellow-400 font-semibold text-sm mb-1">{item.agent}</div>
                      <div className="text-white text-lg mb-1">{item.taskName || item.type}</div>
                      <div className="text-gray-400 text-sm">
                        Created: {formatTimestamp(item.createdAt || item.timestamp)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30">
                        Approve
                      </button>
                      <button className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30">
                        Revise
                      </button>
                      <button className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30">
                        Reject
                      </button>
                    </div>
                  </div>
                  {item.filePath && (
                    <div className="text-xs text-gray-500 font-mono mt-2">
                      {item.filePath}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
              No items pending review
            </div>
          )}
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
              {(data.completedTaskLog || [])
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
