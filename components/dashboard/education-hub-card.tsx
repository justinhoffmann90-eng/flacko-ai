"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, ChevronRight, CheckCircle } from "lucide-react";

interface Lesson {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const featuredLessons: Lesson[] = [
  {
    title: "How to Use Flacko AI",
    href: "/learn/how-to-use-flacko",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    title: "Understanding Modes",
    href: "/learn/modes",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    title: "What is Gamma?",
    href: "/learn/what-is-gamma",
    icon: <GraduationCap className="h-4 w-4" />,
  },
];

export function EducationHubCard() {
  // In a real implementation, this would come from user settings or localStorage
  const progress = 0; // Placeholder - would track actual lesson completion
  const totalLessons = 20;
  const progressPercent = (progress / totalLessons) * 100;

  return (
    <Card className="p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base md:text-lg">Education Hub</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Master the trading system
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-muted-foreground">Your progress</span>
          <span className="font-medium">{progress} of {totalLessons} lessons</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Featured Lessons */}
      <div className="space-y-2 mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Start here
        </p>
        {featuredLessons.map((lesson) => (
          <Link
            key={lesson.href}
            href={lesson.href}
            className="flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
          >
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              {lesson.icon}
            </div>
            <span className="text-sm font-medium flex-1">{lesson.title}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* CTA */}
      <Link href="/learn">
        <Button className="w-full" variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Browse All Lessons
        </Button>
      </Link>
    </Card>
  );
}
