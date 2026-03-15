"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OrbScoreWidget } from "./components/OrbScoreWidget";
import { SetupCard } from "./components/SetupCard";
import { SetupSection } from "./components/SetupSection";
import type {
  OrbRow,
  OrbScoreData,
  PeerComparisonData,
  SetupHistory,
  Trade,
} from "./components/types";

export default function OrbClient() {
  const [rows, setRows] = useState<OrbRow[]>([]);
  const [orbScore, setOrbScore] = useState<OrbScoreData | null>(null);
  const [peerComparison, setPeerComparison] = useState<PeerComparisonData | null>(null);
  const [scoreExpanded, setScoreExpanded] = useState(false);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const [historyBySetup, setHistoryBySetup] = useState<Record<string, SetupHistory>>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [trackingTrades, setTrackingTrades] = useState<Trade[]>([]);
  const [activeSectionExpanded, setActiveSectionExpanded] = useState(true);
  const [watchingSectionExpanded, setWatchingSectionExpanded] = useState(true);
  const [inactiveSectionExpanded, setInactiveSectionExpanded] = useState(false);

  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlightHistory = useRef(new Set<string>());

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchLivePrice = async () => {
      try {
        const res = await fetch("/api/quote/tsla", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const nextPrice = Number(data?.price);
        if (mounted && Number.isFinite(nextPrice)) {
          setLivePrice(nextPrice);
        }
      } catch {
        // best-effort live quote
      }
    };

    fetchLivePrice();
    const interval = setInterval(fetchLivePrice, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const desktopFont = (mobilePx: number) => (isDesktop ? Math.round(mobilePx * 1.2) : mobilePx);

  const loadData = useCallback(async () => {
    const res = await fetch(`/api/orb/states`, { cache: "no-store", credentials: "include" });
    const data = await res.json();

    if (Array.isArray(data)) {
      setRows(data as OrbRow[]);
      setOrbScore(null);
      setTrackingTrades([]);
      setPeerComparison(null);
      return;
    }

    setRows(Array.isArray(data?.setups) ? data.setups : []);
    setOrbScore(data?.score ?? null);
    setTrackingTrades(Array.isArray(data?.trackingTrades) ? data.trackingTrades : []);
    setPeerComparison(data?.peerComparison ?? null);
  }, []);

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
  }, [loadData]);

  const trackingSetupIds = useMemo(() => new Set(trackingTrades.map((trade) => trade.setup_id)), [trackingTrades]);

  const trackingTradeMap = useMemo(() => {
    const out = new Map<string, Trade>();
    for (const trade of trackingTrades) {
      out.set(trade.setup_id, trade);
    }
    return out;
  }, [trackingTrades]);

  const sortedRows = useMemo(() => {
    const rank = (status: string, id: string) => {
      if (status === "active") return 0;
      if (trackingSetupIds.has(id)) return 1;
      if (status === "watching") return 2;
      return 3;
    };

    return [...rows].sort((a, b) => {
      const score = rank(a.state?.status || "inactive", a.id) - rank(b.state?.status || "inactive", b.id);
      if (score !== 0) return score;
      return a.number - b.number;
    });
  }, [rows, trackingSetupIds]);

  const activeTrackingRows = useMemo(
    () => sortedRows.filter((row) => row.state?.status === "active" || trackingSetupIds.has(row.id)),
    [sortedRows, trackingSetupIds]
  );

  const watchingRows = useMemo(
    () => sortedRows.filter((row) => row.state?.status === "watching" && !trackingSetupIds.has(row.id)),
    [sortedRows, trackingSetupIds]
  );

  const inactiveRows = useMemo(
    () =>
      sortedRows.filter((row) => {
        const status = row.state?.status || "inactive";
        return status === "inactive" && !trackingSetupIds.has(row.id);
      }),
    [sortedRows, trackingSetupIds]
  );

  const isSetupExpanded = useCallback(
    (row: OrbRow) => {
      const override = expandedById[row.id];
      if (typeof override === "boolean") return override;
      const status = row.state?.status || "inactive";
      return status === "active" || trackingSetupIds.has(row.id);
    },
    [expandedById, trackingSetupIds]
  );

  const ensureHistoryLoaded = useCallback(
    async (setupId: string) => {
      if (historyBySetup[setupId]) return;
      if (inFlightHistory.current.has(setupId)) return;

      inFlightHistory.current.add(setupId);
      try {
        const res = await fetch(`/api/orb/history/${setupId}`, { cache: "no-store" });
        const data = await res.json();
        setHistoryBySetup((prev) => ({
          ...prev,
          [setupId]: {
            trades: data.trades || [],
            signals: data.signals || [],
            backtest: data.backtest || [],
          },
        }));
      } finally {
        inFlightHistory.current.delete(setupId);
      }
    },
    [historyBySetup]
  );

  const handleToggleSetup = useCallback(
    (setupId: string, nextExpanded: boolean) => {
      setExpandedById((prev) => ({ ...prev, [setupId]: nextExpanded }));
      if (nextExpanded) {
        void ensureHistoryLoaded(setupId);
      }
    },
    [ensureHistoryLoaded]
  );

  useEffect(() => {
    for (const row of activeTrackingRows) {
      if (isSetupExpanded(row)) {
        void ensureHistoryLoaded(row.id);
      }
    }
  }, [activeTrackingRows, isSetupExpanded, ensureHistoryLoaded]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen p-4"
      style={{ background: "#0a0a0c", color: "#f0f0f0", fontFamily: "'Inter', system-ui, sans-serif", overscrollBehavior: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
              </a>
            )}
            <h1 style={{ fontSize: desktopFont(30), fontWeight: 800, letterSpacing: "-0.03em" }}>
              <span>🔮</span>
              <span style={{ background: "linear-gradient(135deg,#f0f0f0 0%, rgba(255,255,255,0.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> Orb</span>
            </h1>
            <span className="ml-auto hidden sm:inline" style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace" }}>LIVE SIGNAL TRACKER</span>
          </div>
          <p style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>13 buy setups + 6 avoid signals • TSLA</p>
        </div>

        {orbScore && (
          <OrbScoreWidget
            orbScore={orbScore}
            rows={rows}
            trackingTrades={trackingTrades}
            scoreExpanded={scoreExpanded}
            onToggleExpanded={() => setScoreExpanded((prev) => !prev)}
            isDesktop={isDesktop}
            desktopFont={desktopFont}
            
          />
        )}



        <div className={isDesktop ? "space-y-3" : "space-y-2"}>
          <SetupSection
            title="ACTIVE / TRACKING"
            count={activeTrackingRows.length}
            isExpanded={activeSectionExpanded}
            onToggle={() => setActiveSectionExpanded((prev) => !prev)}
            isDesktop={isDesktop}
            desktopFont={desktopFont}
          >
            {activeTrackingRows.map((row, index) => (
              <SetupCard
                key={row.id}
                row={row}
                index={index}
                expanded={isSetupExpanded(row)}
                onToggle={handleToggleSetup}
                history={historyBySetup[row.id]}
                isDesktop={isDesktop}
                desktopFont={desktopFont}
                livePrice={livePrice}
                trackingTrade={trackingTradeMap.get(row.id)}
              />
            ))}
          </SetupSection>

          <SetupSection
            title="WATCHING"
            count={watchingRows.length}
            isExpanded={watchingSectionExpanded}
            onToggle={() => setWatchingSectionExpanded((prev) => !prev)}
            isDesktop={isDesktop}
            desktopFont={desktopFont}
          >
            {watchingRows.map((row, index) => (
              <SetupCard
                key={row.id}
                row={row}
                index={index}
                expanded={isSetupExpanded(row)}
                onToggle={handleToggleSetup}
                history={historyBySetup[row.id]}
                isDesktop={isDesktop}
                desktopFont={desktopFont}
                livePrice={livePrice}
                trackingTrade={trackingTradeMap.get(row.id)}
              />
            ))}
          </SetupSection>

          <SetupSection
            title="INACTIVE"
            count={inactiveRows.length}
            isExpanded={inactiveSectionExpanded}
            onToggle={() => setInactiveSectionExpanded((prev) => !prev)}
            collapsedLabel={`Show ${inactiveRows.length} inactive setups`}
            expandedLabel={`Hide ${inactiveRows.length} inactive setups`}
            isDesktop={isDesktop}
            desktopFont={desktopFont}
          >
            {inactiveRows.map((row, index) => (
              <SetupCard
                key={row.id}
                row={row}
                index={index}
                expanded={isSetupExpanded(row)}
                onToggle={handleToggleSetup}
                history={historyBySetup[row.id]}
                isDesktop={isDesktop}
                desktopFont={desktopFont}
                livePrice={livePrice}
                trackingTrade={trackingTradeMap.get(row.id)}
              />
            ))}
          </SetupSection>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/50" style={{ fontSize: desktopFont(11), color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace" }}>
          <p>Data: TSLA daily bars | BX-Trender computed from OHLCV | SMI: 10/3/3</p>
          <p className="mt-1">Past performance does not guarantee future results. All statistics are from backtesting.</p>
        </div>
      </div>
    </div>
  );
}
