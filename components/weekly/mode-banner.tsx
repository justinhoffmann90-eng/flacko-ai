"use client";

import { TrafficLightMode } from "@/types/weekly-review";

interface ModeBannerProps {
  mode: TrafficLightMode;
  guidance: string;
  dailyCap: number;
}

const modeConfig: Record<TrafficLightMode, { emoji: string; gradient: string; textColor: string }> = {
  green: {
    emoji: "🟢",
    gradient: "from-green-500 to-green-600",
    textColor: "text-black",
  },
  yellow: {
    emoji: "🟡",
    gradient: "from-yellow-500 to-yellow-600",
    textColor: "text-black",
  },
  orange: {
    emoji: "🟠",
    gradient: "from-orange-500 to-orange-600",
    textColor: "text-black",
  },
  red: {
    emoji: "🔴",
    gradient: "from-red-500 to-red-600",
    textColor: "text-white",
  },
};

export function ModeBanner({ mode, guidance, dailyCap }: ModeBannerProps) {
  const config = modeConfig[mode];

  return (
    <div className={`bg-gradient-to-r ${config.gradient} rounded-xl p-4 sm:p-6 text-center`}>
      <h2 className={`text-xl sm:text-2xl font-bold ${config.textColor}`}>
        {config.emoji} {mode.toUpperCase()} MODE
      </h2>
      <p className={`text-sm mt-2 ${config.textColor} opacity-90`}>
        {guidance || `${dailyCap}% daily cap`}
      </p>
    </div>
  );
}
