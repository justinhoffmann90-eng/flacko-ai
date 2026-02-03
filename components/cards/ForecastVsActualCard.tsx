import React from "react";
import type { ForecastLevelResult } from "@/lib/accuracy/compareLevels";

export interface ForecastVsActualCardProps {
  date: string;
  mode: string;
  modeEmoji: string;
  modeAssessment: string;
  accuracy: {
    total: number;
    held: number;
    notTested: number;
    broken: number;
    percentage: number;
  };
  results: ForecastLevelResult[];
  actual: {
    high: number;
    low: number;
    close: number;
  };
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(value?: number | null) {
  if (!value && value !== 0) return "—";
  return `$${value.toFixed(2)}`;
}

function statusIcon(status: ForecastLevelResult["status"]) {
  if (status === "held") return "✅";
  if (status === "broken") return "❌";
  return "➖";
}

function statusText(result: ForecastLevelResult) {
  if (result.status === "not_tested") return "Not tested";
  const label = result.type === "resistance" ? "High" : "Low";
  return `${label}: ${formatPrice(result.actualPrice ?? null)}`;
}

export default function ForecastVsActualCard({
  date,
  mode,
  modeEmoji,
  modeAssessment,
  accuracy,
  results,
  actual,
}: ForecastVsActualCardProps) {
  const accuracyCount = accuracy.held + accuracy.notTested;

  return (
    <div
      style={{
        width: "1200px",
        height: "675px",
        background: "#0b0b0f",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        padding: "48px",
        fontFamily: "Inter, Arial, sans-serif",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "18px", letterSpacing: "3px", fontWeight: 700 }}>
            FLACKO AI — FORECAST VS ACTUAL
          </div>
          <div style={{ fontSize: "14px", color: "#94a3b8" }}>{formatDate(date)}</div>
        </div>
        <div style={{ fontSize: "14px", color: "#94a3b8" }}>TSLA</div>
      </div>

      <div style={{ display: "flex", gap: "28px", marginTop: "20px" }}>
        <div
          style={{
            flex: 1,
            background: "#111827",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "14px",
            }}
          >
            Morning Forecast
          </div>
          <div style={{ display: "grid", gap: "14px", fontSize: "20px" }}>
            {results.map((result) => (
              <div key={result.name} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{result.name}</span>
                <span style={{ fontWeight: 700 }}>{formatPrice(result.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#111827",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "14px",
            }}
          >
            End of Day Actual
          </div>
          <div style={{ display: "grid", gap: "14px", fontSize: "18px" }}>
            {results.map((result) => (
              <div
                key={result.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "14px", color: "#cbd5f5" }}>{result.name}</span>
                  <span style={{ fontWeight: 600 }}>{statusText(result)}</span>
                </div>
                <div style={{ fontSize: "22px" }}>{statusIcon(result.status)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "24px" }}>
        <div
          style={{
            flex: 1,
            background: "#0f172a",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "12px", color: "#94a3b8", letterSpacing: "2px" }}>
            MODE
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "6px" }}>
            {modeEmoji} {mode.toUpperCase()} → {modeAssessment}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: "#0f172a",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "12px", color: "#94a3b8", letterSpacing: "2px" }}>
            ACCURACY
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "6px" }}>
            {accuracyCount}/{accuracy.total} levels ({accuracy.percentage.toFixed(0)}%)
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
        <div style={{ color: "#94a3b8", fontSize: "12px" }}>
          High {formatPrice(actual.high)} · Low {formatPrice(actual.low)} · Close {formatPrice(actual.close)}
        </div>
        <div style={{ color: "#94a3b8", fontSize: "12px" }}>flacko.ai</div>
      </div>
    </div>
  );
}
