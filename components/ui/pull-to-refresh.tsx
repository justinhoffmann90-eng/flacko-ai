"use client";

import { useEffect, useState, useRef, useCallback, ReactNode } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    // Only start pull if we're at the top of the page
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, [disabled, refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === null || disabled || refreshing) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (dy > 0 && scrollTop <= 0) {
      setPullDistance(Math.min(dy * 0.5, 80));
    }
  }, [disabled, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 50 && !refreshing && !disabled) {
      setRefreshing(true);
      setPullDistance(50);
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
      setRefreshing(false);
    }
    setPullDistance(0);
    pullStartY.current = null;
  }, [pullDistance, refreshing, disabled, onRefresh]);

  return (
    <div
      ref={containerRef}
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
              animationDuration: "0.7s",
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
