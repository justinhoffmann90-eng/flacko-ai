"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { formatPrice, formatLevel } from "@/lib/utils";
import { LevelMapEntry } from "@/types";

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
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      if (!lastUpdate) { setUpdateText("30s"); return; }
      const elapsed = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setUpdateText(`${remaining}s`);
    };
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [lastUpdate]);

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
      <div key={`${level.price}-${idx}`} className="flex items-center gap-3 pl-1">
        <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center bg-${colorClass}-500/20 border-2 border-${colorClass}-500`}>
          {isAbovePrice ? (
            <ArrowUp className={`h-2.5 w-2.5 ${c.icon}`} />
          ) : (
            <ArrowDown className={`h-2.5 w-2.5 ${c.icon}`} />
          )}
        </div>
        <div className={`flex-1 rounded-lg px-3 py-2 ${c.bg} ${c.border}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{level.level}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${c.text}`}>
                {formatPctAway(level.price, currentPrice)}
              </span>
              <span className={`font-bold ${c.text}`}>{formatLevel(level.price)}</span>
            </div>
          </div>
          {level.action && level.action !== '—' && (
            <div className={`text-[10px] mt-1 ${c.text} opacity-80`}>
              {isAbovePrice ? '📈' : '💰'} {level.action}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentPrice = () => (
    <div className="flex items-center gap-3 pl-1 my-2">
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
            <span className="text-[10px] text-muted-foreground">↻ {updateText}</span>
          )}
          <span className="font-bold">{formatPrice(currentPrice)}</span>
        </div>
      </div>
    </div>
  );

  const renderMasterEject = () => (
    <div className="flex items-center gap-3 pl-1 mt-2">
      <div className="relative z-10 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
        <AlertTriangle className="h-2.5 w-2.5 text-white" />
      </div>
      <div className="flex-1 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-red-500">MASTER EJECT</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 font-medium">
              {formatPctAway(masterEject, currentPrice)}
            </span>
            <span className="font-bold text-red-500">{formatLevel(masterEject)}</span>
          </div>
        </div>
        <div className="text-[10px] mt-1 text-red-400">
          ❌ Exit all — daily close below = out
        </div>
      </div>
    </div>
  );

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

      <div className="relative">
        {/* Vertical line connector */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-500/50 via-foreground/20 to-red-500/50" />

        {/* Levels ABOVE current price */}
        <div className="space-y-2">
          {levelsAbove.map((level, idx) => renderLevel(level, idx))}
        </div>

        {/* Current Price - dynamically positioned */}
        {currentPrice > 0 && renderCurrentPrice()}

        {/* Levels BELOW current price */}
        <div className="space-y-2">
          {levelsBelow.map((level, idx) => renderLevel(level, idx))}
        </div>

        {/* Master Eject (always at bottom) */}
        {masterEject > 0 && renderMasterEject()}
      </div>
    </Card>
  );
}
