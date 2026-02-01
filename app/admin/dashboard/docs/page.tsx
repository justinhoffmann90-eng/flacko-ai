"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      <nav className="bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/admin/command-center" className="text-gray-400 hover:text-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="text-lg font-bold text-blue-400">System Documentation</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Flacko AI Multi-Agent System</h1>

        {/* Overview */}
        <section className="mb-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">📊 System Overview</h2>
          <p className="text-gray-300 mb-4">
            Flacko AI is a multi-agent orchestration system that delivers daily TSLA trading intelligence to swing traders.
            The system uses specialized AI agents to monitor markets, generate reports, manage community, and ensure operational health.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 font-semibold mb-1">Platform</div>
              <div className="text-white">Next.js 14 + Supabase + Anthropic Claude</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 font-semibold mb-1">Orchestration</div>
              <div className="text-white">Clawdbot (Multi-agent system)</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 font-semibold mb-1">Agents</div>
              <div className="text-white">5 specialized agents (Manager + 4 workers)</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-gray-400 font-semibold mb-1">Scheduled Jobs</div>
              <div className="text-white">25+ automated tasks</div>
            </div>
          </div>
        </section>

        {/* Agents */}
        <section className="mb-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">👥 Agent Roles</h2>
          <div className="space-y-4">
            {[
              {
                emoji: "👤",
                name: "Manager",
                model: "Opus 4.5",
                role: "Quality control and coordination. Reviews output from workers before publishing. Runs every 2 hours."
              },
              {
                emoji: "🎯",
                name: "Trading Analyst",
                model: "Sonnet 4.5",
                role: "Monitors price action and HIRO readings. Generates daily trading report at 3pm. Creates daily journal at 5pm."
              },
              {
                emoji: "✍️",
                name: "Content Creator",
                model: "Sonnet 4.5",
                role: "Writes morning briefs, EOD wraps, and tweet drafts. Engages with community content."
              },
              {
                emoji: "🔬",
                name: "Research Analyst",
                model: "Sonnet 4.5",
                role: "Weekly TSLA research, catalyst reviews, and robotaxi updates. Monitors news sources and SEC filings."
              },
              {
                emoji: "🤝",
                name: "Community Manager",
                model: "Sonnet 4.5",
                role: "Daily market pulse at 11am. Monitors Discord and Telegram for support needs."
              },
              {
                emoji: "⚙️",
                name: "Ops Manager",
                model: "Sonnet 4.5",
                role: "System health monitoring, subscriber onboarding checks, X mention analysis (daily 11pm)."
              }
            ].map((agent, idx) => (
              <div key={idx} className="bg-black/20 p-4 rounded border-l-2 border-blue-500">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{agent.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{agent.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">{agent.model}</span>
                    </div>
                    <p className="text-sm text-gray-300">{agent.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/admin/dashboard/roles" className="text-blue-400 hover:text-blue-300 text-sm">
              → View detailed agent responsibilities
            </Link>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">✨ Implemented Features</h2>

          <div className="space-y-3">
            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">📋 Live Command Center</h3>
              <p className="text-sm text-gray-300 mb-2">
                Real-time dashboard showing agent status, scheduled tasks, system health, and alerts.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Agent heartbeats and current task status</li>
                <li>• Today's scheduled tasks with completion tracking</li>
                <li>• System health monitoring (Price Monitor, Clawdbot, Discord, Subscriber Onboarding)</li>
                <li>• P0/P1 alerts with expandable resolution steps and Claude prompts</li>
                <li>• Missed task detection with retry/cancel actions</li>
                <li>• Review queue for manager approval workflow</li>
                <li>• Completed task log with pagination</li>
                <li>• Auto-refresh every 5 seconds</li>
              </ul>
            </div>

            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">🔄 Hybrid Data Sync</h3>
              <p className="text-sm text-gray-300 mb-2">
                Local JSON files auto-sync to Supabase for web access.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Scripts write to ~/clawd/dashboard/*.json (local state)</li>
                <li>• Automatic push to Supabase after each update</li>
                <li>• API routes serve data from Supabase to web dashboard</li>
                <li>• Works both locally and on deployed site</li>
              </ul>
            </div>

            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">📊 Daily Report Generation</h3>
              <p className="text-sm text-gray-300 mb-2">
                5-phase workflow at 3pm CT daily by Trading Analyst.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Phase 1: Capture latest TSLA data (price, options, flow)</li>
                <li>• Phase 2: Analyze SpotGamma charts and regime</li>
                <li>• Phase 3: Generate structured markdown report</li>
                <li>• Phase 4: Send to manager for review</li>
                <li>• Phase 5: Publish to subscribers via Telegram + Discord</li>
              </ul>
            </div>

            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">📈 HIRO Monitoring</h3>
              <p className="text-sm text-gray-300 mb-2">
                3x daily checks (9am, 11am, 1pm) of HIRO readings vs report levels.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Monitors price approaching key levels (put wall, hedge wall, gamma strike)</li>
                <li>• Detects regime drift or invalidation</li>
                <li>• Sends Telegram alerts for level approaches</li>
                <li>• Posts updates to Discord #alerts channel</li>
              </ul>
            </div>

            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">🏥 System Health Monitoring</h3>
              <p className="text-sm text-gray-300 mb-2">
                Automated checks for subscriber onboarding health (every 30 min).
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Email delivery tracking (Resend API)</li>
                <li>• Bounce detection and alerting</li>
                <li>• Discord connection rate monitoring</li>
                <li>• Password set rate tracking</li>
                <li>• P0 alerts for critical issues (&gt;2 bounced emails)</li>
                <li>• P1 alerts for warnings (low Discord rate, low password rate)</li>
              </ul>
            </div>

            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">📝 Research & Content</h3>
              <p className="text-sm text-gray-300 mb-2">
                Weekly research and daily content generation.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Weekly TSLA research (Fridays)</li>
                <li>• Weekly catalyst review tracking earnings, events, macro</li>
                <li>• Robotaxi weekly updates</li>
                <li>• Daily market pulse (11am) from key sources</li>
                <li>• Tweet drafts and morning briefs</li>
              </ul>
            </div>

            <div className="bg-black/20 p-4 rounded">
              <h3 className="font-semibold text-white mb-2">🔍 X Mention Analysis</h3>
              <p className="text-sm text-gray-300 mb-2">
                Daily 11pm analysis of @clawdbot X mentions.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 ml-4">
                <li>• Reviews all mentions from the day</li>
                <li>• Summarizes feature requests and feedback</li>
                <li>• Assesses implementation value and effort</li>
                <li>• Documents in backlog for future development</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Flow */}
        <section className="mb-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">🔄 Data Flow</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">1.</span>
              <div>
                <div className="text-white font-semibold">Cron triggers scheduled job</div>
                <div className="text-gray-400">~/.clawdbot/cron/jobs.json defines schedule and target agent</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">2.</span>
              <div>
                <div className="text-white font-semibold">Worker agent executes task</div>
                <div className="text-gray-400">Reads instructions, gathers data, generates output</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">3.</span>
              <div>
                <div className="text-white font-semibold">Output saved to review queue</div>
                <div className="text-gray-400">~/clawd/review-queue/[agent]/[task].md</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">4.</span>
              <div>
                <div className="text-white font-semibold">Manager reviews and approves</div>
                <div className="text-gray-400">Quality checklist, approve/revise/reject decision</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">5.</span>
              <div>
                <div className="text-white font-semibold">Status updated in dashboard</div>
                <div className="text-gray-400">~/clawd/dashboard/agent-status.json → Supabase → Web UI</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 font-mono">6.</span>
              <div>
                <div className="text-white font-semibold">Approved content published</div>
                <div className="text-gray-400">Telegram, Discord, or internal documentation</div>
              </div>
            </div>
          </div>
        </section>

        {/* File Structure */}
        <section className="mb-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">📁 Key File Locations</h2>
          <div className="space-y-2 font-mono text-xs">
            <div className="bg-black/20 p-2 rounded">
              <div className="text-blue-400">~/.clawdbot/</div>
              <div className="text-gray-400 ml-4">├── clawdbot.json (agent config)</div>
              <div className="text-gray-400 ml-4">└── cron/jobs.json (scheduled tasks)</div>
            </div>
            <div className="bg-black/20 p-2 rounded">
              <div className="text-blue-400">~/clawd/</div>
              <div className="text-gray-400 ml-4">├── dashboard/ (JSON data files)</div>
              <div className="text-gray-400 ml-4">├── scripts/ (automation scripts)</div>
              <div className="text-gray-400 ml-4">├── review-queue/ (pending manager review)</div>
              <div className="text-gray-400 ml-4">├── backlog/ (feature requests)</div>
              <div className="text-gray-400 ml-4">└── logs/ (system logs)</div>
            </div>
            <div className="bg-black/20 p-2 rounded">
              <div className="text-blue-400">~/Flacko_AI/flacko-ai/</div>
              <div className="text-gray-400 ml-4">├── app/ (Next.js application)</div>
              <div className="text-gray-400 ml-4">└── .env.local (credentials)</div>
            </div>
          </div>
        </section>

        {/* Access */}
        <section className="mb-8 bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">🔐 Access & Permissions</h2>
          <div className="space-y-2 text-sm">
            <div className="bg-black/20 p-3 rounded">
              <div className="text-white font-semibold mb-1">Command Center</div>
              <div className="text-gray-400">Admin-only access via Supabase auth (is_admin=true)</div>
              <div className="text-blue-400 text-xs mt-1">https://flacko.ai/admin/command-center</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-white font-semibold mb-1">Local Dashboards</div>
              <div className="text-gray-400">HTML files in ~/clawd/dashboard/ (local machine only)</div>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <div className="text-white font-semibold mb-1">Database</div>
              <div className="text-gray-400">Supabase dashboard_data table stores synced JSON</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
          <p>Flacko AI Multi-Agent System</p>
          <p className="mt-1">Powered by Anthropic Claude • Orchestrated by Clawdbot</p>
        </div>
      </div>
    </div>
  );
}
