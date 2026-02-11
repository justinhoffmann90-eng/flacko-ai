"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Radar, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface OrbSignal {
  id: string;
  public_name: string;
  type: string;
  stance: string;
  one_liner: string;
  backtest_win_rate_20d: number | null;
  backtest_avg_return_20d: number | null;
  state: {
    status: string;
    entry_price?: number;
    entry_date?: string;
    active_since?: string;
  } | null;
}

interface OrbScore {
  value: number;
  zone: string;
  prevZone: string | null;
  date: string;
}

const ZONE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  FULL_SEND: { label: "FULL SEND", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", glow: "shadow-green-500/20" },
  NEUTRAL: { label: "NEUTRAL", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", glow: "shadow-yellow-500/20" },
  CAUTION: { label: "CAUTION", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "shadow-orange-500/20" },
  DEFENSIVE: { label: "DEFENSIVE", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", glow: "shadow-red-500/20" },
};

export function OrbSignalsCard() {
  const [signals, setSignals] = useState<OrbSignal[]>([]);
  const [score, setScore] = useState<OrbScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orb/states", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const setups = Array.isArray(data) ? data : (data?.setups || []);
        const active = setups.filter(
          (s: OrbSignal) => s.state?.status === "active"
        );
        setSignals(active);
        if (data?.score) setScore(data.score);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-4 md:p-6 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </Card>
    );
  }

  const zone = score ? ZONE_CONFIG[score.zone] || ZONE_CONFIG.NEUTRAL : null;
  const buySignals = signals.filter((s) => s.type === "buy");
  const avoidSignals = signals.filter((s) => s.type === "avoid");

  return (
    <Link href="/orb">
      <Card
        className={`p-4 md:p-6 hover:bg-accent/50 transition-all cursor-pointer ${
          zone ? `${zone.border} ${zone.bg}` : "border-muted"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radar
              className={`h-5 w-5 ${zone ? zone.color : "text-muted-foreground"}`}
            />
            <h3 className="font-semibold text-sm md:text-base">The Orb</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            Explore <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {/* Score Zone */}
        {zone && score && (
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-lg md:text-xl font-bold font-mono ${zone.color}`}>
              {zone.label}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {score.value.toFixed(2)}
            </span>
          </div>
        )}

        {/* Active Signals */}
        {signals.length > 0 ? (
          <div className="space-y-1.5">
            {buySignals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-green-500/8 border border-green-500/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {signal.public_name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-green-500/80 flex-shrink-0 ml-2">
                  BUY
                </span>
              </div>
            ))}
            {avoidSignals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-red-500/8 border border-red-500/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {signal.public_name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-red-500/80 flex-shrink-0 ml-2">
                  AVOID
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active signals — 17 setups being tracked
          </p>
        )}
      </Card>
    </Link>
  );
}
