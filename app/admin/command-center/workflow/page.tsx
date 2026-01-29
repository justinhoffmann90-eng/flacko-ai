"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Role {
  id: string;
  name: string;
  emoji: string;
  scheduledJobs: Array<{ id: string; time: string }>;
}

interface RolesData {
  roles: Role[];
}

const roleColors: Record<string, string> = {
  "trading-analyst": "from-red-500 to-orange-500",
  "content-creator": "from-yellow-500 to-amber-500",
  "community-manager": "from-green-500 to-emerald-500",
  "ops": "from-indigo-500 to-violet-500",
  "research-analyst": "from-sky-500 to-cyan-500",
  "justin": "from-pink-500 to-rose-500"
};

const roleBadgeColors: Record<string, string> = {
  "trading-analyst": "bg-red-500/20 text-red-400",
  "content-creator": "bg-yellow-500/20 text-yellow-400",
  "community-manager": "bg-green-500/20 text-green-400",
  "ops": "bg-indigo-500/20 text-indigo-400",
  "research-analyst": "bg-sky-500/20 text-sky-400",
  "justin": "bg-pink-500/20 text-pink-400"
};

// Role value flow data
const roleValueFlow: Record<string, { mission: string; inputs: string[]; tasks: string[]; outputs: { emoji: string; text: string }[] }> = {
  "trading-analyst": {
    mission: "Protect capital & surface intelligence",
    inputs: ["Daily Report", "HIRO Data", "Pulse Log"],
    tasks: ["News Scans", "HIRO Checks (3x)", "Chart Capture", "Daily Journal"],
    outputs: [
      { emoji: "🛡️", text: "Real-time risk alerts" },
      { emoji: "📊", text: "Accuracy tracking data" },
      { emoji: "📈", text: "Flow confirmation" }
    ]
  },
  "community-manager": {
    mission: "Curate signal & track catalysts",
    inputs: ["22 X Accounts", "News Sites", "robotaxitracker.com"],
    tasks: ["Market Pulse (3x)", "Catalyst Flagging", "Member Q&A"],
    outputs: [
      { emoji: "📡", text: "High-signal news feed" },
      { emoji: "📅", text: "Updated catalyst calendar" },
      { emoji: "💬", text: "Community engagement" }
    ]
  },
  "content-creator": {
    mission: "Turn analysis into authority",
    inputs: ["Daily Report", "Pulse Log", "Journal"],
    tasks: ["Morning Brief", "Tweet Drafts (3x)"],
    outputs: [
      { emoji: "🎯", text: "Public accuracy proof" },
      { emoji: "📣", text: "Brand authority on X" },
      { emoji: "🧲", text: "Subscriber acquisition" }
    ]
  },
  "ops": {
    mission: "Keep the machine running",
    inputs: ["System State", "Blockers", "Job Logs"],
    tasks: ["Daily Briefing", "Health Monitoring", "Dashboard Updates"],
    outputs: [
      { emoji: "✅", text: "Reliable automation" },
      { emoji: "🚧", text: "Blocker resolution" },
      { emoji: "📈", text: "Continuous improvement" }
    ]
  },
  "research-analyst": {
    mission: "Deep thesis intelligence",
    inputs: ["X Accounts", "robotaxitracker.com", "Catalyst Calendar"],
    tasks: ["Weekly Deep Dive", "Thesis Tracking"],
    outputs: [
      { emoji: "🔬", text: "FSD/Robotaxi insights" },
      { emoji: "📋", text: "Weekly 'State of Tesla'" },
      { emoji: "🎯", text: "Long-term conviction" }
    ]
  },
  "justin": {
    mission: "Final authority & public voice",
    inputs: ["Drafts via Telegram", "Catalyst Flags", "Daily Briefing"],
    tasks: ["Generate Report", "Approve & Post", "Approve Catalysts"],
    outputs: [
      { emoji: "📋", text: "Daily Flacko Report" },
      { emoji: "📣", text: "Published X content" },
      { emoji: "✅", text: "Quality control" }
    ]
  }
};

// Justin's tasks for timeline and schedule
const justinTasks = [
  { id: "post-brief", time: "8:15a", label: "Post Brief" },
  { id: "gen-report", time: "3:10p", label: "Gen Report" },
  { id: "post-tweets", time: "4:15p", label: "Post Tweets" }
];

