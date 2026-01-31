"use client";

import { useEffect, useState, useRef, ReactNode, useCallback } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentPull = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80;
  const MAX_PULL = 140;
  const RESISTANCE = 0.55;

  // Detect standalone mode
  useEffect(() => {
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  const isDisabled = disabled || !isStandalone;

  // Direct DOM manipulation for smooth 60fps animation
  const updateVisuals = useCallback((distance: number) => {
    if (!contentRef.current || !spinnerRef.current) return;
    
    const progress = Math.min(distance / THRESHOLD, 1);
    const spinnerY = distance / 2 - 10;
    
    // Direct style updates (no React re-render)
    contentRef.current.style.transform = distance > 0 ? `translateY(${distance}px)` : '';
    spinnerRef.current.style.transform = `translateX(-50%) translateY(${Math.max(spinnerY, 5)}px)`;
    spinnerRef.current.style.opacity = distance > 10 ? String(Math.min(progress * 1.3, 1)) : '0';
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isDisabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
        
        // Remove transitions during drag
        if (contentRef.current) contentRef.current.style.transition = 'none';
        if (spinnerRef.current) spinnerRef.current.style.transition = 'none';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;
      
      const touchY = e.touches[0].clientY;
      const rawDiff = touchY - startY.current;
      
      if (rawDiff > 0 && window.scrollY <= 0) {
        // Apply resistance
        const distance = Math.min(rawDiff * RESISTANCE, MAX_PULL);
        currentPull.current = distance;
        
        // Update visuals directly (not through React state)
        updateVisuals(distance);
        
        if (distance > 5) {
          e.preventDefault();
        }
      } else {
        currentPull.current = 0;
        updateVisuals(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;
      
      const finalPull = currentPull.current;
      
      // Re-enable transitions for release animation
      if (contentRef.current) {
        contentRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      }
      if (spinnerRef.current) {
        spinnerRef.current.style.transition = 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
      }
      
      if (finalPull >= THRESHOLD && !isRefreshing) {
        // Hold at refresh position
        updateVisuals(65);
        setIsRefreshing(true);
        
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
      }
      
      // Snap back
      currentPull.current = 0;
      updateVisuals(0);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isRefreshing, onRefresh, isDisabled, updateVisuals]);

  // Browser mode - just render children
  if (!isStandalone) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative min-h-screen touch-pan-y overflow-hidden">
      {/* Spinner */}
      <div 
        ref={spinnerRef}
        className="fixed left-1/2 z-50 pointer-events-none"
        style={{ 
          top: 'env(safe-area-inset-top, 0px)',
          opacity: 0,
        }}
      >
        <IOSSpinner isSpinning={isRefreshing} size={30} />
      </div>

      {/* Content */}
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
}

// Simple iOS spinner
function IOSSpinner({ isSpinning, size = 30 }: { isSpinning: boolean; size?: number }) {
  const lines = 12;
  
  return (
    <div 
      className={isSpinning ? "animate-spin" : ""}
      style={{ 
        width: size, 
        height: size,
        animationDuration: '0.8s',
        animationTimingFunction: 'steps(12)',
      }}
    >
      {Array.from({ length: lines }).map((_, i) => {
        const rotation = (i * 360) / lines;
        const opacity = 0.15 + (0.85 * (1 - i / lines));
        
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 2.5,
              height: size * 0.28,
              left: '50%',
              top: '50%',
              marginLeft: -1.25,
              marginTop: -size / 2 + size * 0.18,
              borderRadius: 2,
              backgroundColor: '#8E8E93',
              opacity,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `center ${size / 2 - size * 0.18}px`,
            }}
          />
        );
      })}
    </div>
  );
}
