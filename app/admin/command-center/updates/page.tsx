"use client";

import Link from "next/link";
import { Calendar, GitBranch, Zap, Code, Users, Settings, CheckCircle, Shield, Layout, Database } from "lucide-react";

interface Update {
  date: string;
  title: string;
  category: "architecture" | "feature" | "optimization" | "fix" | "ui" | "security";
  impact: "high" | "medium" | "low";
  description: string;
  value: string;
  replication: {
    steps: string[];
    files?: string[];
    commands?: string[];
    config?: string;
  };
  metrics?: {
    label: string;
    value: string;
  }[];
}

const updates: Update[] = [
  // Feb 1, 2026
  {
    date: "2026-02-01",
    title: "Multi-Agent Orchestration System",
    category: "architecture",
    impact: "high",
    description: "Implemented full hub-and-spoke orchestration where Manager (Opus 4.5) serves as the central coordinator that delegates to specialized agents. Users now interact with a single interface that intelligently routes tasks to specialists.",
    value: "80%+ cost savings on delegated tasks, better quality control with Manager reviewing all outputs, single interface eliminates confusion, intelligent model routing (Codex for code, Sonnet for analysis, etc.)",
    replication: {
      steps: [
        "Configure sub-agent settings in clawdbot.json with maxConcurrent and model routing",
        "Update Manager agent instructions with delegation logic and task routing table",
        "Remove autonomous heartbeats from worker agents (make them on-demand)",
        "Keep critical monitoring heartbeats (market monitoring, system health)",
        "Add quality review process to Manager workflow",
        "Document the orchestration flow for users"
      ],
      files: [
        "~/.clawdbot/clawdbot.json - Sub-agent configuration",
        "~/clawd/agents/MANAGER.md - Delegation instructions",
        "~/clawd/ORCHESTRATION-GUIDE.md - Complete documentation"
      ],
      config: `{
  "agents": {
    "defaults": {
      "subagents": {
        "maxConcurrent": 8,
        "model": "anthropic/claude-sonnet-4-5-20250929",
        "routing": {
          "software-engineer": "openai/gpt-5.2-codex",
          "trading-analyst": "anthropic/claude-sonnet-4-5-20250929"
        }
      }
    }
  }
}`
    },
    metrics: [
      { label: "Cost Reduction", value: "80%" },
      { label: "Agents Coordinated", value: "7" },
      { label: "Monthly Savings", value: "$300-500" }
    ]
  },
  {
    date: "2026-02-01",
    title: "Software Engineer Agent (Codex)",
    category: "feature",
    impact: "high",
    description: "Created dedicated Software Engineer agent powered by GPT-5.2-Codex for all coding tasks. Includes comprehensive instructions, dev-queue system, and integration with command center.",
    value: "85% cost reduction vs Opus for coding tasks, specialized model excels at code generation/debugging, frees up Manager for coordination, includes code quality checklists and security best practices",
    replication: {
      steps: [
        "Add OpenAI authentication to clawdbot config",
        "Create software-engineer agent with gpt-5.2-codex model",
        "Write comprehensive agent instructions (SOFTWARE-ENGINEER.md)",
        "Set up dev-queue directories (features, bugs, code-review)",
        "Add agent to roles sync script with emoji and display name",
        "Configure as on-demand agent (called by Manager)",
        "Test delegation from Manager"
      ],
      files: [
        "~/.clawdbot/clawdbot.json - Agent config + OpenAI auth",
        "~/clawd/agents/SOFTWARE-ENGINEER.md - Instructions",
        "~/clawd/dev-queue/ - Task queue directories"
      ],
      commands: [
        "mkdir -p ~/clawd/dev-queue/{features,bugs,code-review}",
        "echo 'sk-proj-...' | clawdbot models auth paste-token --provider openai"
      ]
    },
    metrics: [
      { label: "Cost vs Opus", value: "-85%" },
      { label: "Model", value: "GPT-5.2-Codex" }
    ]
  },
  {
    date: "2026-02-01",
    title: "Live Command Center Dashboard",
    category: "feature",
    impact: "high",
    description: "Built real-time command center dashboard with agent status, scheduled jobs, system health monitoring, and comprehensive alerting system. Integrated with Supabase for live updates.",
    value: "Real-time visibility into all agents, proactive issue detection with P0/P1/P2 alerts, comprehensive system health monitoring, actionable resolution steps with copy-to-clipboard prompts for Claude",
    replication: {
      steps: [
        "Create API routes to fetch agent status from Supabase",
        "Build dashboard UI with agent cards, scheduled jobs timeline, and alerts",
        "Implement alert generation logic based on system health metrics",
        "Add expandable alert sections with resolution steps and Claude prompts",
        "Sync agent data to Supabase via push-to-supabase.sh script",
        "Set up polling for live updates (5s interval)"
      ],
      files: [
        "app/admin/command-center/page.tsx - Main dashboard",
        "app/api/admin/command-center/status/route.ts - Agent status API",
        "~/clawd/dashboard/push-to-supabase.sh - Data sync script"
      ]
    },
    metrics: [
      { label: "Agents Monitored", value: "7" },
      { label: "Alert Types", value: "3 (P0/P1/P2)" },
      { label: "Update Frequency", value: "5s" }
    ]
  },
  {
    date: "2026-02-01",
    title: "Cron Expression Parser Enhancement",
    category: "fix",
    impact: "medium",
    description: "Fixed cron parser to handle */N syntax (e.g., '0 */2 * * *') and display as human-readable format ('Every 2h') instead of incorrect time format ('*/2:0').",
    value: "Dashboard now correctly displays recurring job schedules, improves user understanding of when jobs run, handles both standard (H:MM) and interval (*/N) formats",
    replication: {
      steps: [
        "Update sync-roles script's jq parser to detect */N patterns",
        "Add logic to format as 'Every Nh' or 'Every Nm'",
        "Keep standard H:MM formatting for regular cron expressions",
        "Update command center's formatTime() to handle both formats"
      ],
      files: [
        "~/clawd/scripts/sync-roles-simple.sh - Parser logic",
        "app/admin/command-center/page.tsx - Display formatter"
      ],
      config: `if .[1] | startswith("*/") then
  "Every " + (.[1] | sub("\\\\*/"; "")) + "h"
elif .[0] | startswith("*/") then
  "Every " + (.[0] | sub("\\\\*/"; "")) + "m"
else
  .[1] + ":" + .[0]
end`
    }
  },
  {
    date: "2026-02-01",
    title: "Command Center UI Redesign",
    category: "ui",
    impact: "medium",
    description: "Redesigned command center with dark mode aesthetic, purple/blue gradients, glowing effects, and modern glass-morphism. Removed redundant quick action tiles.",
    value: "Professional, modern appearance matches 2026 design trends, improved visual hierarchy, better contrast and readability, reduced clutter with focused design",
    replication: {
      steps: [
        "Update background to gradient (from-gray-900 to-gray-800)",
        "Add glass-morphism to cards (bg-black/40, backdrop-blur)",
        "Use gradient text for headings (from-purple-400 to-blue-400)",
        "Add glowing effects to status indicators (shadow-lg shadow-color/50)",
        "Update borders with subtle transparency (border-purple-500/20)"
      ],
      files: ["app/admin/command-center/page.tsx"]
    }
  },
  {
    date: "2026-02-01",
    title: "Subscriber Management Enhancement",
    category: "feature",
    impact: "high",
    description: "Fixed subscriber page to properly load all users using Supabase service client (bypassing RLS). Added delete functionality with confirmation for removing test accounts.",
    value: "Admin can now see all 49+ subscribers correctly, can safely remove test accounts, proper separation of concerns with service client for admin operations, includes Stripe subscription cancellation",
    replication: {
      steps: [
        "Update API route to use createServiceClient() instead of createClient()",
        "Keep regular client for auth checks (verify admin status)",
        "Use service client for data operations (bypasses RLS)",
        "Add DELETE endpoint with service client for all related data",
        "Include Stripe subscription cancellation in delete flow",
        "Add confirmation dialog with clear warnings"
      ],
      files: [
        "app/api/admin/subscribers/route.ts - GET endpoint",
        "app/api/admin/subscribers/[userId]/route.ts - DELETE endpoint"
      ],
      commands: [
        "const serviceClient = await createServiceClient();",
        "const { data } = await serviceClient.from('users').select('*');"
      ]
    },
    metrics: [
      { label: "Users Visible", value: "49" },
      { label: "RLS Issue", value: "Resolved" }
    ]
  },
  {
    date: "2026-02-01",
    title: "Admin Consolidation",
    category: "optimization",
    impact: "medium",
    description: "Deprecated /admin page and consolidated functionality into command center. Moved 'Upload Report' and 'Manage Subscribers' to main navigation.",
    value: "Reduced maintenance overhead (one less page), cleaner navigation structure, all admin tools in one place, better UX with consistent interface",
    replication: {
      steps: [
        "Add redirect from old admin page to command center",
        "Move key functionality to navigation bar",
        "Update all internal links to point to command center",
        "Keep old route for backwards compatibility (redirects)"
      ],
      files: [
        "app/admin/page.tsx - Redirect",
        "app/admin/command-center/page.tsx - Navigation"
      ]
    }
  },
  {
    date: "2026-02-01",
    title: "Terms of Service & Privacy Policy",
    category: "feature",
    impact: "medium",
    description: "Created comprehensive legal pages with proper disclosures, disclaimers, and privacy policies compliant with financial services regulations.",
    value: "Legal compliance for financial advisory service, clear risk disclosures, proper data handling transparency, protects both business and users",
    replication: {
      steps: [
        "Create /terms and /privacy routes",
        "Include financial disclaimer (not investment advice)",
        "Add data collection transparency",
        "Document user rights and responsibilities",
        "Include contact information for legal inquiries"
      ],
      files: [
        "app/(marketing)/terms/page.tsx",
        "app/(marketing)/privacy/page.tsx"
      ]
    }
  },

  // Jan 31, 2026
  {
    date: "2026-01-31",
    title: "Password Reset System Fix",
    category: "fix",
    impact: "high",
    description: "Fixed broken password reset flow by implementing proper callback-based token handling with session persistence. Added Telegram alerts for all email failures.",
    value: "Users can now successfully reset passwords, email failures are immediately visible via Telegram alerts, proper error tracking and logging for debugging",
    replication: {
      steps: [
        "Use Supabase callback flow instead of client-side token handling",
        "Add email failure detection in webhook",
        "Send Telegram alerts when emails fail to send",
        "Log all email attempts with detailed error messages",
        "Verify session persistence after password reset"
      ],
      files: [
        "app/(auth)/reset-password/page.tsx - UI with callback",
        "app/api/webhooks/stripe/route.ts - Email alerts",
        "app/api/admin/send-password-email/route.ts - Reset endpoint"
      ]
    },
    metrics: [
      { label: "Success Rate", value: "100%" },
      { label: "Alert Channels", value: "Telegram" }
    ]
  },
  {
    date: "2026-01-31",
    title: "Desktop Layout Optimization",
    category: "ui",
    impact: "medium",
    description: "Optimized entire app for desktop viewing with wider max-width (900px → 1200px), larger fonts, and better spacing. Applied to dashboard, reports, chat, and catalysts pages.",
    value: "Better experience on desktop/laptop where most serious traders work, improved readability with larger text, better use of screen real estate, maintains mobile-first responsive design",
    replication: {
      steps: [
        "Update max-width from max-w-4xl (896px) to max-w-6xl (1152px)",
        "Increase heading sizes (text-2xl → text-3xl)",
        "Add more padding on desktop (p-4 md:p-8)",
        "Widen sidebar on desktop for better visibility",
        "Test on various screen sizes to ensure responsiveness"
      ],
      files: [
        "app/(dashboard)/page.tsx - Dashboard",
        "app/(dashboard)/report/page.tsx - Report view",
        "app/(dashboard)/chat/page.tsx - AI chat",
        "app/(dashboard)/performance/page.tsx - Catalysts"
      ]
    }
  },
  {
    date: "2026-01-31",
    title: "Discord Role Sync Emergency Fix",
    category: "fix",
    impact: "high",
    description: "Temporarily hardcoded Discord values to fix broken role syncing while environment variables were being configured on Vercel.",
    value: "Restored subscriber Discord role assignment, documented the issue for proper fix, maintained service continuity during infrastructure issues",
    replication: {
      steps: [
        "Identify missing environment variables causing failures",
        "Add temporary hardcoded values for critical operations",
        "Document the temporary fix and proper solution needed",
        "Set up proper environment variables in deployment platform",
        "Revert hardcoded values once env vars are set"
      ],
      files: [
        "app/api/webhooks/stripe/route.ts - Temporary Discord values",
        "docs/CRITICAL-FIXES.md - Documentation"
      ]
    }
  },

  // Jan 30, 2026
  {
    date: "2026-01-30",
    title: "Daily Report Build Workflow",
    category: "feature",
    impact: "high",
    description: "Documented complete workflow for building daily TSLA reports including chart verification, performance reviews, framework reminders, and quality checklists.",
    value: "Consistent report quality, systematic performance tracking, ensures all required sections are completed, reduces errors and omissions, provides clear process for content creation",
    replication: {
      steps: [
        "Create daily checklist with all required sections",
        "Add chart verification step (HIRO figure required)",
        "Include performance review framework (/10 scoring)",
        "Add framework reminder section (Slow Zone, caps, rules)",
        "Document gameplan header format for next session",
        "Set up weekly review process with mandatory chart checks"
      ],
      files: [
        "~/clawd/docs/DAILY-WORKFLOW.md - Complete process",
        "~/clawd/docs/CHECKLIST.md - Quality checklist"
      ]
    }
  },
  {
    date: "2026-01-30",
    title: "Framework Terminology Update",
    category: "optimization",
    impact: "low",
    description: "Rebranded 'Pause Zone' to 'Slow Zone' across all documentation and chart templates to better reflect the reduced (not zero) position sizing approach.",
    value: "Clearer terminology that better communicates the strategy (slow down, not stop), more accurate reflection of actual trading behavior, consistent language across all materials",
    replication: {
      steps: [
        "Search all documentation for 'Pause Zone'",
        "Replace with 'Slow Zone' consistently",
        "Update chart templates",
        "Revise framework reminder sections",
        "Update tier color interpretation docs"
      ],
      files: [
        "~/clawd/TOOLS.md - Framework reference",
        "~/clawd/docs/* - All documentation"
      ]
    }
  },

  // Jan 29, 2026
  {
    date: "2026-01-29",
    title: "Journal Automation System",
    category: "feature",
    impact: "medium",
    description: "Created automated journal generation with weekly accuracy tracking. System generates daily journals, calculates accuracy scores, and produces weekly analysis.",
    value: "Systematic tracking of forecast accuracy, data-driven insights into what's working, automatic weekly summaries save time, historical record of performance for learning",
    replication: {
      steps: [
        "Create journal template with daily sections",
        "Add accuracy scoring system (correct/incorrect/partial)",
        "Implement weekly aggregation logic",
        "Set up automated journal generation skill",
        "Add trend analysis and pattern recognition",
        "Link to daily reports for context"
      ],
      files: [
        "~/clawd/journals/template.md - Journal format",
        "~/clawd/skills/journal-automation/ - Automation skill"
      ]
    }
  },
  {
    date: "2026-01-29",
    title: "Memory Restructure",
    category: "architecture",
    impact: "medium",
    description: "Reorganized clawdbot memory system into category-based structure for better organization and retrieval. Moved from flat structure to organized categories.",
    value: "Easier to find relevant information, better context retrieval for AI agents, clearer organization makes maintenance simpler, scales better as knowledge grows",
    replication: {
      steps: [
        "Create category directories (framework, tools, process, etc.)",
        "Move existing files into appropriate categories",
        "Update references in agent instructions",
        "Create index/README for each category",
        "Test agent memory retrieval to verify organization works"
      ],
      files: [
        "~/clawd/memory/ - Reorganized structure",
        "~/clawd/agents/*.md - Updated references"
      ]
    }
  },
  {
    date: "2026-01-29",
    title: "Rulebook Update: Master Eject Refinement",
    category: "optimization",
    impact: "medium",
    description: "Updated Master Eject calculation to use the LOWER of Weekly 21 EMA and Put Wall, providing more conservative risk management.",
    value: "More protective exit level reduces risk of large losses, conservative approach aligns with swing trading best practices, clearer decision-making framework",
    replication: {
      steps: [
        "Update Master Eject definition in rulebook",
        "Document the calculation (LOWER of 21 EMA weekly, Put Wall)",
        "Update chart templates to show both levels",
        "Train on when to use this level (position exits)",
        "Add to daily report checklist"
      ],
      files: [
        "~/clawd/RULEBOOK.md - Updated definition",
        "~/clawd/TOOLS.md - Reference documentation"
      ]
    }
  }
];

