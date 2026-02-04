import Link from "next/link";
import { TopicCard } from "@/components/learn/TopicCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Target,
  TrafficCone,
  TrendingUp,
  Wand2,
} from "lucide-react";

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
    summary: "Map the battlefield before the bell — where dealers are hedged and price reacts.",
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

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -top-10 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Education Hub</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Master TSLA trading with a repeatable, risk-first system.
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Learn how modes, levels, alerts, and scenarios connect — so every trade has a plan, a cap, and a reason.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="h-11 px-6">
                  <Link href="/learn/modes">
                    Start the system <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 px-6">
                  <Link href="/reports">See daily reports</Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Risk Framework", desc: "Know your size before the open." },
                  { title: "Level Mastery", desc: "React to price with confidence." },
                  { title: "Execution", desc: "Actionable alerts, no guesswork." },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">TSLA Edge Stack</p>
                    <p className="text-xs text-muted-foreground">Mode → Levels → Alerts → Scenarios</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { label: "Mode Set", value: "Green (25% cap)" },
                    { label: "Key Level", value: "Gamma Strike" },
                    { label: "Alert Plan", value: "Fade rips above strike" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3">
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-semibold text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center gap-3">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold text-primary">What you’ll unlock</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      Fast daily prep in under 5 minutes.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      A playbook for every alert trigger.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      Higher conviction entries with defined risk.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="absolute -bottom-8 -right-4 hidden h-24 w-24 rounded-full bg-primary/20 blur-[80px] lg:block" />
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

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Deep dives</p>
                <h3 className="mt-3 text-2xl font-semibold">Learn the system step-by-step</h3>
                <p className="mt-2 text-sm text-muted-foreground">Tap a section to expand the playbook and key concepts.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
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

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Knowledge check</p>
              <h4 className="mt-3 text-xl font-semibold">Quick quiz</h4>
              <p className="mt-2 text-sm text-muted-foreground">
                What does the Call Wall represent?
              </p>
              <div className="mt-4 grid gap-2">
                {[
                  "Maximum daily loss cap",
                  "Dealer hedging magnet level",
                  "The primary resistance line",
                ].map((answer) => (
                  <Button key={answer} variant="outline" className="h-10 justify-start text-left">
                    {answer}
                  </Button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Answer to unlock the next topic.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Next up</p>
              <h4 className="mt-3 text-xl font-semibold">Continue your path</h4>
              <div className="mt-4 space-y-3">
                {[
                  { title: "Modes → Levels", desc: "Learn how risk informs your map." },
                  { title: "Levels → Alerts", desc: "Turn levels into action." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-5 h-10 w-full">
                <Link href="/learn/levels">Continue learning</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-6">
              <p className="text-sm font-semibold text-primary">Bookmark your progress</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Log in to save your spot and resume the next time you visit the hub.
              </p>
              <Button asChild variant="outline" className="mt-4 h-10">
                <Link href="/login">Sign in to save</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
