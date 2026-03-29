"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle, ArrowRight } from "lucide-react";

export function OnboardingCard() {
  const [viewed, setViewed] = useState<boolean | null>(null);

  useEffect(() => {
    setViewed(localStorage.getItem("flacko_onboarding_viewed") === "true");
  }, []);

  // Don't render until we know the state (avoid flash)
  if (viewed === null) return null;

  if (!viewed) {
    return (
      <Link href="/onboarding" className="block h-full">
        <Card className="p-5 md:p-6 lg:p-7 relative overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer onboarding-glow h-full border-primary/40 bg-primary/[0.04]">
          <style jsx>{`
            @keyframes glow-pulse {
              0%, 100% {
                box-shadow: 0 0 10px 0 hsl(var(--primary) / 0.25),
                  inset 0 0 8px 0 hsl(var(--primary) / 0.04);
              }
              50% {
                box-shadow: 0 0 22px 4px hsl(var(--primary) / 0.35),
                  inset 0 0 14px 0 hsl(var(--primary) / 0.08);
              }
            }
            .onboarding-glow {
              animation: glow-pulse 3s ease-in-out infinite;
              border-color: hsl(var(--primary) / 0.45);
            }
          `}</style>
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] md:text-xs font-medium uppercase tracking-[0.14em] text-primary/80">New here?</p>
              <h3 className="font-semibold text-base md:text-lg mt-1">Welcome to Flacko AI</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Learn how the system works, how risk is managed, and how to use the daily report, Orb, and key levels together.
              </p>
              <div className="mt-4">
                <Button size="sm" variant="default">
                  Start Onboarding
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href="/onboarding" className="block h-full">
      <Card className="p-4 md:p-5 lg:p-6 hover:bg-accent transition-colors cursor-pointer h-full">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm md:text-base">Welcome to Flacko AI</p>
            <p className="text-xs text-muted-foreground">
              Review how the system works
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
