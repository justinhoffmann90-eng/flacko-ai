"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const THRESHOLD = 80; // px to trigger refresh
  const MAX_PULL = 120; // max pull distance

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only activate if we're at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;
      
      if (diff > 0 && window.scrollY === 0) {
        // Apply resistance to pull
        const distance = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(distance);
        
        // Prevent default scroll when pulling
        if (distance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      
      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(60); // Keep spinner visible
        
        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default: reload the page
            window.location.reload();
          }
        } catch (error) {
          console.error("Refresh failed:", error);
        }
        
        setIsRefreshing(false);
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullDistance, isRefreshing, onRefresh, disabled]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center transition-transform duration-200 z-50"
        style={{ 
          transform: `translateY(${Math.max(pullDistance - 40, -40)}px)`,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full 
          bg-background/95 border border-border shadow-lg
          ${isRefreshing ? 'animate-spin' : ''}
        `}>
          <RefreshCw 
            className={`h-5 w-5 text-muted-foreground transition-transform`}
            style={{ 
              transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
