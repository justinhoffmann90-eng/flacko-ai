/**
 * Weekly Scorecard Card Image API
 *
 * GET /api/cards/weekly-scorecard?week=YYYY-WW or ?date=YYYY-MM-DD
 * Returns PNG image (1200x675px) using @vercel/og ImageResponse.
 */

import { ImageResponse } from "@vercel/og";
import { aggregateWeeklyData, WeeklyAggregate } from "@/lib/accuracy/aggregateWeekly";
import { startOfWeek, getISOWeek, getYear } from "date-fns";

export const runtime = "edge";

const MODE_COLORS: Record<string, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekParam = searchParams.get("week");
    const dateParam = searchParams.get("date");

    let input: string;

    if (weekParam) {
      input = weekParam;
    } else if (dateParam) {
      input = dateParam;
    } else {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const year = getYear(weekStart);
      const week = getISOWeek(weekStart);
      input = `${year}-${String(week).padStart(2, "0")}`;
    }

    const data = await aggregateWeeklyData(input);
    const grade = getGrade(data.weeklyScore);
    const scoreColor = getScoreColor(data.weeklyScore);

    const totalDays = data.tradingDays || 1;
    const modeWidths = {
      green: (data.modeBreakdown.green.days / totalDays) * 100,
      yellow: (data.modeBreakdown.yellow.days / totalDays) * 100,
      orange: (data.modeBreakdown.orange.days / totalDays) * 100,
      red: (data.modeBreakdown.red.days / totalDays) * 100,
    };

    return new ImageResponse(
      (
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
          }}
        >
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
                <span style={{ color: "#94a3b8", fontSize: "16px", display: "flex" }}>
                  Trading Days
                </span>
                <span style={{ fontWeight: 700, fontSize: "24px", display: "flex" }}>
                  {data.tradingDays}
                </span>
              </div>

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
                <span style={{ color: "#94a3b8", fontSize: "16px", display: "flex" }}>
                  Levels Hit
                </span>
                <span style={{ fontWeight: 700, fontSize: "24px", display: "flex" }}>
                  {data.totalLevelsHit}
                </span>
              </div>

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
                <span style={{ color: "#94a3b8", fontSize: "16px", display: "flex" }}>
                  Level Accuracy
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "24px",
                    color: "#22c55e",
                    display: "flex",
                  }}
                >
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
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      background: MODE_COLORS.green,
                      display: "flex",
                    }}
                  />
                  <span style={{ display: "flex" }}>
                    GREEN ({data.modeBreakdown.green.avgScore}%)
                  </span>
                </div>
              )}
              {data.modeBreakdown.yellow.days > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      background: MODE_COLORS.yellow,
                      display: "flex",
                    }}
                  />
                  <span style={{ display: "flex" }}>
                    YELLOW ({data.modeBreakdown.yellow.avgScore}%)
                  </span>
                </div>
              )}
              {data.modeBreakdown.orange.days > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      background: MODE_COLORS.orange,
                      display: "flex",
                    }}
                  />
                  <span style={{ display: "flex" }}>
                    ORANGE ({data.modeBreakdown.orange.avgScore}%)
                  </span>
                </div>
              )}
              {data.modeBreakdown.red.days > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "3px",
                      background: MODE_COLORS.red,
                      display: "flex",
                    }}
                  />
                  <span style={{ display: "flex" }}>
                    RED ({data.modeBreakdown.red.avgScore}%)
                  </span>
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
      ),
      {
        width: 1200,
        height: 675,
      }
    );
  } catch (error) {
    console.error("Weekly scorecard card error:", error);
    return new Response(
      `Error generating weekly scorecard: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
