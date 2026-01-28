"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface DiscordChannel {
  name: string;
  emoji: string;
  webhookId: string;
  purpose: string;
  schedule: string;
  scheduleDetails: string;
  automated: boolean;
  approvalRequired: boolean;
  contentTypes: string[];
  doNot: string[];
}

const channels: DiscordChannel[] = [
  {
    name: "#reports",
    emoji: "📄",
    webhookId: "1465448933525295298",
    purpose: "New daily report announcements",
    schedule: "When report uploaded",
    scheduleDetails: "Auto-fires when Justin uploads to flacko.ai/admin",
    automated: true,
    approvalRequired: false,
    contentTypes: [
      "Mode announcement (🟢🟡🟠🔴)",
      "Tier summary (Regime/Trend/Timing/Flow)",
      "Positioning stance",
      "Master eject level"
    ],
    doNot: [
      "Price alerts",
      "Level triggers",
      "Market updates",
      "Research briefs"
    ]
  },
  {
    name: "#alerts",
    emoji: "🚨",
    webhookId: "1463702802349035551",
    purpose: "Price level triggers & warnings",
    schedule: "Real-time (market hours)",
    scheduleDetails: "Cloud price monitor runs every 1 min during market hours (8a-4p CT)",
    automated: true,
    approvalRequired: false,
    contentTypes: [
      "Key level hits (support/resistance)",
      "Master eject warnings",
      "Mode change alerts",
      "Critical threshold breaches"
    ],
    doNot: [
      "Report announcements",
      "General updates",
      "Research content",
      "Morning briefs"
    ]
  },
  {
    name: "#morning-brief",
    emoji: "🌅",
    webhookId: "1465366203131236423",
    purpose: "Daily pre-market brief",
    schedule: "Daily 8:00 AM CT",
    scheduleDetails: "Mon-Fri before market open. Send to Telegram first for approval.",
    automated: false,
    approvalRequired: true,
    contentTypes: [
      "Pre-market price & futures",
      "Current mode & tiers",
      "Key levels for the day",
      "Catalyst watch",
      "Tom Lee First Word (FS Insight)"
    ],
    doNot: [
      "Post without approval",
      "Use wrong date",
      "Use old report data"
    ]
  },
  {
    name: "#market-pulse",
    emoji: "💓",
    webhookId: "1465450377620226058",
    purpose: "Intraday updates & EOD wrap",
    schedule: "As needed + EOD 8:00 PM CT",
    scheduleDetails: "Intraday: Major news/catalysts. EOD: FS Insight wrap (Mark Newton + FlashInsights)",
    automated: false,
    approvalRequired: true,
    contentTypes: [
      "Breaking news affecting TSLA",
      "Significant catalyst updates",
      "EOD Wrap (Daily Technical Strategy)",
      "FlashInsights macro commentary",
      "First to Market intel"
    ],
    doNot: [
      "Price alerts (use #alerts)",
      "Report announcements (use #reports)",
      "Tom Lee First Word (morning only)"
    ]
  },
  {
    name: "#tesla-research",
    emoji: "🔬",
    webhookId: "1465733362626072691",
    purpose: "Deep research & weekly updates",
    schedule: "Weekly + Post-Earnings",
    scheduleDetails: "Sundays 10:00 AM CT (weekly), and after each earnings call",
    automated: false,
    approvalRequired: true,
    contentTypes: [
      "Earnings call analysis",
      "Robotaxi Weekly Tracker (robotaxitracker.com)",
      "Catalyst calendar updates",
      "Deep dive research",
      "Quarterly reviews"
    ],
    doNot: [
      "Daily updates",
      "Price alerts",
      "Breaking news"
    ]
  },
  {
    name: "#hiro-intraday",
    emoji: "🌊",
    webhookId: "1465719006995546319",
    purpose: "HIRO dealer flow alerts",
    schedule: "As detected (market hours)",
    scheduleDetails: "When significant dealer positioning shifts detected on SpotGamma HIRO",
    automated: false,
    approvalRequired: true,
    contentTypes: [
      "Major HIRO moves (S&P, QQQ, TSLA)",
      "Dealer flip signals",
      "Gamma exposure shifts",
      "Options flow anomalies"
    ],
    doNot: [
      "Minor fluctuations",
      "Non-HIRO content"
    ]
  }
];

