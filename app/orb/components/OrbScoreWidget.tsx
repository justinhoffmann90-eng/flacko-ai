"use client";

import { getZoneDisplay, SETUP_TYPES, THRESHOLDS, WEIGHTS } from "@/lib/orb/score";
import type { OrbRow, OrbScoreData, PeerComparisonData, Trade } from "./types";

type OrbScoreWidgetProps = {
  orbScore: OrbScoreData;
  rows: OrbRow[];
  trackingTrades: Trade[];
  scoreExpanded: boolean;
  onToggleExpanded: () => void;
  isDesktop: boolean;
  desktopFont: (n: number) => number;
  /** @deprecated removed — peer data doesn't belong in Orb widget */
  peerComparison?: PeerComparisonData | null;
};

const zoneConfig: Record<
  string,
  { emoji: string; label: string; hex: string; action: string; statsLine: string; description: string; whatToWatch: string }
> = {
  FULL_SEND: {
    emoji: "🟢",
    label: "FULL SEND",
    hex: "#22c55e",
    action: "Deploy leveraged positions.",
    statsLine: "+16.28% avg at 60d · 67% win rate · 15% of trading days",
    description:
      "Multiple bullish signals are firing simultaneously and nothing is warning. Momentum, trend structure, and positioning are all aligned. These are the strongest conditions TSLA produces. The top 10% of FULL SEND outcomes exceed +30% at 20 days.",
    whatToWatch:
      "When buy signals deactivate and the score drops to NEUTRAL, don't panic. FULL SEND → NEUTRAL transitions still average +5.65% over 20 days. The rally doesn't end the moment the score changes.",
  },
  NEUTRAL: {
    emoji: "⚪",
    label: "NEUTRAL",
    hex: "#d4d4d8",
    action: "Hold. Don't add, don't trim.",
    statsLine: "+10.44% avg at 60d · 62% win · 51% of trading days",
    description:
      "Normal TSLA. No strong signals in either direction. The trend may be intact but nothing is compelling enough to justify adding risk or reducing it. The long-term drift works in your favor here.",
    whatToWatch:
      "NEUTRAL → FULL SEND transitions (+5.15% avg at 20d) are your signal to start deploying. NEUTRAL → CAUTION transitions (-0.51% avg at 20d) are your signal to start tightening.",
  },
  CAUTION: {
    emoji: "🟡",
    label: "CAUTION",
    hex: "#eab308",
    action: "Take profits on leveraged. Don't add.",
    statsLine: "-1.37% avg at 10d · 43% win · 24% of trading days",
    description:
      "Warning signals are active. The trend is showing stress -- the kind of deterioration that historically leads to below-average or negative outcomes. A -1.24% avg on stock translates to roughly -2.5% to -4% on 2x ETFs and worse on near-term options.",
    whatToWatch:
      "CAUTION → DEFENSIVE transitions are the worst (-5.27% avg at 20d). If the score keeps dropping, get out. CAUTION → NEUTRAL means the warning passed.",
  },
  DEFENSIVE: {
    emoji: "🔴",
    label: "DEFENSIVE",
    hex: "#ef4444",
    action: "Cash. No leveraged exposure. Wait.",
    statsLine: "-6.73% avg at 60d · 31% win rate · 10% of trading days",
    description:
      "Multiple warning signals are firing. The trend is broken or breaking. These periods produce the corrections TSLA is famous for. The -6.73% avg at 60 days means this isn't a quick dip -- it's structural deterioration.",
    whatToWatch:
      "Do NOT re-enter when the score ticks up to CAUTION (still -4.75% at 20d). Wait for DEFENSIVE → NEUTRAL (+3.94% avg at 20d). That's the real 'worst is over' signal.",
  },
};

