/**
 * Weekly Scorecard Card Component
 *
 * Header image for weekly scorecard thread.
 * Designed for @vercel/og image generation at 1200x675px.
 */

import React from "react";
import { WeeklyAggregate } from "@/lib/accuracy/aggregateWeekly";

const MODE_COLORS: Record<string, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

export interface WeeklyScorecardCardProps {
  data: WeeklyAggregate;
}

/**
 * Get grade letter based on score
 */
function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  return "D";
}

/**
 * Get color for score display
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green
  if (score >= 60) return "#eab308"; // yellow
  if (score >= 40) return "#f97316"; // orange
  return "#ef4444"; // red
}

export default function WeeklyScorecardCard({ data }: WeeklyScorecardCardProps) {
  const grade = getGrade(data.weeklyScore);
  const scoreColor = getScoreColor(data.weeklyScore);

  // Calculate mode distribution for visual bar
  const totalDays = data.tradingDays || 1;
  const modeWidths = {
    green: (data.modeBreakdown.green.days / totalDays) * 100,
    yellow: (data.modeBreakdown.yellow.days / totalDays) * 100,
    orange: (data.modeBreakdown.orange.days / totalDays) * 100,
    red: (data.modeBreakdown.red.days / totalDays) * 100,
  };

  return (
    <div
      style={{
        width: "1200px",
        height: "675px",
        background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        padding: "48px",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
          borderRadius: "50%",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          display: "flex",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "4px",
              color: "#94a3b8",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Weekly Scorecard
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginTop: "8px",
              display: "flex",
            }}
          >
            {data.weekLabel}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#94a3b8",
              display: "flex",
            }}
          >
            FLACKO AI
          </div>
        </div>
      </div>

      {/* Main Score Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
          gap: "48px",
        }}
      >
        {/* Weekly Score */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "24px",
            padding: "40px 60px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "2px",
              color: "#94a3b8",
              textTransform: "uppercase",
              marginBottom: "12px",
              display: "flex",
            }}
          >
            Weekly Score
          </div>
          <div
            style={{
              fontSize: "96px",
              fontWeight: 800,
              color: scoreColor,
              lineHeight: 1,
              display: "flex",
            }}
          >
            {data.weeklyScore}%
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#94a3b8",
              marginTop: "8px",
              display: "flex",
            }}
          >
            Grade: {grade}
          </div>
        </div>

        {/* Stats Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minWidth: "280px",
          }}
        >
          {/* Trading Days */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "16px", display: "flex" }}>Trading Days</span>
            <span style={{ fontWeight: 700, fontSize: "24px", display: "flex" }}>{data.tradingDays}</span>
          </div>

          {/* Levels Hit */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "16px", display: "flex" }}>Levels Hit</span>
            <span style={{ fontWeight: 700, fontSize: "24px", display: "flex" }}>{data.totalLevelsHit}</span>
          </div>

          {/* Level Accuracy */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "16px", display: "flex" }}>Level Accuracy</span>
            <span style={{ fontWeight: 700, fontSize: "24px", color: "#22c55e", display: "flex" }}>
              {data.overallLevelAccuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Mode Distribution Bar */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            letterSpacing: "2px",
            color: "#94a3b8",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          Mode Distribution
        </div>
        <div
          style={{
            display: "flex",
            height: "32px",
            borderRadius: "8px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {modeWidths.green > 0 && (
            <div
              style={{
                width: `${modeWidths.green}%`,
                background: MODE_COLORS.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#000",
              }}
            >
              {data.modeBreakdown.green.days}d
            </div>
          )}
          {modeWidths.yellow > 0 && (
            <div
              style={{
                width: `${modeWidths.yellow}%`,
                background: MODE_COLORS.yellow,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#000",
              }}
            >
              {data.modeBreakdown.yellow.days}d
            </div>
          )}
          {modeWidths.orange > 0 && (
            <div
              style={{
                width: `${modeWidths.orange}%`,
                background: MODE_COLORS.orange,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#000",
              }}
            >
              {data.modeBreakdown.orange.days}d
            </div>
          )}
          {modeWidths.red > 0 && (
            <div
              style={{
                width: `${modeWidths.red}%`,
                background: MODE_COLORS.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 600,
                color: "#fff",
              }}
            >
              {data.modeBreakdown.red.days}d
            </div>
          )}
        </div>

        {/* Mode Legend */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          {data.modeBreakdown.green.days > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: MODE_COLORS.green, display: "flex" }} />
              <span style={{ display: "flex" }}>GREEN ({data.modeBreakdown.green.avgScore}%)</span>
            </div>
          )}
          {data.modeBreakdown.yellow.days > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: MODE_COLORS.yellow, display: "flex" }} />
              <span style={{ display: "flex" }}>YELLOW ({data.modeBreakdown.yellow.avgScore}%)</span>
            </div>
          )}
          {data.modeBreakdown.orange.days > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: MODE_COLORS.orange, display: "flex" }} />
              <span style={{ display: "flex" }}>ORANGE ({data.modeBreakdown.orange.avgScore}%)</span>
            </div>
          )}
          {data.modeBreakdown.red.days > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: MODE_COLORS.red, display: "flex" }} />
              <span style={{ display: "flex" }}>RED ({data.modeBreakdown.red.avgScore}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "24px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ color: "#64748b", fontSize: "14px", display: "flex" }}>
          Track record: flacko.ai/accuracy
        </div>
        <div style={{ color: "#64748b", fontSize: "14px", display: "flex" }}>
          $TSLA Trading Intelligence
        </div>
      </div>
    </div>
  );
}

/**
 * Generate HTML string for @vercel/og or satori
 * This is used by the API route for image generation
 */
