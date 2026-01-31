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
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 70; // px to trigger refresh
  const MAX_PULL = 130; // max visual pull distance

  // Rubber band resistance - feels more natural like iOS
  const applyResistance = useCallback((distance: number): number => {
    if (distance <= 0) return 0;
    // Logarithmic resistance for that stretchy feel
    const resistance = 0.55;
    return Math.min(distance * resistance * (1 - distance / (MAX_PULL * 3)), MAX_PULL);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

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
        setPullDistance(55); // Settle position for spinner
        
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
        await new Promise(r => setTimeout(r, 150));
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
  }, [pullDistance, isRefreshing, onRefresh, disabled, applyResistance]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showSpinner = pullDistance > 8 || isRefreshing;
  
  // Scale from 0.3 to 1 as user pulls
  const spinnerScale = isRefreshing ? 1 : 0.3 + (progress * 0.7);
  const spinnerOpacity = isRefreshing ? 1 : Math.min(progress * 1.5, 1);

  return (
    <div ref={containerRef} className="relative min-h-screen touch-pan-y">
      {/* iOS-style spinner indicator */}
      <div 
        className="absolute left-1/2 z-50 pointer-events-none"
        style={{ 
          transform: `translateX(-50%) translateY(${pullDistance - 45}px)`,
          opacity: showSpinner ? spinnerOpacity : 0,
          transition: isReleasing ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'opacity 0.15s ease',
        }}
      >
        <div 
          className="flex items-center justify-center"
          style={{
            transform: `scale(${spinnerScale})`,
            transition: isReleasing ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        >
          <AppleSpinner 
            progress={progress} 
            isSpinning={isRefreshing} 
            size={28}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isReleasing ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Apple-style activity indicator
function AppleSpinner({ 
  progress, 
  isSpinning, 
  size = 28 
}: { 
  progress: number; 
  isSpinning: boolean; 
  size?: number;
}) {
  const lines = 12;
  
  return (
    <div 
      className={`relative ${isSpinning ? 'animate-spin' : ''}`}
      style={{ 
        width: size, 
        height: size,
        animationDuration: '0.8s',
      }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const rotation = (i * 360) / lines;
        // When pulling, reveal lines progressively
        const lineProgress = isSpinning ? 1 : Math.max(0, (progress * lines - (lines - 1 - i)) / 1);
        const opacity = isSpinning 
          ? 0.25 + (0.75 * ((lines - i) / lines)) // Gradient for spinning
          : Math.min(lineProgress, 0.2 + (0.6 * ((lines - i) / lines))); // Reveal during pull
        
        return (
          <div
            key={i}
            className="absolute left-1/2 top-0 origin-bottom"
            style={{
              width: 2.5,
              height: size / 2 - 2,
              marginLeft: -1.25,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `center ${size / 2}px`,
            }}
          >
            <div
              className="w-full rounded-full bg-current"
              style={{
                height: '35%',
                opacity: opacity,
                transition: isSpinning ? 'none' : 'opacity 0.1s ease',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
