import React from "react";

const MODE_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  ORANGE: "#f97316",
  RED: "#ef4444",
};

export interface DailyModeCardProps {
  mode: string;
  levels: {
    call_wall?: number | null;
    gamma_strike?: number | null;
    hedge_wall?: number | null;
    put_wall?: number | null;
  };
  posture: string;
  date: string;
  dailyCap: string | number;
}

function formatPrice(value?: number | null) {
  if (!value || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DailyModeCard({
  mode,
  levels,
  posture,
  date,
  dailyCap,
}: DailyModeCardProps) {
  const modeKey = mode?.toUpperCase() || "YELLOW";
  const modeColor = MODE_COLORS[modeKey] || MODE_COLORS.YELLOW;
  const dailyCapText = String(dailyCap).includes("%") ? String(dailyCap) : `${dailyCap}%`;

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
          <div style={{ fontSize: "20px", letterSpacing: "2px", fontWeight: 700 }}>
            FLACKO AI
          </div>
          <div style={{ fontSize: "14px", color: "#94a3b8" }}>{formatDate(date)}</div>
        </div>
        <div
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: modeColor,
            color: "#0b0b0f",
            fontWeight: 800,
            fontSize: "20px",
            letterSpacing: "1px",
          }}
        >
          {modeKey} MODE
        </div>
      </div>

      <div
        style={{
          border: `2px solid ${modeColor}`,
          borderRadius: "16px",
          padding: "28px",
          textAlign: "center",
          fontSize: "34px",
          fontWeight: 800,
          letterSpacing: "3px",
        }}
      >
        {modeKey}
      </div>

      <div style={{ display: "flex", gap: "32px" }}>
        <div
          style={{
            flex: 1,
            background: "#111827",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "16px",
            }}
          >
            Key Levels
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Call Wall</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(levels.call_wall)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Gamma Strike</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(levels.gamma_strike)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Hedge Wall</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(levels.hedge_wall)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Put Wall</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(levels.put_wall)}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            width: "360px",
            background: "#111827",
            borderRadius: "14px",
            padding: "24px",
            border: "1px solid #1f2937",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "12px",
              }}
            >
              Daily Cap
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800 }}>{dailyCapText}</div>
          </div>
          <div style={{ fontSize: "16px", color: "#cbd5f5", lineHeight: 1.4 }}>
            {posture}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", color: "#94a3b8" }}>
        flacko.ai
      </div>
    </div>
  );
}
