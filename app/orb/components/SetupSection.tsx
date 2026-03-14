"use client";

import type { ReactNode } from "react";

type SetupSectionProps = {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  collapsedLabel?: string;
  expandedLabel?: string;
  isDesktop: boolean;
  desktopFont: (n: number) => number;
};

export function SetupSection({
  title,
  count,
  isExpanded,
  onToggle,
  children,
  collapsedLabel,
  expandedLabel,
  isDesktop,
  desktopFont,
}: SetupSectionProps) {
  if (count === 0) return null;

  const defaultLabel = `${title} (${count})`;
  const collapsedText = collapsedLabel ?? defaultLabel;
  const expandedText = expandedLabel ?? defaultLabel;

  return (
    <section className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: isDesktop ? "11px 14px" : "9px 12px",
        }}
      >
        <span
          style={{
            fontSize: desktopFont(11),
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.08em",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
          }}
        >
          {isExpanded ? expandedText : collapsedText}
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s ease",
          }}
        >
          ▾
        </span>
      </button>

      {isExpanded && <div className={isDesktop ? "space-y-3" : "space-y-2"}>{children}</div>}
    </section>
  );
}

