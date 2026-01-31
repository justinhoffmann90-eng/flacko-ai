"use client";

import { useEffect } from "react";

interface ModeProviderProps {
  mode?: string | null;
  children: React.ReactNode;
}

export function ModeProvider({ mode, children }: ModeProviderProps) {
  useEffect(() => {
    // Set data-mode attribute on document for CSS theming
    if (mode) {
      const normalizedMode = mode.toLowerCase().replace(' mode', '').trim();
      document.documentElement.setAttribute('data-mode', normalizedMode);
    } else {
      document.documentElement.removeAttribute('data-mode');
    }

    return () => {
      document.documentElement.removeAttribute('data-mode');
    };
  }, [mode]);

  return <>{children}</>;
}

// Hook to get mode colors programmatically
export function getModeColors(mode: string | null | undefined) {
  const normalizedMode = mode?.toLowerCase().replace(' mode', '').trim();
  
  const colors = {
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      border: 'border-green-500/30',
      solid: 'bg-green-500',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500',
      border: 'border-yellow-500/30',
      solid: 'bg-yellow-500',
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-500',
      border: 'border-orange-500/30',
      solid: 'bg-orange-500',
    },
    red: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      border: 'border-red-500/30',
      solid: 'bg-red-500',
    },
  };

  return colors[normalizedMode as keyof typeof colors] || colors.green;
}
