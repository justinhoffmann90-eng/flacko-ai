"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Radar, ArrowRight } from "lucide-react";

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
  } | null;
}

export function OrbSignalsCard() {
  const [signals, setSignals] = useState<OrbSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orb/states", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const active = (Array.isArray(data) ? data : []).filter(
          (s: OrbSignal) => s.state?.status === "active"
        );
        setSignals(active);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-4 md:p-6 animate-pulse">
        <div className="h-16 bg-muted rounded" />
      </Card>
    );
  }

  const hasActive = signals.length > 0;

  return (
    <Link href="/orb">
      <Card
        className={`p-4 md:p-6 lg:p-8 hover:bg-accent transition-all cursor-pointer ${
          hasActive ? "border-green-500/30 bg-green-500/5" : "border-muted"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radar
              className={`h-5 w-5 md:h-6 md:w-6 ${
                hasActive ? "text-green-500" : "text-muted-foreground"
              }`}
            />
            <h3 className="font-semibold text-sm md:text-lg">Orb Signals</h3>
          </div>
          <div className="flex items-center gap-1 text-xs md:text-sm text-primary">
            View all <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        {hasActive ? (
          <div className="space-y-2">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-green-500/10"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-medium truncate">
                      {signal.type === "buy" ? "💣" : "🛡️"} {signal.public_name}
                    </span>
                    <span
                      className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded font-mono font-bold ${
                        signal.type === "buy"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {signal.type === "buy" ? "FIRE THE CANNONS" : "RETREAT"}
                    </span>
                  </div>
                  {signal.state?.entry_price && signal.state?.entry_date && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Triggered {signal.state.entry_date} @ ${signal.state.entry_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>No active signals right now.</p>
            <p className="text-xs mt-1">11 buy setups + 4 avoid signals being tracked</p>
          </div>
        )}
      </Card>
    </Link>
  );
}
