"use client";

import { useMemo, useState } from "react";
import type { PeerComparisonData } from "./types";

type PeerComparisonProps = {
  peerComparison: PeerComparisonData | null;
  isDesktop: boolean;
  desktopFont: (n: number) => number;
};

function valueColor(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "rgba(255,255,255,0.7)";
  if (value > 0) return "#22c55e";
  if (value < 0) return "#ef4444";
  return "rgba(255,255,255,0.8)";
}

export function PeerComparison({ peerComparison, isDesktop, desktopFont }: PeerComparisonProps) {
  const [open, setOpen] = useState(false);

  const fields = useMemo(() => {
    const qqqRsi = peerComparison?.qqq?.rsi14 ?? null;
    const spyRsi = peerComparison?.spy?.rsi14 ?? null;
    const qqqAboveSma200 = peerComparison?.qqq?.aboveSma200 ?? null;
    const spyAboveSma200 = peerComparison?.spy?.aboveSma200 ?? null;

    const format = (value: number | null, decimals = 2) => {
      if (value == null || !Number.isFinite(value)) return "—";
      return value.toFixed(decimals);
    };

    const formatSigned = (value: number | null, decimals = 2, suffix = "") => {
      if (value == null || !Number.isFinite(value)) return "—";
      return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}${suffix}`;
    };

    const formatSmaState = (value: boolean | null) => {
      if (value == null) return "—";
      return value ? "ABOVE" : "BELOW";
    };

    return [
      {
        label: "QQQ Close",
        value: format(peerComparison?.qqq?.latestClose ?? null, 2),
        raw: null,
      },
      {
        label: "QQQ 1D Δ",
        value: formatSigned(peerComparison?.qqq?.change1dPct ?? null, 2, "%"),
        raw: peerComparison?.qqq?.change1dPct ?? null,
      },
      {
        label: "QQQ 5D Δ",
        value: formatSigned(peerComparison?.qqq?.change5dPct ?? null, 2, "%"),
        raw: peerComparison?.qqq?.change5dPct ?? null,
      },
      {
        label: "QQQ RSI(14)",
        value: format(qqqRsi, 1),
        raw: qqqRsi == null || !Number.isFinite(qqqRsi) ? null : qqqRsi - 50,
      },
      {
        label: "QQQ vs 200SMA",
        value: formatSmaState(qqqAboveSma200),
        raw: qqqAboveSma200 == null ? null : qqqAboveSma200 ? 1 : -1,
      },
      {
        label: "SPY Close",
        value: format(peerComparison?.spy?.latestClose ?? null, 2),
        raw: null,
      },
      {
        label: "SPY 1D Δ",
        value: formatSigned(peerComparison?.spy?.change1dPct ?? null, 2, "%"),
        raw: peerComparison?.spy?.change1dPct ?? null,
      },
      {
        label: "SPY 5D Δ",
        value: formatSigned(peerComparison?.spy?.change5dPct ?? null, 2, "%"),
        raw: peerComparison?.spy?.change5dPct ?? null,
      },
      {
        label: "SPY RSI(14)",
        value: format(spyRsi, 1),
        raw: spyRsi == null || !Number.isFinite(spyRsi) ? null : spyRsi - 50,
      },
      {
        label: "SPY vs 200SMA",
        value: formatSmaState(spyAboveSma200),
        raw: spyAboveSma200 == null ? null : spyAboveSma200 ? 1 : -1,
      },
      {
        label: "TSLA/QQQ Corr 20D",
        value: format(peerComparison?.correlation?.tsla_qqq_20d ?? null, 3),
        raw: peerComparison?.correlation?.tsla_qqq_20d ?? null,
      },
      {
        label: "TSLA/SPY Corr 20D",
        value: format(peerComparison?.correlation?.tsla_spy_20d ?? null, 3),
        raw: peerComparison?.correlation?.tsla_spy_20d ?? null,
      },
    ];
  }, [peerComparison]);

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
            PEER COMPARISON
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: desktopFont(10),
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            QQQ & SPY context for TSLA
          </div>
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
