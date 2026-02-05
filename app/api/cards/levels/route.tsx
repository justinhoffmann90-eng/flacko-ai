import { ImageResponse } from "@vercel/og";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "edge";

const MODE_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  ACCUMULATION: "#22c55e",
  YELLOW: "#eab308",
  ORANGE: "#f97316",
  RED: "#ef4444",
  DEFENSIVE: "#ef4444",
};

interface Level {
  name: string;
  price: number;
  type: string;
  pctFromClose: number;
}

function parseReportContent(content: string, closePrice: number): { mode: string; dailyCap: string; levels: Level[] } {
  let mode = "YELLOW";
  let dailyCap = "15";

  // Extract mode
  if (/🔴\s*(RED|DEFENSIVE)/i.test(content)) mode = "RED";
  else if (/🟠\s*ORANGE/i.test(content)) mode = "ORANGE";
  else if (/🟡\s*YELLOW/i.test(content)) mode = "YELLOW";
  else if (/🟢\s*(GREEN|ACCUMULATION)/i.test(content)) mode = "GREEN";

  // Extract daily cap
  const capMatch = content.match(/daily\s*cap[:\s|]*\**(\d+(?:-\d+)?)\s*%/i);
  if (capMatch) dailyCap = capMatch[1];

  // Extract levels from Alert Levels table
  const levels: Level[] = [];
  const levelRegex = /\|\s*\$?([\d.]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  while ((match = levelRegex.exec(content)) !== null) {
    const price = parseFloat(match[1]);
    const levelName = match[2].replace(/[*🎯🔇⚡📈⏸️🛡️⚠️❌📍]/g, "").trim();

    if (price > 0 && levelName && !levelName.includes("Level") && !levelName.includes("Price")) {
      const pctFromClose = closePrice > 0 ? ((price - closePrice) / closePrice) * 100 : 0;
      let type = pctFromClose >= 0 ? "upside" : "downside";
      if (levelName.toLowerCase().includes("eject")) type = "eject";

      levels.push({ name: levelName, price, type, pctFromClose });
    }
  }

  // Sort by price descending
  levels.sort((a, b) => b.price - a.price);

  return { mode, dailyCap, levels: levels.slice(0, 8) }; // Max 8 levels
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const supabase = await createServiceClient();

  let { data: report } = await supabase
    .from("reports")
    .select("report_date, markdown_content, extracted_data")
    .eq("report_date", dateParam)
    .single();

  if (!report) {
    const { data: latestReport } = await supabase
      .from("reports")
      .select("report_date, markdown_content, extracted_data")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (!latestReport) {
      return new Response(`Report not found for ${dateParam}`, { status: 404 });
    }
    report = latestReport;
  }

  // Get close price from extracted_data or try to parse
  const extracted = (report.extracted_data || {}) as Record<string, unknown>;
  let closePrice = 0;
  if (extracted.current_price) closePrice = Number(extracted.current_price);
  else if (extracted.close_price) closePrice = Number(extracted.close_price);
  else {
    const closeMatch = report.markdown_content?.match(/\*\*\$([\d.]+)\*\*\s*\|\s*\*\*📍\s*Current/i);
    if (closeMatch) closePrice = parseFloat(closeMatch[1]);
  }

  const { mode, dailyCap, levels } = parseReportContent(report.markdown_content || "", closePrice);
  const modeColor = MODE_COLORS[mode] || MODE_COLORS.YELLOW;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "675px",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "32px 40px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, display: "flex" }}>⚔️ FLACKO AI</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", display: "flex" }}>TSLA</div>
              <div style={{ fontSize: "14px", color: "#888", display: "flex" }}>{report.report_date}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "14px", color: "#ccc", display: "flex" }}>
              Daily Cap: <span style={{ fontWeight: 700, color: "#fff", marginLeft: "4px" }}>{dailyCap}%</span>
            </div>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                background: modeColor,
                color: mode === "YELLOW" ? "#000" : "#fff",
                fontWeight: 700,
                fontSize: "14px",
                display: "flex",
              }}
            >
              {mode} MODE
            </div>
          </div>
        </div>

        {/* Levels Grid */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "20px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px", display: "flex" }}>
            Key Alert Levels
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            {levels.map((level, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: level.type === "eject" ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.02)",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${level.type === "upside" ? "#22c55e" : level.type === "eject" ? "#f97316" : "#ef4444"}`,
                }}
              >
                <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff", minWidth: "90px", display: "flex" }}>
                    ${level.price.toFixed(2)}
                  </div>
                  <div style={{ fontSize: "14px", color: "#a1a1aa", display: "flex" }}>{level.name}</div>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: level.pctFromClose >= 0 ? "#22c55e" : "#ef4444",
                    display: "flex",
                  }}
                >
                  {level.pctFromClose >= 0 ? "+" : ""}
                  {level.pctFromClose.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <div style={{ fontSize: "12px", color: "#666", display: "flex" }}>Your TSLA trading operating system</div>
          <div style={{ fontSize: "14px", color: "#999", fontWeight: 700, display: "flex" }}>flacko.ai</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
    }
  );
}
