"use client";

import { cn } from "@/lib/utils";

interface EntryQualityScoreProps {
  score: number;
  factors?: string[];
  showFactors?: boolean;
  size?: "sm" | "md" | "lg";
}

const scoreColors: Record<number, string> = {
  1: "text-red-500",
  2: "text-orange-500",
  3: "text-yellow-500",
  4: "text-lime-500",
  5: "text-green-500",
};

const scoreLabels: Record<number, string> = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

export function EntryQualityScore({
  score,
  factors = [],
  showFactors = false,
  size = "md",
}: EntryQualityScoreProps) {
  const clampedScore = Math.max(1, Math.min(5, score));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-bold",
          size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-2xl",
          scoreColors[clampedScore]
        )}>
          {clampedScore}/5
        </span>
        <span className={cn(
          "text-muted-foreground",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          {scoreLabels[clampedScore]}
        </span>
      </div>

      {/* Score bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-2 flex-1 rounded-sm transition-colors",
              i <= clampedScore ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Factors */}
      {showFactors && factors.length > 0 && (
        <ul className="mt-3 space-y-1">
          {factors.map((factor, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-start">
              <span className="mr-2">•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
