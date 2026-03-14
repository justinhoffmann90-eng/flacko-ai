"use client";

import { bestTimeframe, formatActivationLine, formatPct, formatSignalDate, modeColor } from "./setup-utils";
import type { OrbRow, SetupHistory, Trade } from "./types";

const statusConfig: Record<string, { color: string; glow: string }> = {
  active: { color: "#22c55e", glow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]" },
  watching: { color: "#eab308", glow: "" },
  inactive: { color: "#6b7280", glow: "" },
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

function ActiveTradeCard({ row, trade, livePrice }: { row: OrbRow; trade: Trade | null; livePrice: number | null }) {
  if (!trade) return null;
  const isGauge = row.framework === "gauge-to-target";
  const hasLiveReturn = livePrice != null && Number.isFinite(trade.entry_price) && trade.entry_price > 0;
  const displayReturn = hasLiveReturn ? ((livePrice - trade.entry_price) / trade.entry_price) * 100 : trade.current_return_pct;
  const gaugeEntry = row.state?.gauge_entry_value;
  const gaugeCurrent = row.state?.gauge_current_value;
  const gaugeTarget = row.state?.gauge_target_value;
  const gaugeProgressPct =
    gaugeEntry != null && gaugeCurrent != null && gaugeTarget != null && gaugeTarget !== gaugeEntry
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
          color: displayReturn >= 0 ? "#22c55e" : "#ef4444",
          marginBottom: 4,
        }}
      >
        Current Return: {displayReturn >= 0 ? "+" : ""}
        {displayReturn.toFixed(2)}%
      </div>
      <div style={{ fontSize: 12, color: "#a1a1aa", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
        TSLA: {livePrice != null ? `$${livePrice.toFixed(2)}` : "—"}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div className="text-zinc-500">Day</div>
        <div className="text-white font-mono">
          {trade.days_active}
          {row.gauge_median_days ? ` of ~${row.gauge_median_days} median` : ""}
        </div>
        <div className="text-zinc-500">Max Up</div>
        <div className="text-emerald-400 font-mono">+{(trade.max_return_pct || 0).toFixed(2)}%</div>
        <div className="text-zinc-500">Max Down</div>
        <div className="text-red-400 font-mono">{(trade.max_drawdown_pct || 0).toFixed(2)}%</div>
      </div>
      {isGauge && gaugeCurrent != null && (
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500">SMI Progress</span>
            <span className="text-amber-400 font-mono">{gaugeProgressPct}% to target</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(0, Math.min(100, Number(gaugeProgressPct || 0)))}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
            <span>Entry SMI: {gaugeEntry?.toFixed(1)}</span>
            <span>Current: {gaugeCurrent?.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

type SetupCardProps = {
  row: OrbRow;
  index: number;
  expanded: boolean;
  onToggle: (setupId: string, nextExpanded: boolean) => void;
  history?: SetupHistory;
  isDesktop: boolean;
  desktopFont: (mobilePx: number) => number;
  livePrice: number | null;
  trackingTrade?: Trade;
};

export function SetupCard({ row, index, expanded, onToggle, history, isDesktop, desktopFont, livePrice, trackingTrade }: SetupCardProps) {
  const status = row.state?.status || "inactive";
  const sc = statusConfig[status] || statusConfig.inactive;
  const isActive = status === "active";
  const isTracking = !!trackingTrade;
  const openTrade = history?.trades.find((trade) => trade.status === "open") || null;

  const collapsedEntryPrice = isTracking ? trackingTrade.entry_price : row.state?.entry_price;
  const collapsedEntryDate = isTracking ? trackingTrade.entry_date : row.state?.active_since || row.state?.entry_date;
  const collapsedActivationLine =
    (isActive || isTracking) && collapsedEntryDate
      ? formatActivationLine({
          date: collapsedEntryDate,
          price: collapsedEntryPrice,
          prefix: "Triggered",
        })
      : null;
  const collapsedEntry = Number(collapsedEntryPrice);
  const collapsedLiveReturn =
    livePrice != null && Number.isFinite(collapsedEntry) && collapsedEntry > 0
      ? ((livePrice - collapsedEntry) / collapsedEntry) * 100
      : isTracking
      ? trackingTrade.current_return_pct
      : null;

  const badge = (() => {
    if (isTracking) {
      return {
        label: `TRACKING · Day ${trackingTrade.days_active}`,
        dot: "bg-purple-500",
        text: "text-purple-300",
        bg: "bg-purple-500/15",
        border: "border border-purple-500/35",
      };
    }

    if (status === "active") {
      if (row.stance === "offensive") {
        return {
          label: "ACTIVE",
          dot: "bg-emerald-500",
          text: "text-emerald-300",
          bg: "bg-emerald-500/15",
          border: "border border-emerald-500/35",
        };
      }

      return {
        label: "🛡️ ACTIVE - RETREAT",
        dot: "bg-red-500",
        text: "text-red-300",
        bg: "bg-red-500/15",
        border: "border border-red-500/35",
      };
    }

    if (status === "watching") {
      return {
        label: "WATCHING",
        dot: "bg-amber-500",
        text: "text-amber-300",
        bg: "bg-amber-500/15",
        border: "border border-amber-500/35",
      };
    }

    return {
      label: "INACTIVE",
      dot: "bg-zinc-500",
      text: "text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "border border-zinc-600/35",
    };
  })();

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-300 ${expanded ? sc.glow : isActive || isTracking ? "ring-1 ring-opacity-40" : ""}`}
      style={{
        borderColor: isTracking
          ? "rgba(168,85,247,0.4)"
          : isActive
          ? row.stance === "offensive"
            ? "rgba(16,185,129,0.4)"
            : "rgba(239,68,68,0.4)"
          : expanded
          ? sc.color
          : "rgba(255,255,255,0.06)",
        background: isTracking
          ? "rgba(168,85,247,0.06)"
          : isActive
          ? row.stance === "offensive"
            ? "rgba(16,185,129,0.06)"
            : "rgba(239,68,68,0.06)"
          : expanded
          ? "rgba(255,255,255,0.04)"
          : "rgba(255,255,255,0.02)",
        boxShadow: isTracking
          ? "0 0 20px rgba(168,85,247,0.15), 0 0 40px rgba(168,85,247,0.05)"
          : isActive
          ? row.stance === "offensive"
            ? "0 0 20px rgba(16,185,129,0.15), 0 0 40px rgba(16,185,129,0.05)"
            : "0 0 20px rgba(239,68,68,0.15), 0 0 40px rgba(239,68,68,0.05)"
          : "none",
        animation: `fadeIn .4s ease ${index * 0.08}s both`,
      }}
    >
      <button
        onClick={() => onToggle(row.id, !expanded)}
        className="w-full text-left transition-colors"
        style={{ background: "transparent", padding: isDesktop ? "28px 30px" : "14px 16px" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} ${badge.border}`} style={{ fontSize: desktopFont(10), fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", fontWeight: 700 }}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} ${isActive || isTracking ? "animate-pulse" : ""}`} />
                {badge.label}
              </span>
              <span style={{ fontSize: desktopFont(9), letterSpacing: "0.08em", color: row.type === "buy" ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                {row.type.toUpperCase()} #{row.number}
              </span>
            </div>

            <h3 style={{ fontSize: desktopFont(18), fontWeight: 700, letterSpacing: "-0.01em" }}>{row.public_name || row.name}</h3>
            <p className="orb-body-copy" style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.42)", marginTop: 2 }}>
              {row.one_liner || "No tagline available."}
            </p>

            {status === "watching" && row.state?.conditions_met &&
              (() => {
                const conds = row.state.conditions_met as Record<string, boolean>;
                const total = Object.keys(conds).length;
                const met = Object.values(conds).filter(Boolean).length;
                return total > 0 ? (
                  <p style={{ fontSize: desktopFont(11), color: "rgba(234,179,8,0.7)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>👁 {met}/{total} conditions met</p>
                ) : null;
              })()}

            {status === "inactive" && row.state?.conditions_met &&
              (() => {
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
                {collapsedLiveReturn !== null && (
                  <span style={{ fontSize: desktopFont(11), fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: collapsedLiveReturn >= 0 ? "#22c55e" : "#ef4444", marginLeft: 8 }}>
                    {collapsedLiveReturn >= 0 ? "+" : ""}
                    {collapsedLiveReturn.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
            <div className="text-center">
              {row.framework === "gauge-to-target" ? (
                <>
                  <div className="hidden sm:block">
                    <HitRateRing pctPos={row.stance === "defensive" ? 75 : 68} size={52} />
                  </div>
                  <div className="sm:hidden" style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}>
                    {row.stance === "defensive" ? "75" : "68"}%
                  </div>
                  <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>GAUGE HIT</div>
                </>
              ) : (
                (() => {
                  const bt = bestTimeframe(row);
                  return (
                    <>
                      <div className="hidden sm:block">
                        <HitRateRing pctPos={bt.win} size={52} />
                      </div>
                      <div className="sm:hidden" style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: bt.win >= 65 ? "#22c55e" : bt.win >= 50 ? "#eab308" : "#ef4444" }}>
                        {Math.round(bt.win)}%
                      </div>
                      <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{bt.label} HIT</div>
                    </>
                  );
                })()
              )}
            </div>

            <div className="text-right">
              {row.framework === "gauge-to-target" ? (
                <>
                  <div className="text-[18px] sm:text-[28px]" style={{ lineHeight: 1, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: (row.gauge_median_return || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                    {(row.gauge_median_return || 0) >= 0 ? "+" : ""}
                    {(row.gauge_median_return || 0).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>MEDIAN</div>
                </>
              ) : (
                (() => {
                  const bt = bestTimeframe(row);
                  return (
                    <>
                      <div className="text-[18px] sm:text-[28px]" style={{ lineHeight: 1, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: bt.avg >= 0 ? "#22c55e" : "#ef4444" }}>
                        {bt.avg >= 0 ? "+" : ""}
                        {bt.avg.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>AVG {bt.label}</div>
                    </>
                  );
                })()
              )}
            </div>

            <div style={{ color: "rgba(255,255,255,0.35)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s ease" }}>▾</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: isDesktop ? "18px 24px 22px" : "14px 16px 16px", animation: "slideDown .25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isDesktop ? 10 : 6 }}>
            <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>WHY IT MATTERS</p>
          </div>

          {row.conditions && Array.isArray(row.conditions) && row.conditions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: isDesktop ? 12 : 8 }}>
              <span style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginRight: 4, alignSelf: "center" }}>INDICATORS:</span>
              {row.conditions.map((condition: string, idx: number) => (
                <span key={`${row.id}-condition-${idx}`} style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 8px", fontFamily: "'JetBrains Mono', monospace" }}>
                  {condition}
                </span>
              ))}
            </div>
          )}

          {(row.description || row.public_description) && (
            <p className="orb-body-copy" style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.52)", lineHeight: 1.6, marginBottom: isDesktop ? 16 : 12 }}>
              {row.description || row.public_description}
            </p>
          )}

          {(isActive || isTracking) && <ActiveTradeCard row={row} trade={isTracking ? trackingTrade || null : openTrade} livePrice={livePrice} />}

          {row.backtest_n && row.framework !== "gauge-to-target" && (
            <div className={isDesktop ? "mt-4" : "mt-3"}>
              <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: isDesktop ? 10 : 8, fontFamily: "'JetBrains Mono', monospace" }}>FORWARD RETURNS · N={row.backtest_n}</p>
              <div className={isDesktop ? "space-y-3" : "space-y-2"}>
                {[
                  { k: "5D", avg: row.backtest_avg_return_5d, win: row.backtest_win_rate_5d },
                  { k: "10D", avg: row.backtest_avg_return_10d, win: row.backtest_win_rate_10d },
                  { k: "20D", avg: row.backtest_avg_return_20d, win: row.backtest_win_rate_20d },
                  { k: "60D", avg: row.backtest_avg_return_60d, win: row.backtest_win_rate_60d },
                ]
                  .filter((horizon) => horizon.avg != null)
                  .map((horizon) => (
                    <div key={horizon.k} style={{ display: "flex", alignItems: "center", gap: isDesktop ? 10 : 6, overflow: "hidden" }}>
                      <div style={{ width: isDesktop ? 34 : 28, fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{horizon.k}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <ReturnBar label={horizon.k} value={horizon.avg} isDesktop={isDesktop} showLabel={false} />
                      </div>
                      <div style={{ flexShrink: 0, minWidth: isDesktop ? 42 : 34, textAlign: "right" }}>
                        <div style={{ fontSize: isDesktop ? 11 : 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: (horizon.win ?? 0) >= 65 ? "#22c55e" : (horizon.win ?? 0) >= 50 ? "#eab308" : "#ef4444", lineHeight: 1 }}>
                          {Math.round(horizon.win ?? 0)}%
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
                    <div style={{ fontSize: desktopFont(24), fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: (row.gauge_median_return || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                      {(row.gauge_median_return || 0) >= 0 ? "+" : ""}
                      {row.gauge_median_return}%
                    </div>
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
                <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center">
                  <div className="text-zinc-500">Metric</div>
                  <div className="text-zinc-400">Win Rate</div>
                  <div className="text-zinc-400">Avg Return</div>
                </div>
                <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center">
                  <div className="text-zinc-500">Backtest</div>
                  <div className="text-zinc-300 font-mono">{row.backtest_win_rate_20d}%</div>
                  <div className="text-zinc-300 font-mono">{row.backtest_avg_return_20d}%</div>
                </div>
                <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center">
                  <div className="text-zinc-500">Live</div>
                  <div className="text-white font-mono font-bold">{((row.livePerformance.wins / row.livePerformance.total) * 100).toFixed(1)}%</div>
                  <div className="text-white font-mono font-bold">{row.livePerformance.avgReturn.toFixed(1)}%</div>
                </div>
                <div className="p-2 bg-zinc-900/70 border border-white/5 rounded text-center">
                  <div className="text-zinc-500">N</div>
                  <div className="text-zinc-400">{row.backtest_n}</div>
                  <div className="text-zinc-400">{row.livePerformance.total}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3">
            <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", marginBottom: isDesktop ? 10 : 8, fontFamily: "'JetBrains Mono', monospace" }}>RECENT INSTANCES</p>
            {history?.signals?.filter((signal: any) => signal?.event_type === "activated").length || history?.backtest?.length ? (
              <div className="space-y-1">
                {history?.signals
                  ?.filter((signal: any) => signal?.event_type === "activated" && [signal?.ret_5d, signal?.ret_10d, signal?.ret_20d].some((value: any) => value != null))
                  .slice(0, 5)
                  .map((signal: any, signalIndex: number) => {
                    const isLive = false;
                    const r5 = signal?.ret_5d ?? signal?.return_5d ?? signal?.forward_5d;
                    const r10 = signal?.ret_10d ?? signal?.return_10d ?? signal?.forward_10d;
                    const r20 = signal?.ret_20d ?? signal?.return_20d ?? signal?.forward_20d;
                    const r60 = signal?.ret_60d ?? signal?.return_60d ?? signal?.forward_60d;

                    return (
                      <div
                        key={signal?.id || `${row.id}-signal-${signalIndex}`}
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
                          {signal?.event_price != null
                            ? `$${Number(signal.event_price).toFixed(0)}`
                            : signal?.price != null
                            ? `$${Number(signal.price).toFixed(0)}`
                            : signal?.signal_price != null
                            ? `$${Number(signal.signal_price).toFixed(0)}`
                            : "—"}
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

                {history?.backtest
                  ?.filter((instance: any) => [instance.ret_5d, instance.ret_10d, instance.ret_20d, instance.ret_60d].some((value: any) => value != null))
                  .slice(0, 10)
                  .map((instance: any, instanceIndex: number) => (
                    <div
                      key={instance.id || `${row.id}-backtest-${instanceIndex}`}
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
                      <div style={{ fontSize: isDesktop ? desktopFont(11) : 10, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{formatSignalDate(instance.signal_date)}</div>
                      <div style={{ fontSize: isDesktop ? desktopFont(11) : 10, color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>${Number(instance.signal_price).toFixed(0)}</div>
                      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: isDesktop ? 12 : 6 }}>
                        {[
                          { label: "5D", val: instance.ret_5d },
                          { label: "10D", val: instance.ret_10d },
                          { label: "20D", val: instance.ret_20d },
                          { label: "60D", val: instance.ret_60d },
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

          {row.state?.gauge_current_value != null && (
            <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>Entry: </span>
                  <span style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{row.state.gauge_entry_value}</span>
                </div>
                <div>
                  <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>Current: </span>
                  <span style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{row.state.gauge_current_value}</span>
                </div>
                <div>
                  <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono', monospace" }}>Target: </span>
                  <span style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{row.state.gauge_target_value}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

