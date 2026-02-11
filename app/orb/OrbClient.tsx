"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrbRow = {
  id: string;
  name: string;
  public_name: string | null;
  number: number;
  type: "buy" | "avoid";
  stance: "offensive" | "defensive" | null;
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

function ReturnBar({ value, label, maxAbs = 15, isDesktop = false, showLabel = true }: { value: number | null; label: string; maxAbs?: number; isDesktop?: boolean; showLabel?: boolean }) {
  const v = value ?? 0;
  const widthPct = Math.min(100, (Math.abs(v) / maxAbs) * 100);
  const positive = v >= 0;
  const desktopFont = (mobilePx: number) => (isDesktop ? Math.round(mobilePx * 1.2) : mobilePx);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {showLabel && <div style={{ width: 34, fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>}
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
      <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#f4f4f5", marginBottom: 4 }}>
        {formatActivationLine({ date: trade.entry_date, price: trade.entry_price, prefix: "Activated:", withYear: true })}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          color: trade.current_return_pct >= 0 ? "#22c55e" : "#ef4444",
          marginBottom: 8,
        }}
      >
        Current Return: {trade.current_return_pct >= 0 ? "+" : ""}
        {trade.current_return_pct.toFixed(2)}%
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-zinc-500">Day</div><div className="text-white font-mono">{trade.days_active}{row.gauge_median_days ? ` of ~${row.gauge_median_days} median` : ""}</div>
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

const modeColor = (mode: string | null | undefined) => {
  const m = String(mode || "").toUpperCase();
  if (m === "GREEN") return "#22c55e";
  if (m === "YELLOW") return "#eab308";
  if (m === "YELLOW_IMP") return "#a3e635";
  if (m === "ORANGE") return "#f97316";
  if (m === "RED") return "#ef4444";
  return "#6b7280";
};

const formatSignalDate = (value: any) => {
  if (!value) return "—";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const formatPct = (value: any) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
};

const formatActivationDate = (value: any, withYear = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

const formatActivationLine = ({
  date,
  price,
  prefix = "Triggered",
  withYear = false,
}: {
  date: any;
  price: any;
  prefix?: string;
  withYear?: boolean;
}) => {
  const hasPrice = Number.isFinite(Number(price));
  const dateText = formatActivationDate(date, withYear);
  if (!hasPrice) return `${prefix} ${dateText}`;
  return `${prefix} ${dateText} @ $${Number(price).toFixed(2)}`;
};

/** Pick the best timeframe for a setup tile.
 *  Offensive → highest avg return. Defensive → most negative avg return. */
function bestTimeframe(row: OrbRow): { label: string; win: number; avg: number } {
  const periods: { label: string; win: number | null; avg: number | null }[] = [
    { label: "5D", win: row.backtest_win_rate_5d, avg: row.backtest_avg_return_5d },
    { label: "10D", win: row.backtest_win_rate_10d, avg: row.backtest_avg_return_10d },
    { label: "20D", win: row.backtest_win_rate_20d, avg: row.backtest_avg_return_20d },
    { label: "60D", win: row.backtest_win_rate_60d, avg: row.backtest_avg_return_60d },
  ];
  const valid = periods.filter(p => p.avg != null && p.win != null);
  if (!valid.length) return { label: "20D", win: 0, avg: 0 };
  const isDefensive = row.stance === "defensive";
  const best = valid.reduce((a, b) => {
    const aVal = a.avg!;
    const bVal = b.avg!;
    return isDefensive ? (bVal < aVal ? b : a) : (bVal > aVal ? b : a);
  });
  return { label: best.label, win: best.win ?? 0, avg: best.avg ?? 0 };
}

export default function OrbClient() {
  const [rows, setRows] = useState<OrbRow[]>([]);
  const [orbScore, setOrbScore] = useState<{ value: number; zone: string; prevZone: string | null; date: string } | null>(null);
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyBySetup, setHistoryBySetup] = useState<Record<string, { trades: Trade[]; signals: any[]; backtest: any[] }>>({});
  const [filter, setFilter] = useState<"all" | "active" | "buy" | "avoid">("all");
  const [isDesktop, setIsDesktop] = useState(false);
  const [adminDescToggle, setAdminDescToggle] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const desktopFont = (mobilePx: number) => (isDesktop ? Math.round(mobilePx * 1.2) : mobilePx);

  const loadData = useCallback(async () => {
    // Try client-side Supabase auth to detect admin
    let adminParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("admin") : null;
    if (!adminParam) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) adminParam = user.id;
      } catch {}
    }
    const res = await fetch(`/api/orb/states${adminParam ? `?admin=${adminParam}` : ""}`, { cache: "no-store", credentials: "include" });
    const data = await res.json();
    // Handle both old (array) and new ({ score, setups }) response shapes
    if (Array.isArray(data)) {
      setRows(data);
    } else if (data?.setups) {
      setRows(Array.isArray(data.setups) ? data.setups : []);
      if (data.score) setOrbScore(data.score);
    } else {
      setRows([]);
    }
  }, []);

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === null) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0 && containerRef.current && containerRef.current.scrollTop <= 0) {
      setPullDistance(Math.min(dy * 0.5, 80));
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 50 && !refreshing) {
      setRefreshing(true);
      setPullDistance(50);
      await loadData();
      setHistoryBySetup({});
      setRefreshing(false);
    }
    setPullDistance(0);
    pullStartY.current = null;
  }, [pullDistance, refreshing, loadData]);

  useEffect(() => {
    loadData();

    const supabase = createClient();
    const channel = supabase
      .channel("orb-setup-states")
      .on("postgres_changes", { event: "*", schema: "public", table: "orb_setup_states" }, () => {
        loadData();
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


  const openSetup = async (setupId: string) => {
    setExpandedId((prev) => (prev === setupId ? null : setupId));
    if (!historyBySetup[setupId]) {
      const res = await fetch(`/api/orb/history/${setupId}`, { cache: "no-store" });
      const data = await res.json();
      setHistoryBySetup((prev) => ({ ...prev, [setupId]: { trades: data.trades || [], signals: data.signals || [], backtest: data.backtest || [] } }));
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen p-4"
      style={{ background: "#0a0a0c", color: "#f0f0f0", fontFamily: "'Inter', system-ui, sans-serif", overscrollBehavior: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center transition-all"
          style={{
            height: refreshing ? 50 : pullDistance,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            className={refreshing ? "animate-spin" : ""}
            style={{
              width: 24,
              height: 24,
              border: "2px solid rgba(255,255,255,0.15)",
              borderTopColor: pullDistance > 50 || refreshing ? "#22c55e" : "rgba(255,255,255,0.4)",
              borderRadius: "50%",
              opacity: Math.min(pullDistance / 50, 1),
            }}
          />
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 1000px; } }
        @media (max-width: 639px) {
          .orb-body-copy { font-size: 12px !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        <div className="mb-6" style={{ animation: "fadeIn .4s ease" }}>
          <div className="flex items-center gap-2 mb-1">
            {!isDesktop && (
              <a href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </a>
            )}
            <h1 style={{ fontSize: desktopFont(30), fontWeight: 800, letterSpacing: "-0.03em", background: "linear-gradient(135deg,#f0f0f0 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🔮 Orb</h1>
            <span className="ml-auto" style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace" }}>LIVE SIGNAL TRACKER</span>
          </div>
          <p style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>11 buy setups + 6 avoid signals • TSLA</p>
        </div>

        {/* Orb Score Widget */}
        {orbScore && (() => {
          const zoneConfig: Record<string, { emoji: string; label: string; hex: string; action: string; statsLine: string; description: string; whatToWatch: string }> = {
            FULL_SEND: {
              emoji: "🟢", label: "FULL SEND", hex: "#22c55e",
              action: "Deploy leveraged positions.",
              statsLine: "+6.22% avg at 20d \u00b7 66% win \u00b7 15% of trading days",
              description: "Multiple bullish signals are firing simultaneously and nothing is warning. Momentum, trend structure, and positioning are all aligned. These are the strongest conditions TSLA produces. The top 10% of FULL SEND outcomes exceed +30% at 20 days.",
              whatToWatch: "When buy signals deactivate and the score drops to NEUTRAL, don't panic. FULL SEND \u2192 NEUTRAL transitions still average +5.65% over 20 days. The rally doesn't end the moment the score changes.",
            },
            NEUTRAL: {
              emoji: "\u26aa", label: "NEUTRAL", hex: "#d4d4d8",
              action: "Hold. Don't add, don't trim.",
              statsLine: "+4.22% avg at 20d \u00b7 52% win \u00b7 51% of trading days",
              description: "Normal TSLA. No strong signals in either direction. The trend may be intact but nothing is compelling enough to justify adding risk or reducing it. The long-term drift works in your favor here.",
              whatToWatch: "NEUTRAL \u2192 FULL SEND transitions (+5.15% avg at 20d) are your signal to start deploying. NEUTRAL \u2192 CAUTION transitions (-0.51% avg at 20d) are your signal to start tightening.",
            },
            CAUTION: {
              emoji: "🟡", label: "CAUTION", hex: "#eab308",
              action: "Take profits on leveraged. Don't add.",
              statsLine: "-1.24% avg at 20d \u00b7 41% win \u00b7 24% of trading days",
              description: "Warning signals are active. The trend is showing stress -- the kind of deterioration that historically leads to below-average or negative outcomes. A -1.24% avg on stock translates to roughly -2.5% to -4% on 2x ETFs and worse on near-term options.",
              whatToWatch: "CAUTION \u2192 DEFENSIVE transitions are the worst (-5.27% avg at 20d). If the score keeps dropping, get out. CAUTION \u2192 NEUTRAL means the warning passed.",
            },
            DEFENSIVE: {
              emoji: "🔴", label: "DEFENSIVE", hex: "#ef4444",
              action: "Cash. No leveraged exposure. Wait.",
              statsLine: "-1.84% avg at 20d \u00b7 43% win \u00b7 10% of trading days",
              description: "Multiple warning signals are firing. The trend is broken or breaking. These periods produce the corrections TSLA is famous for. The -6.73% avg at 60 days means this isn't a quick dip -- it's structural deterioration.",
              whatToWatch: "Do NOT re-enter when the score ticks up to CAUTION (still -4.75% at 20d). Wait for DEFENSIVE \u2192 NEUTRAL (+3.94% avg at 20d). That's the real 'worst is over' signal.",
            },
          };
          const zc = zoneConfig[orbScore.zone] || zoneConfig.NEUTRAL;
          const activeSetups = rows.filter(r => r.state?.status === "active");
          const watchingSetups = rows.filter(r => r.state?.status === "watching");
          return (<>
            {/* Main Score Widget */}
            <button
              onClick={() => setScoreExpanded(!scoreExpanded)}
              className="w-full text-left mb-2"
              style={{
                background: `linear-gradient(135deg, ${zc.hex}06, ${zc.hex}12)`,
                border: `1px solid ${zc.hex}25`,
                borderRadius: 14,
                padding: isDesktop ? "20px 24px" : "16px 18px",
                animation: "fadeIn .4s ease",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: desktopFont(10), letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>ORB SCORE</div>
              <div className="flex items-center justify-between gap-4">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: desktopFont(26), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: zc.hex, lineHeight: 1, marginBottom: 6 }}>
                    {zc.emoji} {zc.label}
                  </div>
                  <div style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', system-ui", lineHeight: 1.4 }}>{zc.action}</div>
                  <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>{zc.statsLine}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: desktopFont(24), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: zc.hex, lineHeight: 1 }}>
                    {orbScore.value >= 0 ? "+" : ""}{orbScore.value.toFixed(2)}
                  </div>
                  <div style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>
                    {orbScore.date}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6, transform: scoreExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s ease" }}>&#x25BE; details</div>
                </div>
              </div>
            </button>

            {/* Zone Detail Drawer */}
            {scoreExpanded && (
              <div style={{
                background: `rgba(255,255,255,0.02)`,
                border: `1px solid ${zc.hex}15`,
                borderRadius: 12,
                padding: isDesktop ? "18px 22px" : "14px 16px",
                marginBottom: 8,
                animation: "slideDown .25s ease",
              }}>
                <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>WHAT IT MEANS</p>
                <p style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>{zc.description}</p>
                
                <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>WHAT TO WATCH FOR</p>
                <p style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>{zc.whatToWatch}</p>

                {activeSetups.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>ACTIVE SIGNALS ({activeSetups.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSetups.map(s => (
                        <span key={s.id} style={{ fontSize: desktopFont(10), padding: "3px 8px", borderRadius: 6, background: s.type === "buy" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${s.type === "buy" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: s.type === "buy" ? "#22c55e" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
                          {s.public_name || s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {watchingSetups.length > 0 && (
                  <div>
                    <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>WATCHING ({watchingSetups.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {watchingSetups.map(s => (
                        <span key={s.id} style={{ fontSize: desktopFont(10), padding: "3px 8px", borderRadius: 6, background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)", color: "rgba(234,179,8,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {s.public_name || s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <a href="/learn/orb-score" style={{ display: "inline-block", marginTop: 14, fontSize: desktopFont(11), color: zc.hex, fontFamily: "'JetBrains Mono', monospace", textDecoration: "none", opacity: 0.7 }}>
                  Full analysis &rarr;
                </a>
              </div>
            )}

            {/* Zone Summary Table — always visible */}
            <div className="mb-4" style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 10,
              padding: isDesktop ? "12px 16px" : "10px 12px",
              animation: "fadeIn .5s ease",
            }}>
              {([
                { zone: "FULL_SEND", emoji: "🟢", label: "FULL SEND", ret: "+6.22%", win: "66%", days: "15%", hex: "#22c55e" },
                { zone: "NEUTRAL", emoji: "\u26aa", label: "NEUTRAL", ret: "+4.22%", win: "52%", days: "51%", hex: "#d4d4d8" },
                { zone: "CAUTION", emoji: "🟡", label: "CAUTION", ret: "-1.24%", win: "41%", days: "24%", hex: "#eab308" },
                { zone: "DEFENSIVE", emoji: "🔴", label: "DEFENSIVE", ret: "-1.84%", win: "43%", days: "10%", hex: "#ef4444" },
              ] as const).map((z, i) => {
                const isCurrentZone = orbScore.zone === z.zone;
                return (
                  <div key={z.zone} className="flex items-center" style={{
                    padding: isDesktop ? "8px 6px" : "6px 4px",
                    borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: isCurrentZone ? `${z.hex}08` : "transparent",
                    borderRadius: isCurrentZone ? 6 : 0,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: desktopFont(11), fontWeight: isCurrentZone ? 700 : 500, color: isCurrentZone ? z.hex : "rgba(255,255,255,0.45)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {z.emoji} {z.label} {isCurrentZone && "\u25C0"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: isDesktop ? 20 : 12, flexShrink: 0 }}>
                      <span style={{ fontSize: desktopFont(10), color: z.ret.startsWith("+") ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, minWidth: 50, textAlign: "right" }}>{z.ret}</span>
                      <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", minWidth: 28, textAlign: "right" }}>{z.win}</span>
                      <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace", minWidth: 28, textAlign: "right" }}>{z.days}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-end gap-2" style={{ padding: "4px 4px 0", opacity: 0.3 }}>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.4)" }}>20d avg</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.4)", minWidth: 28, textAlign: "right" }}>win%</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.4)", minWidth: 28, textAlign: "right" }}>freq</span>
              </div>
            </div>
          </>);
        })()}

        <div className="mb-4 flex flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 4, gap: 6 }}>

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
                flex: "1 1 160px",
                border: "none",
                borderRadius: 8,
                padding: "10px 12px",
                minHeight: 44,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: isDesktop ? desktopFont(11) : 10,
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

        <div className={isDesktop ? "space-y-3" : "space-y-2"}>
          {filtered.map((row, index) => {
            const status = row.state?.status || "inactive";
            const sc = statusConfig[status];
            const expanded = expandedId === row.id;
            const isActive = status === "active";
            const history = historyBySetup[row.id];
            const openTrade = history?.trades.find((t) => t.status === "open") || null;
            const collapsedEntryPrice = row.state?.entry_price;
            const collapsedEntryDate = row.state?.active_since || row.state?.entry_date;
            const collapsedActivationLine =
              isActive && collapsedEntryDate
                ? formatActivationLine({
                    date: collapsedEntryDate,
                    price: collapsedEntryPrice,
                    prefix: "Triggered",
                  })
                : null;

            const badge = (() => {
              if (status === "active") {
                if (row.stance === "offensive") {
                  return { label: "💣 ACTIVE - FIRE THE CANNONS", dot: "bg-emerald-500", text: "text-emerald-300", bg: "bg-emerald-500/15", border: "border border-emerald-500/35" };
                }
                return { label: "🛡️ ACTIVE - RETREAT", dot: "bg-red-500", text: "text-red-300", bg: "bg-red-500/15", border: "border border-red-500/35" };
              }

              if (status === "watching") {
                return { label: "WATCHING", dot: "bg-amber-500", text: "text-amber-300", bg: "bg-amber-500/15", border: "border border-amber-500/35" };
              }

              return { label: "INACTIVE", dot: "bg-zinc-500", text: "text-zinc-400", bg: "bg-zinc-500/10", border: "border border-zinc-600/35" };
            })();

            return (
              <div
                key={row.id}
                className={`rounded-xl border overflow-hidden transition-all duration-300 ${expanded ? sc.glow : isActive ? "ring-1 ring-opacity-40" : ""}`}
                style={{
                  borderColor: isActive ? (row.stance === "offensive" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)") : expanded ? sc.color : "rgba(255,255,255,0.06)",
                  background: isActive ? (row.stance === "offensive" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)") : expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                  boxShadow: isActive ? (row.stance === "offensive" ? "0 0 20px rgba(16,185,129,0.15), 0 0 40px rgba(16,185,129,0.05)" : "0 0 20px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.05)") : "none",
                  animation: `fadeIn .4s ease ${index * 0.08}s both`,
                }}
              >
                <button onClick={() => openSetup(row.id)} className="w-full text-left transition-colors" style={{ background: "transparent", padding: isDesktop ? "28px 30px" : "14px 16px" }} >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} ${badge.border}`} style={{ fontSize: desktopFont(10), fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${isActive ? "animate-pulse" : ""}`} />
                          {badge.label}
                        </span>
                        <span style={{ fontSize: desktopFont(9), letterSpacing: "0.08em", color: row.type === "buy" ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{row.type.toUpperCase()} #{row.number}</span>
                      </div>

                      <h3 style={{ fontSize: desktopFont(18), fontWeight: 700, letterSpacing: "-0.01em" }}>{row.public_name || row.name}</h3>
                      <p className="orb-body-copy" style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{row.one_liner || "No tagline available."}</p>
                      {status === "watching" && row.state?.conditions_met && (() => {
                        const conds = row.state.conditions_met as Record<string, boolean>;
                        const total = Object.keys(conds).length;
                        const met = Object.values(conds).filter(Boolean).length;
                        return total > 0 ? (
                          <p style={{ fontSize: desktopFont(11), color: "rgba(234,179,8,0.7)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>👁 {met}/{total} conditions met</p>
                        ) : null;
                      })()}
                      {status === "inactive" && row.state?.conditions_met && (() => {
                        const conds = row.state.conditions_met as Record<string, boolean>;
                        const total = Object.keys(conds).length;
                        const met = Object.values(conds).filter(Boolean).length;
                        return total > 0 ? (
                          <p style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.25)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{met}/{total} conditions met</p>
                        ) : null;
                      })()}
                      {collapsedActivationLine && (
                        <div
                          style={{
                            fontSize: isDesktop ? desktopFont(12) : 11,
                            marginTop: 6,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 700,
                            color: row.type === "buy" ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {collapsedActivationLine}
                        </div>
                      )}

                      {!!row.category_tags?.length && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {row.category_tags.map((tag) => (
                            <span key={tag} style={{ fontSize: desktopFont(10), borderRadius: 999, padding: isDesktop ? "4px 10px" : "2px 8px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
                      <div className="text-center">
                        {row.framework === "gauge-to-target" ? (<>
                          <div className="hidden sm:block"><HitRateRing pctPos={row.stance === "defensive" ? 75 : 68} size={52} /></div>
                          <div className="sm:hidden" style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}>{row.stance === "defensive" ? "75" : "68"}%</div>
                          <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>GAUGE HIT</div>
                        </>) : (<>
                          {(() => { const bt = bestTimeframe(row); return (<>
                          <div className="hidden sm:block"><HitRateRing pctPos={bt.win} size={52} /></div>
                          <div className="sm:hidden" style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: bt.win >= 65 ? "#22c55e" : bt.win >= 50 ? "#eab308" : "#ef4444" }}>{Math.round(bt.win)}%</div>
                          <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{bt.label} HIT</div>
                          </>); })()}
                        </>)}
                      </div>
                      <div className="text-right">
                        {row.framework === "gauge-to-target" ? (<>
                          <div className="text-[18px] sm:text-[28px]" style={{ lineHeight: 1, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: (row.gauge_median_return || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                            {(row.gauge_median_return || 0) >= 0 ? "+" : ""}{(row.gauge_median_return || 0).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>MEDIAN</div>
                        </>) : (<>
                          {(() => { const bt = bestTimeframe(row); return (<>
                          <div className="text-[18px] sm:text-[28px]" style={{ lineHeight: 1, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: bt.avg >= 0 ? "#22c55e" : "#ef4444" }}>
                            {bt.avg >= 0 ? "+" : ""}{bt.avg.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>AVG {bt.label}</div>
                          </>); })()}
                        </>)}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.35)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s ease" }}>▾</div>
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: isDesktop ? "18px 24px 22px" : "14px 16px 16px", animation: "slideDown .25s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isDesktop ? 10 : 6 }}>
                      <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>WHY IT MATTERS</p>
                      {row._admin && row.description && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setAdminDescToggle(prev => ({ ...prev, [row.id]: !prev[row.id] })); }}
                          style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(139,92,246,0.3)", background: adminDescToggle[row.id] ? "rgba(139,92,246,0.2)" : "transparent", color: "rgba(139,92,246,0.7)", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", letterSpacing: "0.05em" }}
                        >
                          {adminDescToggle[row.id] ? "🔒 FULL" : "PUBLIC"}
                        </button>
                      )}
                    </div>
                    {(adminDescToggle[row.id] && row._admin && row.description)
                      ? <p className="orb-body-copy" style={{ fontSize: desktopFont(13), color: "rgba(139,92,246,0.6)", lineHeight: 1.6, marginBottom: isDesktop ? 16 : 12 }}>{row.description}</p>
                      : row.public_description && <p className="orb-body-copy" style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.52)", lineHeight: 1.6, marginBottom: isDesktop ? 16 : 12 }}>{row.public_description}</p>
                    }

                    {isActive && <ActiveTradeCard row={row} trade={openTrade} />}

                    {row.backtest_n && row.framework !== "gauge-to-target" && (
                      <div className={isDesktop ? "mt-4" : "mt-3"}>
                        <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: isDesktop ? 10 : 8, fontFamily: "'JetBrains Mono', monospace" }}>FORWARD RETURNS · N={row.backtest_n}</p>
                        <div className={isDesktop ? "space-y-3" : "space-y-2"}>
                          {[
                            { k: "5D", avg: row.backtest_avg_return_5d, win: row.backtest_win_rate_5d },
                            { k: "10D", avg: row.backtest_avg_return_10d, win: row.backtest_win_rate_10d },
                            { k: "20D", avg: row.backtest_avg_return_20d, win: row.backtest_win_rate_20d },
                            { k: "60D", avg: row.backtest_avg_return_60d, win: row.backtest_win_rate_60d },
                          ].filter((h) => h.avg != null).map((h) => (
                            <div key={h.k} style={{ display: "flex", alignItems: "center", gap: isDesktop ? 10 : 6, overflow: "hidden" }}>
                              <div style={{ width: isDesktop ? 34 : 28, fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                {h.k}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <ReturnBar label={h.k} value={h.avg} isDesktop={isDesktop} showLabel={false} />
                              </div>
                              <div style={{ flexShrink: 0, minWidth: isDesktop ? 42 : 34, textAlign: "right" }}>
                                <div style={{ fontSize: isDesktop ? 11 : 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: (h.win ?? 0) >= 65 ? "#22c55e" : (h.win ?? 0) >= 50 ? "#eab308" : "#ef4444", lineHeight: 1 }}>
                                  {Math.round(h.win ?? 0)}%
                                </div>
                                <div style={{ fontSize: isDesktop ? 8 : 7, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginTop: 2 }}>WIN</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {row.framework === "gauge-to-target" && row.gauge_median_days && (
                      <div className={isDesktop ? "mt-4" : "mt-3"}>
                        <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: isDesktop ? 10 : 8, fontFamily: "'JetBrains Mono', monospace" }}>GAUGE-TO-TARGET · N={row.backtest_n}</p>
                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: isDesktop ? 20 : 14 }}>
                          <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12 }}>
                            🎯 {row.id === "smi-oversold-gauge" ? "Tracks momentum recovery from oversold to neutral" : "Tracks momentum reset from overbought to oversold"}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: isDesktop ? 14 : 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>MEDIAN DAYS TO TARGET</div>
                              <div style={{ fontSize: desktopFont(24), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#fff" }}>{row.gauge_median_days}</div>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: isDesktop ? 14 : 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>MEDIAN RETURN</div>
                              <div style={{ fontSize: desktopFont(24), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: (row.gauge_median_return || 0) >= 0 ? "#22c55e" : "#ef4444" }}>{(row.gauge_median_return || 0) >= 0 ? "+" : ""}{row.gauge_median_return}%</div>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: isDesktop ? 14 : 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>WIN RATE</div>
                              <div style={{ fontSize: desktopFont(24), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: row.id === "smi-overbought" ? "#ef4444" : "#22c55e" }}>{row.id === "smi-overbought" ? "75" : "68"}%</div>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: isDesktop ? 14 : 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                              <div style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>TARGET HIT RATE</div>
                              <div style={{ fontSize: desktopFont(24), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}>{row.id === "smi-overbought" ? "100" : "95"}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {row.livePerformance && row.livePerformance.total >= 3 && (
                      <div className={isDesktop ? "mt-4" : "mt-3"}>
                        <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: isDesktop ? 10 : 8, fontFamily: "'JetBrains Mono', monospace" }}>LIVE VS BACKTEST</p>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">Metric</div><div className="text-zinc-400">Win Rate</div><div className="text-zinc-400">Avg Return</div></div>
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">Backtest</div><div className="text-zinc-300 font-mono">{row.backtest_win_rate_20d}%</div><div className="text-zinc-300 font-mono">{row.backtest_avg_return_20d}%</div></div>
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">Live</div><div className="text-white font-mono font-bold">{(row.livePerformance.wins / row.livePerformance.total * 100).toFixed(1)}%</div><div className="text-white font-mono font-bold">{row.livePerformance.avgReturn.toFixed(1)}%</div></div>
                          <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center"><div className="text-zinc-500">N</div><div className="text-zinc-400">{row.backtest_n}</div><div className="text-zinc-400">{row.livePerformance.total}</div></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: isDesktop ? 10 : 8, fontFamily: "'JetBrains Mono', monospace" }}>RECENT INSTANCES</p>
                      {history?.signals?.filter((s: any) => s?.event_type === "activated").length || history?.backtest?.length ? (
                        <div className="space-y-1">
                          {history?.signals?.filter((s: any) => s?.event_type === "activated" && [s?.ret_5d, s?.ret_10d, s?.ret_20d].some((v: any) => v != null)).slice(0, 5).map((signal: any, i: number) => {
                            const isLive = false;
                            const r5 = signal?.ret_5d ?? signal?.return_5d ?? signal?.forward_5d;
                            const r10 = signal?.ret_10d ?? signal?.return_10d ?? signal?.forward_10d;
                            const r20 = signal?.ret_20d ?? signal?.return_20d ?? signal?.forward_20d;
                            const r60 = signal?.ret_60d ?? signal?.return_60d ?? signal?.forward_60d;
                            return (
                              <div
                                key={signal?.id || `${row.id}-signal-${i}`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: isDesktop ? "8px 10px" : "6px 8px",
                                  borderRadius: 6,
                                  background: isLive ? "rgba(34,197,94,0.06)" : "transparent",
                                  border: isLive ? "1px solid rgba(34,197,94,0.15)" : "1px solid transparent",
                                }}
                              >
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: modeColor(signal?.mode), flexShrink: 0 }} />
                                <div style={{ fontSize: isDesktop ? desktopFont(11) : 10, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                  {formatSignalDate(signal?.event_date || signal?.signal_date || signal?.date || signal?.created_at)}
                                </div>
                                <div style={{ fontSize: isDesktop ? desktopFont(11) : 10, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                  {signal?.event_price != null ? `$${Number(signal.event_price).toFixed(0)}` : signal?.price != null ? `$${Number(signal.price).toFixed(0)}` : signal?.signal_price != null ? `$${Number(signal.signal_price).toFixed(0)}` : "—"}
                                </div>
                                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: isDesktop ? 12 : 6 }}>
                                  {[
                                    { label: "5D", val: r5 },
                                    { label: "10D", val: r10 },
                                    { label: "20D", val: r20 },
                                    { label: "60D", val: r60 },
                                  ].map((col) => {
                                    const c = Number(col.val);
                                    return (
                                      <div key={col.label} style={{ textAlign: "right", minWidth: isDesktop ? 40 : 28 }}>
                                        <div style={{ fontSize: isDesktop ? desktopFont(9) : 8, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>{col.label}</div>
                                        <div
                                          style={{
                                            fontSize: isDesktop ? desktopFont(11) : 9,
                                            fontWeight: 600,
                                            fontFamily: "'JetBrains Mono', monospace",
                                            color: isLive ? "rgba(255,255,255,0.35)" : Number.isFinite(c) ? (c >= 0 ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.35)",
                                          }}
                                        >
                                          {isLive ? "⟳" : formatPct(col.val)}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {history?.backtest?.filter((inst: any) => inst.ret_60d != null).slice(0, 10).map((inst: any, i: number) => (
                            <div
                              key={inst.id || `${row.id}-backtest-${i}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: isDesktop ? "8px 10px" : "6px 8px",
                                borderRadius: 6,
                                background: "transparent",
                                border: "1px solid transparent",
                              }}
                            >
                              <div style={{ fontSize: isDesktop ? desktopFont(11) : 10, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                {formatSignalDate(inst.signal_date)}
                              </div>
                              <div style={{ fontSize: isDesktop ? desktopFont(11) : 10, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                ${Number(inst.signal_price).toFixed(0)}
                              </div>
                              <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: isDesktop ? 12 : 6 }}>
                                {[
                                  { label: "5D", val: inst.ret_5d },
                                  { label: "10D", val: inst.ret_10d },
                                  { label: "20D", val: inst.ret_20d },
                                  { label: "60D", val: inst.ret_60d },
                                ].map((col) => {
                                  const c = Number(col.val);
                                  return (
                                    <div key={col.label} style={{ textAlign: "right", minWidth: isDesktop ? 40 : 28 }}>
                                      <div style={{ fontSize: isDesktop ? desktopFont(9) : 8, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace" }}>{col.label}</div>
                                      <div
                                        style={{
                                          fontSize: isDesktop ? desktopFont(11) : 9,
                                          fontWeight: 600,
                                          fontFamily: "'JetBrains Mono', monospace",
                                          color: col.val != null ? (c >= 0 ? "#22c55e" : "#ef4444") : "rgba(255,255,255,0.2)",
                                        }}
                                      >
                                        {col.val != null ? `${c >= 0 ? "+" : ""}${c.toFixed(1)}%` : "—"}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="orb-body-copy" style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>
                          Instances will appear here as signals activate. The Orb is freshly deployed -- check back soon.
                        </p>
                      )}
                    </div>

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

        <div className="mt-6 pt-4 border-t border-zinc-800/50" style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
          <p>Data: TSLA daily bars | BX-Trender computed from OHLCV | SMI: 10/3/3</p>
          <p className="mt-1">Past performance does not guarantee future results. All statistics are from backtesting.</p>
        </div>
      </div>
    </div>
  );
}
