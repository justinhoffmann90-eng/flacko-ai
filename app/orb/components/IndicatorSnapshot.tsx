"use client";

import { useMemo, useState } from "react";
import type { IndicatorSnapshotData } from "./types";

type IndicatorSnapshotProps = {
  snapshot: IndicatorSnapshotData | null;
  isDesktop: boolean;
  desktopFont: (n: number) => number;
};

function valueColor(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "rgba(255,255,255,0.7)";
  if (value > 0) return "#22c55e";
  if (value < 0) return "#ef4444";
  return "rgba(255,255,255,0.8)";
}

export function IndicatorSnapshot({ snapshot, isDesktop, desktopFont }: IndicatorSnapshotProps) {
  const [open, setOpen] = useState(false);

  const fields = useMemo(() => {
    const format = (value: number | null, decimals = 2) => {
      if (value == null || !Number.isFinite(value)) return "—";
      return value.toFixed(decimals);
    };

    const formatSigned = (value: number | null, decimals = 2, suffix = "") => {
      if (value == null || !Number.isFinite(value)) return "—";
      return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}${suffix}`;
    };

    return [
      { label: "SMI Daily", value: format(snapshot?.smiDaily ?? null, 1), raw: snapshot?.smiDaily ?? null },
      { label: "SMI Weekly", value: format(snapshot?.smiWeekly ?? null, 1), raw: snapshot?.smiWeekly ?? null },
      { label: "SMI 4H", value: format(snapshot?.smi4h ?? null, 1), raw: snapshot?.smi4h ?? null },
      { label: "BXT Daily", value: format(snapshot?.bxtDaily ?? null, 2), raw: snapshot?.bxtDaily ?? null },
      { label: "BXT Weekly", value: format(snapshot?.bxtWeekly ?? null, 2), raw: snapshot?.bxtWeekly ?? null },
      { label: "RSI", value: format(snapshot?.rsi ?? null, 1), raw: snapshot?.rsi ?? null },
      { label: "EMA 9", value: format(snapshot?.ema9 ?? null, 2), raw: snapshot?.ema9 ?? null },
      { label: "EMA 13", value: format(snapshot?.ema13 ?? null, 2), raw: snapshot?.ema13 ?? null },
      { label: "EMA 21", value: format(snapshot?.ema21 ?? null, 2), raw: snapshot?.ema21 ?? null },
      { label: "VIX Close", value: format(snapshot?.vixClose ?? null, 2), raw: snapshot?.vixClose ?? null },
      {
        label: "VIX Weekly Δ",
        value: formatSigned(snapshot?.vixWeeklyChangePct ?? null, 2, "%"),
        raw: snapshot?.vixWeeklyChangePct ?? null,
      },
    ];
  }, [snapshot]);

  return (
    <div className="mb-4" style={{ animation: "fadeIn .45s ease" }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full text-left"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: isDesktop ? "12px 16px" : "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: desktopFont(11),
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.45)",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
            }}
          >
            CURRENT INDICATORS
          </div>
          {snapshot?.date && (
            <div
              style={{
                marginTop: 2,
                fontSize: desktopFont(10),
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              as of {snapshot.date}
            </div>
          )}
        </div>
        <span
          style={{
            color: "rgba(255,255,255,0.35)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s ease",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          style={{
            marginTop: 6,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: isDesktop ? "12px" : "10px",
            animation: "slideDown .25s ease",
          }}
        >
          {fields.map((field) => (
            <div
              key={field.label}
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: isDesktop ? "8px 10px" : "7px 8px",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <div
                style={{
                  fontSize: desktopFont(9),
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.07em",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 3,
                }}
              >
                {field.label}
              </div>
              <div
                style={{
                  fontSize: desktopFont(13),
                  fontWeight: 700,
                  color: valueColor(field.raw),
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.2,
                }}
              >
                {field.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