const playbooks: Record<string, { setup: string; calls: string; leveraged: string; bottom: string; bottomLabel: string }> = {
  FULL_SEND: {
    setup:
      "Multiple bullish signals are aligned. This is the 15% of trading days that historically produce +6.22% avg returns. Conditions like this are where leveraged positions earn their keep.",
    calls:
      "Open new positions. Target 0.40-0.50 delta with 3-6 month expiry -- enough time to ride the move without overpaying for premium. These conditions support sizing with conviction.",
    leveraged: "Full allocation. This is what you've been waiting for.",
    bottom: "Set a mental stop at the level where the Orb would flip to NEUTRAL. You'll get an alert if it happens. Until then, let it run.",
    bottomLabel: "RISK",
  },
  NEUTRAL: {
    setup:
      "Nothing exceptional in either direction. TSLA's natural drift is working for you (+4.22% avg at 20d) but conditions don't justify adding risk.",
    calls:
      "Hold what you have. Theta is eating premium daily, so make sure your expiry gives you runway. No new positions unless the score moves to FULL SEND.",
    leveraged: "Maintain current position. Not the time to add, not the time to cut.",
    bottom: "Score ticking toward FULL SEND = prepare to deploy. Score ticking toward CAUTION = prepare to trim.",
    bottomLabel: "WATCH FOR",
  },
  CAUTION: {
    setup:
      "Warning signals are active. The trend is under stress and historically, these periods average -1.37% at 10 days. Leverage works against you in negative expected value environments.",
    calls:
      "Take profits on anything short-dated (under 60 DTE). If you're holding 6-9 month calls and the thesis hasn't changed, you can hold through -- but know that drawdowns from here tend to get worse before they get better. No new entries.",
    leveraged:
      "Reduce or exit. A -1.37% move on stock is roughly -2.7% on 2x. And that's the average -- the tails are worse.",
    bottom: "Building the cash position you'll deploy when the Orb turns green again. Patience is the trade.",
    bottomLabel: "WHAT YOU'RE DOING HERE",
  },
  DEFENSIVE: {
    setup:
      "This is the 10% of trading days that contain the corrections TSLA is famous for. Multiple warning signals, structural deterioration, negative expected value at every horizon out to 60 days.",
    calls:
      "Close short-dated positions. LEAPS (9+ months) are a judgment call -- if your strike is deep ITM and expiry is distant, the theta bleed may be worth riding through. Everything else, take the loss now before it gets bigger.",
    leveraged:
      "Out. Fully. A -1.84% average at 20d on stock can mean -10% to -20% on leveraged positions in the bad cases. Capital preservation is the only objective.",
    bottom:
      "Not when it ticks up to CAUTION -- that's a trap. The data shows DEFENSIVE → CAUTION still averages -4.75% at 20 days. Wait for NEUTRAL. You'll get an alert. The buy signal will come, and you'll have the capital to act on it because you stepped aside here.",
    bottomLabel: "WHEN TO COME BACK",
  },
};

type OrbZoneName = "FULL_SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";

const zoneColors: Record<OrbZoneName, string> = {
  FULL_SEND: "#22c55e",
  NEUTRAL: "#d4d4d8",
  CAUTION: "#eab308",
  DEFENSIVE: "#ef4444",
};

let spectrumMin = 0;
let spectrumMax = 0;

for (const setupId in SETUP_TYPES) {
  const setupType = SETUP_TYPES[setupId];
  const weight = WEIGHTS[setupId] ?? 0.3;
  if (setupType === "buy") {
    spectrumMax += weight;
  } else {
    spectrumMin -= weight;
  }
}

const SCORE_RANGE_MIN = Number(spectrumMin.toFixed(3));
const SCORE_RANGE_MAX = Number(spectrumMax.toFixed(3));

function normalizeZone(zone: string): OrbZoneName {
  if (zone === "FULL_SEND" || zone === "NEUTRAL" || zone === "CAUTION" || zone === "DEFENSIVE") {
    return zone;
  }
  return "NEUTRAL";
}

