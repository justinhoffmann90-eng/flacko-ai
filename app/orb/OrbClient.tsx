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
  _admin?: boolean;
  conditions?: any;
  eval_logic?: any;
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

const statusConfig: Record<string, { label: string; dot: string; text: string; border: string; bg: string; glow: string; color: string }> = {
  active: { label: "ACTIVE", dot: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5", glow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]", color: "#22c55e" },
  watching: { label: "WATCHING", dot: "bg-amber-500", text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/5", glow: "", color: "#eab308" },
  inactive: { label: "INACTIVE", dot: "bg-zinc-600", text: "text-zinc-500", border: "border-zinc-700/50", bg: "bg-zinc-900/30", glow: "", color: "#6b7280" },
};

function HitRateRing({ pctPos, size = 52 }: { pctPos: number; size?: number }) {
  const safePct = Number.isFinite(pctPos) ? Math.max(0, Math.min(100, pctPos)) : 0;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePct / 100) * circumference;
  const color = safePct >= 65 ? "#22c55e" : safePct >= 50 ? "#eab308" : "#ef4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "center",
          fill: color,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {Math.round(safePct)}%
      </text>
    </svg>
  );
}

function ReturnBar({ value, label, maxAbs = 15 }: { value: number | null; label: string; maxAbs?: number }) {
  const v = value ?? 0;
  const widthPct = Math.min(100, (Math.abs(v) / maxAbs) * 100);
  const positive = v >= 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 34, fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.12)" }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: `${widthPct / 2}%`,
            left: positive ? "50%" : `${50 - widthPct / 2}%`,
            borderRadius: 4,
            background: positive
              ? "linear-gradient(90deg, rgba(34,197,94,0.35), rgba(34,197,94,0.9))"
              : "linear-gradient(270deg, rgba(239,68,68,0.35), rgba(239,68,68,0.9))",
          }}
        />
      </div>
      <div
        style={{
          width: 58,
          textAlign: "right",
          fontSize: 12,
          fontWeight: 700,
          color: positive ? "#22c55e" : "#ef4444",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {positive ? "+" : ""}
        {v.toFixed(1)}%
      </div>
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
    <div style={{ border: "1px solid rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.06)", borderRadius: 10, padding: 12 }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>LIVE TRADE</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-zinc-500">Entry</div><div className="text-white font-mono">${trade.entry_price.toFixed(2)} ({trade.entry_date})</div>
        <div className="text-zinc-500">Day</div><div className="text-white font-mono">{trade.days_active}{row.gauge_median_days ? ` of ~${row.gauge_median_days} median` : ""}</div>
        <div className="text-zinc-500">Return</div><div className={`font-mono font-bold ${trade.current_return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{trade.current_return_pct >= 0 ? "+" : ""}{trade.current_return_pct.toFixed(2)}%</div>
        <div className="text-zinc-500">Max Up</div><div className="text-emerald-400 font-mono">+{(trade.max_return_pct || 0).toFixed(2)}%</div>
        <div className="text-zinc-500">Max Down</div><div className="text-red-400 font-mono">{(trade.max_drawdown_pct || 0).toFixed(2)}%</div>
      </div>
      {isGauge && gaugeCurrent != null && (
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1"><span className="text-zinc-500">SMI Progress</span><span className="text-amber-400 font-mono">{gaugeProgressPct}% to target</span></div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(0, Math.min(100, Number(gaugeProgressPct || 0)))}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1"><span>Entry SMI: {gaugeEntry?.toFixed(1)}</span><span>Current: {gaugeCurrent?.toFixed(1)}</span></div>
        </div>
      )}
    </div>
  );
}

function ClosedTradeCard({ trade }: { trade: Trade; row: OrbRow }) {
  const isWin = trade.is_win;
  return (
    <div style={{ border: `1px solid ${isWin ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)"}`, background: isWin ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)", borderRadius: 8, padding: 10 }}>
      <div className="flex items-center gap-2 mb-1 text-xs">
        <span className={isWin ? "text-emerald-400" : "text-red-400"}>{isWin ? "●" : "●"}</span>
        <span className="text-zinc-400 font-mono">{trade.entry_date} → {trade.exit_date}</span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-500">{trade.days_active}d</span>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-zinc-500 font-mono">${trade.entry_price} → ${trade.exit_price}</span>
        <span className={`font-mono font-bold ${(trade.final_return_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{(trade.final_return_pct || 0) >= 0 ? "+" : ""}{(trade.final_return_pct || 0).toFixed(2)}%</span>
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

  const activeSetups = rows.filter((r) => r.state?.status === "active");
  const featured = activeSetups[0] || null;

  const openSetup = async (setupId: string) => {
    setExpandedId((prev) => (prev === setupId ? null : setupId));
    if (!historyBySetup[setupId]) {
      const res = await fetch(`/api/orb/history/${setupId}`, { cache: "no-store" });
      const data = await res.json();
      setHistoryBySetup((prev) => ({ ...prev, [setupId]: { trades: data.trades || [], signals: data.signals || [] } }));
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ background: "#0a0a0c", color: "#f0f0f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 1000px; } }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6" style={{ animation: "fadeIn .4s ease" }}>
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f0f0 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Orb</h1>
            <span className="ml-auto" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace" }}>LIVE SIGNAL TRACKER</span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>11 buy setups + 4 avoid signals • 905 bars backtested • TSLA</p>
        </div>

        {featured && (
          <div className="mb-5" style={{ border: `1px solid rgba(34,197,94,0.2)`, background: "linear-gradient(135deg, rgba(34,197,94,0.09) 0%, rgba(59,130,246,0.03) 100%)", borderRadius: 14, padding: 16, animation: "fadeIn .45s ease" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#22c55e", fontFamily: "'JetBrains Mono', monospace" }}>FEATURED ACTIVE SIGNAL</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{featured.public_name || featured.name}</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{featured.one_liner || featured.state?.watching_reason || featured.state?.inactive_reason || "Signal currently active."}</p>
            <div className="grid grid-cols-4 gap-2 mt-4" style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 10 }}>
              <div className="text-center"><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: "#22c55e" }}>{featured.backtest_avg_return_20d != null ? `${featured.backtest_avg_return_20d > 0 ? "+" : ""}${featured.backtest_avg_return_20d.toFixed(1)}%` : "—"}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>AVG 20D</div></div>
              <div className="text-center"><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{featured.backtest_win_rate_20d != null ? `${featured.backtest_win_rate_20d}%` : "—"}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>HIT RATE</div></div>
              <div className="text-center"><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{featured.backtest_n ?? "—"}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>INSTANCES</div></div>
              <div className="text-center"><div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: featured.type === "buy" ? "#22c55e" : "#ef4444" }}>{featured.type.toUpperCase()}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>SETUP TYPE</div></div>
            </div>
          </div>
        )}

        <div className="mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 4, display: "flex", gap: 4 }}>
          {[
            { key: "all", label: "All Setups" },
            { key: "active", label: "Active / Watching" },
            { key: "buy", label: "Buy" },
            { key: "avoid", label: "Avoid" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as any)}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 8,
                padding: "8px 10px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: filter === t.key ? "#f0f0f0" : "rgba(255,255,255,0.35)",
                background: filter === t.key ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((row, index) => {
            const status = row.state?.status || "inactive";
            const sc = statusConfig[status];
            const expanded = expandedId === row.id;
            const isActive = status === "active";
            const history = historyBySetup[row.id];
            const openTrade = history?.trades.find((t) => t.status === "open") || null;
            const closedTrades = history?.trades.filter((t) => t.status === "closed") || [];

            return (
              <div
                key={row.id}
                className={`rounded-xl border overflow-hidden transition-all duration-300 ${expanded ? sc.glow : ""}`}
                style={{
                  borderColor: expanded ? sc.color : "rgba(255,255,255,0.06)",
                  background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  animation: `fadeIn .4s ease ${index * 0.08}s both`,
                }}
              >
                <button onClick={() => openSetup(row.id)} className="w-full text-left p-4 transition-colors" style={{ background: "transparent" }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`} style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${isActive ? "animate-pulse" : ""}`} />
                          {sc.label}
                        </span>
                        <span style={{ fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>{row.type.toUpperCase()} #{row.number}</span>
                      </div>

                      <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{row.public_name || row.name}</h3>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{row.one_liner || "No tagline available."}</p>

                      {!!row.category_tags?.length && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {row.category_tags.map((tag) => (
                            <span key={tag} style={{ fontSize: 10, borderRadius: 999, padding: "2px 8px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <HitRateRing pctPos={row.backtest_win_rate_20d ?? 0} />
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>20D HIT</div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: 28, lineHeight: 1, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: (row.backtest_avg_return_20d || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                          {(row.backtest_avg_return_20d || 0) >= 0 ? "+" : ""}{(row.backtest_avg_return_20d || 0).toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>AVG 20D</div>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.35)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s ease" }}>▾</div>
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px 16px", animation: "slideDown .25s ease" }}>
                    <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>WHY IT MATTERS</p>
                    {row.public_description && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.6, marginBottom: 12 }}>{row.public_description}</p>}

                    {isActive && <ActiveTradeCard row={row} trade={openTrade} />}

                    {row.framework === "fixed-horizon" && row.backtest_n && (
                      <div className="mt-3">
                        <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>FORWARD RETURNS · N={row.backtest_n}</p>
                        <div className="space-y-2">
                          {[
                            { k: "5D", avg: row.backtest_avg_return_5d },
                            { k: "10D", avg: row.backtest_avg_return_10d },
                            { k: "20D", avg: row.backtest_avg_return_20d },
                            { k: "60D", avg: row.backtest_avg_return_60d },
                          ].filter((h) => h.avg != null).map((h) => (
                            <ReturnBar key={h.k} label={h.k} value={h.avg} />
                          ))}
                        </div>
                      </div>
                    )}

                    {row.framework === "gauge-to-target" && !isActive && row.gauge_median_days && (
                      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                        <div className="p-2 rounded-lg bg-zinc-900/70 border border-white/5 text-center"><div className="text-zinc-500">Median Return</div><div className={`font-mono font-bold ${(row.gauge_median_return || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{(row.gauge_median_return || 0) >= 0 ? "+" : ""}{row.gauge_median_return}%</div></div>
                        <div className="p-2 rounded-lg bg-zinc-900/70 border border-white/5 text-center"><div className="text-zinc-500">Median Days</div><div className="text-white font-mono font-bold">{row.gauge_median_days}</div></div>
                        <div className="p-2 rounded-lg bg-zinc-900/70 border border-white/5 text-center"><div className="text-zinc-500">Sample</div><div className="text-white font-mono font-bold">N={row.backtest_n}</div></div>
                      </div>
                    )}

                    {row.livePerformance && row.livePerformance.total >= 3 && (
                      <div className="mt-3">
                        <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>LIVE VS BACKTEST</p>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">Metric</div><div className="text-zinc-400">Win Rate</div><div className="text-zinc-400">Avg Return</div></div>
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">Backtest</div><div className="text-zinc-300 font-mono">{row.backtest_win_rate_20d}%</div><div className="text-zinc-300 font-mono">{row.backtest_avg_return_20d}%</div></div>
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">Live</div><div className="text-white font-mono font-bold">{(row.livePerformance.wins / row.livePerformance.total * 100).toFixed(1)}%</div><div className="text-white font-mono font-bold">{row.livePerformance.avgReturn.toFixed(1)}%</div></div>
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">N</div><div className="text-zinc-400">{row.backtest_n}</div><div className="text-zinc-400">{row.livePerformance.total}</div></div>
                        </div>
                      </div>
                    )}

                    {closedTrades.length > 0 && (
                      <div className="mt-3">
                        <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>RECENT INSTANCES ({closedTrades.length})</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {closedTrades.slice(0, 10).map((t) => (
                            <ClosedTradeCard key={t.id} trade={t} row={row} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin-only indicator details */}
                    {row._admin && (
                      <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(139, 92, 246, 0.06)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                        <p style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(139, 92, 246, 0.6)", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>🔒 ADMIN · INDICATOR DETAILS</p>
                        {row.name && row.name !== row.public_name && (
                          <div className="mb-2">
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Internal: </span>
                            <span style={{ fontSize: 12, color: "rgba(139, 92, 246, 0.8)", fontFamily: "'JetBrains Mono', monospace" }}>{row.name}</span>
                          </div>
                        )}
                        {row.description && (
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, marginBottom: 8 }}>{row.description}</p>
                        )}
                        {row.conditions && (
                          <div className="mb-2">
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Conditions: </span>
                            <pre style={{ fontSize: 11, color: "rgba(139, 92, 246, 0.7)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", marginTop: 4 }}>
                              {typeof row.conditions === "string" ? row.conditions : JSON.stringify(row.conditions, null, 2)}
                            </pre>
                          </div>
                        )}
                        {row.eval_logic && (
                          <div className="mb-2">
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Eval Logic: </span>
                            <pre style={{ fontSize: 11, color: "rgba(139, 92, 246, 0.7)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", marginTop: 4 }}>
                              {typeof row.eval_logic === "string" ? row.eval_logic : JSON.stringify(row.eval_logic, null, 2)}
                            </pre>
                          </div>
                        )}
                        {row.state?.gauge_current_value != null && (
                          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                            <div><span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Gauge Entry: </span><span style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace" }}>{row.state.gauge_entry_value}</span></div>
                            <div><span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Current: </span><span style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace" }}>{row.state.gauge_current_value}</span></div>
                            <div><span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Target: </span><span style={{ fontSize: 12, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace" }}>{row.state.gauge_target_value}</span></div>
                          </div>
                        )}
                        {row.state?.entry_indicator_values && (
                          <div className="mt-2">
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>Entry Indicators: </span>
                            <pre style={{ fontSize: 11, color: "rgba(139, 92, 246, 0.7)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", marginTop: 4 }}>
                              {JSON.stringify(row.state.entry_indicator_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/50" style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
          <p>Data: 905 TSLA daily bars (Jul 2022 - Feb 2026) | BX-Trender computed from OHLCV | SMI: 10/3/3</p>
          <p className="mt-1">Past performance does not guarantee future results. All statistics are from backtesting.</p>
        </div>
      </div>
    </div>
  );
}
