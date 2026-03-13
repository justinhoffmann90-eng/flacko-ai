"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Setup {
  id: string;
  name: string;
  type: "buy" | "avoid";
  status: "backlog" | "testing" | "backtested" | "active" | "archived";
  one_liner?: string;
  hypothesis?: string;
  grade?: string;
  win_rate_20d?: number;
  sample_size?: number;
  tickers?: string[];
  forward_returns?: Record<string, number>;
  backtest_stats?: Record<string, SummaryPeriod>;
  conditions?: Record<string, unknown>;
  source?: string;
  notes?: string;
  last_triggered_at?: string;
  promoted_at?: string;
  created_at?: string;
  category_tags?: string[];
}

interface SetupState {
  setup_id: string;
  market_status: "active" | "watching" | "inactive";
  last_check?: string;
}

interface SummaryPeriod {
  n: number;
  wins: number;
  win_rate: number;
  win_rate_pct: string;
  avg_return: number;
  median_return: number;
  best: number;
  worst: number;
  avg_max_upside: number | null;
  avg_max_downside: number | null;
}

interface BacktestSignal {
  signal_date: string;
  signal_close: number;
  streak_len: number | string;
  completed: boolean;
  is_current?: boolean;
  is_active?: boolean;
}

interface BacktestTickerResult {
  scan?: string;
  ticker?: string;
  min_streak?: number;
  counts?: { total: number; completed: number; current: number; active_streak: number };
  signals?: BacktestSignal[];
  summary?: Record<string, SummaryPeriod>;
  // ad-hoc condition result
  current_signal?: { date: string; close: number; streak: number } | null;
  active_streak?: { streak: number; last_date: string; last_close: number } | null;
}

interface BacktestResult {
  [ticker: string]: BacktestTickerResult;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ["active", "testing", "backlog", "archived"] as const;
type Tab = typeof TABS[number];

const FAVORITE_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "GOOGL", "MU", "BABA", "AMZN"];
const PERIODS = ["1d", "5d", "10d", "30d", "1w", "2w", "4w", "6w", "8w", "10w"] as const;

const BG = "#111118";
const CARD_BG = "rgba(255,255,255,0.05)";
const CARD_BORDER = "rgba(255,255,255,0.12)";
const TEXT = "#f5f5f5";
const TEXT_DIM = "rgba(255,255,255,0.6)";
const TEXT_DIMMER = "rgba(255,255,255,0.4)";
const GREEN = "#34d399";
const RED = "#f87171";
const AMBER = "#fbbf24";
const BLUE = "#60a5fa";
const MONO = "'JetBrains Mono', 'Fira Code', monospace";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toISOString().slice(0, 10);
}

