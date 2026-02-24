/**
 * Card Templates for Image Cards Tab
 * These are React components that render visual cards for html2canvas capture
 */

import React from "react";

interface ModeCardData {
  mode: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  date: string;
  ticker: string;
  dailyCap: string;
  levels: Array<{
    name: string;
    price: number;
    type: "upside" | "downside" | "eject" | "close";
    pctFromClose?: number;
  }>;
  take?: {
    action?: string;
    caution?: string;
  };
}

interface LevelsCardData {
  callWall: number;
  hedgeWall: number;
  gammaStrike: number;
  putWall: number;
  currentPrice: number;
  date: string;
}

interface ScorecardData {
  weekEnding: string;
  scenariosHit: string;
  keyWins: string;
  keyMisses: string;
  summary?: string;
}

const modeColors = {
  GREEN: { bg: "#22c55e", class: "accumulation" },
  YELLOW: { bg: "#eab308", class: "yellow" },
  ORANGE: { bg: "#f97316", class: "orange" },
  RED: { bg: "#dc2626", class: "defensive" },
};

export const ModeCardTemplate: React.FC<{ data: ModeCardData }> = ({ data }) => {
  const modeColor = modeColors[data.mode];
  const nextSession = getNextSession(data.date);

  return (
    <div
      className="mode-card-template"
      style={{
        width: 1200,
        padding: 24,
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
        color: "#fff",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>⚔️ flacko ai</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 24 }}>
            <span style={{ fontSize: 20, fontWeight: 700 }}>{data.ticker}</span>
            <span style={{ fontSize: 14, color: "#888" }}>{data.date}</span>
            <span
              style={{
                fontSize: 12,
                color: "#4ade80",
                fontWeight: 600,
                padding: "4px 10px",
                background: "rgba(74,222,128,0.1)",
                borderRadius: 6,
                border: "1px solid rgba(74,222,128,0.3)",
              }}
            >
              📅 Gameplan for {nextSession}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 15, color: "#ccc" }}>
            Daily Cap: <span style={{ fontWeight: 700, color: "#fff" }}>{data.dailyCap}%</span>
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              textTransform: "uppercase",
              background: modeColor.bg,
            }}
          >
            {data.mode}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", gap: 20 }}>
        {/* Chart Panel - Levels Ladder */}
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            minHeight: 320,
            padding: "24px 28px",
          }}
        >
          {data.levels.map((level, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: 28,
                right: 28,
                top: 24 + idx * 56,
                height: 36,
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Level Label - Left Side */}
              <div
                style={{
                  width: 100,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background:
                      level.type === "upside"
                        ? "#22c55e"
                        : level.type === "downside"
                          ? "#ef4444"
                          : level.type === "eject"
                            ? "#f97316"
                            : "#3b82f6",
                    boxShadow:
                      level.type === "upside"
                        ? "0 0 8px rgba(34,197,94,0.5)"
                        : level.type === "downside"
                          ? "0 0 8px rgba(239,68,68,0.5)"
                          : level.type === "eject"
                            ? "0 0 8px rgba(249,115,22,0.5)"
                            : "0 0 8px rgba(59,130,246,0.5)",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      level.type === "upside"
                        ? "#22c55e"
                        : level.type === "downside"
                          ? "#ef4444"
                          : level.type === "eject"
                            ? "#f97316"
                            : "#fff",
                    letterSpacing: 0.3,
                  }}
                >
                  {level.name}
                </span>
              </div>

              {/* Horizontal Line */}
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: "0 16px",
                  background:
                    level.type === "upside"
                      ? "linear-gradient(90deg, #22c55e 0%, rgba(34,197,94,0.3) 70%, transparent 100%)"
                      : level.type === "downside"
                        ? "linear-gradient(90deg, #ef4444 0%, rgba(239,68,68,0.3) 70%, transparent 100%)"
                        : level.type === "eject"
                          ? "repeating-linear-gradient(90deg, #f97316 0px, #f97316 6px, transparent 6px, transparent 12px)"
                          : "linear-gradient(90deg, #3b82f6 0%, rgba(59,130,246,0.3) 70%, transparent 100%)",
                }}
              />

              {/* Price Badge - Right Side */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(0,0,0,0.7)",
                  padding: "6px 14px",
                  borderRadius: 6,
                  border:
                    level.type === "upside"
                      ? "1px solid rgba(34,197,94,0.4)"
                      : level.type === "downside"
                        ? "1px solid rgba(239,68,68,0.4)"
                        : level.type === "eject"
                          ? "1px solid rgba(249,115,22,0.4)"
                          : "1px solid rgba(59,130,246,0.4)",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color:
                      level.type === "upside"
                        ? "#22c55e"
                        : level.type === "downside"
                          ? "#ef4444"
                          : level.type === "eject"
                            ? "#f97316"
                            : "#fff",
                    fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
                    letterSpacing: 0.5,
                  }}
                >
                  ${level.price.toFixed(2)}
                </span>
                {level.pctFromClose !== undefined && level.type !== "close" && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: level.pctFromClose >= 0 ? "#22c55e" : "#ef4444",
                      background: level.pctFromClose >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {level.pctFromClose >= 0 ? "+" : ""}
                    {level.pctFromClose.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Panel */}
        <div style={{ width: 380, display: "flex", flexDirection: "column", gap: 12 }}>
          {(data.take?.action || data.take?.caution) && (
            <div
              style={{
                background: "rgba(124,58,237,0.06)",
                borderRadius: 12,
                border: "1px solid rgba(124,58,237,0.2)",
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#a78bfa",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 14,
                  fontWeight: 700,
                }}
              >
                🧠 FLACKO AI&apos;S TAKE
              </div>
              {data.take?.action && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 6,
                      color: "#22c55e",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    ✅ What I&apos;d Do
                  </div>
                  <div style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.5, fontWeight: 400 }}>
                    {data.take.action}
                  </div>
                </div>
              )}
              {data.take?.caution && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 6,
                      color: "#f97316",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    ⚠️ Would Change My Mind
                  </div>
                  <div style={{ fontSize: 14, color: "#e5e7eb", lineHeight: 1.5, fontWeight: 400 }}>
                    {data.take.caution}
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Key Levels
            </div>
            {data.levels
              .filter((l) => l.type !== "close")
              .map((level, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: idx < data.levels.length - 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background:
                        level.type === "upside" ? "#22c55e" : level.type === "downside" ? "#ef4444" : "#f97316",
                      boxShadow:
                        level.type === "upside"
                          ? "0 0 8px rgba(34,197,94,0.4)"
                          : level.type === "downside"
                            ? "0 0 8px rgba(239,68,68,0.4)"
                            : "0 0 8px rgba(249,115,22,0.4)",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#a1a1aa", fontWeight: 500 }}>{level.name}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#fff",
                            fontFamily: "'SF Mono', 'Monaco', 'Consolas', monospace",
                            letterSpacing: 0.5,
                          }}
                        >
                          ${level.price.toFixed(2)}
                        </span>
                        {level.pctFromClose !== undefined && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: level.pctFromClose >= 0 ? "#22c55e" : "#ef4444",
                              background: level.pctFromClose >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                              padding: "3px 6px",
                              borderRadius: 4,
                              minWidth: 44,
                              textAlign: "center",
                            }}
                          >
                            {level.pctFromClose >= 0 ? "+" : ""}
                            {level.pctFromClose.toFixed(1)}%
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#666" }}>
        <span>Your TSLA trading operating system. Join the gang:</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#999" }}>⚔️ flacko.ai</span>
      </div>
    </div>
  );
};

