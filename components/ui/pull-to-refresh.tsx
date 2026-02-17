"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

const THRESHOLD = 60;
const MAX_PULL = 100;
const RESISTANCE = 0.4;

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshing) return;
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
      // Prevent native scroll while pulling
      e.preventDefault();
      setPullDistance(Math.min(dy * RESISTANCE, MAX_PULL));
    } else {
      // User scrolled up, cancel pull
      pullStartY.current = null;
      setPullDistance(0);
    }
  }, [disabled, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullStartY.current === null) return;
    
    if (pullDistance >= THRESHOLD && !refreshing && !disabled) {
      setReleasing(true);
      setRefreshing(true);
      setPullDistance(THRESHOLD); // Snap to threshold

      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Use Next.js soft refresh — re-fetches server components without full reload
          router.refresh();
          // Small delay so the spinner is visible (router.refresh is near-instant visually)
          await new Promise((r) => setTimeout(r, 600));
        }
      } catch {
        // Silently handle refresh errors
      }

      setRefreshing(false);
      setReleasing(false);
    }
    
    setPullDistance(0);
    pullStartY.current = null;
  }, [pullDistance, refreshing, disabled, onRefresh, router]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const pastThreshold = pullDistance >= THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden pointer-events-none"
        style={{
          height: refreshing ? THRESHOLD : pullDistance,
          transition: releasing || (!refreshing && pullDistance === 0) ? "height 0.3s cubic-bezier(0.2, 0, 0, 1)" : "none",
        }}
      >
        <div className="relative flex items-center justify-center w-8 h-8">
          {/* Circular progress / spinner */}
          <svg
            className={refreshing ? "animate-spin" : ""}
            width={28}
            height={28}
            viewBox="0 0 28 28"
            style={{
              transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
              transition: refreshing ? undefined : "transform 0.1s ease-out",
              animationDuration: "0.7s",
            }}
          >
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2.5"
            />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke={pastThreshold || refreshing ? "#22c55e" : "rgba(255,255,255,0.35)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(refreshing ? 0.7 : progress * 0.75) * 69.1} 69.1`}
              style={{
                transition: "stroke 0.2s ease",
              }}
            />
          </svg>
          {/* Arrow indicator when past threshold */}
          {pastThreshold && !refreshing && (
            <svg
              className="absolute"
              width={12}
              height={12}
              viewBox="0 0 12 12"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: Math.min((pullDistance - THRESHOLD) / 20 + 0.5, 1),
              }}
            >
              <path d="M6 9V3M3 5.5L6 2.5L9 5.5" />
            </svg>
          )}
        </div>
      </div>

      {/* Content with transform for smooth pull effect */}
      <div
        style={{
          transform: pullDistance > 0 || refreshing ? `translateY(0)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
