"use client";

import { useEffect, useState, useRef, ReactNode, useCallback } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80; // px to trigger refresh
  const MAX_PULL = 150; // max visual pull distance

  // Detect if running as installed PWA (standalone mode)
  useEffect(() => {
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // Lighter resistance for more natural iOS-like pull
  const applyResistance = useCallback((distance: number): number => {
    if (distance <= 0) return 0;
    // Less resistance = more movement like native iOS
    const factor = 0.6;
    return Math.min(distance * factor, MAX_PULL);
  }, []);

  // Only activate in standalone/PWA mode
  const isDisabled = disabled || !isStandalone;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isDisabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
        setIsReleasing(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const rawDiff = currentY - startY.current;
      
      if (rawDiff > 0 && window.scrollY <= 0) {
        const distance = applyResistance(rawDiff);
        setPullDistance(distance);
        
        if (distance > 5) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      
      const currentPull = pullDistance;
      
      if (currentPull >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setIsReleasing(true);
        setPullDistance(70); // Hold position while refreshing
        
        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            window.location.reload();
          }
        } catch (error) {
          console.error("Refresh failed:", error);
        }
        
        setIsRefreshing(false);
        await new Promise(r => setTimeout(r, 100));
        setPullDistance(0);
        setIsReleasing(false);
      } else {
        setIsReleasing(true);
        setPullDistance(0);
        setTimeout(() => setIsReleasing(false), 300);
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh, isDisabled, applyResistance]);

  // In browser mode, just render children - let Safari's native work
  if (!isStandalone) {
    return <>{children}</>;
  }

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showSpinner = pullDistance > 10 || isRefreshing;
  
  // Spinner in the gap that opens up (centered in pull area)
  const spinnerY = pullDistance / 2 - 15;

  return (
    <div ref={containerRef} className="relative min-h-screen touch-pan-y overflow-x-hidden">
      {/* iOS-style spinner - positioned in the gap that opens */}
      <div 
        className="absolute left-1/2 z-50 pointer-events-none"
        style={{ 
          top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(spinnerY, 10)}px)`,
          transform: 'translateX(-50%)',
          opacity: showSpinner ? Math.min(progress * 1.5, 1) : 0,
          transition: isReleasing ? 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'opacity 0.1s',
        }}
      >
        <IOSSpinner 
          progress={progress} 
          isSpinning={isRefreshing} 
          size={32}
        />
      </div>

      {/* Content moves down with pull */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isReleasing ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Native iOS activity indicator style - no background, just the spinner
function IOSSpinner({ 
  progress, 
  isSpinning, 
  size = 32 
}: { 
  progress: number; 
  isSpinning: boolean; 
  size?: number;
}) {
  const lines = 12;
  const lineWidth = 2.5;
  const lineHeight = size * 0.3;
  const innerRadius = size * 0.22;
  
  return (
    <div 
      className={isSpinning ? "animate-spin" : ""}
      style={{ 
        width: size, 
        height: size,
        animationDuration: isSpinning ? '1s' : undefined,
        animationTimingFunction: isSpinning ? 'steps(12)' : undefined,
      }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const rotation = (i * 360) / lines;
        // Gradient opacity - darkest at top, fading around
        const baseOpacity = isSpinning 
          ? 0.1 + (0.9 * (1 - i / lines))
          : Math.max(0.1, progress * (1 - i / (lines * 1.2)));
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: lineWidth,
              height: lineHeight,
              left: '50%',
              top: '50%',
              marginLeft: -lineWidth / 2,
              marginTop: -size / 2 + innerRadius,
              borderRadius: lineWidth,
              backgroundColor: '#8E8E93', // iOS gray
              opacity: baseOpacity,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `center ${size / 2 - innerRadius}px`,
            }}
          />
        );
      })}
    </div>
  );
}
