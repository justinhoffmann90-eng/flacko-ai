"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";

interface TrialBannerProps {
  daysRemaining: number;
}

export function TrialBanner({ daysRemaining }: TrialBannerProps) {
  const urgency = daysRemaining <= 2 ? "destructive" : "default";
  
  return (
    <Alert variant={urgency} className="mb-6">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span>
          {daysRemaining === 0 ? (
            <>Your trial expires today!</>
          ) : daysRemaining === 1 ? (
            <>Your trial expires tomorrow!</>
          ) : (
            <><Sparkles className="h-4 w-4 inline mr-1" /> You have <strong>{daysRemaining} days</strong> left in your free trial</>
          )}
        </span>
        <Link href="/pricing">
          <Button size="sm" variant={urgency === "destructive" ? "default" : "outline"}>
            Subscribe Now
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  );
}
