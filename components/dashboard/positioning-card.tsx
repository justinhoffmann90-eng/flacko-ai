"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

// Animated dollar amount
function AnimatedDollar({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (value === prevValue.current) return;
    
    const startValue = prevValue.current;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(startValue + (endValue - startValue) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = endValue;
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <span className={className}>${Math.round(displayValue).toLocaleString()}</span>;
}

interface PositioningCardProps {
  dailyCapPct: number;
  posture: string;
  serverCashAvailable: number | null;
  isDevMode: boolean;
}

export function PositioningCard({
  dailyCapPct,
  posture,
  serverCashAvailable,
  isDevMode,
}: PositioningCardProps) {
  const [cashAvailable, setCashAvailable] = useState<number | null>(serverCashAvailable);

  useEffect(() => {
    // In dev mode, read from localStorage
    if (isDevMode) {
      const savedSettings = localStorage.getItem("dev_settings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setCashAvailable(settings.cash_available || null);
      }
    }
  }, [isDevMode]);

  const dailyBudget = cashAvailable ? cashAvailable * (dailyCapPct / 100) : null;
  const bulletSize = dailyBudget ? dailyBudget / 4 : null;

  return (
    <Card className="p-4 press-scale-sm">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Daily Cap</p>
          <p className="font-bold mt-1">
            {dailyBudget ? (
              <><AnimatedDollar value={dailyBudget} /> ({dailyCapPct}%)</>
            ) : (
              `${dailyCapPct}%`
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Bullet Size</p>
          <p className="font-bold mt-1 text-sm">
            {bulletSize ? (
              <><AnimatedDollar value={bulletSize} /> (x4)</>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Posture</p>
          <p className="font-bold mt-1 text-sm">{posture || '—'}</p>
        </div>
      </div>
      {cashAvailable && (
        <div className="mt-3 pt-3 border-t text-center">
          <Link href="/settings" className="text-xs text-muted-foreground hover:text-primary">
            Based on ${cashAvailable.toLocaleString()} cash available →
          </Link>
        </div>
      )}
    </Card>
  );
}
