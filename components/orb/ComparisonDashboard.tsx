"use client";

import { useCallback, useMemo, useState } from "react";

const SUBSCRIBE_URL = "/signup";

interface ComparisonTicker {
  ticker: string;
  close: number;
  change_pct: number;
  mode: string;
  buy_active: number;
  avoid_active: number;
  watching: number;
  recommendation_short: string;
  seasonality_30d: number | null;
}

interface ComparisonDashboardProps {
  tickers: ComparisonTicker[];
  isSubscriber: boolean;
  onTickerClick?: (ticker: string) => void;
}

type SortKey = "ticker" | "close" | "change_pct" | "mode" | "buy_active" | "avoid_active" | "watching" | "seasonality_30d" | "recommendation_short";

const MODE_ORDER: Record<string, number> = {
  GREEN_EXTENDED: 0, GREEN: 1, YELLOW: 2, ORANGE: 3, RED: 4, EJECTED: 5,
};

function modeBadge(mode: string) {
  const label = mode.replace("_EXTENDED", " EXT").replace("_", " ");
  switch (mode) {
    case "GREEN":
    case "GREEN_EXTENDED":
      return { label, cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" };
    case "YELLOW":
      return { label, cls: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300" };
    case "ORANGE":
      return { label, cls: "border-orange-500/40 bg-orange-500/15 text-orange-300" };
    case "RED":
    case "EJECTED":
      return { label, cls: "border-red-500/40 bg-red-500/15 text-red-300" };
    default:
      return { label, cls: "border-zinc-600/40 bg-zinc-700/15 text-zinc-300" };
  }
}

function recBadge(rec: string) {
  switch (rec) {
    case "Buy":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "Lean Buy":
      return "border-emerald-500/20 bg-emerald-500/5 text-emerald-400";
    case "Wait":
      return "border-zinc-600/30 bg-zinc-700/10 text-zinc-300";
    case "Reduce Risk":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-zinc-600/30 bg-zinc-700/10 text-zinc-300";
  }
}

function fmtPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "--";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function ComparisonDashboard({ tickers, isSubscriber, onTickerClick }: ComparisonDashboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "ticker");
    }
  }, [sortKey, sortAsc]);

  const sorted = useMemo(() => {
    const items = [...tickers];
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "ticker": cmp = a.ticker.localeCompare(b.ticker); break;
        case "close": cmp = a.close - b.close; break;
        case "change_pct": cmp = a.change_pct - b.change_pct; break;
        case "mode": cmp = (MODE_ORDER[a.mode] ?? 9) - (MODE_ORDER[b.mode] ?? 9); break;
        case "buy_active": cmp = a.buy_active - b.buy_active; break;
        case "avoid_active": cmp = a.avoid_active - b.avoid_active; break;
        case "watching": cmp = a.watching - b.watching; break;
        case "seasonality_30d": cmp = (a.seasonality_30d ?? -999) - (b.seasonality_30d ?? -999); break;
        case "recommendation_short": cmp = a.recommendation_short.localeCompare(b.recommendation_short); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return items;
  }, [tickers, sortKey, sortAsc]);

  // Non-subscribers see top 3 tickers only
  const visibleTickers = isSubscriber ? sorted : sorted.slice(0, 3);
  const hiddenCount = isSubscriber ? 0 : Math.max(0, sorted.length - 3);

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortAsc ? " ▲" : " ▼";
  };

  const headers: { key: SortKey; label: string; align: string }[] = [
    { key: "ticker", label: "Ticker", align: "text-left" },
    { key: "close", label: "Price", align: "text-right" },
    { key: "change_pct", label: "Change", align: "text-right" },
    { key: "mode", label: "Mode", align: "text-center" },
    { key: "buy_active", label: "Buy", align: "text-center" },
    { key: "avoid_active", label: "Caution", align: "text-center" },
    { key: "watching", label: "Watch", align: "text-center" },
    { key: "seasonality_30d", label: "30D Seas.", align: "text-right" },
    { key: "recommendation_short", label: "Rec.", align: "text-center" },
  ];

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800">
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={`py-2.5 px-2 ${h.align} cursor-pointer hover:text-zinc-300 transition select-none whitespace-nowrap`}
                  onClick={() => handleSort(h.key)}
                >
                  {h.label}{sortArrow(h.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleTickers.map((t) => {
              const mb = modeBadge(t.mode);
              return (
                <tr
                  key={t.ticker}
                  className="border-b border-zinc-900/70 hover:bg-zinc-800/30 transition cursor-pointer"
                  onClick={() => onTickerClick?.(t.ticker)}
                >
                  <td className="py-2.5 px-2 text-left font-semibold text-zinc-100">{t.ticker}</td>
                  <td className="py-2.5 px-2 text-right text-zinc-200">${t.close.toFixed(2)}</td>
                  <td className={`py-2.5 px-2 text-right ${t.change_pct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {fmtPct(t.change_pct)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${mb.cls}`}>
                      {mb.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {t.buy_active > 0 ? (
                      <span className="text-emerald-300 font-semibold">{t.buy_active}</span>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {t.avoid_active > 0 ? (
                      <span className="text-red-300 font-semibold">{t.avoid_active}</span>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {t.watching > 0 ? (
                      <span className="text-amber-300">{t.watching}</span>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>
                  <td className={`py-2.5 px-2 text-right ${(t.seasonality_30d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {fmtPct(t.seasonality_30d)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${recBadge(t.recommendation_short)}`}>
                      {t.recommendation_short}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {/* Sort selector */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-zinc-500 tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            SORT BY:
          </span>
          <select
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300"
            value={sortKey}
            onChange={(e) => { setSortKey(e.target.value as SortKey); setSortAsc(false); }}
          >
            {headers.map((h) => (
              <option key={h.key} value={h.key}>{h.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            {sortAsc ? "▲ Asc" : "▼ Desc"}
          </button>
        </div>

        {visibleTickers.map((t) => {
          const mb = modeBadge(t.mode);
          return (
            <div
              key={t.ticker}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 cursor-pointer hover:bg-zinc-800/30 transition"
              onClick={() => onTickerClick?.(t.ticker)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {t.ticker}
                  </span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${mb.cls}`}>
                    {mb.label}
                  </span>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${recBadge(t.recommendation_short)}`}>
                  {t.recommendation_short}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <div>
                  <span className="text-zinc-500">Price </span>
                  <span className="text-zinc-200">${t.close.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Change </span>
                  <span className={t.change_pct >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {fmtPct(t.change_pct)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Buy </span>
                  <span className={t.buy_active > 0 ? "text-emerald-300 font-semibold" : "text-zinc-600"}>
                    {t.buy_active}
                  </span>
                  {t.avoid_active > 0 && (
                    <>
                      <span className="text-zinc-500"> / Caution </span>
                      <span className="text-red-300 font-semibold">{t.avoid_active}</span>
                    </>
                  )}
                </div>
                <div>
                  <span className="text-zinc-500">30D </span>
                  <span className={(t.seasonality_30d ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"}>
                    {fmtPct(t.seasonality_30d)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Non-subscriber gate */}
      {hiddenCount > 0 && (
        <div className="mt-4 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg">🔒</span>
            <p className="text-sm text-zinc-300">
              {hiddenCount} more ticker{hiddenCount > 1 ? "s" : ""} available with a subscription
            </p>
          </div>
          <a
            href={SUBSCRIBE_URL}
            className="inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
          >
            Subscribe to Flacko AI →
          </a>
        </div>
      )}
    </div>
  );
}
