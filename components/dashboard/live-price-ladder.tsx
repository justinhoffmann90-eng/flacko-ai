"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, AlertTriangle, RefreshCw } from "lucide-react";
import { formatPrice, formatLevel } from "@/lib/utils";
import { LevelMapEntry } from "@/types";

interface LivePriceLadderProps {
  upsideLevels: LevelMapEntry[];
  downsideLevels: LevelMapEntry[];
  masterEject: number;
  fallbackPrice: number; // Close price from report as fallback
  reportDate?: string; // Report date for header display
}

interface PriceData {
  price: number;
  change?: number;
  changePercent?: number;
  timestamp: string;
  isMarketOpen: boolean;
  cached?: boolean;
}

// Get next trading day from report date (reports are for next session)
function getNextTradingDay(dateStr: string): Date {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay();

  // If Saturday (6), next trading day is Monday (+2)
  // If Sunday (0), next trading day is Monday (+1)
  // If Friday (5), next trading day is Monday (+3)
  // Otherwise, next trading day is tomorrow (+1)
  if (dayOfWeek === 6) {
    date.setDate(date.getDate() + 2);
  } else if (dayOfWeek === 0) {
    date.setDate(date.getDate() + 1);
  } else if (dayOfWeek === 5) {
    date.setDate(date.getDate() + 3);
  } else {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

// Format date as "Monday Jan 27th"
function formatReportDateHeader(dateStr: string): string {
  const date = getNextTradingDay(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();

  // Add ordinal suffix
  const suffix = dayNum === 1 || dayNum === 21 || dayNum === 31 ? 'st'
    : dayNum === 2 || dayNum === 22 ? 'nd'
    : dayNum === 3 || dayNum === 23 ? 'rd'
    : 'th';

  return `${dayName} ${monthName} ${dayNum}${suffix}`;
}

export function LivePriceLadder({
  upsideLevels,
  downsideLevels,
  masterEject,
  fallbackPrice,
  reportDate,
}: LivePriceLadderProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateText, setUpdateText] = useState<string>("");

  const currentPrice = priceData?.price || fallbackPrice;
  const isMarketOpen = priceData?.isMarketOpen || false;

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/price/tsla");
        if (res.ok) {
          const data = await res.json();
          setPriceData(data);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error("Failed to fetch price:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPrice();

    // Refresh every 30 seconds during market hours
    const interval = setInterval(() => {
      fetchPrice();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update the "Xs ago" text every second
  useEffect(() => {
    const updateTimer = () => {
      if (!lastUpdate) {
        setUpdateText("");
        return;
      }
      const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (seconds < 60) {
        setUpdateText(`${seconds}s ago`);
      } else {
        setUpdateText(`${Math.floor(seconds / 60)}m ago`);
      }
    };

    updateTimer(); // Initial
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [lastUpdate]);

  return (
    <Card className="p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          Key Levels{reportDate && ` for ${formatReportDateHeader(reportDate)}`}
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] text-green-400 bg-green-500/20 px-2 py-0.5 rounded">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          <span>Alerts: LIVE</span>
        </div>
      </div>

      {/* Vertical Price Ladder */}
      <div className="relative">
        {/* Vertical line connector */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-foreground/20 to-blue-500/50" />

        {/* Take Profit Levels (top) */}
        {upsideLevels.length > 0 && (
          <div className="space-y-2 mb-3">
            {[...upsideLevels].sort((a, b) => b.price - a.price).map((level, idx) => {
              const pctAway = currentPrice ? ((level.price - currentPrice) / currentPrice * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="flex items-center gap-3 pl-1">
                  <div className="relative z-10 w-5 h-5 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                    <ArrowUp className="h-2.5 w-2.5 text-green-500" />
                  </div>
                  <div className="flex-1 flex items-center justify-between bg-green-500/5 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs text-muted-foreground">{level.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-500 font-medium">+{pctAway}%</span>
                      <span className="font-bold text-green-500">{formatLevel(level.price)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current Price (center) */}
        {currentPrice > 0 && (
          <div className="flex items-center gap-3 pl-1 my-3">
            <div className="relative z-10 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
              {isMarketOpen ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-background" />
              )}
            </div>
            <div className="flex-1 flex items-center justify-between bg-foreground/10 rounded-lg px-3 py-2 border border-foreground/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {isMarketOpen ? "Live Price" : "Last Close"}
                </span>
                {priceData?.changePercent != null && (
                  <span className={`text-[10px] font-medium ${priceData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {priceData.changePercent >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isMarketOpen && updateText && (
                  <span className="text-[10px] text-muted-foreground">{updateText}</span>
                )}
                <span className="font-bold">{formatPrice(currentPrice)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Buy the Dip Levels (bottom) */}
        {downsideLevels.length > 0 && (
          <div className="space-y-2 mt-3">
            {downsideLevels.map((level, idx) => {
              const pctAway = currentPrice ? ((level.price - currentPrice) / currentPrice * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="flex items-center gap-3 pl-1">
                  <div className="relative z-10 w-5 h-5 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                    <ArrowDown className="h-2.5 w-2.5 text-blue-500" />
                  </div>
                  <div className="flex-1 flex items-center justify-between bg-blue-500/5 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{level.level}</span>
                      {level.depth && level.depth !== '—' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 border-blue-500/30 text-blue-400">
                          {level.depth}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-500 font-medium">{pctAway}%</span>
                      <span className="font-bold text-blue-500">{formatLevel(level.price)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Master Eject (bottom-most) */}
        {masterEject > 0 && (
          <div className="flex items-center gap-3 pl-1 mt-3">
            <div className="relative z-10 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center eject-warning">
              <AlertTriangle className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="flex-1 flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/30">
              <span className="text-xs font-semibold text-red-500">EJECT</span>
              <div className="flex items-center gap-2">
                {currentPrice && currentPrice > 0 && (
                  <span className="text-xs text-red-500 font-medium">
                    {((masterEject - currentPrice) / currentPrice * 100).toFixed(1)}%
                  </span>
                )}
                <span className="font-bold text-red-500">{formatLevel(masterEject)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
