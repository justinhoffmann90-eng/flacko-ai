"use client";

import { useEffect, useState, ReactNode } from "react";
import PullToRefreshLib from "react-simple-pull-to-refresh";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [isStandalone, setIsStandalone] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect standalone mode on mount
  useEffect(() => {
    setMounted(true);
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // Default refresh handler
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      window.location.reload();
    }
  };

  // SSR safety + browser mode = just render children
  if (!mounted || !isStandalone) {
    return <>{children}</>;
  }

  // PWA mode - use the library
  return (
    <PullToRefreshLib
      onRefresh={handleRefresh}
      isPullable={!disabled}
      pullDownThreshold={70}
      maxPullDownDistance={120}
      resistance={2}
      pullingContent={<IOSSpinner spinning={false} />}
      refreshingContent={<IOSSpinner spinning={true} />}
      className="min-h-screen"
    >
      {children}
    </PullToRefreshLib>
  );
}

// iOS-style activity indicator
function IOSSpinner({ spinning }: { spinning: boolean }) {
  const lines = 12;
  const size = 28;
  
  return (
    <div className="flex justify-center py-3">
      <div 
        className={spinning ? "animate-spin" : ""}
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
    </div>
  );
}