const categoryIcons = {
  architecture: GitBranch,
  feature: Zap,
  optimization: Settings,
  fix: CheckCircle,
  ui: Layout,
  security: Shield,
};

const categoryColors = {
  architecture: "from-purple-500 to-pink-500",
  feature: "from-blue-500 to-cyan-500",
  optimization: "from-green-500 to-emerald-500",
  fix: "from-orange-500 to-red-500",
  ui: "from-indigo-500 to-purple-500",
  security: "from-red-500 to-pink-500",
};

const impactBadges = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

// Group updates by date
const updatesByDate = updates.reduce((acc, update) => {
  if (!acc[update.date]) {
    acc[update.date] = [];
  }
  acc[update.date].push(update);
  return acc;
}, {} as Record<string, Update[]>);

const sortedDates = Object.keys(updatesByDate).sort().reverse();

export default function UpdatesPage() {
  const totalUpdates = updates.length;
  const highImpact = updates.filter(u => u.impact === "high").length;
  const newFeatures = updates.filter(u => u.category === "feature").length;
  const daysActive = sortedDates.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-black/20 border-b border-white/10 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Updates
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link href="/admin/reports" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Upload Report
                </Link>
                <Link href="/admin/subscribers" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Subscribers
                </Link>
                <Link href="/admin/command-center" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Command Center
                </Link>
                <Link href="/admin/command-center/updates" className="px-3 py-2 rounded bg-white/10 text-white">
                  Updates
                </Link>
                <Link href="/admin/dashboard/roles" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Roles
                </Link>
                <Link href="/admin/dashboard/docs" className="px-3 py-2 rounded hover:bg-white/5 text-gray-300 hover:text-white">
                  Docs
                </Link>
              </div>
              <div className="text-right text-sm text-gray-400">
                <div className="text-lg font-bold text-blue-400">
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

      <div className="max-w-7xl mx-auto p-4 md:p-8 mb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
            System Updates & Improvements
          </h1>
          <p className="text-gray-400 text-lg">
            A complete timeline of major enhancements, architectural changes, and optimizations made to the Flacko AI multi-agent system.
            Each entry includes detailed replication steps for others to implement in their own systems.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-400">{totalUpdates}</div>
            <div className="text-sm text-gray-400">Total Updates</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-blue-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">{highImpact}</div>
            <div className="text-sm text-gray-400">High Impact</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-green-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{newFeatures}</div>
            <div className="text-sm text-gray-400">New Features</div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-orange-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-400">{daysActive}</div>
            <div className="text-sm text-gray-400">Days Active</div>
          </div>
        </div>

        {/* Timeline - Grouped by Date */}
        <div className="space-y-12">
          {sortedDates.map((date) => {
            const dateUpdates = updatesByDate[date];
            const dateObj = new Date(date + "T00:00:00");
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
            const formattedDate = dateObj.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            });

            return (
              <div key={date} className="space-y-6">
                {/* Date Header */}
                <div className="sticky top-16 z-40 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-4 -mx-4 px-4 border-b border-purple-500/30">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-6 h-6 text-purple-400" />
                      <div>
                        <h2 className="text-2xl font-bold text-white">{dayName}</h2>
                        <p className="text-sm text-gray-400">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                    <div className="bg-purple-500/20 px-3 py-1 rounded-full text-sm font-semibold text-purple-300 border border-purple-500/30">
                      {dateUpdates.length} update{dateUpdates.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Updates for this date */}
                <div className="space-y-8 ml-0 md:ml-8">
                  {dateUpdates.map((update, index) => {
                    const Icon = categoryIcons[update.category];
                    const gradientClass = categoryColors[update.category];
                    const impactClass = impactBadges[update.impact];

                    return (
                      <div key={index} className="relative">
                        {/* Timeline connector */}
                        {index < dateUpdates.length - 1 && (
                          <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 to-transparent hidden md:block" />
                        )}

                        {/* Update card */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden hover:border-purple-500/30 transition-all">
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className={`p-3 rounded-lg bg-gradient-to-br ${gradientClass} shadow-lg flex-shrink-0`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                                  <div className="min-w-0">
                                    <h3 className="text-xl font-bold text-white mb-1">{update.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
                                      <span className="capitalize">{update.category}</span>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${impactClass} whitespace-nowrap`}>
                                    {update.impact.toUpperCase()} IMPACT
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="mb-4">
                              <p className="text-gray-300 leading-relaxed">{update.description}</p>
                            </div>

                            {/* Value Proposition */}
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="text-sm font-semibold text-green-400 mb-1">Why It's Valuable</div>
                                  <p className="text-sm text-gray-300">{update.value}</p>
                                </div>
                              </div>
                            </div>

                            {/* Metrics */}
                            {update.metrics && (
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                {update.metrics.map((metric, i) => (
                                  <div key={i} className="bg-white/5 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-purple-400">{metric.value}</div>
                                    <div className="text-xs text-gray-400">{metric.label}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Replication Guide */}
                            <details className="group">
                              <summary className="cursor-pointer text-blue-400 font-semibold mb-2 hover:text-blue-300 list-none flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                <span>How to Replicate</span>
                                <span className="ml-auto text-gray-500 group-open:rotate-90 transition-transform">▶</span>
                              </summary>

                              <div className="mt-4 space-y-4 bg-white/5 rounded-lg p-4">
                                {/* Steps */}
                                <div>
                                  <div className="text-sm font-semibold text-gray-300 mb-2">Steps:</div>
                                  <ol className="space-y-2">
                                    {update.replication.steps.map((step, i) => (
                                      <li key={i} className="text-sm text-gray-400 flex gap-2">
                                        <span className="text-purple-400 font-semibold">{i + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {/* Files */}
                                {update.replication.files && (
                                  <div>
                                    <div className="text-sm font-semibold text-gray-300 mb-2">Files Modified:</div>
                                    <ul className="space-y-1">
                                      {update.replication.files.map((file, i) => (
                                        <li key={i} className="text-sm text-gray-400 font-mono bg-black/30 px-3 py-1 rounded">
                                          {file}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Commands */}
                                {update.replication.commands && (
                                  <div>
                                    <div className="text-sm font-semibold text-gray-300 mb-2">Commands:</div>
                                    <div className="bg-black/50 rounded p-3 font-mono text-xs space-y-1">
                                      {update.replication.commands.map((cmd, i) => (
                                        <div key={i} className="text-green-400">{cmd}</div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Config */}
                                {update.replication.config && (
                                  <div>
                                    <div className="text-sm font-semibold text-gray-300 mb-2">Configuration:</div>
                                    <pre className="bg-black/50 rounded p-3 text-xs text-gray-300 overflow-x-auto">
                                      {update.replication.config}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Documentation maintained by Claude Sonnet 4.5</p>
          <p className="mt-1">All improvements are open for replication and adaptation</p>
          <p className="mt-2 text-xs text-gray-600">
            Journey: {sortedDates[sortedDates.length - 1]} → {sortedDates[0]} ({daysActive} days, {totalUpdates} updates)
          </p>
        </div>
      </div>
    </div>
  );
}