// Schedule by role with destinations
const scheduleByRole: Record<string, { time: string; task: string; destination: string }[]> = {
  "justin": [
    { time: "~8:15a", task: "Review & Post Brief", destination: "Check draft → Post to X" },
    { time: "~3:10p", task: "Generate Daily Report", destination: "Run Flacko report generation" },
    { time: "~4:15p", task: "Review & Post Tweets", destination: "Check 3 drafts → Post to X" },
    { time: "Async", task: "Approve Catalysts", destination: "Review flagged events" }
  ],
  "trading-analyst": [
    { time: "7:30a", task: "News Scan", destination: "→ news/morning.md" },
    { time: "9:00a", task: "HIRO Check #1", destination: "→ Discord #alerts + Telegram" },
    { time: "11:00a", task: "HIRO Check #2", destination: "→ Discord #alerts + Telegram" },
    { time: "1:00p", task: "HIRO Check #3", destination: "→ Discord #alerts + Telegram" },
    { time: "3:00p", task: "Chart Capture", destination: "→ trading_inputs/" },
    { time: "3:30p", task: "EOD News Scan", destination: "→ news/afternoon.md" },
    { time: "4:30p", task: "Daily Journal", destination: "→ journals/ + Telegram" }
  ],
  "community-manager": [
    { time: "8:15a", task: "Market Pulse #1", destination: "→ Discord #market-pulse" },
    { time: "11:15a", task: "Market Pulse #2", destination: "→ Discord #market-pulse" },
    { time: "4:15p", task: "EOD Wrap", destination: "→ Discord #market-pulse" },
    { time: "All day", task: "Pulse Log", destination: "→ pulse/YYYY-MM-DD.md" },
    { time: "Async", task: "Catalyst Flags", destination: "→ Telegram for approval" }
  ],
  "content-creator": [
    { time: "8:00a", task: "Morning Brief Draft", destination: "→ Telegram for review" },
    { time: "4:00p", task: "Tweet Drafts (3)", destination: "→ drafts/tweets.md + Telegram" }
  ],
  "ops": [
    { time: "7:00a", task: "Daily Briefing", destination: "→ Telegram" },
    { time: "All day", task: "Dashboard Updates", destination: "→ dashboard/data.json" },
    { time: "Async", task: "Blocker Resolution", destination: "Fix issues as they arise" }
  ],
  "research-analyst": [
    { time: "Weekly", task: "Thesis Deep Dive", destination: "FSD/Robotaxi/Energy research" },
    { time: "Weekly", task: "State of Tesla", destination: "Weekly summary report" }
  ]
};

