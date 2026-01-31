"use client";

import { TimeframeData, TierSignal } from "@/types/weekly-review";

// Format BXT display with light/dark terminology
function formatBxtDisplay(color: string, pattern: string): string {
  const upperPattern = pattern.toUpperCase();
  
  if (color === "green") {
    // HH = Light Green, LH = Dark Green
    if (upperPattern === "HH") return "Light Green (HH)";
    if (upperPattern === "LH") return "Dark Green (LH)";
    return `Green, ${pattern}`; // fallback
  } else {
    // HL = Light Red, LL = Dark Red  
    if (upperPattern === "HL") return "Light Red (HL)";
    if (upperPattern === "LL") return "Dark Red (LL)";
    return `Red, ${pattern}`; // fallback
  }
}

interface TimeframeGridProps {
  monthly: TimeframeData;
  weekly: TimeframeData;
  daily: TimeframeData;
}

const signalConfig: Record<TierSignal, { bg: string; text: string; emoji: string }> = {
  green: { bg: "bg-green-500/20", text: "text-green-500", emoji: "🟢" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-500", emoji: "🟡" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-500", emoji: "🟠" },
  red: { bg: "bg-red-500/20", text: "text-red-500", emoji: "🔴" },
};

const borderColors: Record<string, string> = {
  monthly: "border-t-purple-500",
  weekly: "border-t-blue-500",
  daily: "border-t-green-500",
};

interface TimeframeCardProps {
  label: string;
  data: TimeframeData;
  borderColor: string;
}

function TimeframeCard({ label, data, borderColor }: TimeframeCardProps) {
  const signal = signalConfig[data.signal];

  return (
    <div className={`bg-card border border-border rounded-xl p-4 border-t-[3px] ${borderColor}`}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${signal.bg} ${signal.text}`}>
          {signal.emoji} {data.signal.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1 border-b border-border">
          <span className="text-muted-foreground">BX-Trender</span>
          <span className={`font-medium ${data.bx_trender.color === "green" ? "text-green-500" : "text-red-500"}`}>
            {formatBxtDisplay(data.bx_trender.color, data.bx_trender.pattern)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-border">
          <span className="text-muted-foreground">Structure</span>
          <span className="font-medium">{data.structure}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border">
          <span className="text-muted-foreground">9 EMA</span>
          <span className={`font-medium ${data.ema_9_status === "above" ? "text-green-500" : "text-red-500"}`}>
            {data.ema_9_status === "above" ? "Above ✓" : "Below ⚠️"}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted-foreground">21 EMA</span>
          <span className={`font-medium ${data.ema_21_status === "above" ? "text-green-500" : "text-red-500"}`}>
            {data.ema_21_status === "above" ? "Above ✓" : "Below ⚠️"}
          </span>
        </div>
      </div>

      {data.interpretation && (
        <div className="mt-3 p-3 bg-muted rounded-lg text-xs text-muted-foreground italic">
          &ldquo;{data.interpretation}&rdquo;
        </div>
      )}
    </div>
  );
}

export function TimeframeGrid({ monthly, weekly, daily }: TimeframeGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TimeframeCard label="Monthly" data={monthly} borderColor={borderColors.monthly} />
      <TimeframeCard label="Weekly" data={weekly} borderColor={borderColors.weekly} />
      <TimeframeCard label="Daily" data={daily} borderColor={borderColors.daily} />
    </div>
  );
}
