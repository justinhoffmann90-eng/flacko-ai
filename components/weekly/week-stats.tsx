"use client";

import { WeeklyCandle } from "@/types/weekly-review";
import { formatPrice } from "@/lib/utils";

interface WeekStatsProps {
  candle: WeeklyCandle;
}

export function WeekStats({ candle }: WeekStatsProps) {
  const isPositive = candle.change_pct >= 0;

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      <div className="bg-muted rounded-lg p-3 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">Open</p>
        <p className="text-base sm:text-lg font-semibold">{formatPrice(candle.open)}</p>
      </div>
      <div className="bg-muted rounded-lg p-3 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">High</p>
        <p className="text-base sm:text-lg font-semibold">{formatPrice(candle.high)}</p>
      </div>
      <div className="bg-muted rounded-lg p-3 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">Low</p>
        <p className="text-base sm:text-lg font-semibold">{formatPrice(candle.low)}</p>
      </div>
      <div className="bg-muted rounded-lg p-3 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">Close</p>
        <p className="text-base sm:text-lg font-semibold">{formatPrice(candle.close)}</p>
      </div>
      <div className="bg-muted rounded-lg p-3 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">Change</p>
        <p className={`text-base sm:text-lg font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{candle.change_pct.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
