import Link from "next/link";
import type { Metadata } from "next";
import { TopicCard } from "@/components/learn/TopicCard";
import { Button } from "@/components/ui/button";
import {
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

const systemFlow = [
  { label: "Market Data", sublabel: "Options flow + technicals", icon: LineChart },
  { label: "Daily Report", sublabel: "Pre-market analysis", icon: FileText },
  { label: "Mode + Cap", sublabel: "Risk-sized positions", icon: Gauge },
  { label: "Price Alerts", sublabel: "Action at key levels", icon: Bell },
];

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Education Hub</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              Trade TSLA with a repeatable, risk-first system.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
              Modes, levels, alerts, and scenarios — so every trade has a plan, a cap, and a reason.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="h-11 px-6">
                <Link href="/learn/how-to-use-flacko">
                  Start learning
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href="/pricing">Get full access</Link>
              </Button>
            </div>
          </div>

          {/* System Flow */}
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
        {/* Lesson Groups */}
        {lessonGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx === 0 ? "mt-4" : "mt-16"}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{group.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {group.lessons.map((lesson) => (
                <TopicCard key={lesson.title} {...lesson} />
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-8">
            <h3 className="text-xl font-semibold">Ready to trade with an edge?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get daily reports, real-time alerts, and the full system.
            </p>
            <Button asChild className="mt-4 h-11 px-8">
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
