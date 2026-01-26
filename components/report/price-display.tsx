"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  close: number;
  changePct: number;
  high?: number;
  low?: number;
  volume?: number;
  title?: string;
  compact?: boolean;
  className?: string;
}

export function PriceDisplay({
  close,
  changePct,
  high,
  low,
  volume,
  title = "TSLA",
  compact = false,
  className,
}: PriceDisplayProps) {
  const isPositive = changePct >= 0;

  if (compact) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <span className="text-lg font-bold">{formatPrice(close)}</span>
        <span
          className={cn(
            "flex items-center text-sm",
            isPositive ? "text-green-500" : "text-red-500"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-1" />
          )}
          {formatPercent(changePct)}
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{formatPrice(close)}</p>
            <div
              className={cn(
                "flex items-center mt-1",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span className="font-medium">{formatPercent(changePct)}</span>
            </div>
          </div>

          {(high !== undefined || low !== undefined) && (
            <div className="text-right text-sm text-muted-foreground">
              {high !== undefined && (
                <p>
                  <span className="text-green-500">H:</span> {formatPrice(high)}
                </p>
              )}
              {low !== undefined && (
                <p>
                  <span className="text-red-500">L:</span> {formatPrice(low)}
                </p>
              )}
            </div>
          )}
        </div>

        {volume !== undefined && (
          <p className="text-xs text-muted-foreground mt-2">
            Vol: {(volume / 1000000).toFixed(2)}M
          </p>
        )}
      </CardContent>
    </Card>
  );
}
