"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { formatPrice, formatLevel } from "@/lib/utils";
import { LevelMapEntry } from "@/types";
import { Skeleton, SkeletonLevelRow } from "@/components/ui/skeleton";

interface LivePriceLadderProps {
  upsideLevels: LevelMapEntry[];
  downsideLevels: LevelMapEntry[];
  masterEject: number;
  fallbackPrice: number;
  reportDate?: string;
}

interface PriceData {
  price: number;
  change?: number;
  changePercent?: number;
  timestamp: string;
  isMarketOpen: boolean;
  isExtendedHours?: boolean;
  cached?: boolean;
}

function getNextTradingDay(dateStr: string): Date {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) date.setDate(date.getDate() + 2);
  else if (dayOfWeek === 0) date.setDate(date.getDate() + 1);
  else if (dayOfWeek === 5) date.setDate(date.getDate() + 3);
  else date.setDate(date.getDate() + 1);
  return date;
}

function formatReportDateHeader(dateStr: string): string {
  const date = getNextTradingDay(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  const suffix = dayNum === 1 || dayNum === 21 || dayNum === 31 ? 'st'
    : dayNum === 2 || dayNum === 22 ? 'nd'
    : dayNum === 3 || dayNum === 23 ? 'rd' : 'th';
  return `${dayName} ${monthName} ${dayNum}${suffix}`;
}

// Format percentage with proper sign
function formatPctAway(levelPrice: number, currentPrice: number): string {
  const pct = ((levelPrice - currentPrice) / currentPrice) * 100;
  if (pct >= 0) {
    return `+${pct.toFixed(1)}%`;
  } else {
    return `${pct.toFixed(1)}%`;
  }
}

// Animated price component
function AnimatedPrice({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (value === prevValue.current) return;
    
    const startValue = prevValue.current;
    const endValue = value;
    const duration = 400;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      setDisplayValue(startValue + (endValue - startValue) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span className={className}>${displayValue.toFixed(2)}</span>;
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
  const [initialLoad, setInitialLoad] = useState(true);

  const currentPrice = priceData?.price || fallbackPrice;
  const isMarketOpen = priceData?.isMarketOpen || false;
  const isExtendedHours = priceData?.isExtendedHours || false;
  const isFullyClosed = !isMarketOpen && !isExtendedHours;

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
        setInitialLoad(false);
      }
    };
    
    fetchPrice();
    
    // Smart polling: 30s during market/extended hours, 5 minutes when fully closed
    const pollInterval = isFullyClosed ? 300000 : 30000;
    const interval = setInterval(fetchPrice, pollInterval);
    
    return () => clearInterval(interval);
  }, [isFullyClosed]);

  useEffect(() => {
    const updateTimer = () => {
      if (isFullyClosed) {
        setUpdateText("Market Closed");
        return;
      }
      if (!lastUpdate) { 
        setUpdateText("30s"); 
        return; 
      }
      const elapsed = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setUpdateText(`${remaining}s`);
    };
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [lastUpdate, isFullyClosed]);

  // Combine all levels and sort by price descending (highest first)
  const allLevels = [...upsideLevels, ...downsideLevels].sort((a, b) => b.price - a.price);
  
  // Find where current price fits in the ladder
  const priceIndex = allLevels.findIndex(level => currentPrice >= level.price);
  
  // Split into levels above and below current price
  const levelsAbove = priceIndex === -1 ? allLevels : allLevels.slice(0, priceIndex);
  const levelsBelow = priceIndex === -1 ? [] : allLevels.slice(priceIndex);

  const renderLevel = (level: LevelMapEntry, idx: number) => {
    const isAbovePrice = level.price > currentPrice;
    const isSlowZone = level.level.toLowerCase().includes('slow') || level.level.toLowerCase().includes('pause') || level.type === 'pause';
    const isCritical = level.level.toLowerCase().includes('critical') || level.level.toLowerCase().includes('put wall');
    
    // Determine colors based on position relative to price
    let colorClass = isAbovePrice ? 'green' : 'blue';
    if (isSlowZone) colorClass = 'amber';
    else if (isCritical) colorClass = 'yellow';
    
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      green: { bg: 'bg-green-500/5', border: '', text: 'text-green-500', icon: 'text-green-500' },
      blue: { bg: 'bg-blue-500/5', border: '', text: 'text-blue-500', icon: 'text-blue-500' },
      amber: { bg: 'bg-amber-500/10', border: 'border border-amber-500/30', text: 'text-amber-500', icon: 'text-amber-500' },
      yellow: { bg: 'bg-yellow-500/5', border: '', text: 'text-yellow-500', icon: 'text-yellow-500' },
    };
    const c = colors[colorClass];
    
    return (
      <div key={`${level.price}-${idx}`} className="flex items-center gap-3 md:gap-4 pl-1">
        <div className={`relative z-10 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center bg-${colorClass}-500/20 border-2 border-${colorClass}-500`}>
          {isAbovePrice ? (
            <ArrowUp className={`h-2.5 w-2.5 md:h-3 md:w-3 ${c.icon}`} />
          ) : (
            <ArrowDown className={`h-2.5 w-2.5 md:h-3 md:w-3 ${c.icon}`} />
          )}
        </div>
        <div className={`flex-1 rounded-lg px-3 py-2 md:px-4 md:py-3 ${c.bg} ${c.border}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-muted-foreground">{level.level}</span>
            <div className="flex items-center gap-2 md:gap-3">
              <span className={`text-xs md:text-sm font-medium ${c.text}`}>
                {formatPctAway(level.price, currentPrice)}
              </span>
              <span className={`font-bold md:text-lg ${c.text}`}>{formatLevel(level.price)}</span>
            </div>
          </div>
          {level.action && level.action !== '—' && (
            <div className={`text-[10px] md:text-xs mt-1 ${c.text} opacity-80`}>
              {isAbovePrice ? '📈' : '💰'} {level.action}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentPrice = () => {
    let statusLabel = "Last Close";
    if (isMarketOpen) {
      statusLabel = "Live Price";
    } else if (isExtendedHours) {
      statusLabel = "Extended Hours";
    }
    
    return (
      <div className="flex items-center gap-3 md:gap-4 pl-1 my-2 md:my-3">
        <div className="relative z-10 w-5 h-5 md:w-6 md:h-6 rounded-full bg-foreground flex items-center justify-center">
          {(isMarketOpen || isExtendedHours) ? (
            <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-white" />
            </span>
          ) : (
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-background" />
          )}
        </div>
        <div className="flex-1 flex items-center justify-between bg-foreground/10 rounded-lg px-3 py-2 md:px-4 md:py-3 border border-foreground/20">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm font-medium">
              {statusLabel}
            </span>
            {priceData?.changePercent != null && (
              <span className={`text-[10px] md:text-xs font-medium ${priceData.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceData.changePercent >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {(isMarketOpen || isExtendedHours) && updateText && !isFullyClosed && (
              <span className="text-[10px] md:text-xs text-muted-foreground">↻ {updateText}</span>
            )}
            {isFullyClosed && updateText && (
              <span className="text-[10px] md:text-xs text-muted-foreground/60">{updateText}</span>
            )}
            <AnimatedPrice value={currentPrice} className="font-bold md:text-lg" />
          </div>
        </div>
      </div>
    );
  };

  const renderMasterEject = () => (
    <div className="flex items-center gap-3 md:gap-4 pl-1 mt-2 md:mt-3">
      <div className="relative z-10 w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 flex items-center justify-center">
        <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
      </div>
      <div className="flex-1 bg-red-500/10 rounded-lg px-3 py-2 md:px-4 md:py-3 border border-red-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-semibold text-red-500">KILL LEVERAGE</span>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs md:text-sm text-red-500 font-medium">
              {formatPctAway(masterEject, currentPrice)}
            </span>
            <span className="font-bold md:text-lg text-red-500">{formatLevel(masterEject)}</span>
          </div>
        </div>
        <div className="text-[10px] md:text-xs mt-1 text-red-400">
          ⚠️ 2 consecutive daily closes below = cut TSLL + options. Hold shares.
        </div>
      </div>
    </div>
  );

  // Show skeleton during initial load
  if (initialLoad) {
    return (
      <Card className="p-4 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-3">
          <SkeletonLevelRow />
          <SkeletonLevelRow />
          <SkeletonLevelRow />
          <SkeletonLevelRow />
          <SkeletonLevelRow />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h3 className="font-semibold md:text-lg">
          Key Levels{reportDate && ` for ${formatReportDateHeader(reportDate)}`}
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-green-400 bg-green-500/20 px-2 md:px-3 py-0.5 md:py-1 rounded">
          <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500" />
          </span>
          <span>Alerts: LIVE</span>
        </div>
      </div>

      <div className="relative">
        {/* Vertical line connector */}
        <div className="absolute left-[11px] md:left-[13px] top-0 bottom-0 w-0.5 md:w-[3px] bg-gradient-to-b from-green-500/50 via-foreground/20 to-red-500/50" />

        {/* Levels ABOVE current price */}
        <div className="space-y-2 md:space-y-3">
          {levelsAbove.map((level, idx) => renderLevel(level, idx))}
        </div>

        {/* Current Price - dynamically positioned */}
        {currentPrice > 0 && renderCurrentPrice()}

        {/* Levels BELOW current price */}
        <div className="space-y-2 md:space-y-3">
          {levelsBelow.map((level, idx) => renderLevel(level, idx))}
        </div>

        {/* Master Eject (always at bottom) */}
        {/* Kill Leverage is now shown as a regular alert level — no separate section needed */}
      </div>
    </Card>
  );
}