export const LevelsCardTemplate: React.FC<{ data: LevelsCardData }> = ({ data }) => {
  const levels = [
    { name: "Call Wall", price: data.callWall, color: "#22c55e" },
    { name: "Hedge Wall", price: data.hedgeWall, color: "#a78bfa" },
    { name: "Gamma Strike", price: data.gammaStrike, color: "#f97316" },
    { name: "Put Wall", price: data.putWall, color: "#ef4444" },
  ].sort((a, b) => b.price - a.price);

  const maxPrice = Math.max(...levels.map((l) => l.price), data.currentPrice) * 1.02;
  const minPrice = Math.min(...levels.map((l) => l.price), data.currentPrice) * 0.98;
  const range = maxPrice - minPrice;

  const getPosition = (price: number) => ((price - minPrice) / range) * 100;

  return (
    <div
      className="levels-card-template"
      style={{
        width: 800,
        padding: 32,
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
        color: "#fff",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        borderRadius: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>⚔️ flacko ai</div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 20, fontWeight: 600 }}>TSLA Key Levels</span>
        </div>
        <span style={{ fontSize: 14, color: "#888" }}>{data.date}</span>
      </div>

      {/* Visual Level Map */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          padding: 24,
          marginBottom: 24,
          position: "relative",
          height: 280,
        }}
      >
        {levels.map((level, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: `${getPosition(level.price)}%`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: level.color,
                boxShadow: `0 0 12px ${level.color}`,
              }}
            />
            <div style={{ flex: 1, height: 2, background: level.color, opacity: 0.5 }} />
            <div
              style={{
                background: "rgba(0,0,0,0.8)",
                padding: "6px 12px",
                borderRadius: 6,
                border: `2px solid ${level.color}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "#999" }}>{level.name}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: level.color }}>${level.price.toFixed(2)}</span>
            </div>
          </div>
        ))}

        {/* Current Price Marker */}
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: `${getPosition(data.currentPrice)}%`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#3b82f6",
              boxShadow: "0 0 16px #3b82f6",
            }}
          />
          <div style={{ flex: 1, height: 3, background: "#3b82f6" }} />
          <div
            style={{
              background: "#3b82f6",
              padding: "8px 16px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Current</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>${data.currentPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Level List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {levels.map((level, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: level.color,
              }}
            />
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>{level.name}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>${level.price.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#666",
        }}
      >
        <span>Key gamma levels for TSLA options positioning</span>
        <span style={{ fontWeight: 700 }}>⚔️ flacko.ai</span>
      </div>
    </div>
  );
};

export const ScorecardTemplate: React.FC<{ data: ScorecardData }> = ({ data }) => {
  const wins = data.keyWins.split("\n").filter((w) => w.trim());
  const misses = data.keyMisses.split("\n").filter((m) => m.trim());

  return (
    <div
      className="scorecard-template"
      style={{
        width: 800,
        padding: 32,
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
        color: "#fff",
        fontFamily: "'Segoe UI', 'Roboto', sans-serif",
        borderRadius: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>⚔️ flacko ai</div>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 20, fontWeight: 600 }}>Weekly Scorecard</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#888" }}>Week Ending</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{data.weekEnding}</div>
        </div>
      </div>

      {/* Score */}
      <div
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 14, color: "#888", marginBottom: 8 }}>Scenarios Hit</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: "#22c55e" }}>{data.scenariosHit}</div>
      </div>

      {/* Wins and Misses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Wins */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#22c55e",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ✅ Key Wins
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {wins.length > 0 ? (
              wins.map((win, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(34,197,94,0.05)",
                    border: "1px solid rgba(34,197,94,0.2)",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: "#d1d5db",
                  }}
                >
                  {win}
                </div>
              ))
            ) : (
              <div style={{ color: "#666", fontSize: 14, fontStyle: "italic" }}>No wins recorded</div>
            )}
          </div>
        </div>

        {/* Misses */}
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#ef4444",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            📉 Key Misses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {misses.length > 0 ? (
              misses.map((miss, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: "#d1d5db",
                  }}
                >
                  {miss}
                </div>
              ))
            ) : (
              <div style={{ color: "#666", fontSize: 14, fontStyle: "italic" }}>No misses recorded</div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 12, color: "#a78bfa", marginBottom: 8, fontWeight: 600 }}>Summary</div>
          <div style={{ fontSize: 14, color: "#d1d5db", lineHeight: 1.5 }}>{data.summary}</div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          color: "#666",
        }}
      >
        <span>Weekly trading performance review</span>
        <span style={{ fontWeight: 700 }}>⚔️ flacko.ai</span>
      </div>
    </div>
  );
};

function getNextSession(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return "Next Session";
  }
}
