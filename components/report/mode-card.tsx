"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ModeBadge } from "./mode-badge";
import { TrafficLightMode } from "@/types";
import { cn } from "@/lib/utils";

interface ModeCardProps {
  mode: TrafficLightMode;
  label?: string;
  summary?: string;
  date?: string;
  className?: string;
}

const borderColors = {
  green: "border-green-500",
  yellow: "border-yellow-500",
  red: "border-red-500",
};

const modeDescriptions = {
  green: "Full offense. Trend confirmed. Add on dips, let winners run.",
  yellow: "Caution. Mixed signals. Reduce size, wait for clarity.",
  red: "Defense mode. Protect capital. Minimal exposure, quick trades only.",
};

export function ModeCard({ mode, label, summary, date, className }: ModeCardProps) {
  return (
    <Card className={cn("border-2", borderColors[mode], className)}>
      <CardContent className="pt-6">
        <div className="text-center">
          <ModeBadge mode={mode} label={label} size="xl" />
          {date && (
            <p className="text-sm text-muted-foreground mt-2">{date}</p>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            {summary || modeDescriptions[mode]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