function fmtPct(n: number | null | undefined, forceSign = true): string {
  if (n == null) return "—";
  const sign = forceSign && n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function winColor(rate: number): string {
  if (rate >= 0.7) return GREEN;
  if (rate >= 0.5) return AMBER;
  return RED;
}

function labelStyle(label: string): React.CSSProperties {
  return {
    fontSize: 10,
    color: TEXT_DIMMER,
    fontFamily: MONO,
    letterSpacing: "0.1em",
    marginBottom: 6,
    display: "block",
    textTransform: "uppercase" as const,
  };
}

// ─── Forward Returns Table ────────────────────────────────────────────────────

function ForwardReturnsTable({ summary }: { summary: Record<string, SummaryPeriod> }) {
  const periods = Object.keys(summary).sort((a, b) => Number(a) - Number(b));
  if (periods.length === 0) return null;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: MONO, fontSize: 11 }}>
        <thead>
          <tr>
            {["Period", "N", "Wins", "Win%", "Avg%", "Median%", "Best", "Worst", "Avg Up", "Avg Dn"].map((h) => (
              <th key={h} style={{ padding: "5px 10px", textAlign: h === "Period" ? "left" : "right", color: TEXT_DIMMER, fontWeight: 600, borderBottom: `1px solid ${CARD_BORDER}`, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => {
            const s = summary[p];
            if (!s) return null;
            const wr = s.win_rate ?? (s.wins / s.n);
            return (
              <tr key={p} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                <td style={{ padding: "5px 10px", color: TEXT_DIM }}>{p}wk</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: TEXT_DIM }}>{s.n}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: TEXT_DIM }}>{s.wins}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: winColor(wr), fontWeight: 700 }}>{s.win_rate_pct ?? `${(wr * 100).toFixed(0)}%`}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: s.avg_return >= 0 ? GREEN : RED }}>{fmtPct(s.avg_return)}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: s.median_return >= 0 ? GREEN : RED }}>{fmtPct(s.median_return)}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: GREEN }}>{fmtPct(s.best)}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: RED }}>{fmtPct(s.worst)}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: GREEN }}>{s.avg_max_upside != null ? fmtPct(s.avg_max_upside) : "—"}</td>
                <td style={{ padding: "5px 10px", textAlign: "right", color: RED }}>{s.avg_max_downside != null ? fmtPct(s.avg_max_downside) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Backtest Explorer ────────────────────────────────────────────────────────

function BacktestExplorer({ onSaved }: { onSaved: () => void }) {
  const [condition, setCondition] = useState("");
  const [ticker, setTicker] = useState("TSLA");
  const [forwardPeriods, setForwardPeriods] = useState<string[]>([...PERIODS]);
  const [timeframe, setTimeframe] = useState<string>("weekly");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const togglePeriod = (p: string) => {
    setForwardPeriods((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const runBacktest = async () => {
    if (!condition.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setSaveSuccess(false);

    // Detect if it's a named scan
    const isScan = condition.trim().toLowerCase().startsWith("scan:");
    const scanName = isScan ? condition.trim().slice(5).trim() : undefined;

    try {
      // Try Vercel API first, fall back to direct Mac Mini proxy
      const payload = JSON.stringify({
        condition: isScan ? undefined : condition.trim(),
        scan: scanName,
        ticker,
        forward: forwardPeriods,
        timeframe,
      });

      let res: Response;
      try {
        res = await fetch("/api/admin/orb/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        // If Vercel API returns engine error, try direct proxy
        if (!res.ok) {
          const errCheck = await res.clone().json().catch(() => ({}));
          if (errCheck.error?.includes("Engine") || errCheck.error?.includes("Proxy")) {
            throw new Error("fallback to direct");
          }
        }
      } catch {
        // Direct call to Mac Mini backtest proxy
        res = await fetch("https://adaptation-vsnet-none-colony.trycloudflare.com/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Backtest failed");
      } else {
        setResult(data.result as BacktestResult);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  const saveToOrb = async () => {
    if (!result) return;
    setSaving(true);
    const tickerResult = result[ticker];
    if (!tickerResult) { setSaving(false); return; }

    const summary = tickerResult.summary ?? {};
    const signals = tickerResult.signals ?? [];
    const completed = signals.filter((s) => s.completed);
    const wins4w = summary["4"] ? summary["4"].wins : null;
    const n4w = summary["4"] ? summary["4"].n : completed.length;
    const winRate = wins4w != null && n4w > 0 ? wins4w / n4w : null;

    const name = condition.trim().slice(0, 60);
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const res = await fetch("/api/admin/orb/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `${id}-${Date.now()}`,
        name,
        type: "buy",
        status: "backlog",
        tickers: [ticker],
        source: "backtest-explorer",
        backtest_stats: summary,
        win_rate_20d: winRate,
        sample_size: completed.length,
        notes: `Auto-saved from backtest explorer.\nCondition: ${condition}\nTicker: ${ticker}`,
        created_at: new Date().toISOString(),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const tickerResult = result ? result[ticker] : null;
  const signals = tickerResult?.signals ?? [];
  const summary = tickerResult?.summary ?? {};
  const hasSummary = Object.keys(summary).length > 0;
  const hasSignals = signals.length > 0;

  // Determine current/active signals
  const currentSignal = signals.find((s) => s.is_current || (!s.completed && signals.indexOf(s) === signals.length - 2));
  const activeStreak = signals.find((s) => s.is_active || (!s.completed && signals.indexOf(s) === signals.length - 1));

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Backtest Explorer</h2>
        <p style={{ color: TEXT_DIM, fontSize: 12, marginTop: 4, fontFamily: MONO }}>
          Run ad-hoc backtests or named scans. Try: <span style={{ color: AMBER }}>weekly_rsi &lt; 35</span> or <span style={{ color: AMBER }}>scan:bxt-consecutive-ll</span>
        </p>
      </div>

      {/* Input area */}
      <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Condition input */}
        <div>
          <span style={labelStyle("Condition")}>Condition / Setup Description</span>
          <textarea
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g. weekly_rsi < 35   or   bxt_consecutive_ll >= 8   or   scan:bxt-consecutive-ll"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runBacktest(); }}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid rgba(255,255,255,0.1)`,
              borderRadius: 8,
              color: TEXT,
              padding: "12px 14px",
              fontSize: 14,
              fontFamily: MONO,
              resize: "vertical",
              minHeight: 56,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Condition Builder — Timeframe + Indicator groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Timeframe selector */}
          <div>
            <span style={labelStyle("Timeframe")}>Applies to all indicators below</span>
            <div style={{ display: "flex", gap: 6 }}>
              {([
                { label: "Weekly", value: "weekly", note: "" },
                { label: "Daily", value: "daily", note: "" },
                { label: "4H", value: "4h", note: "~60 days history" },
                { label: "Monthly", value: "monthly", note: "" },
              ] as const).map((tf) => {
                const isActive = timeframe === tf.value;
                return (
                  <button
                    key={tf.value}
                    onClick={() => setTimeframe(tf.value)}
                    title={tf.note ?? undefined}
                    style={{
                      background: isActive ? `${BLUE}33` : "rgba(255,255,255,0.04)",
                      color: isActive ? BLUE : TEXT_DIM,
                      border: `1px solid ${isActive ? BLUE + "66" : CARD_BORDER}`,
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontFamily: MONO,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tf.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indicator groups */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* RSI */}
            <div>
              <span style={{ ...labelStyle("RSI"), color: AMBER }}>RSI (Relative Strength Index)</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: "RSI < 30", value: "weekly_rsi < 30" },
                  { label: "RSI < 35", value: "weekly_rsi < 35" },
                  { label: "RSI < 40", value: "weekly_rsi < 40" },
                  { label: "RSI < 50", value: "weekly_rsi < 50" },
                  { label: "RSI > 60", value: "weekly_rsi > 60" },
                  { label: "RSI > 70", value: "weekly_rsi > 70" },
                  { label: "RSI > 80", value: "weekly_rsi > 80" },
                ].map((chip) => (
                  <button key={chip.value} onClick={() => setCondition((prev) => prev.trim() ? `${prev.trim()} AND ${chip.value}` : chip.value)}
                    style={{ background: `${AMBER}15`, color: AMBER, border: `1px solid ${AMBER}33`, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.background = `${AMBER}30`; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.background = `${AMBER}15`; }}
                  >{chip.label}</button>
                ))}
              </div>
            </div>

            {/* BXT */}
            <div>
              <span style={{ ...labelStyle("BXT"), color: GREEN }}>BX Trender</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: "BXT > 0 (bullish)", value: "bxt > 0" },
                  { label: "BXT < 0 (bearish)", value: "bxt < 0" },
                  { label: "BXT < -20", value: "bxt < -20" },
                  { label: "BXT < -30", value: "bxt < -30" },
                  { label: "BXT > 20", value: "bxt > 20" },
                  { label: "Consecutive LL ≥ 6", value: "bxt_consecutive_ll >= 6" },
                  { label: "Consecutive LL ≥ 8", value: "bxt_consecutive_ll >= 8" },
                  { label: "Consecutive LL ≥ 10", value: "bxt_consecutive_ll >= 10" },
                ].map((chip) => (
                  <button key={chip.value} onClick={() => setCondition((prev) => prev.trim() ? `${prev.trim()} AND ${chip.value}` : chip.value)}
                    style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}33`, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.background = `${GREEN}30`; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.background = `${GREEN}15`; }}
                  >{chip.label}</button>
                ))}
              </div>
            </div>

            {/* EMAs */}
            <div>
              <span style={{ ...labelStyle("EMA"), color: BLUE }}>Moving Averages</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { label: "Close > EMA 9", value: "close > ema_9" },
                  { label: "Close < EMA 9", value: "close < ema_9" },
                  { label: "Close > EMA 13", value: "close > ema_13" },
                  { label: "Close < EMA 13", value: "close < ema_13" },
                  { label: "Close > EMA 21", value: "close > ema_21" },
                  { label: "Close < EMA 21", value: "close < ema_21" },
                  { label: "EMA 9 > EMA 21", value: "ema_9 > ema_21" },
                  { label: "EMA 9 < EMA 21", value: "ema_9 < ema_21" },
                ].map((chip) => (
                  <button key={chip.value} onClick={() => setCondition((prev) => prev.trim() ? `${prev.trim()} AND ${chip.value}` : chip.value)}
                    style={{ background: `${BLUE}15`, color: BLUE, border: `1px solid ${BLUE}33`, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontFamily: MONO, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.background = `${BLUE}30`; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.background = `${BLUE}15`; }}
                  >{chip.label}</button>
                ))}
              </div>
            </div>

            {/* Clear button */}
            {condition.trim() && (
              <button onClick={() => setCondition("")}
                style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.04)", color: TEXT_DIM, border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, fontFamily: MONO, cursor: "pointer" }}
              >✕ Clear condition</button>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Ticker */}
          <div>
            <span style={labelStyle("Ticker")}>Ticker (any valid symbol)</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z.]/g, ""))}
                placeholder="TSLA"
                style={{
                  width: 90,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 6,
                  color: TEXT,
                  padding: "7px 10px",
                  fontSize: 13,
                  fontFamily: MONO,
                  fontWeight: 700,
                }}
              />
              {FAVORITE_TICKERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTicker(t)}
                  style={{
                    background: ticker === t ? `${BLUE}33` : "rgba(255,255,255,0.04)",
                    color: ticker === t ? BLUE : TEXT_DIM,
                    border: `1px solid ${ticker === t ? BLUE + "66" : CARD_BORDER}`,
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontFamily: MONO,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forward periods */}
        <div>
          <span style={labelStyle("Forward Periods")}>Forward Periods</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => togglePeriod(p)}
                style={{
                  background: forwardPeriods.includes(p) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  color: forwardPeriods.includes(p) ? TEXT : TEXT_DIMMER,
                  border: `1px solid ${forwardPeriods.includes(p) ? "rgba(255,255,255,0.15)" : CARD_BORDER}`,
                  borderRadius: 5,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontFamily: MONO,
                  cursor: "pointer",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Run button */}
        <div>
          <button
            onClick={runBacktest}
            disabled={running || !condition.trim()}
            style={{
              background: running ? "rgba(59,130,246,0.3)" : BLUE,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "11px 28px",
              fontSize: 13,
              fontWeight: 700,
              cursor: running || !condition.trim() ? "not-allowed" : "pointer",
              fontFamily: MONO,
              letterSpacing: "0.05em",
              opacity: !condition.trim() ? 0.5 : 1,
            }}
          >
            {running ? "⏳ Running..." : "▶ Run Backtest"}
          </button>
          <span style={{ marginLeft: 12, fontSize: 11, color: TEXT_DIMMER, fontFamily: MONO }}>⌘↩ to run</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 12, background: `${RED}18`, border: `1px solid ${RED}44`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: RED, fontFamily: MONO }}>
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {result && tickerResult && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Backtest details bar */}
          <div style={{ background: "rgba(96,165,250,0.08)", border: `1px solid rgba(96,165,250,0.2)`, borderRadius: 8, padding: "10px 16px", display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12, fontFamily: MONO, color: TEXT_DIM }}>
            <span><strong style={{ color: TEXT }}>Ticker:</strong> {ticker}</span>
            <span><strong style={{ color: TEXT }}>Timeframe:</strong> {timeframe.toUpperCase()}</span>
            <span><strong style={{ color: TEXT }}>Condition:</strong> {condition}</span>
            {hasSignals && signals.length > 0 && (
              <>
                <span><strong style={{ color: TEXT }}>Data range:</strong> {(() => {
                  const dates = signals.map(s => s.signal_date).filter(Boolean).sort();
                  if (dates.length < 2) return "—";
                  const first = dates[0]?.slice(0, 4);
                  const last = dates[dates.length - 1]?.slice(0, 4);
                  const years = first && last ? Number(last) - Number(first) : 0;
                  return `${first} – ${last} (${years}+ years)`;
                })()}</span>
              </>
            )}
          </div>
          {/* Summary stats banner */}
          {tickerResult.counts && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "TOTAL INSTANCES", value: tickerResult.counts.total, color: TEXT },
                { label: "COMPLETED", value: tickerResult.counts.completed, color: GREEN },
                { label: "CURRENT", value: tickerResult.counts.current, color: AMBER },
                { label: "ACTIVE STREAK", value: tickerResult.counts.active_streak, color: BLUE },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 10, padding: "12px 18px", textAlign: "center", minWidth: 90 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color }}>{value}</div>
                  <div style={{ fontSize: 9, color: TEXT_DIMMER, letterSpacing: "0.1em", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Current / Active signal callout */}
          {(currentSignal || activeStreak) && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {currentSignal && (
                <div style={{ background: `${AMBER}12`, border: `1px solid ${AMBER}33`, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 11, fontFamily: MONO, color: AMBER, letterSpacing: "0.1em", marginBottom: 6 }}>📍 CURRENT SIGNAL</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: TEXT }}>
                    {fmtDate(currentSignal.signal_date)} @ <span style={{ color: AMBER }}>${currentSignal.signal_close.toFixed(2)}</span>
                  </div>
                  {currentSignal.streak_len ? <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4, fontFamily: MONO }}>Streak: {currentSignal.streak_len}</div> : null}
                </div>
              )}
              {activeStreak && (
                <div style={{ background: `${BLUE}12`, border: `1px solid ${BLUE}33`, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 11, fontFamily: MONO, color: BLUE, letterSpacing: "0.1em", marginBottom: 6 }}>🔄 ACTIVE STREAK</div>
                  <div style={{ fontFamily: MONO, fontSize: 13, color: TEXT }}>
                    {fmtDate(activeStreak.signal_date)} @ <span style={{ color: BLUE }}>${activeStreak.signal_close.toFixed(2)}</span>
                  </div>
                  {activeStreak.streak_len ? <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4, fontFamily: MONO }}>Streak: {activeStreak.streak_len}</div> : null}
                </div>
              )}
            </div>
          )}

          {/* Forward returns table */}
          {hasSummary && (
            <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, color: TEXT_DIMMER, fontFamily: MONO, letterSpacing: "0.1em", marginBottom: 12 }}>FORWARD RETURN SUMMARY</div>
              <ForwardReturnsTable summary={summary} />
            </div>
          )}

          {/* Instances table */}
          {hasSignals && (
            <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${CARD_BORDER}` }}>
                <span style={{ fontSize: 11, color: TEXT_DIMMER, fontFamily: MONO, letterSpacing: "0.1em" }}>
                  ALL INSTANCES ({signals.length})
                </span>
              </div>
              <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: MONO, fontSize: 12 }}>
                  <thead style={{ position: "sticky", top: 0, background: "#0d0d10", zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: "8px 16px", textAlign: "left", color: TEXT_DIMMER, fontWeight: 600, borderBottom: `1px solid ${CARD_BORDER}` }}>Date</th>
                      <th style={{ padding: "8px 16px", textAlign: "right", color: TEXT_DIMMER, fontWeight: 600, borderBottom: `1px solid ${CARD_BORDER}` }}>Close</th>
                      <th style={{ padding: "8px 16px", textAlign: "right", color: TEXT_DIMMER, fontWeight: 600, borderBottom: `1px solid ${CARD_BORDER}` }}>Streak</th>
                      <th style={{ padding: "8px 16px", textAlign: "left", color: TEXT_DIMMER, fontWeight: 600, borderBottom: `1px solid ${CARD_BORDER}` }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signals.map((sig, i) => {
                      const isCurrent = sig.is_current || (!sig.completed && i === signals.length - 2 && signals.length > 1);
                      const isActive = sig.is_active || (!sig.completed && i === signals.length - 1);
                      const rowBg = isCurrent ? `${AMBER}0a` : isActive ? `${BLUE}0a` : "transparent";
                      const status = sig.completed ? "✅ Completed" : isCurrent ? "📍 Current" : isActive ? "🔄 Active" : "⚪ Open";

                      return (
                        <tr key={i} style={{ background: rowBg, borderBottom: `1px solid rgba(255,255,255,0.02)` }}>
                          <td style={{ padding: "7px 16px", color: TEXT }}>{fmtDate(sig.signal_date)}</td>
                          <td style={{ padding: "7px 16px", textAlign: "right", color: TEXT }}>${sig.signal_close.toFixed(2)}</td>
                          <td style={{ padding: "7px 16px", textAlign: "right", color: TEXT_DIM }}>{sig.streak_len || "—"}</td>
                          <td style={{ padding: "7px 16px", color: sig.completed ? GREEN : isCurrent ? AMBER : isActive ? BLUE : TEXT_DIM, fontSize: 11 }}>{status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Save to Orb */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={saveToOrb}
              disabled={saving || saveSuccess}
              style={{
                background: saveSuccess ? `${GREEN}33` : `${GREEN}22`,
                color: saveSuccess ? GREEN : "#a3e8bc",
                border: `1px solid ${saveSuccess ? GREEN + "66" : GREEN + "33"}`,
                borderRadius: 8,
                padding: "10px 22px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: MONO,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saveSuccess ? "✅ Saved to Orb!" : saving ? "Saving..." : "💾 Save to Orb"}
            </button>
            <span style={{ fontSize: 11, color: TEXT_DIMMER, fontFamily: MONO }}>Adds to backlog with full stats</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Setup Card ───────────────────────────────────────────────────────────────

function SetupCard({
  setup,
  tab,
  stateMap,
  onAction,
}: {
  setup: Setup;
  tab: Tab;
  stateMap: Record<string, SetupState>;
  onAction: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(setup.notes ?? "");

  const typeColor = setup.type === "buy" ? GREEN : RED;
  const marketState = stateMap[setup.id];

  const handleStatusChange = async (newStatus: string) => {
    await fetch(`/api/admin/orb/pipeline/${setup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onAction();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${setup.name}" permanently?`)) return;
    await fetch(`/api/admin/orb/pipeline/${setup.id}`, { method: "DELETE" });
    onAction();
  };

  const handleSaveNotes = async () => {
    await fetch(`/api/admin/orb/pipeline/${setup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesValue }),
    });
    setEditingNotes(false);
    onAction();
  };

  // Compute prominent stats from backtest_stats
  const stats = setup.backtest_stats;
  const period4 = stats?.["4"] ?? stats?.["4wk"] ?? null;
  const winRate = period4 ? (period4.win_rate ?? period4.wins / period4.n) : (setup.win_rate_20d ?? null);
  const sampleN = period4?.n ?? setup.sample_size ?? null;

  const marketStatusColor = marketState
    ? marketState.market_status === "active"
      ? GREEN
      : marketState.market_status === "watching"
      ? AMBER
      : TEXT_DIMMER
    : null;

  return (
    <div
      style={{
        background: expanded ? "rgba(255,255,255,0.03)" : CARD_BG,
        border: `1px solid ${expanded ? "rgba(255,255,255,0.1)" : CARD_BORDER}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Card header — always visible */}
      <div
        onClick={() => setExpanded((x) => !x)}
        style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
      >
        {/* Type badge */}
        <span style={{
          background: `${typeColor}18`,
          color: typeColor,
          border: `1px solid ${typeColor}40`,
          borderRadius: 5,
          padding: "3px 9px",
          fontSize: 10,
          fontWeight: 700,
          fontFamily: MONO,
          letterSpacing: "0.08em",
          flexShrink: 0,
        }}>
          {setup.type.toUpperCase()}
        </span>

        {/* Name + one-liner */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 8 }}>
            {setup.name}
            {setup.grade && (
              <span style={{ fontFamily: MONO, fontSize: 12, color: AMBER, fontWeight: 700 }}>{setup.grade}</span>
            )}
            {tab === "active" && marketStatusColor && (
              <span style={{
                fontSize: 9,
                fontFamily: MONO,
                color: marketStatusColor,
                border: `1px solid ${marketStatusColor}44`,
                borderRadius: 4,
                padding: "2px 6px",
                letterSpacing: "0.1em",
              }}>
                {marketState?.market_status?.toUpperCase()}
              </span>
            )}
          </div>
          {setup.one_liner && (
            <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {setup.one_liner}
            </div>
          )}
        </div>

        {/* Stats cluster */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
          {winRate != null && sampleN != null && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: winColor(winRate) }}>
                {(winRate * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 9, color: TEXT_DIMMER, fontFamily: MONO }}>WIN n={sampleN}</div>
            </div>
          )}
          {setup.tickers && setup.tickers.length > 0 && (
            <div style={{ display: "flex", gap: 3 }}>
              {setup.tickers.map((t) => (
                <span key={t} style={{ background: "rgba(255,255,255,0.05)", color: TEXT_DIM, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontFamily: MONO }}>{t}</span>
              ))}
            </div>
          )}
          {setup.last_triggered_at && (
            <span style={{ fontSize: 10, color: TEXT_DIMMER, fontFamily: MONO }}>{fmtDate(setup.last_triggered_at)}</span>
          )}
          {setup.category_tags && setup.category_tags.map((tag) => (
            <span key={tag} style={{ background: `${BLUE}18`, color: BLUE, border: `1px solid ${BLUE}30`, borderRadius: 4, padding: "2px 6px", fontSize: 9, fontFamily: MONO }}>{tag}</span>
          ))}
          {/* Chevron */}
          <span style={{ color: TEXT_DIMMER, fontSize: 14, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${CARD_BORDER}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Backtest stats table */}
          {stats && Object.keys(stats).length > 0 && (
            <div>
              <span style={labelStyle("Forward Returns")}>Forward Returns</span>
              <ForwardReturnsTable summary={stats} />
            </div>
          )}

          {/* Hypothesis */}
          {setup.hypothesis && (
            <div>
              <span style={labelStyle("Hypothesis")}>Hypothesis</span>
              <p style={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.65, margin: 0 }}>{setup.hypothesis}</p>
            </div>
          )}

          {/* Conditions */}
          {setup.conditions && (
            <div>
              <span style={labelStyle("Conditions")}>Conditions</span>
              <pre style={{ fontFamily: MONO, fontSize: 11, color: TEXT_DIM, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "10px 14px", margin: 0, overflow: "auto" }}>
                {JSON.stringify(setup.conditions, null, 2)}
              </pre>
            </div>
          )}

          {/* Notes */}
          <div>
            <span style={labelStyle("Notes")}>Notes</span>
            {editingNotes ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${CARD_BORDER}`,
                    borderRadius: 6,
                    color: TEXT,
                    padding: "10px 12px",
                    fontSize: 12,
                    resize: "vertical",
                    minHeight: 80,
                    fontFamily: "Inter, sans-serif",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSaveNotes} style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Save</button>
                  <button onClick={() => { setEditingNotes(false); setNotesValue(setup.notes ?? ""); }} style={{ background: "rgba(255,255,255,0.05)", color: TEXT_DIM, border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <p style={{ fontSize: 12, color: TEXT_DIM, lineHeight: 1.5, margin: 0, flex: 1 }}>{setup.notes || "No notes."}</p>
                <button onClick={() => setEditingNotes(true)} style={{ background: "rgba(255,255,255,0.05)", color: TEXT_DIM, border: "none", borderRadius: 5, padding: "3px 9px", fontSize: 10, cursor: "pointer", flexShrink: 0 }}>Edit</button>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 16, fontSize: 10, color: TEXT_DIMMER, fontFamily: MONO, flexWrap: "wrap" }}>
            {setup.source && <span>SOURCE: {setup.source}</span>}
            {setup.last_triggered_at && <span>LAST TRIGGERED: {fmtDate(setup.last_triggered_at)}</span>}
            {setup.promoted_at && <span>PROMOTED: {fmtDate(setup.promoted_at)}</span>}
            {setup.created_at && <span>CREATED: {fmtDate(setup.created_at)}</span>}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 12 }}>
            {tab === "backlog" && (
              <button onClick={() => handleStatusChange("testing")} style={{ background: `${AMBER}28`, color: AMBER, border: `1px solid ${AMBER}44`, borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>→ Testing</button>
            )}
            {tab === "testing" && (
              <button onClick={() => handleStatusChange("active")} style={{ background: `${GREEN}28`, color: GREEN, border: `1px solid ${GREEN}44`, borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>→ Promote to Active</button>
            )}
            {tab === "active" && (
              <button onClick={() => handleStatusChange("archived")} style={{ background: "rgba(255,255,255,0.05)", color: TEXT_DIM, border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "6px 14px", fontSize: 11, cursor: "pointer" }}>Archive</button>
            )}
            {tab !== "active" && (
              <>
                {tab !== "backlog" && (
                  <button onClick={() => handleStatusChange("archived")} style={{ background: "rgba(255,255,255,0.05)", color: TEXT_DIM, border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "6px 14px", fontSize: 11, cursor: "pointer" }}>Archive</button>
                )}
                <button onClick={handleDelete} style={{ background: `${RED}18`, color: RED, border: `1px solid ${RED}33`, borderRadius: 6, padding: "6px 14px", fontSize: 11, cursor: "pointer" }}>Delete</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Setup Library ────────────────────────────────────────────────────────────

function SetupLibrary({ refreshKey }: { refreshKey: number }) {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [setups, setSetups] = useState<Setup[]>([]);
  const [stateMap, setStateMap] = useState<Record<string, SetupState>>({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [listKey, setListKey] = useState(0);

  const fetchSetups = useCallback(async (tab: Tab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orb/pipeline?status=${tab}`);
      const data = await res.json();
      setSetups(data.setups ?? []);

      // For active tab, fetch setup states
      if (tab === "active" && data.setups?.length > 0) {
        // States are fetched inline for now; the orb_setup_states table query
        // would require a dedicated endpoint — skip for now, show status from DB if available
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSetups(activeTab);
  }, [activeTab, fetchSetups, refreshKey, listKey]);

  const refresh = () => setListKey((k) => k + 1);

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Setup Library</h2>
          <p style={{ color: TEXT_DIM, fontSize: 12, marginTop: 4 }}>Living library of validated trading setups</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          + Add Setup
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 3, marginBottom: 18, background: "rgba(255,255,255,0.025)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? "rgba(255,255,255,0.07)" : "transparent",
              color: activeTab === tab ? TEXT : TEXT_DIM,
              border: "none",
              borderRadius: 7,
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Setup list */}
      {loading ? (
        <div style={{ color: TEXT_DIM, fontFamily: MONO, fontSize: 12, padding: 20 }}>Loading...</div>
      ) : setups.length === 0 ? (
        <div style={{ color: TEXT_DIMMER, fontFamily: MONO, fontSize: 12, padding: "20px 4px" }}>No setups in {activeTab}.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {setups.map((setup) => (
            <SetupCard
              key={setup.id}
              setup={setup}
              tab={activeTab}
              stateMap={stateMap}
              onAction={refresh}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSetupModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Add Setup Modal ──────────────────────────────────────────────────────────

function AddSetupModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: "",
    hypothesis: "",
    type: "buy",
    tickers: "TSLA",
    source: "manual",
    notes: "",
    one_liner: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const id = `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now()}`;
    const res = await fetch("/api/admin/orb/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id,
        tickers: form.tickers.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean),
        status: "backlog",
      }),
    });
    setSaving(false);
    if (res.ok) onAdded();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 6,
    color: TEXT,
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: "Inter, sans-serif",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#111114", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 32, width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ color: TEXT, fontWeight: 800, fontSize: 18, marginTop: 0, marginBottom: 22 }}>Add New Setup</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {([
            { label: "Name", key: "name", placeholder: "e.g. RSI Oversold Recovery", required: true },
            { label: "One-liner", key: "one_liner", placeholder: "Short description shown in card header" },
            { label: "Tickers (comma-separated)", key: "tickers", placeholder: "TSLA, QQQ" },
            { label: "Source", key: "source", placeholder: "manual / nightly-cron / justin" },
          ] as Array<{ label: string; key: string; placeholder: string; required?: boolean }>).map(({ label, key, placeholder, required }) => (
            <div key={key}>
              <span style={labelStyle(label)}>{label}</span>
              <input
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                required={required}
                style={inputStyle}
              />
            </div>
          ))}
          <div>
            <span style={labelStyle("Type")}>Type</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value="buy">Buy</option>
              <option value="avoid">Avoid</option>
            </select>
          </div>
          <div>
            <span style={labelStyle("Hypothesis")}>Hypothesis</span>
            <textarea
              value={form.hypothesis}
              onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))}
              placeholder="What is the setup based on? Why should it work?"
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
            />
          </div>
          <div>
            <span style={labelStyle("Notes")}>Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional context..."
              style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, background: BLUE, color: "#fff", border: "none", borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Add to Backlog"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.06)", color: TEXT_DIM, border: "none", borderRadius: 8, padding: "11px 20px", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OrbAdminClient() {
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "Inter, system-ui, sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
          Orb Admin
        </h1>
        <p style={{ color: TEXT_DIM, fontSize: 12, marginTop: 5, fontFamily: MONO }}>
          Backtest explorer + setup lifecycle management
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${CARD_BORDER}`, marginBottom: 36 }} />

      {/* Section 1: Backtest Explorer */}
      <BacktestExplorer onSaved={() => setLibraryRefreshKey((k) => k + 1)} />

      {/* Divider */}
      <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, marginBottom: 36 }} />

      {/* Section 2: Setup Library */}
      <SetupLibrary refreshKey={libraryRefreshKey} />
    </div>
  );
}
