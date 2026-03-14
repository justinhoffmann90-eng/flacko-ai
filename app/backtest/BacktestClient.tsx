"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BacktestExplorer } from "@/components/orb/BacktestExplorer";

const FAVORITE_TICKERS = ["TSLA", "QQQ", "SPY", "NVDA", "AAPL", "GOOGL", "MU", "BABA", "AMZN"];

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
  peer_comparison: PeerRow[];
  scenarios: ScenarioRow[];
  setups: ScanSetup[];
  meta?: {
    backtest_data_ticker?: string;
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

function ForwardSummaryTable({ summary }: { summary: Record<string, SummaryPeriod> }) {
  const periods = ["5", "10", "20", "60"].filter((period) => summary[period]);
  if (periods.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800">
            {[
              "Period",
              "N",
              "Wins",
              "Win%",
              "Avg",
              "Median",
              "Best",
              "Worst",
            ].map((heading) => (
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

function SetupCard({ setup }: { setup: ScanSetup }) {
  const badge = statusBadge(setup.status);
  const trueConditions = Object.entries(setup.conditions_met || {}).filter(([, value]) => Boolean(value));
  const showInstances = setup.backtest.instances.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-2">
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
      </div>

      <div className="mt-3">
        <h3 className="text-lg font-semibold text-zinc-100">{setup.public_name || setup.name}</h3>
        {setup.one_liner && <p className="mt-1 text-sm text-zinc-300">{setup.one_liner}</p>}
      </div>

      <p
        className="mt-3 rounded-lg border border-zinc-700/70 bg-zinc-900/60 px-3 py-2 text-[12px] text-zinc-300"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {setup.reason}
      </p>

      {setup.active_streak && (
        <div
          className="mt-3 grid gap-2 rounded-lg border border-sky-500/25 bg-sky-500/10 p-3 text-[11px] text-sky-100 sm:grid-cols-3"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <div>Active Since: {setup.active_streak.active_since ?? "—"}</div>
          <div>Active Day: {setup.active_streak.active_day ?? "—"}</div>
          <div>Entry: {setup.active_streak.entry_price != null ? `$${setup.active_streak.entry_price.toFixed(2)}` : "—"}</div>
        </div>
      )}

      <div className="mt-4">
        <p
          className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
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

      <div className="mt-4">
        <p
          className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
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

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <p
          className="mb-3 text-[10px] tracking-[0.1em] text-zinc-500"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          FORWARD RETURN SUMMARY
        </p>
        {setup.backtest.message && !showInstances ? (
          <p className="text-sm text-zinc-400">{setup.backtest.message}</p>
        ) : (
          <ForwardSummaryTable summary={setup.backtest.summary} />
        )}
      </div>

      {showInstances && (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <p
            className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
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
    </div>
  );
}

export default function BacktestClient() {
  const [tickerInput, setTickerInput] = useState("TSLA");
  const [selectedTicker, setSelectedTicker] = useState("TSLA");
  const [data, setData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async (ticker: string) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runScan(selectedTicker);
  }, [selectedTicker, runScan]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = tickerInput.toUpperCase().replace(/[^A-Z.^-]/g, "").slice(0, 10);
    if (!normalized) return;
    setTickerInput(normalized);
    setSelectedTicker(normalized);
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

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-10 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-center text-xl leading-10">📊</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ORB Backtest Explorer</h1>
              <p className="text-sm text-zinc-400">Auto-scan all 18 setups, compare peers, and run custom condition backtests.</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Section 1 · Auto-Scan</h2>
            <p className="text-sm text-zinc-400">Pick a ticker and we evaluate all ORB setups against current market conditions.</p>

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
                {loading ? "Scanning..." : "Run Auto-Scan"}
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
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="mb-2 text-[10px] tracking-[0.1em] text-emerald-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  RIGHT NOW · {data.ticker} · {data.date}
                </p>
                <p className="text-sm leading-relaxed text-zinc-100">{data.right_now.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">Mode: {data.right_now.suggestion}</span>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">Confidence: {data.right_now.confidence.toUpperCase()}</span>
                  <span className="rounded bg-zinc-900/60 px-2 py-1">Source: {data.source}</span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="mb-3 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  PEER COMPARISON (9 TICKERS)
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {data.peer_comparison.map((peer) => (
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
              </div>

              {data.scenarios.length > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                  <p className="mb-3 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    SCENARIO COMPARISON · CLOSEST HISTORICAL INSTANCES
                  </p>
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
                </div>
              )}

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="mb-2 text-[10px] tracking-[0.1em] text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  INDICATOR SNAPSHOT
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(data.indicators).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/70 px-2 py-1 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      <span className="text-zinc-500">{key.replace(/_/g, " ")}</span>
                      <span className="text-zinc-200">{typeof value === "number" ? value.toFixed(2) : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {groupedSetups.active.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-emerald-300">Active Setups ({groupedSetups.active.length})</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedSetups.active.map((setup) => (
                      <SetupCard key={setup.id} setup={setup} />
                    ))}
                  </div>
                </div>
              )}

              {groupedSetups.watching.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-amber-300">Watching Setups ({groupedSetups.watching.length})</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedSetups.watching.map((setup) => (
                      <SetupCard key={setup.id} setup={setup} />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-sm text-zinc-300">
                  Inactive setups: <span className="font-semibold text-zinc-100">{groupedSetups.inactive.length}</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {groupedSetups.inactive.map((setup) => setup.public_name || setup.name).join(" • ") || "—"}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Section 2 · Custom Explorer</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-400">
            Run ad-hoc conditions with indicator chips, timeframe controls, forward periods, and Save to Orb.
          </p>

          <BacktestExplorer onSaved={() => {}} />
        </section>
      </div>
    </div>
  );
}

