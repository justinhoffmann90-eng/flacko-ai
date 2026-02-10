"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrbRow = {
  id: string;
  name: string;
  public_name: string | null;
  number: number;
  type: "buy" | "avoid";
  framework: "fixed-horizon" | "gauge-to-target";
  grade: string | null;
  category_tags: string[] | null;
  one_liner: string | null;
  public_description: string | null;
  backtest_n: number | null;
  backtest_win_rate_5d: number | null;
  backtest_avg_return_5d: number | null;
  backtest_win_rate_10d: number | null;
  backtest_avg_return_10d: number | null;
  backtest_win_rate_20d: number | null;
  backtest_avg_return_20d: number | null;
  backtest_win_rate_60d: number | null;
  backtest_avg_return_60d: number | null;
  gauge_median_days: number | null;
  gauge_median_return: number | null;
  description: string | null;
  state: any;
  livePerformance: { wins: number; total: number; avgReturn: number } | null;
};

type Trade = {
  id: number;
  setup_id: string;
  entry_date: string;
  entry_price: number;
  exit_date: string | null;
  exit_price: number | null;
  exit_reason: string | null;
  current_return_pct: number;
  max_return_pct: number;
  max_drawdown_pct: number;
  days_active: number;
  final_return_pct: number | null;
  is_win: boolean | null;
  status: "open" | "closed";
};

