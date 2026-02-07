import Link from "next/link";
import type { Metadata } from "next";
import { TopicCard } from "@/components/learn/TopicCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Brain,
  ChevronRight,
  FileText,
  Gauge,
  Layers,
  LineChart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  TrafficCone,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Learn | Flacko AI",
  description: "Master TSLA trading with a repeatable, risk-first system.",
};

export const dynamic = "force-static";
export const revalidate = 3600;

const lessonGroups = [
  {
    title: "Using Flacko AI",
    description: "How to use the system day-to-day.",
    lessons: [
      {
        title: "How to Use Flacko AI",
        description: "A complete overview of the system and workflow.",
        time: "5 min",
        href: "/learn/how-to-use-flacko",
        icon: <BookOpen className="h-5 w-5" />,
        badge: "Start here",
      },
      {
        title: "Modes",
        description: "The risk dial that controls your position sizing.",
        time: "5 min",
        href: "/learn/modes",
        icon: <TrafficCone className="h-5 w-5" />,
      },
      {
        title: "Reports",
        description: "Read the daily report and extract the edge.",
        time: "10 min",
        href: "/learn/reports",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "Alerts",
        description: "How alerts fire and what to do when price hits.",
        time: "3 min",
        href: "/learn/alerts",
        icon: <Bell className="h-5 w-5" />,
      },
      {
        title: "Weekly Review",
        description: "Analyze the week and prepare for the next.",
        time: "7 min",
        href: "/learn/weekly-review",
        icon: <FileText className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Flacko Philosophy",
    description: "The rationale and logic behind the operating system.",
    lessons: [
      {
        title: "Why Structure Matters",
        description: "Trade with a plan, not emotions.",
        time: "4 min",
        href: "/learn/why-structure-matters",
        icon: <Brain className="h-5 w-5" />,
      },
      {
        title: "Position Sizing",
        description: "Why we size based on mode and conviction.",
        time: "6 min",
        href: "/learn/position-sizing",
        icon: <Gauge className="h-5 w-5" />,
      },
      {
        title: "Master Eject",
        description: "Why capital protection comes first.",
        time: "4 min",
        href: "/learn/master-eject",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        title: "Scenarios",
        description: "Why we think in probabilities, not predictions.",
        time: "5 min",
        href: "/learn/scenarios",
        icon: <Target className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "SpotGamma & Options Flow",
    description: "How dealer positioning creates support and resistance.",
    lessons: [
      {
        title: "What is Gamma?",
        description: "How dealer hedging moves the market.",
        time: "6 min",
        href: "/learn/what-is-gamma",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Gamma Strike",
        description: "The highest gamma level — where reactions are strongest.",
        time: "4 min",
        href: "/learn/gamma-strike",
        icon: <Zap className="h-5 w-5" />,
      },
      {
        title: "Call Wall",
        description: "The upside magnet where hedging creates resistance.",
        time: "3 min",
        href: "/learn/call-wall",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Put Wall",
        description: "The downside floor where hedging creates support.",
        time: "3 min",
        href: "/learn/put-wall",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Hedge Wall",
        description: "Where institutional hedging creates a ceiling.",
        time: "3 min",
        href: "/learn/hedge-wall",
        icon: <Layers className="h-5 w-5" />,
      },
      {
        title: "Dealer Positioning",
        description: "Read the options flow and market structure.",
        time: "7 min",
        href: "/learn/dealer-positioning",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        title: "HIRO",
        description: "Real-time hedging pressure and what it signals.",
        time: "8 min",
        href: "/learn/hiro",
        icon: <LineChart className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Technical Indicators",
    description: "The chart patterns and EMAs that define trend.",
    lessons: [
      {
        title: "Weekly EMAs",
        description: "The 9/13/21 EMAs that define trend structure.",
        time: "6 min",
        href: "/learn/weekly-emas",
        icon: <TrendingUp className="h-5 w-5" />,
      },
      {
        title: "Slow Zone",
        description: "When momentum stalls — patience over action.",
        time: "5 min",
        href: "/learn/slow-zone",
        icon: <Sparkles className="h-5 w-5" />,
      },
    ],
  },
];

// Mode reference table data
const modeTable = [
  { mode: "🟢 GREEN", cap: "25%", posture: "Offensive", bestFor: "Strong trend, high conviction" },
  { mode: "🟡 YELLOW", cap: "15%", posture: "Cautious", bestFor: "Mixed signals, lower conviction" },
  { mode: "🟠 ORANGE", cap: "10%", posture: "Defensive", bestFor: "Elevated risk, chop likely" },
  { mode: "🔴 RED", cap: "5%", posture: "Protective", bestFor: "High risk, avoid new positions" },
];

// Key levels reference table
const levelsTable = [
  { level: "Call Wall", type: "Resistance", description: "Upside magnet — price tends to stall here" },
  { level: "Gamma Strike", type: "Pivot", description: "Highest gamma — strongest reactions" },
  { level: "Hedge Wall", type: "Resistance", description: "Institutional hedging ceiling" },
  { level: "Put Wall", type: "Support", description: "Downside floor — support level" },
  { level: "Master Eject", type: "Stop", description: "Exit all positions if broken" },
];

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Back to Dashboard Button - Sticky */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <Link href="/admin/command-center">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary">
              Education Hub
            </p>
            <h1 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Trade TSLA with a repeatable, risk-first system.
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-0">
              Modes, levels, alerts, and scenarios — so every trade has a plan, a cap, and a reason.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 px-4 sm:px-0">
              <Button asChild className="h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto">
                <Link href="/learn/how-to-use-flacko">
                  Start learning
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 sm:h-11 px-4 sm:px-6 w-full sm:w-auto">
                <Link href="/pricing">Get full access</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 pb-12 sm:pb-16">
        {/* Quick Reference Tables - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* Mode Reference Table */}
          <Card className="p-3 sm:p-4 overflow-hidden">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Mode Reference</h2>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[300px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Mode</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Cap</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground hidden sm:table-cell">Posture</th>
                  </tr>
                </thead>
                <tbody>
                  {modeTable.map((row) => (
                    <tr key={row.mode} className="border-b last:border-0">
                      <td className="py-2 sm:py-2.5 px-2 font-medium whitespace-nowrap">{row.mode}</td>
                      <td className="py-2 sm:py-2.5 px-2">{row.cap}</td>
                      <td className="py-2 sm:py-2.5 px-2 text-muted-foreground hidden sm:table-cell">{row.posture}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Key Levels Table */}
          <Card className="p-3 sm:p-4 overflow-hidden">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Key Levels</h2>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[300px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Level</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {levelsTable.map((row) => (
                    <tr key={row.level} className="border-b last:border-0">
                      <td className="py-2 sm:py-2.5 px-2 font-medium">{row.level}</td>
                      <td className="py-2 sm:py-2.5 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          row.type === "Resistance" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          row.type === "Support" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          row.type === "Stop" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}>
                          {row.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Lesson Groups */}
        {lessonGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx === 0 ? "mt-6 sm:mt-8" : "mt-10 sm:mt-16"}>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-primary">
              {group.title}
            </p>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">{group.description}</p>

            <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.lessons.map((lesson) => (
                <TopicCard key={lesson.title} {...lesson} />
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-10 sm:mt-16 max-w-2xl mx-auto text-center px-2 sm:px-0">
          <div className="rounded-xl sm:rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-8">
            <h3 className="text-lg sm:text-xl font-semibold">Ready to trade with an edge?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get daily reports, real-time alerts, and the full system.
            </p>
            <Button asChild className="mt-4 h-10 sm:h-11 px-6 sm:px-8 w-full sm:w-auto">
              <Link href="/pricing">
                View plans
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
