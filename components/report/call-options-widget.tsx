"use client";

import { Badge } from "@/components/ui/badge";
import { Phone, Eye, ShieldAlert, Minus } from "lucide-react";

interface CallAlertData {
  status: string;
  setup?: string | null;
  priority?: string | null;
  conditions?: string[];
  backtest?: {
    avg_return?: string;
    win_rate?: string;
    n?: number;
    period?: string;
  };
  trigger_next?: string;
  also_watching?: string;
  stop_logic?: string;
  mode_context?: string;
  trim_guidance?: string;
  clears_when?: string;
  spec?: { delta?: string; expiry?: string; strike?: string; budget?: string } | null;
}

function formatSetupName(setup: string | null | undefined): string {
  if (!setup) return "";
  return setup
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CallOptionsWidget({ data }: { data: CallAlertData | undefined | null }) {
  if (!data) return null;

  const status = (data.status || "NO_SIGNAL").toUpperCase();

  // ACTIVE
  if (status === "ACTIVE") {
    return (
      <div className="bg-card border border-green-500/30 rounded-lg p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-400" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Call Options</span>
          </div>
          <Badge variant="green" className="animate-pulse text-xs px-2 py-0.5">ACTIVE</Badge>
        </div>

        {(data.setup || data.priority) && (
          <p className="text-base md:text-lg font-bold text-green-400 mb-2">
            {formatSetupName(data.setup)}
            {data.priority && <span className="text-sm font-normal text-green-400/70 ml-2">({data.priority})</span>}
          </p>
        )}

        {data.conditions && data.conditions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Conditions Met</p>
            <ul className="space-y-0.5">
              {data.conditions.map((c, i) => (
                <li key={i} className="text-sm text-green-300/90 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.backtest && (
          <div className="bg-green-500/10 rounded px-3 py-2 mb-3">
            <p className="text-xs text-muted-foreground mb-0.5">Backtest Edge</p>
            <p className="text-sm font-medium">
              {data.backtest.avg_return} avg {data.backtest.period} return
              {data.backtest.win_rate && <> · {data.backtest.win_rate} win rate</>}
              {data.backtest.n && <> · N={data.backtest.n}</>}
            </p>
          </div>
        )}

        {data.stop_logic && (
          <p className="text-xs text-red-400/80 mb-1">
            <span className="font-semibold">Invalidates if:</span> {data.stop_logic}
          </p>
        )}

        {data.mode_context && (
          <p className="text-xs text-muted-foreground">
            Mode: {data.mode_context}
          </p>
        )}
      </div>
    );
  }

  // WATCHING
  if (status === "WATCHING") {
    return (
      <div className="bg-card border border-yellow-500/30 rounded-lg p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Call Options</span>
          </div>
          <Badge variant="yellow" className="text-xs px-2 py-0.5">WATCHING</Badge>
        </div>

        {data.setup && (
          <p className="text-base md:text-lg font-semibold text-yellow-400 mb-2">
            Approaching {formatSetupName(data.setup)}
          </p>
        )}

        {data.conditions && data.conditions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Current Conditions</p>
            <ul className="space-y-0.5">
              {data.conditions.map((c, i) => (
                <li key={i} className="text-sm text-yellow-300/80 flex items-start gap-1.5">
                  <span className="text-yellow-400 mt-0.5">◦</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.trigger_next && (
          <div className="bg-yellow-500/10 rounded px-3 py-2 mb-2">
            <p className="text-xs text-muted-foreground mb-0.5">Triggers When</p>
            <p className="text-sm font-medium">{data.trigger_next}</p>
          </div>
        )}

        {data.also_watching && (
          <p className="text-xs text-muted-foreground">
            Also watching: {data.also_watching}
          </p>
        )}
      </div>
    );
  }

  // AVOID
  if (status === "AVOID") {
    return (
      <div className="bg-card border border-red-500/30 rounded-lg p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Call Options</span>
          </div>
          <Badge variant="red" className="text-xs px-2 py-0.5">AVOID</Badge>
        </div>

        {data.setup && (
          <p className="text-base md:text-lg font-semibold text-red-400 mb-2">
            {formatSetupName(data.setup)}
          </p>
        )}

        {data.conditions && data.conditions.length > 0 && (
          <div className="mb-3">
            <ul className="space-y-0.5">
              {data.conditions.map((c, i) => (
                <li key={i} className="text-sm text-red-300/80 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">✕</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.backtest && (
          <div className="bg-red-500/10 rounded px-3 py-2 mb-3">
            <p className="text-xs text-muted-foreground mb-0.5">Backtest Evidence</p>
            <p className="text-sm font-medium">
              {data.backtest.avg_return} avg {data.backtest.period} return
              {data.backtest.win_rate && <> · {data.backtest.win_rate} win rate</>}
            </p>
          </div>
        )}

        {data.trim_guidance && (
          <p className="text-xs text-yellow-400/80 mb-1">
            <span className="font-semibold">If holding calls:</span> {data.trim_guidance}
          </p>
        )}

        {data.clears_when && (
          <p className="text-xs text-muted-foreground mb-2">
            <span className="font-semibold">Clears when:</span> {data.clears_when}
          </p>
        )}

        <p className="text-xs text-red-400/60 italic">
          Keeping you out of negative-EV trades IS the value.
        </p>
      </div>
    );
  }

  // NO_SIGNAL (default)
  return (
    <div className="bg-card border border-border/50 rounded-lg p-4 md:p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Minus className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Call Options</span>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">NO SIGNAL</span>
      </div>
      <p className="text-sm text-muted-foreground">
        No call-specific trigger today. Continue holding existing positions per mode rules.
      </p>
    </div>
  );
}