const weeklySchedule = [
  { day: "Monday", items: [
    { time: "8:00 AM", channel: "#morning-brief", task: "Morning Brief", auto: false },
    { time: "8:00 PM", channel: "#market-pulse", task: "EOD Wrap", auto: false },
    { time: "Real-time", channel: "#alerts", task: "Price Alerts", auto: true },
  ]},
  { day: "Tuesday", items: [
    { time: "8:00 AM", channel: "#morning-brief", task: "Morning Brief", auto: false },
    { time: "8:00 PM", channel: "#market-pulse", task: "EOD Wrap", auto: false },
    { time: "Real-time", channel: "#alerts", task: "Price Alerts", auto: true },
  ]},
  { day: "Wednesday", items: [
    { time: "8:00 AM", channel: "#morning-brief", task: "Morning Brief", auto: false },
    { time: "8:00 PM", channel: "#market-pulse", task: "EOD Wrap", auto: false },
    { time: "Real-time", channel: "#alerts", task: "Price Alerts", auto: true },
  ]},
  { day: "Thursday", items: [
    { time: "8:00 AM", channel: "#morning-brief", task: "Morning Brief", auto: false },
    { time: "8:00 PM", channel: "#market-pulse", task: "EOD Wrap", auto: false },
    { time: "Real-time", channel: "#alerts", task: "Price Alerts", auto: true },
  ]},
  { day: "Friday", items: [
    { time: "8:00 AM", channel: "#morning-brief", task: "Morning Brief", auto: false },
    { time: "8:00 PM", channel: "#market-pulse", task: "EOD Wrap", auto: false },
    { time: "Real-time", channel: "#alerts", task: "Price Alerts", auto: true },
  ]},
  { day: "Saturday", items: [
    { time: "—", channel: "—", task: "Markets Closed", auto: false },
  ]},
  { day: "Sunday", items: [
    { time: "10:00 AM", channel: "#tesla-research", task: "Robotaxi Weekly Tracker", auto: false },
    { time: "5:00 PM", channel: "#tesla-research", task: "Weekly Catalyst Review", auto: false },
  ]},
];

const specialEvents = [
  { event: "New Daily Report Upload", channel: "#reports", timing: "Immediate (auto)", description: "Auto-fires when Justin uploads to admin" },
  { event: "TSLA Earnings Call", channel: "#tesla-research", timing: "Next morning", description: "Full earnings analysis + catalyst updates" },
  { event: "FOMC Decision", channel: "#market-pulse", timing: "After announcement", description: "Fed decision impact analysis" },
  { event: "Major News/Catalyst", channel: "#market-pulse", timing: "As needed", description: "Breaking news affecting TSLA" },
  { event: "HIRO Major Move", channel: "#hiro-intraday", timing: "When detected", description: "Significant dealer flow shifts" },
];

