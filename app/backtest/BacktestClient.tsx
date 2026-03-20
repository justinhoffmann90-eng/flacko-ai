"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BacktestExplorer } from "@/components/orb/BacktestExplorer";
import { ComparisonDashboard } from "@/components/orb/ComparisonDashboard";

const SUPPORTED_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "AMZN", "META", "MU", "GOOGL", "BABA"] as const;
const SUBSCRIBE_URL = "/signup";
const MAX_FREE_SCANS_PER_DAY = 3;
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
    <div className={`rounded-xl border border-zinc-700/50 bg-zinc-800/30 ${compact ? "p-3" : "p-5"} text-center`}>
      <div className={`flex items-center justify-center gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <span className="text-lg">🔒</span>
        <p className={`${compact ? "text-xs" : "text-sm"} text-zinc-300`}>{message}</p>
      </div>
      <a
        href={SUBSCRIBE_URL}
        className={`inline-block rounded-lg bg-white ${compact ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} font-semibold text-zinc-900 transition hover:bg-zinc-200`}
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
    forward?: {
      d5: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
      d10: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
      d30: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
      d60: { avg_return: number; median_return: number; win_rate: number; n: number } | null;
    };
  };
  peer_comparison: PeerRow[];
  scenarios: ScenarioRow[];
  scenario_context?: string;
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
  const [instancesExpanded, setInstancesExpanded] = useState(false);
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
            {setup.type.toUpperCase()}
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
                  <p className="text-sm text-zinc-400">{setup.backtest.message || "This setup has not triggered historically on this ticker. It may be too rare or the ticker lacks sufficient data."}</p>
                )}
              </div>

              {showInstances && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <button
                    onClick={() => setInstancesExpanded(!instancesExpanded)}
                    className="w-full flex items-center justify-between text-left text-[10px] tracking-[0.1em] text-zinc-300 hover:text-white transition"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span>{instancesExpanded ? "▲" : "▼"} {setup.backtest.n} historical instances</span>
                  </button>
                  {instancesExpanded && (
                    <>
                      <div className="overflow-x-auto mt-2">
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
                    </>
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
                  <button
                    onClick={() => setInstancesExpanded(!instancesExpanded)}
                    className="w-full flex items-center justify-between text-left text-[10px] tracking-[0.1em] text-zinc-300 hover:text-white transition"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    <span>{instancesExpanded ? "▲" : "▼"} {setup.backtest.n} historical instances</span>
                  </button>
                  {instancesExpanded && (
                    <div className="overflow-x-auto mt-2">
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
                  )}
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
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "compare">("single");
  const [compareData, setCompareData] = useState<Array<{
    ticker: string; close: number; change_pct: number; mode: string;
    buy_active: number; avoid_active: number; watching: number;
    recommendation_short: string; seasonality_30d: number | null;
  }> | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  // Check scans + subscription status on mount
  useEffect(() => {
    setScansUsed(getScansToday());
    fetch("/api/auth/subscription-status")
      .then((r) => r.json())
      .then((d) => { if (d.isSubscriber) setIsSubscriber(true); })
      .catch(() => {});
  }, []);

  const doScan = useCallback(async (ticker: string) => {
    if (!isSubscriber) {
      const currentScans = getScansToday();
      if (currentScans >= MAX_FREE_SCANS_PER_DAY) {
        setRateLimited(true);
        return;
      }
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
      if (!isSubscriber) {
        const newCount = incrementScans();
        setScansUsed(newCount);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isSubscriber]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = tickerInput.toUpperCase().replace(/[^A-Z.^-]/g, "").slice(0, 10);
    if (!normalized) return;
    if (!SUPPORTED_TICKERS.includes(normalized as (typeof SUPPORTED_TICKERS)[number])) {
      setError(`Unsupported ticker: ${normalized}. /backtest currently supports TSLA, QQQ, SPY, NVDA, AAPL, AMZN, META, MU, GOOGL, and BABA.`);
      return;
    }
    setTickerInput(normalized);
    setSelectedTicker(normalized);
    doScan(normalized);
  };

  const handleScanClick = () => {
    doScan(selectedTicker);
  };

  const handleCompareAll = useCallback(async () => {
    setViewMode("compare");
    if (compareData) return; // Already loaded
    setCompareLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/backtest/compare");
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Failed to load comparison data.");
        return;
      }
      setCompareData(body.tickers);
      if (body.is_subscriber) setIsSubscriber(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCompareLoading(false);
    }
  }, [compareData]);

  const handleCompareTickerClick = useCallback((ticker: string) => {
    setViewMode("single");
    setTickerInput(ticker);
    setSelectedTicker(ticker);
    doScan(ticker);
  }, [doScan]);

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

      {rateLimited && !isSubscriber && <RateLimitOverlay />}
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-center text-xl leading-10">📊</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ORB Forward Return Engine</h1>
              <p className="text-sm text-zinc-400">Measure what historically happened after the current setup: win rates, forward returns, and closest analogs across the validated backtest universe. All times Eastern.</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Backtest Universe</h2>
            <p className="text-sm text-zinc-400">Select a supported ticker to view the current setup against ORB forward returns, win rates, and historical analogs.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={tickerInput}
                onChange={(event) => setTickerInput(event.target.value.toUpperCase())}
                placeholder="TSLA"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/30 transition focus:ring sm:w-44"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
              <button
                type="submit"
                className="rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {loading ? "Loading Backtest..." : "Load Ticker"}
              </button>
            </form>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-400">
              Supported tickers: TSLA, QQQ, SPY, NVDA, AAPL, AMZN, META, MU, GOOGL, BABA.
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCompareAll}
                className={`rounded-md border px-3 py-1 text-[11px] font-semibold ${
                  viewMode === "compare"
                    ? "border-amber-500/35 bg-amber-500/15 text-amber-300"
                    : "border-zinc-600 bg-zinc-800 text-zinc-300 hover:border-amber-500/30 hover:text-amber-300"
                } transition`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Compare All
              </button>
              <div className="w-px bg-zinc-700 mx-0.5" />
              {SUPPORTED_TICKERS.map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => {
                    setViewMode("single");
                    setTickerInput(ticker);
                    setSelectedTicker(ticker);
                  }}
                  className={`rounded-md border px-2 py-1 text-[11px] ${
                    viewMode === "single" && selectedTicker === ticker
                      ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400"
                  }`}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {ticker}
                </button>
              ))}
            </div>

            {viewMode === "single" && !data && !loading && (
              <button
                onClick={handleScanClick}
                className="w-full rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Load {selectedTicker} Backtest
              </button>
            )}

            <p className="text-[11px] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {isSubscriber ? "Unlimited backtests" : scansUsed > 0 ? `${MAX_FREE_SCANS_PER_DAY - scansUsed} free backtests remaining today` : "Select a supported ticker, then load the backtest"}
            </p>
          </div>

          {/* ─── Compare All View ─── */}
          {viewMode === "compare" && (
            <div>
              {compareLoading && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-500" />
                  <p className="text-sm text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    Evaluating all 10 tickers...
                  </p>
                </div>
              )}
              {!compareLoading && compareData && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200 mb-1">All Tickers at a Glance</h3>
                    <p className="text-xs text-zinc-500">Click any ticker to load its full backtest. Sortable by any column.</p>
                  </div>
                  <ComparisonDashboard
                    tickers={compareData}
                    isSubscriber={isSubscriber}
                    onTickerClick={handleCompareTickerClick}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {viewMode === "single" && loading && !data && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-emerald-500" />
              <p className="text-sm text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Loading ticker backtest...
              </p>
            </div>
          )}

          {viewMode === "single" && data && (
            <div className="space-y-4">
              {/* RIGHT NOW — always open */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="mb-2 text-[10px] tracking-[0.1em] text-emerald-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  CURRENT BACKTEST READ · {data.ticker} · {data.date ? new Date(data.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </p>
                <div className="space-y-2.5 text-sm leading-relaxed text-zinc-100">
                  {data.right_now.summary.split("\n\n").map((paragraph: string, i: number) => (
                    <p key={i} className={paragraph.startsWith("📌") ? "text-emerald-200/90 font-medium border-l-2 border-emerald-500/40 pl-3" : ""}>
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">BXT: {data.indicators?.bxt_state || "—"} {data.indicators?.bxt_state === "HH" ? "↑" : data.indicators?.bxt_state === "LL" ? "↓" : data.indicators?.bxt_state === "HL" ? "↗" : data.indicators?.bxt_state === "LH" ? "↘" : ""}</span>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">Signal: {data.right_now.confidence.toUpperCase()}</span>
                  {data.meta?.data_range?.years && (
                    <span className="rounded bg-zinc-900/60 px-2 py-1">{data.meta.data_range.earliest?.split("-")[0]}–{data.meta.data_range.latest?.split("-")[0]} · {Math.round(Number(data.meta.data_range.years))}y data</span>
                  )}
                </div>
                {data.indicators && (
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {data.indicators.close != null && (
                      <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300">Close: ${data.indicators.close}</span>
                    )}
                    {data.indicators.rsi != null && (
                      <span className={`rounded px-2 py-0.5 ${Number(data.indicators.rsi) > 70 ? "bg-red-900/40 text-red-300" : Number(data.indicators.rsi) < 30 ? "bg-emerald-900/40 text-emerald-300" : "bg-zinc-800/80 text-zinc-300"}`}>RSI: {data.indicators.rsi}</span>
                    )}
                    {data.indicators.smi != null && (
                      <span className={`rounded px-2 py-0.5 ${Number(data.indicators.smi) > 40 ? "bg-emerald-900/40 text-emerald-300" : Number(data.indicators.smi) < -40 ? "bg-red-900/40 text-red-300" : "bg-zinc-800/80 text-zinc-300"}`}>SMI: {data.indicators.smi}</span>
                    )}
                    {data.indicators.sma200_dist != null && (
                      <span className={`rounded px-2 py-0.5 ${Number(data.indicators.sma200_dist) < 0 ? "bg-red-900/40 text-red-300" : "bg-zinc-800/80 text-zinc-300"}`}>SMA200: {Number(data.indicators.sma200_dist) >= 0 ? "+" : ""}{data.indicators.sma200_dist}%</span>
                    )}
                    {data.indicators.bx_weekly_state && (
                      <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300">Wkly BXT: {data.indicators.bx_weekly_state}</span>
                    )}
                    {data.indicators.vix_close != null && (
                      <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-zinc-300">VIX: {data.indicators.vix_close}</span>
                    )}
                  </div>
                )}
              </div>

              {/* ACTIVE SETUPS — full width, default expanded */}
              {groupedSetups.active.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-emerald-300">Active Setups ({groupedSetups.active.length})</h3>
                  <div className="space-y-4">
                    {groupedSetups.active.map((setup) => (
                      <SetupCard key={setup.id} setup={setup} defaultOpen={true} limited={!isSubscriber} />
                    ))}
                  </div>
                </div>
              )}

              {/* No active banner */}
              {groupedSetups.active.length === 0 && groupedSetups.watching.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[12px] text-amber-200/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  No setups are active right now — {groupedSetups.watching.length} setup{groupedSetups.watching.length !== 1 ? "s are" : " is"} approaching trigger. Conditions are being monitored.
                </div>
              )}

              {/* WATCHING SETUPS — limited view */}
              {groupedSetups.watching.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-amber-300">Watching Setups ({groupedSetups.watching.length})</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedSetups.watching.map((setup) => (
                      <SetupCard key={setup.id} setup={setup} defaultOpen={false} limited={!isSubscriber} />
                    ))}
                  </div>
                </div>
              )}

              {/* SEASONALITY — visual bar chart */}
              {data.seasonality && data.seasonality.monthly.length > 0 && (() => {
                const currentMonth = new Date().getMonth(); // 0-indexed
                const months = data.seasonality.monthly;
                const maxAbs = Math.max(...months.map((m) => Math.abs(m.avg_return)), 1);
                // Free: show current month + next 2 months (3 total); subscribers see all 12
                const freeIndices = isSubscriber
                  ? new Set(Array.from({ length: 12 }, (_, i) => i))
                  : new Set([currentMonth, (currentMonth + 1) % 12, (currentMonth + 2) % 12]);

                return (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-purple-300">Seasonality</h3>

                    {/* Next 30 days highlight */}
                    {data.seasonality.next_30d && (
                      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                        <p className="text-[10px] tracking-[0.1em] text-purple-300 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          NEXT 30 DAYS · TIME-WEIGHTED BLEND OF {data.seasonality.next_30d.n} YEARS
                        </p>
                        <div className="flex items-center gap-8 mb-3">
                          <div>
                            <p className={`text-3xl font-bold ${data.seasonality.next_30d.avg_return >= 0 ? "text-emerald-300" : "text-red-300"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {data.seasonality.next_30d.avg_return >= 0 ? "+" : ""}{data.seasonality.next_30d.avg_return.toFixed(2)}%
                            </p>
                            <p className="text-[10px] text-purple-300/70 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>AVG RETURN</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-zinc-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {data.seasonality.next_30d.win_rate.toFixed(0)}%
                            </p>
                            <p className="text-[10px] text-purple-300/70 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>WIN RATE</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-purple-300/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          This differs from the monthly bar because it is a time-weighted blend of the remaining days in the current month + the start of the next month — not a single month's average.
                        </p>
                      </div>
                    )}

                    {/* Forward Seasonality: 5D / 10D / 30D / 60D */}
                    {data.seasonality.forward && (() => {
                      const fw = data.seasonality.forward;
                      const windows = [
                        { key: "d5" as const, label: "5D", subscriberOnly: true },
                        { key: "d10" as const, label: "10D", subscriberOnly: true },
                        { key: "d30" as const, label: "30D", subscriberOnly: false },
                        { key: "d60" as const, label: "60D", subscriberOnly: true },
                      ];
                      const visibleWindows = windows.filter(w => !w.subscriberOnly || isSubscriber);
                      const lockedWindows = windows.filter(w => w.subscriberOnly && !isSubscriber);

                      return (
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                          <p className="text-[10px] tracking-[0.1em] text-purple-300 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            FORWARD SEASONALITY FROM TODAY&apos;S CALENDAR DATE
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {visibleWindows.map(({ key, label }) => {
                              const s = fw[key];
                              if (!s) return null;
                              return (
                                <div key={key} className="rounded-lg border border-zinc-700/50 bg-zinc-900/50 p-3 text-center">
                                  <p className="text-[10px] tracking-[0.1em] text-zinc-500 mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{label}</p>
                                  <p className={`text-xl font-bold ${s.avg_return >= 0 ? "text-emerald-300" : "text-red-300"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {s.avg_return >= 0 ? "+" : ""}{s.avg_return.toFixed(1)}%
                                  </p>
                                  <p className="text-[10px] text-zinc-500 mt-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {s.win_rate.toFixed(0)}% win · n={s.n}
                                  </p>
                                </div>
                              );
                            })}
                            {lockedWindows.length > 0 && (
                              <div className="rounded-lg border border-zinc-700/30 bg-zinc-900/30 p-3 text-center flex flex-col items-center justify-center col-span-1">
                                <span className="text-lg mb-1">🔒</span>
                                <p className="text-[10px] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {lockedWindows.map(w => w.label).join(", ")}
                                </p>
                                <a href={SUBSCRIBE_URL} className="text-[10px] text-emerald-400 hover:text-emerald-300 mt-1">
                                  Unlock →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bar chart — all 12 months */}
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <p className="mb-4 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        MONTHLY AVG RETURN · {Math.max(...months.map((m) => m.n), 0)} YEARS OF DATA
                      </p>

                      <div className="flex gap-1.5 sm:gap-2" style={{ height: "220px" }}>
                        {months.map((m, idx) => {
                          const isFree = freeIndices.has(idx);
                          const isCurrent = idx === currentMonth;
                          const barPct = Math.max((Math.abs(m.avg_return) / maxAbs) * 80, 5); // 5-80% of half
                          const isPositive = m.avg_return >= 0;

                          return (
                            <div key={m.month} className="flex flex-1 flex-col items-center h-full relative" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {/* TOP HALF — positive bars grow up from center */}
                              <div className="flex flex-col items-center justify-end w-full" style={{ height: "45%" }}>
                                {/* Win rate + return label above positive bars */}
                                {isPositive && (
                                  <>
                                    {isFree ? (
                                      <div className="mb-0.5 flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-300">
                                          {m.win_rate.toFixed(0)}%
                                        </span>
                                        <span className="text-[7px] text-zinc-600 leading-tight">win</span>
                                      </div>
                                    ) : (
                                      <div className="mb-0.5 flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500">—</span>
                                        <span className="text-[7px] text-zinc-600 leading-tight">win</span>
                                      </div>
                                    )}
                                    <div className={`mb-0.5 text-[9px] sm:text-[10px] ${!isFree ? "blur-[3px] select-none" : ""}`}>
                                      <span className="text-emerald-300">+{m.avg_return.toFixed(1)}%</span>
                                    </div>
                                    <div
                                      className={`w-full rounded-t-sm transition-all ${
                                        !isFree
                                          ? "bg-zinc-700/40 blur-[2px]"
                                          : isCurrent ? "bg-emerald-400" : "bg-emerald-500/70"
                                      } ${isCurrent ? "ring-1 ring-white/30" : ""}`}
                                      style={{ height: `${barPct}%`, minHeight: "4px" }}
                                    />
                                  </>
                                )}
                              </div>

                              {/* X-AXIS LINE */}
                              <div className="w-full h-px bg-zinc-700 flex-shrink-0" />

                              {/* BOTTOM HALF — negative bars grow down from center */}
                              <div className="flex flex-col items-center justify-start w-full" style={{ height: "45%" }}>
                                {!isPositive && (
                                  <>
                                    <div
                                      className={`w-full rounded-b-sm transition-all ${
                                        !isFree
                                          ? "bg-zinc-700/40 blur-[2px]"
                                          : isCurrent ? "bg-red-400" : "bg-red-500/70"
                                      } ${isCurrent ? "ring-1 ring-white/30" : ""}`}
                                      style={{ height: `${barPct}%`, minHeight: "4px" }}
                                    />
                                    <div className={`mt-0.5 text-[9px] sm:text-[10px] ${!isFree ? "blur-[3px] select-none" : ""}`}>
                                      <span className="text-red-300">{m.avg_return.toFixed(1)}%</span>
                                    </div>
                                    {isFree ? (
                                      <div className="mt-0.5 flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-300">
                                          {m.win_rate.toFixed(0)}%
                                        </span>
                                        <span className="text-[7px] text-zinc-600 leading-tight">win</span>
                                      </div>
                                    ) : (
                                      <div className="mt-0.5 flex flex-col items-center">
                                        <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500">—</span>
                                        <span className="text-[7px] text-zinc-600 leading-tight">win</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Month label — always at bottom */}
                              <div className={`mt-auto text-[9px] sm:text-[10px] ${isCurrent ? "text-white font-bold" : "text-zinc-500"}`}>
                                {m.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-[9px] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500/70" /> Positive avg return</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500/70" /> Negative avg return</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full ring-1 ring-white/30 bg-zinc-600" /> Current month</span>
                        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-zinc-700/40 blur-[1px]" /> Locked (subscribe)</span>
                        <span className="flex items-center gap-1 text-zinc-400">· % above bar = win rate (how often that month was positive)</span>
                      </div>

                      {!isSubscriber && (
                        <div className="mt-3">
                          <SubscribeCTA message={`Subscribe to unlock all 12 months of ${data.ticker} seasonality + condition breakdowns.`} compact />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* PEER COMPARISON — collapsible, after setups */}
              <CollapsibleSection title="PEER COMPARISON" badge={isSubscriber ? `${data.peer_comparison.length} TICKERS` : `${Math.min(data.peer_comparison.length, MAX_PUBLIC_PEERS)} OF ${data.peer_comparison.length} TICKERS`} defaultOpen={false}>
                <p className="mb-3 text-[11px] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  How related tickers look right now using the same setup engine. Useful for reading the broader market environment — if peers are also in RISK, the headwind is systemic, not just {data.ticker}-specific.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {(isSubscriber ? data.peer_comparison : data.peer_comparison.slice(0, MAX_PUBLIC_PEERS)).map((peer) => (
                    <div
                      key={peer.ticker}
                      className={`rounded-lg border p-3 ${peerStateStyle(peer.state)}`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      <div className="text-sm font-bold">{peer.ticker}</div>
                      <div className="mt-1 text-[11px] font-semibold tracking-wide">{peer.state}</div>
                      <div className="mt-2 space-y-0.5 text-[10px] text-zinc-400">
                        <div>{peer.buy_active} buy signal{peer.buy_active !== 1 ? "s" : ""} active</div>
                        <div>{peer.avoid_active} avoid signal{peer.avoid_active !== 1 ? "s" : ""} active</div>
                        <div>{peer.watching} watching</div>
                      </div>
                    </div>
                  ))}
                </div>
                {!isSubscriber && data.peer_comparison.length > MAX_PUBLIC_PEERS && (
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
                  <p className="mb-3 text-[11px] text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {data.scenario_context || `Each card shows a past instance when the same setup triggered on ${data.ticker}.`} The date it fired, the entry price, and what the stock actually returned over the next 5, 10, 20, and 60 days. Use these to calibrate your expectations for the current setup.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {data.scenarios.map((scenario) => (
                      <div key={`${scenario.setup_id}-${scenario.date}`} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold text-zinc-100">{scenario.setup_name}</p>
                          <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            PAST TRIGGER
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mb-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          Triggered {scenario.date} · Entry ${scenario.entry_price.toFixed(2)}{scenario.distance_pct != null ? ` · ${Math.abs(scenario.distance_pct).toFixed(1)}% ${scenario.distance_pct >= 0 ? "above" : "below"} current price` : ""}
                        </p>
                        <div className="grid grid-cols-4 gap-2 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {([
                            ["5 days", scenario.ret_5d],
                            ["10 days", scenario.ret_10d],
                            ["20 days", scenario.ret_20d],
                            ["60 days", scenario.ret_60d],
                          ] as const).map(([label, value]) => (
                            <div key={label} className="rounded border border-zinc-800 bg-zinc-950/70 px-2 py-1.5 text-center">
                              <div className="text-zinc-500 text-[9px] mb-0.5">{label}</div>
                              <div className={`font-semibold ${value != null && value >= 0 ? "text-emerald-300" : "text-red-300"}`}>{fmtPct(value)}</div>
                              <div className="text-zinc-600 text-[8px] mt-0.5">return</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              {/* INACTIVE — full for subscribers, gated count-badge for free users */}
              {groupedSetups.inactive.length > 0 && (
                isSubscriber ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-zinc-400">Inactive Setups ({groupedSetups.inactive.length})</h3>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {groupedSetups.inactive.map((setup) => (
                        <SetupCard key={setup.id} setup={setup} defaultOpen={false} limited={false} />
                      ))}
                    </div>
                  </div>
                ) : (
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
                )
              )}
            </div>
          )}
        </section>

        {/* CUSTOM EXPLORER — gated for non-subscribers */}
        {!isSubscriber && (
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
        )}
      </div>
    </div>
  );
}
