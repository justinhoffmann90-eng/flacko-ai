"use client";

import { cn } from "@/lib/utils";
import { TrafficLightMode } from "@/types";

interface ModeBadgeProps {
  mode: TrafficLightMode;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-lg px-4 py-1.5",
  xl: "text-xl px-6 py-2",
};

const modeClasses = {
  green: "bg-green-500/10 border-green-500 text-green-500",
  yellow: "bg-yellow-500/10 border-yellow-500 text-yellow-500",
  red: "bg-red-500/10 border-red-500 text-red-500",
};

export function ModeBadge({ mode, label, size = "md", className }: ModeBadgeProps) {
  const displayLabel = label || `${mode.toUpperCase()} MODE`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        sizeClasses[size],
        modeClasses[mode],
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
