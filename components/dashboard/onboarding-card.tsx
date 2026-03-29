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
      <Link href="/onboarding" className="block">
        <Card className="p-4 md:p-6 lg:p-8 relative overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer onboarding-glow">
          <style jsx>{`
            @keyframes glow-pulse {
              0%, 100% {
                box-shadow: 0 0 8px 0 hsl(var(--primary) / 0.3),
                  inset 0 0 8px 0 hsl(var(--primary) / 0.05);
              }
              50% {
                box-shadow: 0 0 20px 4px hsl(var(--primary) / 0.4),
                  inset 0 0 12px 0 hsl(var(--primary) / 0.1);
              }
            }
            .onboarding-glow {
              animation: glow-pulse 3s ease-in-out infinite;
              border-color: hsl(var(--primary) / 0.5);
            }
          `}</style>
          <div className="flex items-start gap-3 md:gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold md:text-lg">Welcome to Flacko AI</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                Start here — learn how the system works, what you get, and why
                it&apos;s built to protect your capital.
              </p>
              <div className="mt-3">
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
    <Link href="/onboarding" className="block">
      <Card className="p-4 md:p-6 lg:p-8 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm md:text-base">System Overview</p>
            <p className="text-xs text-muted-foreground">
              Review how Flacko AI works
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