export default function WorkflowPage() {
  const [data, setData] = useState<RolesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/command-center/data')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white/50">Loading workflow...</div>
      </div>
    );
  }

  function parseTime(timeStr: string): number {
    if (!timeStr) return 9999;
    const match = timeStr.match(/(\d+):?(\d*)([ap])?/i);
    if (!match) return 9999;
    let hour = parseInt(match[1]);
    const min = parseInt(match[2]) || 0;
    const ampm = (match[3] || 'a').toLowerCase();
    if (ampm === 'p' && hour !== 12) hour += 12;
    if (ampm === 'a' && hour === 12) hour = 0;
    return hour * 60 + min;
  }

  // Format task label - remove "morning-", "afternoon-", etc.
  function formatTaskLabel(id: string): string {
    return id
      .replace(/^morning-/i, '')
      .replace(/^afternoon-/i, '')
      .replace(/^eod-/i, 'EOD ')
      .replace(/-\d{4}$/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();
  }

  // Group by role for swim lanes
  const swimLanes = [
    ...data.roles.map(role => ({
      ...role,
      jobs: role.scheduledJobs.sort((a, b) => parseTime(a.time) - parseTime(b.time))
    })),
    // Add Justin lane
    {
      id: "justin",
      name: "Justin",
      emoji: "👤",
      jobs: justinTasks.map(t => ({ id: t.label, time: t.time }))
    }
  ];

  // Time markers (7am to 5pm)
  const timeMarkers = ['7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];

  function getPosition(timeStr: string): number {
    const minutes = parseTime(timeStr);
    // 7am = 420 minutes, 5pm = 1020 minutes, span = 600 minutes
    const startMin = 7 * 60;
    const endMin = 17 * 60;
    const pct = ((minutes - startMin) / (endMin - startMin)) * 100;
    return Math.max(0, Math.min(92, pct));
  }

  // All roles for value flow including Justin
  const allRoles = [
    ...data.roles,
    { id: "justin", name: "Justin", emoji: "👤", scheduledJobs: [] }
  ];

  // Roles ordered for schedule display (Justin first)
  const scheduleRoleOrder = ["justin", "trading-analyst", "community-manager", "content-creator", "ops", "research-analyst"];
  const roleDisplayData: Record<string, { name: string; emoji: string; description: string }> = {
    "justin": { name: "Justin", emoji: "👤", description: "Final authority & public voice" },
    "trading-analyst": { name: "Trading Analyst", emoji: "🎯", description: "Risk alerts & flow analysis" },
    "community-manager": { name: "Community Manager", emoji: "💬", description: "Curate signal & engage" },
    "content-creator": { name: "Content Creator", emoji: "✍️", description: "Turn analysis into authority" },
    "ops": { name: "Ops", emoji: "⚙️", description: "Keep the machine running" },
    "research-analyst": { name: "Research Analyst", emoji: "📊", description: "Deep thesis work" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h1 className="text-xl font-semibold text-white">Daily Workflow</h1>
                <p className="text-xs text-white/50">Tasks across the trading day</p>
              </div>
            </div>
            <nav className="flex gap-2">
              <Link href="/admin" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Admin</Link>
              <Link href="/admin/command-center" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Dashboard</Link>
              <Link href="/admin/command-center/flow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Flow</Link>
              <Link href="/admin/command-center/discord" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Discord</Link>
              <Link href="/admin/command-center/roles" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Roles</Link>
              <Link href="/admin/command-center/workflow" className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg">Workflow</Link>
                <Link href="/admin/command-center/report" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Report</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Daily Sequence Timeline */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">📅 Daily Sequence</h2>
          <p className="text-sm text-white/50 mb-6">Tasks across the trading day (7am - 5pm CT) — scroll horizontally</p>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[1200px]">
              {/* Time axis */}
              <div className="flex border-b border-white/20 mb-4">
                {timeMarkers.map((t, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-white/50 pb-2 relative">
                    {t}
                    <div className="absolute bottom-0 left-1/2 w-px h-2 bg-white/30" />
                  </div>
                ))}
              </div>
              
              {/* Swim lanes */}
              <div className="space-y-2">
                {swimLanes.filter(lane => lane.jobs.length > 0).map((lane) => (
                  <div key={lane.id} className="flex items-center">
                    <div className="w-36 shrink-0 flex items-center gap-2 text-sm">
                      <span>{lane.emoji}</span>
                      <span className="text-white/70 truncate">{lane.name}</span>
                    </div>
                    <div className="flex-1 h-12 bg-white/5 rounded-lg relative">
                      {lane.jobs.map((job, i) => (
                        <div
                          key={i}
                          className={`absolute h-10 top-1 rounded-md flex items-center justify-center px-2 text-[11px] font-semibold shadow-lg bg-gradient-to-r ${roleColors[lane.id] || 'from-slate-500 to-slate-600'} ${lane.id === 'content-creator' ? 'text-slate-900' : 'text-white'}`}
                          style={{ 
                            left: `${getPosition(job.time)}%`,
                            minWidth: '55px',
                            maxWidth: '70px'
                          }}
                          title={`${job.id} @ ${job.time}`}
                        >
                          {lane.id === 'justin' ? job.id : formatTaskLabel(job.id)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex gap-4 mt-6 flex-wrap">
                {swimLanes.filter(l => l.jobs.length > 0).map(role => (
                  <div key={role.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded bg-gradient-to-r ${roleColors[role.id]}`} />
                    <span className="text-white/60">{role.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Full Schedule by Role */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">📋 Full Schedule by Role</h2>
          <p className="text-sm text-white/50 mb-6">Every task organized by who does it</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduleRoleOrder.map(roleId => {
              const roleInfo = roleDisplayData[roleId];
              const schedule = scheduleByRole[roleId] || [];
              if (schedule.length === 0) return null;
              
              return (
                <Card key={roleId} className="bg-white/3 border-white/10 overflow-hidden">
                  <div className={`px-4 py-3 flex items-center gap-3 border-b border-white/10 bg-gradient-to-r ${roleColors[roleId]} bg-opacity-20`} style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))` }}>
                    <span className="text-2xl">{roleInfo.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{roleInfo.name}</div>
                      <div className="text-xs text-white/50">{roleInfo.description}</div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    {schedule.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
                        <div className="text-xs text-white/40 w-14 shrink-0 font-mono">{item.time}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white">{item.task}</div>
                          <div className="text-xs text-white/50">{item.destination}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${roleId === 'justin' ? 'bg-pink-500/20 text-pink-400' : roleBadgeColors[roleId]}`}>
                          {roleId === 'justin' ? 'ACTION' : roleId.split('-').map(w => w[0].toUpperCase()).join('')}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Value Flow */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">🔄 Value Flow</h2>
          <p className="text-sm text-white/50 mb-6">How each role produces value — inputs, tasks, and outputs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRoles.filter(r => roleValueFlow[r.id]).map(role => {
              const flow = roleValueFlow[role.id];
              return (
                <Card key={role.id} className="bg-white/3 border-white/10 overflow-hidden">
                  <div className={`px-4 py-3 flex items-center gap-3 bg-gradient-to-r ${roleColors[role.id]} bg-opacity-15`} style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))` }}>
                    <span className="text-2xl">{role.emoji}</span>
                    <div>
                      <div className="font-semibold text-white text-sm">{role.name}</div>
                      <div className="text-xs text-white/50">{flow.mission}</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Inputs */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Inputs</div>
                      <div className="flex flex-wrap gap-1.5">
                        {flow.inputs.map((input, i) => (
                          <span key={i} className="bg-white/10 text-white/80 px-2 py-1 rounded text-xs font-medium">{input}</span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tasks */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Tasks</div>
                      <div className="flex flex-wrap gap-1.5">
                        {flow.tasks.map((task, i) => (
                          <span key={i} className="bg-white/10 text-white/80 px-2 py-1 rounded text-xs font-medium">{task}</span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Value Produced */}
                    <div className="pt-3 border-t border-white/5">
                      <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Value Produced</div>
                      <div className="space-y-1.5">
                        {flow.outputs.map((output, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                            <span>{output.emoji}</span>
                            <span>{output.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}