export function generateWeeklyScorecardHTML(data: WeeklyAggregate): string {
  const grade = getGrade(data.weeklyScore);
  const scoreColor = getScoreColor(data.weeklyScore);
  const totalDays = data.tradingDays || 1;

  const modeWidths = {
    green: (data.modeBreakdown.green.days / totalDays) * 100,
    yellow: (data.modeBreakdown.yellow.days / totalDays) * 100,
    orange: (data.modeBreakdown.orange.days / totalDays) * 100,
    red: (data.modeBreakdown.red.days / totalDays) * 100,
  };

  // Build mode bar segments
  let modeBarHTML = "";
  if (modeWidths.green > 0) {
    modeBarHTML += `<div style="width: ${modeWidths.green}%; background: ${MODE_COLORS.green}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #000;">${data.modeBreakdown.green.days}d</div>`;
  }
  if (modeWidths.yellow > 0) {
    modeBarHTML += `<div style="width: ${modeWidths.yellow}%; background: ${MODE_COLORS.yellow}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #000;">${data.modeBreakdown.yellow.days}d</div>`;
  }
  if (modeWidths.orange > 0) {
    modeBarHTML += `<div style="width: ${modeWidths.orange}%; background: ${MODE_COLORS.orange}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #000;">${data.modeBreakdown.orange.days}d</div>`;
  }
  if (modeWidths.red > 0) {
    modeBarHTML += `<div style="width: ${modeWidths.red}%; background: ${MODE_COLORS.red}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #fff;">${data.modeBreakdown.red.days}d</div>`;
  }

  // Build legend items
  let legendHTML = "";
  if (data.modeBreakdown.green.days > 0) {
    legendHTML += `<div style="display: flex; align-items: center; gap: 6px;"><div style="width: 12px; height: 12px; border-radius: 3px; background: ${MODE_COLORS.green};"></div><span>GREEN (${data.modeBreakdown.green.avgScore}%)</span></div>`;
  }
  if (data.modeBreakdown.yellow.days > 0) {
    legendHTML += `<div style="display: flex; align-items: center; gap: 6px;"><div style="width: 12px; height: 12px; border-radius: 3px; background: ${MODE_COLORS.yellow};"></div><span>YELLOW (${data.modeBreakdown.yellow.avgScore}%)</span></div>`;
  }
  if (data.modeBreakdown.orange.days > 0) {
    legendHTML += `<div style="display: flex; align-items: center; gap: 6px;"><div style="width: 12px; height: 12px; border-radius: 3px; background: ${MODE_COLORS.orange};"></div><span>ORANGE (${data.modeBreakdown.orange.avgScore}%)</span></div>`;
  }
  if (data.modeBreakdown.red.days > 0) {
    legendHTML += `<div style="display: flex; align-items: center; gap: 6px;"><div style="width: 12px; height: 12px; border-radius: 3px; background: ${MODE_COLORS.red};"></div><span>RED (${data.modeBreakdown.red.avgScore}%)</span></div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Flacko AI Weekly Scorecard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; }
  </style>
</head>
<body>
  <div style="width: 1200px; height: 675px; background: linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%); color: #f8fafc; display: flex; flex-direction: column; padding: 48px; position: relative; overflow: hidden;">
    <!-- Background decorations -->
    <div style="position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, ${scoreColor}15 0%, transparent 70%); border-radius: 50%;"></div>
    <div style="position: absolute; bottom: -150px; left: -150px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%); border-radius: 50%;"></div>

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
      <div style="display: flex; flex-direction: column;">
        <div style="font-size: 14px; letter-spacing: 4px; color: #94a3b8; text-transform: uppercase;">Weekly Scorecard</div>
        <div style="font-size: 28px; font-weight: 700; margin-top: 8px;">${data.weekLabel}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 18px; font-weight: 600; color: #94a3b8;">FLACKO AI</div>
      </div>
    </div>

    <!-- Main Score Section -->
    <div style="display: flex; justify-content: center; align-items: center; flex: 1; gap: 48px;">
      <!-- Weekly Score -->
      <div style="display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.03); border-radius: 24px; padding: 40px 60px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 14px; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">Weekly Score</div>
        <div style="font-size: 96px; font-weight: 800; color: ${scoreColor}; line-height: 1;">${data.weeklyScore}%</div>
        <div style="font-size: 24px; font-weight: 600; color: #94a3b8; margin-top: 8px;">Grade: ${grade}</div>
      </div>

      <!-- Stats Column -->
      <div style="display: flex; flex-direction: column; gap: 20px; min-width: 280px;">
        <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #94a3b8; font-size: 16px;">Trading Days</span>
          <span style="font-weight: 700; font-size: 24px;">${data.tradingDays}</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #94a3b8; font-size: 16px;">Levels Hit</span>
          <span style="font-weight: 700; font-size: 24px;">${data.totalLevelsHit}</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #94a3b8; font-size: 16px;">Level Accuracy</span>
          <span style="font-weight: 700; font-size: 24px; color: #22c55e;">${data.overallLevelAccuracy}%</span>
        </div>
      </div>
    </div>

    <!-- Mode Distribution Bar -->
    <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 12px;">
      <div style="font-size: 14px; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase;">Mode Distribution</div>
      <div style="display: flex; height: 32px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.05);">
        ${modeBarHTML}
      </div>
      <div style="display: flex; gap: 24px; font-size: 12px; color: #94a3b8;">
        ${legendHTML}
      </div>
    </div>

    <!-- Footer -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
      <div style="color: #64748b; font-size: 14px;">Track record: flacko.ai/accuracy</div>
      <div style="color: #64748b; font-size: 14px;">$TSLA Trading Intelligence</div>
    </div>
  </div>
</body>
</html>`;
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  return "D";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#eab308";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}
