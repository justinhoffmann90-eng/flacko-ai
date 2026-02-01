"use client";

import { WeeklyCandle } from "@/types/weekly-review";
import { formatPrice } from "@/lib/utils";

interface WeekStatsProps {
  candle: WeeklyCandle;
}

export function WeekStats({ candle }: WeekStatsProps) {
  const isPositive = candle.change_pct >= 0;

  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-4">
      <div className="bg-muted rounded-lg p-2 sm:p-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">Open</p>
        <p className="text-sm sm:text-lg font-semibold">{formatPrice(candle.open)}</p>
      </div>
      <div className="bg-muted rounded-lg p-2 sm:p-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">High</p>
        <p className="text-sm sm:text-lg font-semibold">{formatPrice(candle.high)}</p>
      </div>
      <div className="bg-muted rounded-lg p-2 sm:p-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">Low</p>
        <p className="text-sm sm:text-lg font-semibold">{formatPrice(candle.low)}</p>
      </div>
      <div className="bg-muted rounded-lg p-2 sm:p-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">Close</p>
        <p className="text-sm sm:text-lg font-semibold">{formatPrice(candle.close)}</p>
      </div>
      <div className="bg-muted rounded-lg p-2 sm:p-4 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1">Change</p>
        <p className={`text-sm sm:text-lg font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{candle.change_pct.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
