import Link from "next/link";
import type { Metadata } from "next";
import { TopicCard } from "@/components/learn/TopicCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gauge,
  Layers,
  LineChart,
  Sparkles,
  Target,
  TrafficCone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Learn | Flacko AI",
  description: "Master TSLA trading with a repeatable, risk-first system.",
};

export const dynamic = "force-static";
export const revalidate = 3600;

const topics = [
  {
    title: "Modes",
    description: "Understand the risk dial that controls position sizing.",
    time: "5 min",
    href: "/learn/modes",
    icon: <TrafficCone className="h-5 w-5" />,
    badge: "Start here",
    progress: 0.2,
  },
  {
    title: "Levels",
    description: "Call Wall, Put Wall, Gamma Strike, and key reaction zones.",
    time: "8 min",
    href: "/learn/levels",
    icon: <Layers className="h-5 w-5" />,
    badge: "Core",
    progress: 0.1,
  },
  {
    title: "Alerts",
    description: "How alerts fire and what to do when price hits a level.",
    time: "3 min",
    href: "/learn/alerts",
    icon: <Bell className="h-5 w-5" />,
    badge: "Action",
    progress: 0,
  },
  {
    title: "Reports",
    description: "Read the daily report fast and extract the edge.",
    time: "10 min",
    href: "/learn/reports",
    icon: <FileText className="h-5 w-5" />,
    badge: "Routine",
    progress: 0,
  },
  {
    title: "Scenarios",
    description: "Bull, base, and bear cases — how probabilities shape bias.",
    time: "5 min",
    href: "/learn/scenarios",
    icon: <Target className="h-5 w-5" />,
    badge: "Decision",
    progress: 0,
  },
  {
    title: "Quick Start",
    description: "Start with the risk framework and build from there.",
    time: "2 min",
    href: "/learn/modes",
    icon: <Sparkles className="h-5 w-5" />,
    badge: "Primer",
    progress: 0,
  },
];

const learningSections = [
  {
    id: "modes",
    title: "Mode System (Risk Dial)",
    summary: "Set the daily cap and decide how aggressive your sizing can be.",
    bullets: [
      "Green = favorable conditions, size up to 25%.",
      "Yellow = proceed with caution, cap 15%.",
      "Orange/Red = defense first, cap 10%/5%.",
    ],
    callout: "Your mode is the stoplight. It tells you how much to press — not whether to trade.",
    code: `// Risk cap example
const modeCaps = {
  green: 0.25,
  yellow: 0.15,
  orange: 0.10,
  red: 0.05,
};`,
    href: "/learn/modes",
  },
  {
    id: "levels",
    title: "Key Levels (Call/Put Walls)",
    summary: "Map the battlefield before the open — where dealers are hedged and price reacts.",
    bullets: [
      "Gamma Strike = highest reaction zone.",
      "Call Wall = upside magnet until it breaks.",
      "Put Wall = downside floor until it fails.",
    ],
    callout: "Levels guide your reaction plan. They are not predictions — they are decision points.",
    code: `// Reaction plan template
if (price > gammaStrike) {
  bias = "positive gamma";
  plan = "sell rips, buy dips";
}`,
    href: "/learn/levels",
  },
  {
    id: "alerts",
    title: "Alerts & Execution",
    summary: "When the alert fires, you already know the playbook.",
    bullets: [
      "Alert includes level, context, and next action.",
      "Confirm with mode + scenario alignment.",
      "Use smaller size if late to the move.",
    ],
    callout: "Alerts are triggers — discipline is the edge. Execute your plan, not your emotions.",
    code: `// Alert filter
const canTrade = mode !== "red" && scenario !== "bear";
if (canTrade) executePlan();`,
    href: "/learn/alerts",
  },
];

const systemFlow = [
  { label: "Market Data", sublabel: "Options flow, gamma levels, technicals", icon: LineChart },
  { label: "Daily Report", sublabel: "Analysis synthesized pre-market", icon: FileText },
  { label: "Mode + Cap", sublabel: "Risk dial sets your position size", icon: Gauge },
  { label: "Price Alerts", sublabel: "Triggers when levels hit", icon: Bell },
];

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Education Hub</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Master TSLA trading with a repeatable, risk-first system.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
              Learn how modes, levels, alerts, and scenarios connect — so every trade has a plan, a cap, and a reason.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="h-11 px-6">
                <Link href="/learn/modes">
                  Start the system <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href="/pricing">Get full access</Link>
              </Button>
            </div>
          </div>

          {/* System Flow Visualization */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0">
              {systemFlow.map((step, idx) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center text-center px-4 py-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary mb-2">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
                  </div>
                  {idx < systemFlow.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Core topics</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Build the foundation</h2>
            <p className="mt-2 text-sm text-muted-foreground">Short, focused lessons that compound into mastery.</p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex">6 Lessons</Badge>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.title} {...topic} />
          ))}
        </div>

        <div className="mt-14">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Deep dives</p>
              <h3 className="mt-3 text-2xl font-semibold">Learn the system step-by-step</h3>
              <p className="mt-2 text-sm text-muted-foreground">Tap a section to expand the playbook and key concepts.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 max-w-3xl">
            {learningSections.map((section) => (
              <details
                key={section.id}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground">
                  <span>{section.title}</span>
                  <span className="text-xs text-primary">View</span>
                </summary>
                <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                  <p>{section.summary}</p>
                  <ul className="space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-primary">
                    {section.callout}
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-4 text-xs text-white/80">
                    <code>{section.code}</code>
                  </pre>
                  <Button asChild variant="outline" className="h-9">
                    <Link href={section.href}>
                      Go to {section.title} <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Simple CTA */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-8">
            <h3 className="text-xl font-semibold">Ready to trade with an edge?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get daily reports, real-time alerts, and the full system.
            </p>
            <Button asChild className="mt-4 h-11 px-8">
              <Link href="/pricing">
                View plans <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