export function OrbScoreWidget({
  orbScore,
  rows,
  trackingTrades,
  scoreExpanded,
  onToggleExpanded,
  isDesktop,
  desktopFont,
  peerComparison,
}: OrbScoreWidgetProps) {
  const currentZone = normalizeZone(orbScore.zone);
  const zc = zoneConfig[currentZone] || zoneConfig.NEUTRAL;
  const zoneDisplay = orbScore.zone_display || getZoneDisplay(orbScore.value);
  const activeSetups = rows.filter((row) => row.state?.status === "active");
  const watchingSetups = rows.filter((row) => row.state?.status === "watching");
  const pb = playbooks[currentZone];

  return (
    <>
      <button
        onClick={onToggleExpanded}
        className="w-full text-left mb-2"
        style={{
          background: `linear-gradient(135deg, ${zc.hex}06, ${zc.hex}12)`,
          border: `1px solid ${zc.hex}25`,
          borderRadius: 14,
          padding: isDesktop ? "20px 24px" : "16px 18px",
          animation: "fadeIn .4s ease",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontSize: desktopFont(10),
            letterSpacing: "0.12em",
            color: "rgba(255,255,255,0.3)",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 8,
          }}
        >
          ORB SCORE
        </div>
        <div className="flex items-center justify-between gap-4">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: desktopFont(26),
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: zc.hex,
                  lineHeight: 1,
                }}
              >
                {zc.emoji} {zoneDisplay.label}
              </div>
              {zoneDisplay.qualifier && (
                <div
                  style={{
                    fontSize: desktopFont(10),
                    color: "rgba(255,255,255,0.45)",
                    fontFamily: "'JetBrains Mono', monospace",
                    marginTop: 3,
                  }}
                >
                  transition: {zoneDisplay.qualifier}
                </div>
              )}
            </div>
            <div style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.6)", fontFamily: "'Inter', system-ui", lineHeight: 1.4 }}>{zc.action}</div>
            <div
              style={{
                fontSize: desktopFont(11),
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 6,
              }}
            >
              {zc.statsLine}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: desktopFont(24),
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: zc.hex,
                lineHeight: 1,
              }}
            >
              {orbScore.value >= 0 ? "+" : ""}
              {orbScore.value.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: desktopFont(10),
                color: "rgba(255,255,255,0.25)",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 4,
              }}
            >
              {orbScore.date}
            </div>
            <div
              style={{
                fontSize: desktopFont(12),
                color: "rgba(255,255,255,0.45)",
                marginTop: 8,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.05em",
                transform: scoreExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform .2s ease",
              }}
            >
              &#x25BE; details
            </div>
          </div>
        </div>
      </button>

      {(() => {
        const score = orbScore.value;
        const zone = currentZone;

        let upLabel = "";
        let upDist = 0;
        let downLabel = "";
        let downDist = 0;

        if (zone === "FULL_SEND") {
          downLabel = "NEUTRAL";
          downDist = Math.max(0, score - THRESHOLDS.FULL_SEND);
        } else if (zone === "NEUTRAL") {
          upLabel = "FULL SEND";
          upDist = Math.max(0, THRESHOLDS.FULL_SEND - score);
          downLabel = "CAUTION";
          downDist = Math.max(0, score - THRESHOLDS.NEUTRAL);
        } else if (zone === "CAUTION") {
          upLabel = "NEUTRAL";
          upDist = Math.max(0, THRESHOLDS.NEUTRAL - score);
          downLabel = "DEFENSIVE";
          downDist = Math.max(0, score - THRESHOLDS.CAUTION);
        } else {
          upLabel = "CAUTION";
          upDist = Math.max(0, THRESHOLDS.CAUTION - score);
        }

        const spectrumMinValue = SCORE_RANGE_MIN;
        const spectrumMaxValue = SCORE_RANGE_MAX;
        const spectrumRange = Math.max(0.001, spectrumMaxValue - spectrumMinValue);

        const clampToSpectrum = (value: number) => Math.max(spectrumMinValue, Math.min(spectrumMaxValue, value));
        const toPercent = (value: number) => ((clampToSpectrum(value) - spectrumMinValue) / spectrumRange) * 100;

        const scorePct = toPercent(score);

        const segments: Array<{ zone: OrbZoneName; start: number; end: number }> = [
          { zone: "DEFENSIVE", start: spectrumMinValue, end: THRESHOLDS.CAUTION },
          { zone: "CAUTION", start: THRESHOLDS.CAUTION, end: THRESHOLDS.NEUTRAL },
          { zone: "NEUTRAL", start: THRESHOLDS.NEUTRAL, end: THRESHOLDS.FULL_SEND },
          { zone: "FULL_SEND", start: THRESHOLDS.FULL_SEND, end: spectrumMaxValue },
        ];

        const boundaryLabels: Array<{ zone: "CAUTION" | "NEUTRAL" | "FULL_SEND"; value: number }> = [
          { zone: "CAUTION", value: THRESHOLDS.CAUTION },
          { zone: "NEUTRAL", value: THRESHOLDS.NEUTRAL },
          { zone: "FULL_SEND", value: THRESHOLDS.FULL_SEND },
        ];

        const currentColor = zoneColors[zone] || zoneColors.NEUTRAL;

        return (
          <div style={{ margin: "14px 0 8px", padding: "0 2px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: desktopFont(9), color: "rgba(239,68,68,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
                DEFENSIVE {spectrumMinValue.toFixed(2)}
              </span>
              <span style={{ fontSize: desktopFont(9), color: "rgba(34,197,94,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>
                FULL SEND {spectrumMaxValue.toFixed(2)}
              </span>
            </div>

            <div style={{ position: "relative", paddingTop: isDesktop ? 20 : 18 }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${scorePct}%`,
                  transform: "translateX(-50%)",
                  fontSize: desktopFont(8),
                  color: currentColor,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  textShadow: `0 0 8px ${currentColor}55`,
                }}
              >
                YOU ARE HERE
              </div>

              <div
                style={{
                  position: "relative",
                  height: isDesktop ? 20 : 18,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  overflow: "hidden",
                }}
              >
                {segments.map((segment) => {
                  const leftPct = toPercent(segment.start);
                  const rightPct = toPercent(segment.end);
                  const widthPct = Math.max(0, rightPct - leftPct);
                  const isCurrent = segment.zone === zone;
                  const segmentColor = zoneColors[segment.zone];

                  return (
                    <div
                      key={segment.zone}
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        background: `linear-gradient(90deg, ${segmentColor}bf, ${segmentColor}66)`,
                        opacity: isCurrent ? 1 : 0.72,
                        boxShadow: isCurrent ? `inset 0 0 16px ${segmentColor}99, 0 0 18px ${segmentColor}40` : "none",
                        transition: "all .35s ease",
                      }}
                    />
                  );
                })}

                {boundaryLabels.map((boundary) => (
                  <div
                    key={`tick-${boundary.zone}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `${toPercent(boundary.value)}%`,
                      width: 1,
                      background: "rgba(10,10,12,0.45)",
                    }}
                  />
                ))}

                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${scorePct}%`,
                    transform: "translate(-50%, -50%)",
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: currentColor,
                    border: "2px solid #0a0a0c",
                    boxShadow: `0 0 12px ${currentColor}90`,
                    transition: "left .5s ease",
                  }}
                />
              </div>
            </div>

            <div style={{ position: "relative", height: isDesktop ? 24 : 28, marginTop: 8 }}>
              {boundaryLabels.map((boundary) => (
                <div
                  key={`label-${boundary.zone}`}
                  style={{
                    position: "absolute",
                    left: `${toPercent(boundary.value)}%`,
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: desktopFont(8), color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {isDesktop ? `${boundary.zone} ≥ ${boundary.value.toFixed(3)}` : `${boundary.zone.slice(0, 3)} ${boundary.value.toFixed(2)}`}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between" style={{ marginTop: 8 }}>
              {downLabel ? (
                <span style={{ fontSize: desktopFont(9), fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
                  ↓ {downLabel} ({downDist.toFixed(2)})
                </span>
              ) : (
                <span />
              )}
              {upLabel ? (
                <span style={{ fontSize: desktopFont(9), fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.25)" }}>
                  ↑ {upLabel} ({upDist.toFixed(2)})
                </span>
              ) : (
                <span />
              )}
            </div>
          </div>
        );
      })()}

      {scoreExpanded && (
        <div
          style={{
            background: `rgba(255,255,255,0.02)`,
            border: `1px solid ${zc.hex}15`,
            borderRadius: 12,
            padding: isDesktop ? "18px 22px" : "14px 16px",
            marginBottom: 8,
            animation: "slideDown .25s ease",
          }}
        >
          <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
            WHAT IT MEANS
          </p>
          <p style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>{zc.description}</p>

          <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>
            WHAT TO WATCH FOR
          </p>
          <p style={{ fontSize: desktopFont(13), color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>{zc.whatToWatch}</p>

          {activeSetups.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                ACTIVE SIGNALS ({activeSetups.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeSetups.map((setup) => (
                  <span
                    key={setup.id}
                    style={{
                      fontSize: desktopFont(10),
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: setup.type === "buy" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      border: `1px solid ${setup.type === "buy" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                      color: setup.type === "buy" ? "#22c55e" : "#ef4444",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {setup.public_name || setup.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {trackingTrades.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(168,85,247,0.6)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                RECENTLY TRIGGERED ({trackingTrades.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trackingTrades.map((trade) => {
                  const setupDef = rows.find((row) => row.id === trade.setup_id);
                  const returnPct = trade.current_return_pct || 0;
                  return (
                    <span
                      key={trade.id}
                      style={{
                        fontSize: desktopFont(10),
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(168,85,247,0.1)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        color: "#a855f7",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {setupDef?.public_name || setupDef?.name || trade.setup_id} · Day {trade.days_active} · {returnPct >= 0 ? "+" : ""}
                      {returnPct.toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {watchingSetups.length > 0 && (
            <div>
              <p style={{ fontSize: desktopFont(10), letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>
                WATCHING ({watchingSetups.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {watchingSetups.map((setup) => (
                  <span
                    key={setup.id}
                    style={{
                      fontSize: desktopFont(10),
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "rgba(234,179,8,0.08)",
                      border: "1px solid rgba(234,179,8,0.15)",
                      color: "rgba(234,179,8,0.6)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {setup.public_name || setup.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <a
            href="/learn/orb-score"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontSize: desktopFont(11),
              color: zc.hex,
              fontFamily: "'JetBrains Mono', monospace",
              textDecoration: "none",
              opacity: 0.7,
            }}
          >
            Full analysis &rarr;
          </a>
        </div>
      )}

      <div
        className="mb-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
          padding: isDesktop ? "12px 16px" : "10px 12px",
          animation: "fadeIn .5s ease",
        }}
      >
        {([
          { zone: "FULL_SEND", emoji: "🟢", label: "FULL SEND", ret: "+16.28%", win: "67%", days: "15%", hex: "#22c55e", horizon: "60D" },
          { zone: "NEUTRAL", emoji: "⚪", label: "NEUTRAL", ret: "+10.44%", win: "62%", days: "51%", hex: "#d4d4d8", horizon: "60D" },
          { zone: "CAUTION", emoji: "🟡", label: "CAUTION", ret: "-1.37%", win: "43%", days: "24%", hex: "#eab308", horizon: "10D" },
          { zone: "DEFENSIVE", emoji: "🔴", label: "DEFENSIVE", ret: "-6.73%", win: "31%", days: "10%", hex: "#ef4444", horizon: "60D" },
        ] as const).map((zone, index) => {
          const isCurrentZone = currentZone === zone.zone;
          return (
            <div
              key={zone.zone}
              className="flex items-center"
              style={{
                padding: isDesktop ? "8px 6px" : "6px 4px",
                borderBottom: index < 3 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: isCurrentZone ? `${zone.hex}08` : "transparent",
                borderRadius: isCurrentZone ? 6 : 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: desktopFont(11),
                    fontWeight: isCurrentZone ? 700 : 500,
                    color: isCurrentZone ? zone.hex : "rgba(255,255,255,0.45)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {zone.emoji} {zone.label} {isCurrentZone && "◀"}
                </span>
              </div>
              <div style={{ display: "flex", gap: isDesktop ? 20 : 12, flexShrink: 0 }}>
                <div style={{ minWidth: 72, textAlign: "right" }}>
                  <span style={{ fontSize: desktopFont(9), color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, marginRight: 4 }}>
                    {zone.horizon}:
                  </span>
                  <span style={{ fontSize: desktopFont(10), color: zone.ret.startsWith("+") ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                    {zone.ret}
                  </span>
                </div>
                <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace", minWidth: 28, textAlign: "right" }}>{zone.win}</span>
                <span style={{ fontSize: desktopFont(10), color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono', monospace", minWidth: 28, textAlign: "right" }}>{zone.days}</span>
              </div>
            </div>
          );
        })}
        <div className="flex items-center justify-end gap-2" style={{ padding: "4px 4px 0" }}>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.55)", minWidth: 72, textAlign: "right" }}>avg return</span>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.55)", minWidth: 28, textAlign: "right" }}>win%</span>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.55)", minWidth: 28, textAlign: "right" }}>freq</span>
        </div>
      </div>
    </>
  );
}
