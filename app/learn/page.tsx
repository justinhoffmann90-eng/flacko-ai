import Link from "next/link";
import { TopicCard } from "@/components/learn/TopicCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, FileText, Layers, Sparkles, Target, TrafficCone } from "lucide-react";

const topics = [
  {
    title: "Modes",
    description: "Understand the risk dial that controls position sizing.",
    time: "5 min",
    href: "/learn/modes",
    icon: <TrafficCone className="h-5 w-5" />,
  },
  {
    title: "Levels",
    description: "Call Wall, Put Wall, Gamma Strike, and key reaction zones.",
    time: "8 min",
    href: "/learn/levels",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Alerts",
    description: "How alerts fire and what to do when price hits a level.",
    time: "3 min",
    href: "/learn/alerts",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    title: "Reports",
    description: "Read the daily report fast and extract the edge.",
    time: "10 min",
    href: "/learn/reports",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Scenarios",
    description: "Bull, base, and bear cases — how probabilities shape bias.",
    time: "5 min",
    href: "/learn/scenarios",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Quick Start",
    description: "Start with the risk framework and build from there.",
    time: "2 min",
    href: "/learn/modes",
    icon: <Sparkles className="h-5 w-5" />,
  },
];

export default function LearnHubPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Flacko AI Education Hub</p>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">Master the system. Trade with confidence.</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to understand modes, levels, alerts, and daily reports — distilled into short, actionable lessons.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/learn/modes">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <TopicCard key={topic.title} {...topic} />
          ))}
        </div>
      </div>
    </div>
  );
}
