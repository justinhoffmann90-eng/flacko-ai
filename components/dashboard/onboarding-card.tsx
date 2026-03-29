"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function OnboardingCard() {
  return (
    <Link href="/onboarding" className="block">
      <Card className="p-4 md:p-5 hover:bg-accent transition-colors cursor-pointer h-full">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div>
            <p className="font-medium text-sm md:text-base">Welcome to Flacko AI</p>
            <p className="text-xs text-muted-foreground">
              How the system works
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