export default function DiscordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💬</span>
              <div>
                <h1 className="text-xl font-semibold text-white">Discord Channels</h1>
                <p className="text-xs text-white/50">Complete posting schedule & rules</p>
              </div>
            </div>
            
            <nav className="flex gap-2">
              <Link href="/admin" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Admin</Link>
              <Link href="/admin/command-center" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Dashboard</Link>
              <Link href="/admin/command-center/flow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Flow</Link>
              <Link href="/admin/command-center/discord" className="px-3 py-1.5 text-sm text-white bg-white/10 rounded-lg">Discord</Link>
              <Link href="/admin/command-center/roles" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Roles</Link>
              <Link href="/admin/command-center/workflow" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10">Workflow</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* Quick Overview */}
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📋 Quick Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">2</div>
              <div className="text-xs text-white/60">Automated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">4</div>
              <div className="text-xs text-white/60">Manual (Approval)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">5</div>
              <div className="text-xs text-white/60">Daily Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">2</div>
              <div className="text-xs text-white/60">Weekly Tasks</div>
            </div>
          </div>
        </Card>

        {/* Weekly Schedule Grid */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">📅 Weekly Schedule</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-white/60 font-medium">Day</th>
                  <th className="text-left py-2 px-3 text-white/60 font-medium">Time (CT)</th>
                  <th className="text-left py-2 px-3 text-white/60 font-medium">Channel</th>
                  <th className="text-left py-2 px-3 text-white/60 font-medium">Task</th>
                  <th className="text-left py-2 px-3 text-white/60 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {weeklySchedule.map((day) => (
                  day.items.map((item, idx) => (
                    <tr key={`${day.day}-${idx}`} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2 px-3 text-white font-medium">
                        {idx === 0 ? day.day : ""}
                      </td>
                      <td className="py-2 px-3 text-white/80 font-mono text-xs">{item.time}</td>
                      <td className="py-2 px-3">
                        <span className="text-blue-400">{item.channel}</span>
                      </td>
                      <td className="py-2 px-3 text-white/80">{item.task}</td>
                      <td className="py-2 px-3">
                        {item.auto ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Auto</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Manual</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Special Events */}
        <Card className="bg-white/5 border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">⚡ Special Events & Triggers</h2>
          <div className="space-y-3">
            {specialEvents.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <div className="flex-1">
                  <div className="text-white font-medium">{event.event}</div>
                  <div className="text-xs text-white/50">{event.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 text-sm">{event.channel}</div>
                  <div className="text-xs text-white/40">{event.timing}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Channel Details */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">📢 Channel Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {channels.map((channel) => (
              <Card key={channel.name} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{channel.emoji}</span>
                    <h3 className="font-semibold text-white">{channel.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    {channel.automated ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Automated</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Manual</Badge>
                    )}
                    {channel.approvalRequired && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Approval</Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-white/70 mb-2">{channel.purpose}</div>
                
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="text-white/40">⏰</span>
                  <span className="text-white/60">{channel.schedule}</span>
                </div>
                <div className="text-xs text-white/50 mb-3 italic">{channel.scheduleDetails}</div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-green-400 font-medium mb-1">✅ Post Here:</div>
                    <div className="text-xs text-white/60 space-y-0.5">
                      {channel.contentTypes.map((type, idx) => (
                        <div key={idx}>• {type}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-red-400 font-medium mb-1">❌ Do NOT Post:</div>
                    <div className="text-xs text-white/60 space-y-0.5">
                      {channel.doNot.map((item, idx) => (
                        <div key={idx}>• {item}</div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/30 font-mono">Webhook: {channel.webhookId}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Approval Workflow */}
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">⚠️ Approval Workflow</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
              <div>
                <div className="text-white font-medium">Draft Content</div>
                <div className="text-white/60">Create the brief, wrap, or research update</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">2</div>
              <div>
                <div className="text-white font-medium">Send to Telegram</div>
                <div className="text-white/60">Justin reviews and approves (or requests changes)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">3</div>
              <div>
                <div className="text-white font-medium">Post to Discord</div>
                <div className="text-white/60">ONLY after explicit approval — "hurry up" ≠ approval</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Critical Rules */}
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🚨 Critical Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="text-green-400 font-medium">✅ DO:</div>
              <div className="text-white/70 space-y-1">
                <div>• Price alerts → #alerts</div>
                <div>• Research briefs → #tesla-research</div>
                <div>• EOD wrap → #market-pulse</div>
                <div>• Always Telegram first for manual posts</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-red-400 font-medium">❌ DON'T:</div>
              <div className="text-white/70 space-y-1">
                <div>• Price alerts → #reports</div>
                <div>• Research → #alerts</div>
                <div>• Post without approval</div>
                <div>• Confuse "hurry up" with approval</div>
              </div>
            </div>
          </div>
        </Card>

      </main>
    </div>
  );
}
