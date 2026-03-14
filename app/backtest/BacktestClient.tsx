"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BacktestExplorer } from "@/components/orb/BacktestExplorer";

const FAVORITE_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "GOOGL", "MU", "BABA", "AMZN"];
const SUBSCRIBE_URL = "/signup";
const MAX_FREE_SCANS_PER_DAY = 10;
const MAX_PUBLIC_PEERS = 3;

function getScansToday(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = localStorage.getItem("flacko_backtest_scans");
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored);
    const today = new Date().toISOString().split("T")[0];
    return date === today ? count : 0;
  } catch { return 0; }
}

function incrementScans(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().split("T")[0];
  const current = getScansToday();
  const next = current + 1;
  localStorage.setItem("flacko_backtest_scans", JSON.stringify({ date: today, count: next }));
  return next;
}

function SubscribeCTA({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-amber-500/30 bg-amber-500/5 ${compact ? "p-3" : "p-5"} text-center`}>
      <div className={`flex items-center justify-center gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <span className="text-lg">🔒</span>
        <p className={`${compact ? "text-xs" : "text-sm"} text-amber-200`}>{message}</p>
      </div>
      <a
        href={SUBSCRIBE_URL}
        className={`inline-block rounded-lg border border-amber-500/40 bg-amber-500/20 ${compact ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} font-semibold text-amber-100 transition hover:bg-amber-500/30`}
      >
        Subscribe to Flacko AI →
      </a>
    </div>
  );
}

function RateLimitOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="max-w-md rounded-2xl border border-amber-500/30 bg-zinc-900 p-8 text-center">
        <div className="text-4xl mb-4">⚡</div>
        <h2 className="text-2xl font-bold mb-3">You&apos;ve used your free scan today</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Subscribe for unlimited scans, real-time alerts when setups activate, custom condition backtests, and the full setup library.
        </p>
        <a
          href={SUBSCRIBE_URL}
          className="inline-block rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
        >
          Get Unlimited Access →
        </a>
        <p className="mt-4 text-xs text-zinc-500">Or come back tomorrow for another free scan.</p>
      </div>
    </div>
  );
}

type SetupStatus = "active" | "watching" | "inactive";

interface SummaryPeriod {
  n: number;
  wins: number;
  win_rate_pct: string;
  avg_return: number;
  median_return: number;
  best: number;
  worst: number;
  avg_max_upside: number | null;
  avg_max_downside: number | null;
}

interface BacktestInstance {
  date: string;
  price: number;
  status: "completed" | "open";
  ret_5d: number | null;
  ret_10d: number | null;
  ret_20d: number | null;
  ret_60d: number | null;
}

interface ScanSetup {
  id: string;
  name: string;
  public_name: string;
  number: number;
  type: "buy" | "avoid";
  status: SetupStatus;
  one_liner: string | null;
  public_description: string | null;
  reason: string;
  conditions_met: Record<string, boolean>;
  relevant_indicators: Record<string, string | number | boolean | null>;
  current_signal: { date: string; close: number } | null;
  active_streak: { active_since: string | null; active_day: number | null; entry_price: number | null } | null;
  backtest: {
    n: number;
    instances: BacktestInstance[];
    summary: Record<string, SummaryPeriod>;
    message?: string | null;
  };
}

interface PeerRow {
  ticker: string;
  state: "BULLISH" | "RISK" | "WATCH" | "NEUTRAL";
  buy_active: number;
  avoid_active: number;
  watching: number;
  date: string | null;
  source: string;
  error?: string;
}

interface ScenarioRow {
  setup_id: string;
  setup_name: string;
  date: string;
  entry_price: number;
  distance_pct: number;
  ret_5d: number | null;
  ret_10d: number | null;
  ret_20d: number | null;
  ret_60d: number | null;
}

interface SeasonalityMonth {
  month: number;
  name: string;
  avg_return: number;
  median_return: number;
  win_rate: number;
  n: number;
}

interface ScanResponse {
  ticker: string;
  date: string;
  source: string;
  indicators: Record<string, string | number | null>;
  right_now: {
    summary: string;
    suggestion: string;
    confidence: "high" | "medium" | "low";
    reasoning: string[];
  };
  seasonality?: {
    monthly: SeasonalityMonth[];
    next_30d: { avg_return: number; win_rate: number; n: number } | null;
  };
  peer_comparison: PeerRow[];
  scenarios: ScenarioRow[];
  setups: ScanSetup[];
  meta?: {
    backtest_source?: string;
    data_range?: { earliest: string | null; latest: string | null; years: number | null };
  };
}

function fmtPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function statusBadge(status: SetupStatus) {
  if (status === "active") {
    return { label: "ACTIVE", cls: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10" };
  }
  if (status === "watching") {
    return { label: "WATCHING", cls: "text-amber-300 border-amber-500/30 bg-amber-500/10" };
  }
  return { label: "INACTIVE", cls: "text-zinc-400 border-zinc-600/30 bg-zinc-700/10" };
}

function peerStateStyle(state: PeerRow["state"]) {
  switch (state) {
    case "BULLISH":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "RISK":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "WATCH":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    default:
      return "border-zinc-600/40 bg-zinc-700/10 text-zinc-300";
  }
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/40 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {title}
          </span>
          {badge && (
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {badge}
            </span>
          )}
        </div>
        <span className="text-zinc-500 text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ForwardSummaryTable({ summary }: { summary: Record<string, SummaryPeriod> }) {
  const periods = ["5", "10", "20", "60"].filter((period) => summary[period]);
  if (periods.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            {["Period", "N", "Wins", "Win%", "Avg", "Median", "Best", "Worst"].map((heading) => (
              <th key={heading} className={`py-2 px-2 ${heading === "Period" ? "text-left" : "text-right"}`}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const row = summary[period];
            return (
              <tr key={period} className="border-b border-zinc-900/70">
                <td className="py-2 px-2 text-zinc-300 text-left">{period}d</td>
                <td className="py-2 px-2 text-zinc-300 text-right">{row.n}</td>
                <td className="py-2 px-2 text-zinc-300 text-right">{row.wins}</td>
                <td className="py-2 px-2 text-right text-zinc-200">{row.win_rate_pct}</td>
                <td className={`py-2 px-2 text-right ${row.avg_return >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(row.avg_return)}</td>
                <td className={`py-2 px-2 text-right ${row.median_return >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(row.median_return)}</td>
                <td className="py-2 px-2 text-right text-emerald-300">{fmtPct(row.best)}</td>
                <td className="py-2 px-2 text-right text-red-300">{fmtPct(row.worst)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SetupCard({ setup, defaultOpen = false, limited = false }: { setup: ScanSetup; defaultOpen?: boolean; limited?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  const badge = statusBadge(setup.status);
  const trueConditions = Object.entries(setup.conditions_met || {}).filter(([, value]) => Boolean(value));
  const showInstances = setup.backtest.instances.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
      {/* Always-visible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-5 text-left hover:bg-zinc-800/20 transition"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em] ${badge.cls}`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {badge.label}
          </span>
          <span
            className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.08em] ${
              setup.type === "buy"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/25 bg-red-500/10 text-red-300"
            }`}
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {setup.type.toUpperCase()} #{setup.number}
          </span>
          <span className="ml-auto text-zinc-500 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
        <div className="mt-2">
          <h3 className="text-base font-semibold text-zinc-100">{setup.public_name || setup.name}</h3>
          {setup.one_liner && <p className="mt-1 text-xs text-zinc-400">{setup.one_liner}</p>}
        </div>
        <p
          className="mt-2 text-[11px] text-zinc-400"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {setup.reason}
        </p>
      </button>

      {/* Expandable details */}
      {expanded && (
        <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-zinc-800/50">
          {!limited && setup.active_streak && (
            <div
              className="mt-3 grid gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 p-3 text-[11px] text-sky-100 sm:grid-cols-3"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <div>Active Since: {setup.active_streak.active_since ?? "—"}</div>
              <div>Active Day: {setup.active_streak.active_day ?? "—"}</div>
              <div>Entry: {setup.active_streak.entry_price != null ? `$${setup.active_streak.entry_price.toFixed(2)}` : "—"}</div>
            </div>
          )}

          {limited ? (
            /* PUBLIC VIEW: forward return table + historical instances, no conditions/indicators */
            <div className="space-y-3 mt-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="mb-3 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  FORWARD RETURN SUMMARY · {setup.backtest.n} INSTANCES
                </p>
                {setup.backtest.n > 0 ? (
                  <ForwardSummaryTable summary={setup.backtest.summary} />
                ) : (
                  <p className="text-sm text-zinc-400">{setup.backtest.message || "No historical instances found."}</p>
                )}
              </div>

              {showInstances && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    HISTORICAL INSTANCES ({setup.backtest.n})
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500">
                          <th className="px-2 py-2 text-left">Date</th>
                          <th className="px-2 py-2 text-right">Entry</th>
                          <th className="px-2 py-2 text-right">5d</th>
                          <th className="px-2 py-2 text-right">10d</th>
                          <th className="px-2 py-2 text-right">20d</th>
                          <th className="px-2 py-2 text-right">60d</th>
                        </tr>
                      </thead>
                      <tbody>
                        {setup.backtest.instances.slice(0, 8).map((instance) => (
                          <tr key={`${setup.id}-${instance.date}`} className="border-b border-zinc-900/80">
                            <td className="px-2 py-2 text-zinc-300">{instance.date}</td>
                            <td className="px-2 py-2 text-right text-zinc-200">${instance.price.toFixed(2)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_5d != null && instance.ret_5d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_5d)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_10d != null && instance.ret_10d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_10d)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_20d != null && instance.ret_20d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_20d)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_60d != null && instance.ret_60d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_60d)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {setup.backtest.instances.length > 8 && (
                    <p className="mt-2 text-[10px] text-zinc-500 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      Showing 8 of {setup.backtest.instances.length} instances
                    </p>
                  )}
                </div>
              )}

              <SubscribeCTA message="Subscribe for condition breakdowns, real-time alerts, and unlimited scans." compact />
            </div>
          ) : (
            /* SUBSCRIBER VIEW: full details */
            <>
              <div>
                <p className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  CONDITIONS MET ({trueConditions.length}/{Object.keys(setup.conditions_met || {}).length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(setup.conditions_met || {}).map(([key, value]) => (
                    <span
                      key={key}
                      className={`rounded-full border px-2 py-1 text-[10px] ${
                        value
                          ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {key.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  RELEVANT INDICATORS
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(setup.relevant_indicators || {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[11px]"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <span className="text-zinc-500">{key.replace(/_/g, " ")}</span>
                      <span className="text-zinc-200">
                        {typeof value === "number" ? value.toFixed(2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="mb-3 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  FORWARD RETURN SUMMARY
                </p>
                {setup.backtest.message && !showInstances ? (
                  <p className="text-sm text-zinc-400">{setup.backtest.message}</p>
                ) : (
                  <ForwardSummaryTable summary={setup.backtest.summary} />
                )}
              </div>

              {showInstances && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    HISTORICAL INSTANCES ({setup.backtest.n})
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-500">
                          <th className="px-2 py-2 text-left">Date</th>
                          <th className="px-2 py-2 text-right">Entry</th>
                          <th className="px-2 py-2 text-right">5d</th>
                          <th className="px-2 py-2 text-right">10d</th>
                          <th className="px-2 py-2 text-right">20d</th>
                          <th className="px-2 py-2 text-right">60d</th>
                        </tr>
                      </thead>
                      <tbody>
                        {setup.backtest.instances.slice(0, 12).map((instance) => (
                          <tr key={`${setup.id}-${instance.date}`} className="border-b border-zinc-900/80">
                            <td className="px-2 py-2 text-zinc-300">{instance.date}</td>
                            <td className="px-2 py-2 text-right text-zinc-200">${instance.price.toFixed(2)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_5d != null && instance.ret_5d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_5d)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_10d != null && instance.ret_10d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_10d)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_20d != null && instance.ret_20d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_20d)}</td>
                            <td className={`px-2 py-2 text-right ${instance.ret_60d != null && instance.ret_60d >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(instance.ret_60d)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BacktestClient() {
  const [tickerInput, setTickerInput] = useState("TSLA");
  const [selectedTicker, setSelectedTicker] = useState("TSLA");
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [scansUsed, setScansUsed] = useState(0);
  // Check scans on mount
  useEffect(() => {
    setScansUsed(getScansToday());
  }, []);

  const doScan = useCallback(async (ticker: string) => {
    const currentScans = getScansToday();
    if (currentScans >= MAX_FREE_SCANS_PER_DAY) {
      setRateLimited(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/backtest/scan?ticker=${encodeURIComponent(ticker)}`);
      const body = await response.json();

      if (!response.ok) {
        setError(body.error ?? "Failed to run backtest scan.");
        setData(null);
        return;
      }

      setData(body as ScanResponse);
      const newCount = incrementScans();
      setScansUsed(newCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = tickerInput.toUpperCase().replace(/[^A-Z.^-]/g, "").slice(0, 10);
    if (!normalized) return;
    setTickerInput(normalized);
    setSelectedTicker(normalized);
    doScan(normalized);
  };

  const handleScanClick = () => {
    doScan(selectedTicker);
  };

  const groupedSetups = useMemo(() => {
    const setups = data?.setups ?? [];
    return {
      active: setups.filter((setup) => setup.status === "active"),
      watching: setups.filter((setup) => setup.status === "watching"),
      inactive: setups.filter((setup) => setup.status === "inactive"),
    };
  }, [data]);

  return (
    <div
      className="min-h-screen p-4 sm:p-6"
      style={{
        background: "#0a0a0c",
        color: "#f0f0f0",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
      `}</style>

      {rateLimited && <RateLimitOverlay />}
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-center text-xl leading-10">📊</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ORB Backtest Explorer</h1>
              <p className="text-sm text-zinc-400">Auto-scan all 19 setups against current conditions. All times Eastern.</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Auto-Scan</h2>
            <p className="text-sm text-zinc-400">Pick a ticker — we evaluate all ORB setups against current conditions.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value.toUpperCase())}
                placeholder="Enter any ticker..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/30 transition focus:ring sm:w-44"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <button
                type="submit"
                className="rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {loading ? "Scanning..." : "Scan"}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {FAVORITE_TICKERS.map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => {
                    setTickerInput(ticker);
                    setSelectedTicker(ticker);
                  }}
                  className={`rounded-md border px-2 py-1 text-[11px] ${
                    selectedTicker === ticker
                      ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {ticker}
                </button>
              ))}
            </div>

            {!data && !loading && (
              <button
                onClick={handleScanClick}
                className="w-full rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Scan {selectedTicker}
              </button>
            )}

            <p className="text-[11px] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {scansUsed > 0 ? `${MAX_FREE_SCANS_PER_DAY - scansUsed} free scans remaining today` : "Select a ticker, then click Scan"}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading && !data && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
              <p className="text-sm text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Evaluating all setups...
              </p>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* RIGHT NOW — always open */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="mb-2 text-[10px] tracking-[0.1em] text-emerald-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  RIGHT NOW · {data.ticker} · {data.date} ET
                </p>
                <p className="text-sm leading-relaxed text-zinc-100">{data.right_now.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">Mode: {data.right_now.suggestion}</span>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">Confidence: {data.right_now.confidence.toUpperCase()}</span>
                  {data.meta?.data_range?.years && (
                    <span className="rounded bg-zinc-900/60 px-2 py-1">Data: {data.meta.data_range.years}y ({data.meta.data_range.earliest?.split("-")[0]}–{data.meta.data_range.latest?.split("-")[0]})</span>
                  )}
                </div>
              </div>

              {/* ACTIVE SETUPS — full width, default expanded */}
              {groupedSetups.active.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-emerald-300">Active Setups ({groupedSetups.active.length})</h3>
                  <div className="space-y-4">
                    {groupedSetups.active.map((setup) => (
                      <SetupCard key={setup.id} setup={setup} defaultOpen={true} limited />
                    ))}
                  </div>
                </div>
              )}

              {/* WATCHING SETUPS — limited view */}
              {groupedSetups.watching.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-amber-300">Watching Setups ({groupedSetups.watching.length})</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedSetups.watching.map((setup) => (
                      <SetupCard key={setup.id} setup={setup} defaultOpen={false} limited />
                    ))}
                  </div>
                </div>
              )}

              {/* SEASONALITY — next 30 days free, full year for subscribers */}
              {data.seasonality && data.seasonality.monthly.length > 0 && (() => {
                const currentMonth = new Date().getMonth(); // 0-indexed
                // Show next 2 months (free preview)
                const freeMonths = [
                  data.seasonality.monthly[currentMonth],
                  data.seasonality.monthly[(currentMonth + 1) % 12],
                ];
                const lockedCount = 10;
                return (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-purple-300">Seasonality</h3>
                    {data.seasonality.next_30d && (
                      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                        <p className="text-[10px] tracking-[0.1em] text-purple-300 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          NEXT 30 DAYS · HISTORICAL AVERAGE
                        </p>
                        <div className="flex gap-6 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <span className={data.seasonality.next_30d.avg_return >= 0 ? "text-emerald-300" : "text-red-300"}>
                            Avg: {fmtPct(data.seasonality.next_30d.avg_return)}
                          </span>
                          <span className="text-zinc-300">Win Rate: {data.seasonality.next_30d.win_rate.toFixed(0)}%</span>
                          <span className="text-zinc-500">n={data.seasonality.next_30d.n}</span>
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                      <p className="mb-3 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        MONTHLY PERFORMANCE
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500">
                              <th className="px-2 py-2 text-left">Month</th>
                              <th className="px-2 py-2 text-right">Avg</th>
                              <th className="px-2 py-2 text-right">Median</th>
                              <th className="px-2 py-2 text-right">Win%</th>
                              <th className="px-2 py-2 text-right">Years</th>
                            </tr>
                          </thead>
                          <tbody>
                            {freeMonths.map((m) => (
                              <tr key={m.month} className="border-b border-zinc-900/80">
                                <td className="px-2 py-2 text-zinc-200 font-semibold">{m.name}</td>
                                <td className={`px-2 py-2 text-right ${m.avg_return >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(m.avg_return)}</td>
                                <td className={`px-2 py-2 text-right ${m.median_return >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(m.median_return)}</td>
                                <td className="px-2 py-2 text-right text-zinc-300">{m.win_rate.toFixed(0)}%</td>
                                <td className="px-2 py-2 text-right text-zinc-400">{m.n}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3">
                        <SubscribeCTA message={`Subscribe to see all 12 months of ${data.ticker} seasonality data.`} compact />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PEER COMPARISON — collapsible, after setups */}
              <CollapsibleSection title="PEER COMPARISON" badge={`${Math.min(data.peer_comparison.length, MAX_PUBLIC_PEERS)} OF ${data.peer_comparison.length} TICKERS`} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {data.peer_comparison.slice(0, MAX_PUBLIC_PEERS).map((peer) => (
                    <div
                      key={peer.ticker}
                      className={`rounded-lg border p-2 ${peerStateStyle(peer.state)}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <div className="text-sm font-bold">{peer.ticker}</div>
                      <div className="mt-1 text-[11px]">{peer.state}</div>
                      <div className="mt-1 text-[10px] text-zinc-300/90">
                        B {peer.buy_active} · A {peer.avoid_active} · W {peer.watching}
                      </div>
                    </div>
                  ))}
                </div>
                {data.peer_comparison.length > MAX_PUBLIC_PEERS && (
                  <div className="mt-3">
                    <SubscribeCTA message={`Subscribe to see all ${data.peer_comparison.length} tickers.`} compact />
                  </div>
                )}
              </CollapsibleSection>

              {/* SCENARIO COMPARISON — collapsible, default closed */}
              {data.scenarios.length > 0 && (
                <CollapsibleSection
                  title="SCENARIO COMPARISON"
                  badge={`${data.scenarios.length}`}
                  defaultOpen={false}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {data.scenarios.map((scenario) => (
                      <div key={`${scenario.setup_id}-${scenario.date}`} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                        <p className="text-sm font-semibold text-zinc-100">{scenario.setup_name}</p>
                        <p className="text-[11px] text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {scenario.date} · Entry ${scenario.entry_price.toFixed(2)} · Δ {fmtPct(scenario.distance_pct)}
                        </p>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {([
                            ["5d", scenario.ret_5d],
                            ["10d", scenario.ret_10d],
                            ["20d", scenario.ret_20d],
                            ["60d", scenario.ret_60d],
                          ] as const).map(([label, value]) => (
                            <div key={label} className="rounded border border-zinc-800 bg-zinc-950/70 px-2 py-1 text-center">
                              <div className="text-zinc-500">{label}</div>
                              <div className={value != null && value >= 0 ? "text-emerald-300" : "text-red-300"}>{fmtPct(value)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* Inline CTA */}
              {(groupedSetups.active.length > 0 || groupedSetups.watching.length > 0) && (
                <SubscribeCTA message="Subscribe for condition breakdowns, real-time alerts, and unlimited scans." />
              )}

              {/* INACTIVE — gated for subscribers */}
              {groupedSetups.inactive.length > 0 && (
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-lg">🔒</span>
                    <p className="text-sm text-zinc-400">
                      {groupedSetups.inactive.length} more setups available for subscribers
                    </p>
                  </div>
                  <a
                    href={SUBSCRIBE_URL}
                    className="inline-block rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-5 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                  >
                    Unlock All Setups →
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* CUSTOM EXPLORER — gated for subscribers */}
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🔬</span>
              <h2 className="text-xl font-semibold">Custom Backtest Explorer</h2>
            </div>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto">
              Build your own conditions with indicator chips, test any combination on any ticker, and see exactly how your strategy would have performed historically.
            </p>
            <a
              href={SUBSCRIBE_URL}
              className="inline-block rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
            >
              Unlock Custom Explorer →
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
