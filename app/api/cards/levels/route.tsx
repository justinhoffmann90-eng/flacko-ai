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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const supabase = await createServiceClient();

  let { data: report, error } = await supabase
    .from("reports")
    .select("report_date, extracted_data")
    .eq("report_date", dateParam)
    .single();

  if (error || !report) {
    const { data: latestReport } = await supabase
      .from("reports")
      .select("report_date, extracted_data")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (!latestReport) {
      return new Response(`Report not found for ${dateParam}`, { status: 404 });
    }
    report = latestReport;
  }

  // Extract data from extracted_data JSON
  const extracted = (report.extracted_data || {}) as Record<string, unknown>;
  
  // Get mode
  const modeData = extracted.mode as Record<string, unknown> | undefined;
  let mode = String(modeData?.current || "YELLOW").toUpperCase();
  
  // Get daily cap
  const positionData = extracted.position as Record<string, unknown> | undefined;
  let dailyCap = String(positionData?.daily_cap_pct || modeData?.daily_cap || "15");
  
  // Get close price
  let closePrice = Number(extracted.current_price || extracted.close_price || 0);
  
  // Get alerts/levels from extracted_data
  const alertsData = (extracted.alerts || []) as Array<Record<string, unknown>>;
  const levels: Level[] = alertsData
    .filter((a) => a.price && a.name)
    .map((a) => {
      const price = Number(a.price);
      const name = String(a.name || "");
      const pctFromClose = closePrice > 0 ? ((price - closePrice) / closePrice) * 100 : 0;
      let type = pctFromClose >= 0 ? "upside" : "downside";
      if (name.toLowerCase().includes("eject")) type = "eject";
      return { name, price, type, pctFromClose };
    })
    .sort((a, b) => b.price - a.price)
    .slice(0, 8);
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
