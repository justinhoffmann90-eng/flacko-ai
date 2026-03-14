"use client";

import { useState } from "react";

type Playbook = {
  setup: string;
  calls: string;
  leveraged: string;
  bottom: string;
  bottomLabel: string;
};

type OptionsPlaybookProps = {
  pb: Playbook;
  hex: string;
  isDesktop: boolean;
  desktopFont: (n: number) => number;
};

export function OptionsPlaybook({ pb, hex, isDesktop, desktopFont }: OptionsPlaybookProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3" style={{ animation: "fadeIn .4s ease" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: isDesktop ? "12px 16px" : "10px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: desktopFont(11),
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
          }}
        >
          OPTIONS PLAYBOOK
        </span>
        <span
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.45)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s ease",
          }}
        >
          &#x25BE;
        </span>
      </button>

      {open && (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderTop: "none",
            borderRadius: "0 0 10px 10px",
            padding: isDesktop ? "16px 18px" : "14px 14px",
            animation: "slideDown .25s ease",
          }}
        >
          <div
            style={{
              fontSize: desktopFont(12),
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
              marginBottom: 14,
              fontStyle: "italic",
            }}
          >
            {pb.setup}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: desktopFont(10),
                letterSpacing: "0.08em",
                color: hex,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              CALLS
            </div>
            <div style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{pb.calls}</div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: desktopFont(10),
                letterSpacing: "0.08em",
                color: hex,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              TSLL / LEVERAGED ETF
            </div>
            <div style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{pb.leveraged}</div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
            <div
              style={{
                fontSize: desktopFont(10),
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {pb.bottomLabel}
            </div>
            <div style={{ fontSize: desktopFont(12), color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{pb.bottom}</div>
          </div>
        </div>
      )}
    </div>
  );
}

