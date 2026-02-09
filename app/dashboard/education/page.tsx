import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Gauge,
  Layers,
  LineChart,
  Play,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  TrafficCone,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Education Hub | Flacko AI",
  description: "Master TSLA trading with structured lessons.",
};

const lessonGroups = [
  {
    title: "Using Flacko AI",
    description: "How to use the system day-to-day.",
    lessons: [
      { title: "How to Use Flacko AI", time: "5 min", href: "/learn/how-to-use-flacko", icon: BookOpen, completed: true },
      { title: "Modes", time: "5 min", href: "/learn/modes", icon: TrafficCone, completed: true },
      { title: "Reports", time: "10 min", href: "/learn/reports", icon: FileText, completed: false },
      { title: "Alerts", time: "3 min", href: "/learn/alerts", icon: Zap, completed: false },
      { title: "Weekly Review", time: "7 min", href: "/learn/weekly-review", icon: FileText, completed: false },
    ],
  },
  {
    title: "Flacko Philosophy",
    description: "The rationale behind the operating system.",
    lessons: [
      { title: "Why Structure Matters", time: "4 min", href: "/learn/why-structure-matters", icon: Brain, completed: false },
      { title: "Position Sizing", time: "6 min", href: "/learn/position-sizing", icon: Gauge, completed: false },
      { title: "Master Eject", time: "4 min", href: "/learn/master-eject", icon: Shield, completed: false },
      { title: "Scenarios", time: "5 min", href: "/learn/scenarios", icon: Target, completed: false },
    ],
  },
  {
    title: "SpotGamma & Options Flow",
    description: "Dealer positioning and market structure.",
    lessons: [
      { title: "What is Gamma?", time: "6 min", href: "/learn/what-is-gamma", icon: TrendingUp, completed: false },
      { title: "Gamma Strike", time: "4 min", href: "/learn/gamma-strike", icon: Zap, completed: false },
      { title: "Call Wall", time: "3 min", href: "/learn/call-wall", icon: TrendingUp, completed: false },
      { title: "Put Wall", time: "3 min", href: "/learn/put-wall", icon: TrendingUp, completed: false },
      { title: "Hedge Wall", time: "3 min", href: "/learn/hedge-wall", icon: Layers, completed: false },
      { title: "HIRO", time: "8 min", href: "/learn/hiro", icon: LineChart, completed: false },
    ],
  },
  {
    title: "Technical Indicators",
    description: "Chart patterns and EMAs.",
    lessons: [
      { title: "Weekly EMAs", time: "6 min", href: "/learn/weekly-emas", icon: TrendingUp, completed: false },
      { title: "Slow Zone", time: "5 min", href: "/learn/slow-zone", icon: Sparkles, completed: false },
    ],
  },
];

export default function EducationHubPage() {
  const totalLessons = lessonGroups.reduce((acc, group) => acc + group.lessons.length, 0);
  const completedLessons = lessonGroups.reduce(
    (acc, group) => acc + group.lessons.filter((l) => l.completed).length,
    0
  );
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  const nextLesson = lessonGroups
    .flatMap((g) => g.lessons)
    .find((l) => !l.completed);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Progress Card */}
        <Card className="mb-6 bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Education Hub</h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Master the Flacko trading system
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{progressPercent}%</p>
                <p className="text-xs text-zinc-500">
                  {completedLessons} of {totalLessons} completed
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {nextLesson && (
              <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-xs text-purple-400 font-medium uppercase tracking-wide">Continue Learning</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <nextLesson.icon className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-white">{nextLesson.title}</span>
                    <span className="text-xs text-zinc-500">({nextLesson.time})</span>
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700" asChild>
                    <Link href={nextLesson.href}>
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lesson Groups */}
        <div className="space-y-6">
          {lessonGroups.map((group) => {
            const groupCompleted = group.lessons.filter((l) => l.completed).length;
            const groupProgress = Math.round((groupCompleted / group.lessons.length) * 100);

            return (
              <Card key={group.title} className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{group.title}</h2>
                      <p className="text-sm text-zinc-400">{group.description}</p>
                    </div>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">{groupCompleted}/{group.lessons.length}</Badge>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${groupProgress}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.lessons.map((lesson) => (
                      <Link
                        key={lesson.title}
                        href={lesson.href}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                          {lesson.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <lesson.icon className="h-4 w-4 text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate text-white ${lesson.completed ? "text-zinc-500 line-through" : ""}`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.time}
                          </p>
                        </div>
                        {lesson.completed && (
                          <Badge variant="outline" className="text-xs shrink-0 border-green-500/30 text-green-400">Completed</Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