const statusConfig: Record<string, { label: string; dot: string; text: string; border: string; bg: string; glow: string }> = {
  active: { label: "ACTIVE", dot: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", glow: "shadow-lg shadow-emerald-500/20" },
  watching: { label: "WATCHING", dot: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", glow: "" },
  inactive: { label: "INACTIVE", dot: "bg-zinc-600", text: "text-zinc-500", border: "border-zinc-700/50", bg: "bg-zinc-900/30", glow: "" },
};

function GaugeBar({ value, min, max, thresholds }: { value: number; min: number; max: number; thresholds?: { value: number; label: string }[] }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = value < -40 ? "#ef4444" : value < 0 ? "#f59e0b" : value < 50 ? "#22c55e" : "#3b82f6";
  return (
    <div className="mb-1">
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
        {thresholds?.map((t, i) => {
          const tPct = ((t.value - min) / (max - min)) * 100;
          return <div key={i} className="absolute top-0 bottom-0 w-px bg-zinc-600" style={{ left: `${tPct}%` }} />;
        })}
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      {thresholds && (
        <div className="flex justify-between text-[10px] mt-0.5 text-zinc-600">
          {thresholds.map((t, i) => <span key={i}>{t.label}</span>)}
        </div>
      )}
    </div>
  );
}

function ActiveTradeCard({ row, trade }: { row: OrbRow; trade: Trade | null }) {
  if (!trade) return null;
  const isGauge = row.framework === "gauge-to-target";
  const gaugeEntry = row.state?.gauge_entry_value;
  const gaugeCurrent = row.state?.gauge_current_value;
  const gaugeTarget = row.state?.gauge_target_value;
  const gaugeProgressPct = gaugeEntry != null && gaugeCurrent != null && gaugeTarget != null && gaugeTarget !== gaugeEntry
    ? (((gaugeCurrent - gaugeEntry) / (gaugeTarget - gaugeEntry)) * 100).toFixed(0)
    : null;

  return (
    <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live Trade</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-zinc-500">Entry</div>
        <div className="text-white font-mono">${trade.entry_price.toFixed(2)} ({trade.entry_date})</div>
        <div className="text-zinc-500">Day</div>
        <div className="text-white font-mono">{trade.days_active}{row.gauge_median_days ? ` of ~${row.gauge_median_days} median` : ""}</div>
        <div className="text-zinc-500">Return</div>
        <div className={`font-mono font-bold ${trade.current_return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {trade.current_return_pct >= 0 ? "+" : ""}{trade.current_return_pct.toFixed(2)}%
        </div>
        <div className="text-zinc-500">Max Up</div>
        <div className="text-emerald-400 font-mono">+{(trade.max_return_pct || 0).toFixed(2)}%</div>
        <div className="text-zinc-500">Max Down</div>
        <div className="text-red-400 font-mono">{(trade.max_drawdown_pct || 0).toFixed(2)}%</div>
      </div>
      {isGauge && gaugeCurrent != null && (
        <div className="pt-1">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500">SMI Progress</span>
            <span className="text-amber-400 font-mono">{gaugeProgressPct}% to target</span>
          </div>
          <GaugeBar
            value={gaugeCurrent}
            min={-100}
            max={100}
            thresholds={[
              { value: gaugeEntry ?? -60, label: `${gaugeEntry ?? -60} entry` },
              { value: 0, label: "0" },
              { value: gaugeTarget ?? 30, label: `${gaugeTarget ?? 30} target` },
            ]}
          />
          <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
            <span>Entry SMI: {gaugeEntry?.toFixed(1)}</span>
            <span>Current: {gaugeCurrent?.toFixed(1)}</span>
          </div>
        </div>
      )}
      {row.backtest_avg_return_20d != null && (
        <div className="text-[10px] text-zinc-600 pt-1 border-t border-zinc-800/50">
          Backtest avg: {row.backtest_avg_return_20d > 0 ? "+" : ""}{row.backtest_avg_return_20d}% over ~{row.gauge_median_days || "N/A"} days | {row.backtest_win_rate_20d}% win rate (N={row.backtest_n})
        </div>
      )}
    </div>
  );
}

function ClosedTradeCard({ trade, row }: { trade: Trade; row: OrbRow }) {
  const isWin = trade.is_win;
  return (
    <div className={`p-2.5 rounded-lg border text-xs ${isWin ? "border-emerald-500/10 bg-emerald-500/5" : "border-red-500/10 bg-red-500/5"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={isWin ? "text-emerald-400" : "text-red-400"}>{isWin ? "✅" : "❌"}</span>
        <span className="text-zinc-400">{trade.entry_date} → {trade.exit_date}</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-400">{trade.days_active}d</span>
      </div>
      <div className="flex gap-4">
        <span className="text-zinc-500">${trade.entry_price} → ${trade.exit_price}</span>
        <span className={`font-mono font-bold ${(trade.final_return_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {(trade.final_return_pct || 0) >= 0 ? "+" : ""}{(trade.final_return_pct || 0).toFixed(2)}%
        </span>
        <span className="text-zinc-600">Max: +{(trade.max_return_pct || 0).toFixed(1)}% / {(trade.max_drawdown_pct || 0).toFixed(1)}%</span>
      </div>
      {trade.exit_reason && <div className="text-zinc-600 mt-0.5">Exit: {trade.exit_reason.replace(/_/g, " ")}</div>}
    </div>
  );
}

function CumulativeStats({ rows }: { rows: OrbRow[] }) {
  const allLive = rows.filter(r => r.livePerformance && r.livePerformance.total > 0);
  if (allLive.length === 0) return null;

  const buys = allLive.filter(r => r.type === "buy");
  const avoids = allLive.filter(r => r.type === "avoid");

  const buyStats = buys.reduce((acc, r) => {
    const lp = r.livePerformance!;
    return { wins: acc.wins + lp.wins, total: acc.total + lp.total, sumReturn: acc.sumReturn + lp.avgReturn * lp.total };
  }, { wins: 0, total: 0, sumReturn: 0 });

  const avoidStats = avoids.reduce((acc, r) => {
    const lp = r.livePerformance!;
    return { wins: acc.wins + lp.wins, total: acc.total + lp.total, sumReturn: acc.sumReturn + lp.avgReturn * lp.total };
  }, { wins: 0, total: 0, sumReturn: 0 });

  return (
    <div className="mb-4 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">🔮 Live Track Record</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {buyStats.total > 0 && (
          <div>
            <div className="text-emerald-400 font-bold mb-1">Buy Signals</div>
            <div className="text-zinc-400">Completed: {buyStats.total} | Wins: {buyStats.wins}</div>
            <div className="text-zinc-400">Win Rate: {(buyStats.wins / buyStats.total * 100).toFixed(1)}%</div>
            <div className="text-zinc-400">Avg Return: {(buyStats.sumReturn / buyStats.total).toFixed(1)}%</div>
          </div>
        )}
        {avoidStats.total > 0 && (
          <div>
            <div className="text-red-400 font-bold mb-1">Avoid Signals</div>
            <div className="text-zinc-400">Completed: {avoidStats.total} | Correct: {avoidStats.wins}</div>
            <div className="text-zinc-400">Accuracy: {(avoidStats.wins / avoidStats.total * 100).toFixed(1)}%</div>
            <div className="text-zinc-400">Avg Decline: {(avoidStats.sumReturn / avoidStats.total).toFixed(1)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrbClient() {
  const [rows, setRows] = useState<OrbRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyBySetup, setHistoryBySetup] = useState<Record<string, { trades: Trade[]; signals: any[] }>>({});
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
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg font-bold tracking-tight">🔮 Orb</h1>
          <span className="text-xs text-zinc-600 font-mono ml-auto">Live Signal Tracker</span>
        </div>
        <p className="text-xs text-zinc-500">11 buy setups + 4 avoid signals • 905 bars backtested • TSLA</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`p-3 rounded-lg border ${activeBuys > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
          <div className="text-xs text-zinc-500">Buy Signals</div>
          <div className={`text-2xl font-bold font-mono ${activeBuys > 0 ? "text-emerald-400" : "text-zinc-600"}`}>{activeBuys}</div>
          <div className="text-xs text-zinc-600">active</div>
        </div>
        <div className={`p-3 rounded-lg border ${activeAvoids > 0 ? "border-red-500/30 bg-red-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
          <div className="text-xs text-zinc-500">Avoid Signals</div>
          <div className={`text-2xl font-bold font-mono ${activeAvoids > 0 ? "text-red-400" : "text-zinc-600"}`}>{activeAvoids}</div>
          <div className="text-xs text-zinc-600">active</div>
        </div>
        <div className={`p-3 rounded-lg border ${watching > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
          <div className="text-xs text-zinc-500">Watching</div>
          <div className={`text-2xl font-bold font-mono ${watching > 0 ? "text-amber-400" : "text-zinc-600"}`}>{watching}</div>
          <div className="text-xs text-zinc-600">developing</div>
        </div>
      </div>

      {/* Cumulative track record */}
      <CumulativeStats rows={rows} />

      {/* Active alert banner */}
      {(activeBuys > 0 || activeAvoids > 0) && (
        <div className={`mb-4 p-3 rounded-lg border ${activeAvoids > 0 ? "border-red-500/20 bg-red-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${activeAvoids > 0 ? "bg-red-500" : "bg-emerald-500"}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${activeAvoids > 0 ? "text-red-400" : "text-emerald-400"}`}>
              {activeAvoids > 0 ? "Avoid Signal Active" : "Buy Signal Active"}
            </span>
          </div>
          {rows.filter(r => r.type === "avoid" && r.state?.status === "active").map(s => (
            <p key={s.id} className="text-xs text-zinc-300">
              <span className="text-red-400 font-semibold">{s.public_name || s.name}</span> -- {s.state?.inactive_reason || s.state?.watching_reason || "Active"}
            </p>
          ))}
          {rows.filter(r => r.type === "buy" && r.state?.status === "active").map(s => (
            <p key={s.id} className="text-xs text-zinc-300 mt-1">
              <span className="text-emerald-400 font-semibold">{s.public_name || s.name}</span> -- Day {s.state?.active_day || "?"}{s.gauge_median_days ? ` of ~${s.gauge_median_days} median` : ""}. Win rate: {s.backtest_win_rate_20d}%.
            </p>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3">
        {[
          { key: "all", label: "All Setups" },
          { key: "active", label: "Active / Watching" },
          { key: "buy", label: "Buy" },
          { key: "avoid", label: "Avoid" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === t.key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Setup Cards */}
      <div className="space-y-2">
        {filtered.map((row) => {
          const status = row.state?.status || "inactive";
          const sc = statusConfig[status];
          const expanded = expandedId === row.id;
          const isActive = status === "active";
          const history = historyBySetup[row.id];
          const openTrade = history?.trades.find(t => t.status === "open") || null;
          const closedTrades = history?.trades.filter(t => t.status === "closed") || [];

          return (
            <div key={row.id} className={`rounded-xl border ${sc.border} ${sc.bg} overflow-hidden transition-all duration-300 ${isActive ? sc.glow : ""}`}>
              <button onClick={() => openSetup(row.id)} className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${sc.dot} ${isActive ? "animate-pulse" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${row.type === "buy" ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                      {row.type === "buy" ? `BUY #${row.number}` : `AVOID #${row.number}`}
                    </span>
                    <h3 className="text-white font-semibold text-sm">{row.public_name || row.name}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${sc.text}`}>{sc.label}</span>
                    {row.grade && row.grade !== "AVOID" && <span className="text-xs text-zinc-500 font-mono">{row.grade}</span>}
                  </div>
                  {row.one_liner && <p className="mt-1 text-xs text-zinc-400">{row.one_liner}</p>}
                  {!!row.category_tags?.length && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {row.category_tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className={sc.text}>{row.backtest_win_rate_20d ?? "-"}% win</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-zinc-400">N={row.backtest_n ?? "-"}</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-zinc-500">{row.framework}</span>
                  </div>
                  {/* Inline active trade summary */}
                  {isActive && row.state?.entry_price && (
                    <div className="mt-2 flex gap-4 text-xs">
                      <span className="text-zinc-400">Entry: <span className="text-white font-mono">${row.state.entry_price}</span></span>
                      <span className="text-zinc-400">Day: <span className="text-white font-mono">{row.state.active_day || 1}</span></span>
                      {row.state.gauge_current_value != null && (
                        <span className="text-zinc-400">SMI: <span className="text-amber-400 font-mono">{Number(row.state.gauge_current_value).toFixed(1)}</span> → {row.state.gauge_target_value} target</span>
                      )}
                    </div>
                  )}
                  {/* Inactive reason */}
                  {!isActive && status === "watching" && row.state?.watching_reason && (
                    <p className="mt-1.5 text-xs text-zinc-600 truncate">{row.state.watching_reason}</p>
                  )}
                  {!isActive && status === "inactive" && row.state?.inactive_reason && (
                    <p className="mt-1.5 text-xs text-zinc-600 truncate">{row.state.inactive_reason}</p>
                  )}
                </div>
                <svg className={`w-4 h-4 text-zinc-600 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expanded && (
                <div className="px-4 pb-4 border-t border-zinc-800/50 space-y-3 pt-3">
                  {row.public_description && <p className="text-xs text-zinc-400 italic">{row.public_description}</p>}

                  {/* Active trade card */}
                  {isActive && <ActiveTradeCard row={row} trade={openTrade} />}

                  {/* Horizons (fixed-horizon setups) */}
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

                  {/* Gauge stats (gauge-to-target setups, when not active) */}
                  {row.framework === "gauge-to-target" && !isActive && row.gauge_median_days && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-zinc-800/50 rounded text-center">
                        <div className="text-zinc-500">Median Return</div>
                        <div className={`font-mono font-bold ${(row.gauge_median_return || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(row.gauge_median_return || 0) >= 0 ? "+" : ""}{row.gauge_median_return}%
                        </div>
                      </div>
                      <div className="p-2 bg-zinc-800/50 rounded text-center">
                        <div className="text-zinc-500">Median Days</div>
                        <div className="text-white font-mono font-bold">{row.gauge_median_days}</div>
                      </div>
                      <div className="p-2 bg-zinc-800/50 rounded text-center">
                        <div className="text-zinc-500">Sample</div>
                        <div className="text-white font-mono font-bold">N={row.backtest_n}</div>
                      </div>
                    </div>
                  )}

                  {/* Live vs Backtest comparison (3+ completed trades) */}
                  {row.livePerformance && row.livePerformance.total >= 3 && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Live vs Backtest</p>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-zinc-800/50 rounded text-center">
                          <div className="text-zinc-500 mb-0.5">Metric</div>
                          <div className="text-zinc-400">Win Rate</div>
                          <div className="text-zinc-400">Avg Return</div>
                        </div>
                        <div className="p-2 bg-zinc-800/50 rounded text-center">
                          <div className="text-zinc-500 mb-0.5">Backtest</div>
                          <div className="text-zinc-300 font-mono">{row.backtest_win_rate_20d}%</div>
                          <div className="text-zinc-300 font-mono">{row.backtest_avg_return_20d}%</div>
                        </div>
                        <div className="p-2 bg-zinc-800/50 rounded text-center">
                          <div className="text-zinc-500 mb-0.5">Live</div>
                          <div className="text-white font-mono font-bold">{(row.livePerformance.wins / row.livePerformance.total * 100).toFixed(1)}%</div>
                          <div className="text-white font-mono font-bold">{row.livePerformance.avgReturn.toFixed(1)}%</div>
                        </div>
                        <div className="p-2 bg-zinc-800/50 rounded text-center">
                          <div className="text-zinc-500 mb-0.5">N</div>
                          <div className="text-zinc-400">{row.backtest_n}</div>
                          <div className="text-zinc-400">{row.livePerformance.total}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simple live stats (< 3 completed trades) */}
                  {row.livePerformance && row.livePerformance.total > 0 && row.livePerformance.total < 3 && (
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

                  {/* Closed trade log */}
                  {closedTrades.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Trade History ({closedTrades.length})</p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {closedTrades.slice(0, 10).map(t => (
                          <ClosedTradeCard key={t.id} trade={t} row={row} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-zinc-800/50 text-xs text-zinc-600">
        <p>Data: 905 TSLA daily bars (Jul 2022 - Feb 2026) | BX-Trender computed from OHLCV | SMI: 10/3/3</p>
        <p className="mt-1">Past performance does not guarantee future results. All statistics are from backtesting.</p>
      </div>
    </div>
  );
}
