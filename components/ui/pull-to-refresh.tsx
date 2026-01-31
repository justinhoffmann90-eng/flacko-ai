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

  const THRESHOLD = 60; // px to trigger refresh
  const MAX_PULL = 120; // max visual pull distance

  // Detect if running as installed PWA (standalone mode)
  useEffect(() => {
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // Rubber band resistance - feels more natural like iOS
  const applyResistance = useCallback((distance: number): number => {
    if (distance <= 0) return 0;
    // Smoother logarithmic resistance
    const maxDistance = MAX_PULL * 2.5;
    return MAX_PULL * (1 - Math.exp(-distance / maxDistance * 2));
  }, []);

  // Only activate custom pull-to-refresh in standalone/PWA mode
  // In regular browser, let Safari's native pull-to-refresh handle it
  const isDisabled = disabled || !isStandalone;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isDisabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only activate if we're at the top of the page
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
        
        // Prevent default scroll when pulling down
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
        // Trigger refresh
        setIsRefreshing(true);
        setIsReleasing(true);
        setPullDistance(50); // Settle position for spinner
        
        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            window.location.reload();
          }
        } catch (error) {
          console.error("Refresh failed:", error);
        }
        
        // Animate out
        setIsRefreshing(false);
        await new Promise(r => setTimeout(r, 100));
        setPullDistance(0);
        setIsReleasing(false);
      } else {
        // Spring back
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

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showSpinner = pullDistance > 5 || isRefreshing;
  
  // Spinner positioning - starts hidden, slides down with content
  const spinnerY = Math.max(0, pullDistance - 15);
  const spinnerScale = isRefreshing ? 1 : Math.min(0.5 + (progress * 0.5), 1);
  const spinnerOpacity = isRefreshing ? 1 : Math.min(progress * 1.2, 1);

  // In browser mode, just render children - let native Safari pull-to-refresh work
  if (!isStandalone) {
    return <>{children}</>;
  }

  return (
    <div 
      ref={containerRef} 
      className="relative min-h-screen touch-pan-y"
      style={{
        // CSS custom property for safe area (set in globals.css or layout)
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* iOS-style spinner indicator - fixed position for PWA compatibility */}
      <div 
        className="fixed left-1/2 z-[100] pointer-events-none flex items-center justify-center"
        style={{ 
          top: `calc(env(safe-area-inset-top, 0px) + ${spinnerY}px)`,
          transform: 'translateX(-50%)',
          opacity: showSpinner ? spinnerOpacity : 0,
          transition: isReleasing 
            ? 'top 0.3s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease' 
            : 'opacity 0.1s ease',
        }}
      >
        <div 
          className="flex items-center justify-center w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border border-border/50"
          style={{
            transform: `scale(${spinnerScale})`,
            transition: isReleasing ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'transform 0.1s ease',
          }}
        >
          <AppleSpinner 
            progress={progress} 
            isSpinning={isRefreshing} 
            size={20}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isReleasing ? 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Apple-style activity indicator - thinner, more elegant
function AppleSpinner({ 
  progress, 
  isSpinning, 
  size = 20 
}: { 
  progress: number; 
  isSpinning: boolean; 
  size?: number;
}) {
  const lines = 12;
  const lineWidth = 2;
  const lineHeight = size * 0.28;
  
  return (
    <div 
      className="relative text-muted-foreground"
      style={{ 
        width: size, 
        height: size,
        animation: isSpinning ? 'spin 0.75s linear infinite' : 'none',
      }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const rotation = (i * 360) / lines;
        // Progressive reveal during pull
        const lineIndex = (lines - 1 - i);
        const lineOpacity = isSpinning 
          ? 0.15 + (0.85 * (1 - i / lines)) // Gradient for spinning
          : Math.max(0.15, Math.min(1, (progress * lines - lineIndex) * 0.5 + 0.15));
        
        return (
          <div
            key={i}
            className="absolute"
            style={{
              width: lineWidth,
              height: lineHeight,
              left: '50%',
              top: '50%',
              marginLeft: -lineWidth / 2,
              marginTop: -size / 2 + 1,
              borderRadius: lineWidth,
              backgroundColor: 'currentColor',
              opacity: lineOpacity,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `center ${size / 2 - 1}px`,
              transition: isSpinning ? 'none' : 'opacity 0.08s ease',
            }}
          />
        );
      })}
    </div>
  );
}
