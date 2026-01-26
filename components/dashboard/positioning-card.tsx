"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

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
    <Card className="p-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Daily Cap</p>
          <p className="font-bold mt-1">
            {dailyBudget ? `$${dailyBudget.toLocaleString()} (${dailyCapPct}%)` : `${dailyCapPct}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase">Bullet Size</p>
          <p className="font-bold mt-1 text-sm">
            {bulletSize ? `$${bulletSize.toLocaleString()} (x4)` : '—'}
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
