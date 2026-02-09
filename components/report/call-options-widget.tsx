"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Phone, Eye, ShieldAlert, Minus, ChevronDown, ChevronUp } from "lucide-react";

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

const SETUP_NAMES: Record<string, string> = {
  GREEN_SHOOTS: "Green Shoots Reversal",
  TREND_CONTINUATION: "Trend Continuation",
  OVERSOLD_GENERATIONAL: "Oversold Generational",
  OVERSOLD_DEEP_VALUE: "Oversold Deep Value",
  REGIME_SHIFT: "Regime Shift",
  DAILY_TREND_RIDE: "Daily Trend Ride",
  MOMENTUM_FLIP: "Momentum Flip",
  AVOID_EXTENDED: "Extended & Fading",
  AVOID_DOWNTREND: "Accelerating Downtrend",
};

const SETUP_PRIORITIES: Record<string, string> = {
  GREEN_SHOOTS: "A+",
  TREND_CONTINUATION: "A",
  OVERSOLD_GENERATIONAL: "S-Tier",
  OVERSOLD_DEEP_VALUE: "A+",
  REGIME_SHIFT: "A",
  DAILY_TREND_RIDE: "B+",
  MOMENTUM_FLIP: "B+",
};

function getSetupName(key: string | null | undefined): string {
  if (!key) return "";
  return SETUP_NAMES[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getSetupPriority(key: string | null | undefined, explicit?: string | null): string {
  if (explicit) return explicit;
  if (!key) return "";
  return SETUP_PRIORITIES[key] || "";
}

export function CallOptionsWidget({
  data,
  reportDate,
}: {
  data: CallAlertData | undefined | null;
  reportDate?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const status = (data.status || "NO_SIGNAL").toUpperCase();
  const setupName = getSetupName(data.setup);
  const priority = getSetupPriority(data.setup, data.priority);

  const hasDetails =
    (data.conditions && data.conditions.length > 0) ||
    data.backtest ||
    data.stop_logic ||
    data.trigger_next ||
    data.trim_guidance ||
    data.clears_when;

  // ACTIVE
  if (status === "ACTIVE") {
    return (
      <div className="bg-[#1a2332] border border-green-500/40 rounded-lg overflow-hidden">
        {/* Hero status bar */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Phone className="h-5 w-5 text-green-400" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-400 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-green-400">ACTIVE</span>
                <span className="text-xs bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded font-mono">BETA</span>
              </div>
              <p className="text-sm text-white/90">
                {setupName}
                {priority && <span className="text-green-400/70 ml-1.5">({priority})</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reportDate && (
              <span className="text-[10px] text-white/30 hidden sm:block">Updated {reportDate}</span>
            )}
            {hasDetails && (
              expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-green-500/20 space-y-3">
            {data.conditions && data.conditions.length > 0 && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Conditions Met</p>
                <ul className="space-y-0.5">
                  {data.conditions.map((c, i) => (
                    <li key={i} className="text-sm text-green-200/80 flex items-start gap-1.5">
                      <span className="text-green-400 mt-0.5 text-xs">✓</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.backtest && (
              <div className="flex items-center gap-3 text-xs bg-green-500/10 rounded px-3 py-2 font-mono">
                {data.backtest.avg_return && <span className="text-green-300">{data.backtest.avg_return} avg</span>}
                {data.backtest.win_rate && <><span className="text-white/20">|</span><span className="text-white/70">{data.backtest.win_rate} win</span></>}
                {data.backtest.n && <><span className="text-white/20">|</span><span className="text-white/50">N={data.backtest.n}</span></>}
              </div>
            )}

            {data.stop_logic && (
              <p className="text-xs text-red-400/80">
                <span className="font-semibold">Invalidates:</span> {data.stop_logic}
              </p>
            )}

            {data.mode_context && (
              <p className="text-xs text-white/40">Mode: {data.mode_context}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // WATCHING
  if (status === "WATCHING") {
    return (
      <div className="bg-[#1a2332] border border-yellow-500/30 rounded-lg overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-yellow-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-yellow-400">WATCHING</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded font-mono">BETA</span>
              </div>
              {setupName && (
                <p className="text-sm text-white/90">Approaching {setupName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reportDate && (
              <span className="text-[10px] text-white/30 hidden sm:block">Updated {reportDate}</span>
            )}
            {hasDetails && (
              expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-yellow-500/20 space-y-3">
            {data.conditions && data.conditions.length > 0 && (
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Current Conditions</p>
                <ul className="space-y-0.5">
                  {data.conditions.map((c, i) => (
                    <li key={i} className="text-sm text-yellow-200/70 flex items-start gap-1.5">
                      <span className="text-yellow-400 mt-0.5 text-xs">◦</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.trigger_next && (
              <div className="bg-yellow-500/10 rounded px-3 py-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Triggers When</p>
                <p className="text-sm text-yellow-200">{data.trigger_next}</p>
              </div>
            )}

            {data.also_watching && (
              <p className="text-xs text-white/40">Also watching: {data.also_watching}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // AVOID
  if (status === "AVOID") {
    return (
      <div className="bg-[#1a2332] border border-red-500/30 rounded-lg overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-red-400">AVOID</span>
                <span className="text-xs bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono">BETA</span>
              </div>
              {setupName && (
                <p className="text-sm text-white/90">{setupName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reportDate && (
              <span className="text-[10px] text-white/30 hidden sm:block">Updated {reportDate}</span>
            )}
            {hasDetails && (
              expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />
            )}
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 pt-1 border-t border-red-500/20 space-y-3">
            {data.conditions && data.conditions.length > 0 && (
              <ul className="space-y-0.5">
                {data.conditions.map((c, i) => (
                  <li key={i} className="text-sm text-red-200/70 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 text-xs">✕</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}

            {data.backtest && (
              <div className="flex items-center gap-3 text-xs bg-red-500/10 rounded px-3 py-2 font-mono">
                {data.backtest.avg_return && <span className="text-red-300">{data.backtest.avg_return} avg</span>}
                {data.backtest.win_rate && <><span className="text-white/20">|</span><span className="text-white/70">{data.backtest.win_rate} win</span></>}
                {data.backtest.n && <><span className="text-white/20">|</span><span className="text-white/50">N={data.backtest.n}</span></>}
              </div>
            )}

            {data.trim_guidance && (
              <p className="text-xs text-yellow-400/80">
                <span className="font-semibold">Holding calls?</span> {data.trim_guidance}
              </p>
            )}

            {data.clears_when && (
              <p className="text-xs text-white/40">
                <span className="font-semibold text-white/50">Clears when:</span> {data.clears_when}
              </p>
            )}

            <p className="text-[11px] text-red-400/50 italic">
              Keeping you out of negative-EV trades IS the value.
            </p>
          </div>
        )}
      </div>
    );
  }

  // NO_SIGNAL
  return (
    <div className="bg-[#1a2332] border border-white/10 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Minus className="h-5 w-5 text-white/30" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white/50">NO SIGNAL</span>
              <span className="text-xs bg-white/5 text-white/30 px-1.5 py-0.5 rounded font-mono">BETA</span>
            </div>
            <p className="text-sm text-white/40">No call-specific trigger today. Continue per mode rules.</p>
          </div>
        </div>
        {reportDate && (
          <span className="text-[10px] text-white/20 hidden sm:block">Updated {reportDate}</span>
        )}
      </div>
    </div>
  );
}
