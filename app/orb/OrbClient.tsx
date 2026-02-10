"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrbRow = {
  id: string;
  name: string;
  number: number;
  type: "buy" | "avoid";
  framework: "fixed-horizon" | "gauge-to-target";
  grade: string | null;
  conditions: string[];
  backtest_n: number | null;
  backtest_win_rate_5d: number | null;
  backtest_avg_return_5d: number | null;
  backtest_win_rate_10d: number | null;
  backtest_avg_return_10d: number | null;
  backtest_win_rate_20d: number | null;
  backtest_avg_return_20d: number | null;
  backtest_win_rate_60d: number | null;
  backtest_avg_return_60d: number | null;
  description: string | null;
  gauge_median_days: number | null;
  gauge_median_return: number | null;
  state: any;
  livePerformance: { wins: number; total: number; avgReturn: number } | null;
};

const statusConfig: Record<string, { label: string; dot: string; text: string; border: string; bg: string }> = {
  active: { label: "ACTIVE", dot: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
  watching: { label: "WATCHING", dot: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5" },
  inactive: { label: "INACTIVE", dot: "bg-zinc-600", text: "text-zinc-500", border: "border-zinc-700/50", bg: "bg-zinc-900/30" },
};

function GaugeBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function OrbClient() {
  const [rows, setRows] = useState<OrbRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyBySetup, setHistoryBySetup] = useState<Record<string, { trades: any[]; signals: any[] }>>({});
  const [filter, setFilter] = useState<"all" | "active" | "buy" | "avoid">("all");

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/orb/states", { cache: "no-store" });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    };
    load();

    const supabase = createClient();
    const channel = supabase
      .channel("orb-setup-states")
      .on("postgres_changes", { event: "*", schema: "public", table: "orb_setup_states" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (filter === "active") out = out.filter((r) => ["active", "watching"].includes(r.state?.status || "inactive"));
    if (filter === "buy") out = out.filter((r) => r.type === "buy");
    if (filter === "avoid") out = out.filter((r) => r.type === "avoid");

    const rank = (status: string) => (status === "active" ? 0 : status === "watching" ? 1 : 2);
    return out.sort((a, b) => rank(a.state?.status || "inactive") - rank(b.state?.status || "inactive"));
  }, [rows, filter]);

  const activeBuys = rows.filter((r) => r.type === "buy" && r.state?.status === "active").length;
  const activeAvoids = rows.filter((r) => r.type === "avoid" && r.state?.status === "active").length;
  const watching = rows.filter((r) => r.state?.status === "watching").length;

  const openSetup = async (setupId: string) => {
    setExpandedId((prev) => (prev === setupId ? null : setupId));
    if (!historyBySetup[setupId]) {
      const res = await fetch(`/api/orb/history/${setupId}`, { cache: "no-store" });
      const data = await res.json();
      setHistoryBySetup((prev) => ({ ...prev, [setupId]: { trades: data.trades || [], signals: data.signals || [] } }));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg font-bold tracking-tight">🔮 Orb</h1>
          <span className="text-xs text-zinc-600 font-mono ml-auto">Live Signal Tracker</span>
        </div>
        <p className="text-xs text-zinc-500">11 buy setups + 4 avoid signals • TSLA patterns</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5"><div className="text-xs text-zinc-500">Buy Signals</div><div className="text-2xl font-bold text-emerald-400">{activeBuys}</div></div>
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5"><div className="text-xs text-zinc-500">Avoid Signals</div><div className="text-2xl font-bold text-red-400">{activeAvoids}</div></div>
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5"><div className="text-xs text-zinc-500">Watching</div><div className="text-2xl font-bold text-amber-400">{watching}</div></div>
      </div>

      <div className="flex gap-1 mb-3">
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active / Watching" },
          { key: "buy", label: "Buy" },
          { key: "avoid", label: "Avoid" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            className={`text-xs px-3 py-1.5 rounded-lg ${filter === t.key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((row) => {
          const status = row.state?.status || "inactive";
          const sc = statusConfig[status];
          const expanded = expandedId === row.id;
          const isGauge = row.framework === "gauge-to-target";
          const gaugeCurrent = row.state?.gauge_current_value;

          return (
            <div key={row.id} className={`rounded-xl border ${sc.border} ${sc.bg} overflow-hidden`}>
              <button onClick={() => openSetup(row.id)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${sc.dot} ${status === "active" ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${row.type === "buy" ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                      {row.type === "buy" ? `BUY #${row.number}` : `AVOID #${row.number}`}
                    </span>
                    <h3 className="text-white font-semibold text-sm">{row.name}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${sc.text}`}>{sc.label}</span>
                    {row.grade && <span className="text-xs text-zinc-500 font-mono">{row.grade}</span>}
                  </div>
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className={sc.text}>{row.backtest_win_rate_20d ?? "-"}% win(20d)</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">N={row.backtest_n ?? "-"}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-500">{row.framework}</span>
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="px-4 pb-4 border-t border-zinc-800/50 space-y-3 pt-3">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Conditions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(row.conditions || []).map((c, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-zinc-800/80 text-zinc-300 font-mono">{c}</span>
                      ))}
                    </div>
                  </div>

                  {row.description && (
                    <p className="text-xs text-zinc-400 italic">{row.description}</p>
                  )}

                  {row.framework === "fixed-horizon" && row.backtest_n && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Forward Returns (backtest)</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { k: "5d", win: row.backtest_win_rate_5d, avg: row.backtest_avg_return_5d },
                          { k: "10d", win: row.backtest_win_rate_10d, avg: row.backtest_avg_return_10d },
                          { k: "20d", win: row.backtest_win_rate_20d, avg: row.backtest_avg_return_20d },
                          { k: "60d", win: row.backtest_win_rate_60d, avg: row.backtest_avg_return_60d },
                        ].filter(h => h.win != null).map((h) => (
                          <div key={h.k} className="text-center p-2 rounded bg-zinc-800/50">
                            <div className="text-xs text-zinc-500 mb-0.5">{h.k}</div>
                            <div className={`text-sm font-mono font-bold ${(h.avg || 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {(h.avg || 0) > 0 ? "+" : ""}{(h.avg || 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-zinc-500">{h.win}% win</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isGauge && typeof gaugeCurrent === "number" && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Gauge Progress</p>
                      <GaugeBar value={gaugeCurrent} min={-100} max={100} />
                      <div className="text-xs text-zinc-400 mt-1">
                        Entry: {row.state?.gauge_entry_value ?? "-"} | Current: {row.state?.gauge_current_value ?? "-"} | Target: {row.state?.gauge_target_value ?? "-"}
                      </div>
                    </div>
                  )}

                  {row.livePerformance && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-zinc-800/50 rounded text-center">
                        <div className="text-zinc-500">Live Wins</div>
                        <div className="text-white font-mono font-bold">{row.livePerformance.wins}/{row.livePerformance.total}</div>
                      </div>
                      <div className="p-2 bg-zinc-800/50 rounded text-center">
                        <div className="text-zinc-500">Live Avg</div>
                        <div className={`font-mono font-bold ${row.livePerformance.avgReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {row.livePerformance.avgReturn >= 0 ? "+" : ""}{row.livePerformance.avgReturn.toFixed(2)}%
                        </div>
                      </div>
                      <div className="p-2 bg-zinc-800/50 rounded text-center">
                        <div className="text-zinc-500">Backtest 20d</div>
                        <div className={`font-mono font-bold ${(row.backtest_avg_return_20d || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(row.backtest_avg_return_20d || 0) >= 0 ? "+" : ""}{(row.backtest_avg_return_20d || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {historyBySetup[row.id] && (
                    <div className="text-xs bg-zinc-900/40 border border-zinc-800 rounded p-2">
                      <p className="text-zinc-400 mb-1">Trade History: {historyBySetup[row.id].trades.length} trades</p>
                      <p className="text-zinc-500">Recent Signals: {historyBySetup[row.id].signals.length}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
