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

interface LevelResult {
  name: string;
  price: number;
  status: "hit" | "broken" | "not-tested";
  type: "support" | "resistance" | "eject";
}

async function fetchOHLC(date: string): Promise<{ open: number; high: number; low: number; close: number } | null> {
  try {
    // Use Yahoo Finance API
    const endDate = Math.floor(new Date(date + "T23:59:59Z").getTime() / 1000);
    const startDate = Math.floor(new Date(date + "T00:00:00Z").getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${startDate}&period2=${endDate}&interval=1d`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    
    const quote = data?.chart?.result?.[0]?.indicators?.quote?.[0];
    if (quote && quote.open?.[0]) {
      return {
        open: quote.open[0],
        high: quote.high[0],
        low: quote.low[0],
        close: quote.close[0],
      };
    }
  } catch (e) {
    console.error("OHLC fetch error:", e);
  }
  return null;
}

function evaluateLevels(
  levels: Array<{ name: string; price: number; type: string }>,
  ohlc: { high: number; low: number }
): LevelResult[] {
  return levels.map((level) => {
    const isResistance = level.type === "upside" || level.type === "resistance";
    const isEject = level.type === "eject";
    
    let status: "hit" | "broken" | "not-tested" = "not-tested";
    
    if (isResistance || isEject) {
      // Resistance/upside - was high >= level price?
      if (ohlc.high >= level.price) {
        status = "broken";
      } else if (ohlc.high >= level.price * 0.995) {
        status = "hit"; // Within 0.5%
      }
    } else {
      // Support/downside - was low <= level price?
      if (ohlc.low <= level.price) {
        status = "broken";
      } else if (ohlc.low <= level.price * 1.005) {
        status = "hit"; // Within 0.5%
      }
    }
    
    return {
      name: level.name,
      price: level.price,
      status,
      type: isEject ? "eject" : isResistance ? "resistance" : "support",
    };
  });
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

  // Get OHLC data
  const ohlc = await fetchOHLC(report.report_date);
  if (!ohlc) {
    return new Response(`Could not fetch price data for ${report.report_date}`, { status: 500 });
  }

  // Extract data from extracted_data JSON
  const extracted = (report.extracted_data || {}) as Record<string, unknown>;
  
  // Get mode
  const modeData = extracted.mode as Record<string, unknown> | undefined;
  let mode = String(modeData?.current || "YELLOW").toUpperCase();
  
  // Get close price for calculating level types
  const closePrice = Number(extracted.current_price || extracted.close_price || ohlc.close);
  
  // Get alerts/levels from extracted_data
  const alertsData = (extracted.alerts || []) as Array<Record<string, unknown>>;
  const levels: Array<{ name: string; price: number; type: string }> = alertsData
    .filter((a) => a.price && a.name)
    .map((a) => {
      const price = Number(a.price);
      const name = String(a.name || "");
      let type = price >= closePrice ? "upside" : "downside";
      if (name.toLowerCase().includes("eject")) type = "eject";
      return { name, price, type };
    });

  // Evaluate levels against actual price action
  const results = evaluateLevels(levels.slice(0, 6), ohlc);
  
  // Calculate accuracy
  const tested = results.filter((r) => r.status !== "not-tested");
  const accurate = results.filter((r) => r.status === "hit" || r.status === "broken");
  const accuracyPct = tested.length > 0 ? Math.round((accurate.length / tested.length) * 100) : 0;

  const modeColor = MODE_COLORS[mode] || MODE_COLORS.YELLOW;
  const dayChange = ((ohlc.close - ohlc.open) / ohlc.open) * 100;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "24px", fontWeight: 700, display: "flex" }}>⚔️ FLACKO AI</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", display: "flex" }}>TSLA</div>
              <div style={{ fontSize: "14px", color: "#888", display: "flex" }}>{report.report_date} EOD</div>
            </div>
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

        {/* Main Content */}
        <div style={{ display: "flex", gap: "24px", flex: 1 }}>
          {/* Left: OHLC & Accuracy */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "320px" }}>
            {/* OHLC Box */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", display: "flex" }}>
                Daily OHLC
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: "#888", display: "flex" }}>Open</div>
                  <div style={{ fontWeight: 600, display: "flex" }}>${ohlc.open.toFixed(2)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: "#888", display: "flex" }}>High</div>
                  <div style={{ fontWeight: 600, color: "#22c55e", display: "flex" }}>${ohlc.high.toFixed(2)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: "#888", display: "flex" }}>Low</div>
                  <div style={{ fontWeight: 600, color: "#ef4444", display: "flex" }}>${ohlc.low.toFixed(2)}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: "#888", display: "flex" }}>Close</div>
                  <div style={{ fontWeight: 600, display: "flex" }}>${ohlc.close.toFixed(2)}</div>
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  borderRadius: "6px",
                  background: dayChange >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: 700, color: dayChange >= 0 ? "#22c55e" : "#ef4444", display: "flex" }}>
                  {dayChange >= 0 ? "+" : ""}{dayChange.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Accuracy Box */}
            <div
              style={{
                background: accuracyPct >= 70 ? "rgba(34,197,94,0.1)" : accuracyPct >= 50 ? "rgba(234,179,8,0.1)" : "rgba(239,68,68,0.1)",
                borderRadius: "12px",
                border: `1px solid ${accuracyPct >= 70 ? "rgba(34,197,94,0.3)" : accuracyPct >= 50 ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)"}`,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", display: "flex" }}>
                Level Accuracy
              </div>
              <div style={{ fontSize: "48px", fontWeight: 700, color: accuracyPct >= 70 ? "#22c55e" : accuracyPct >= 50 ? "#eab308" : "#ef4444", display: "flex" }}>
                {accuracyPct}%
              </div>
              <div style={{ fontSize: "14px", color: "#888", display: "flex" }}>
                {accurate.length}/{tested.length} levels tested
              </div>
            </div>
          </div>

          {/* Right: Level Results */}
          <div
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: "12px", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", display: "flex" }}>
              Level Performance
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {results.map((result, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: result.status === "hit" ? "rgba(34,197,94,0.1)" : result.status === "broken" ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    borderLeft: `4px solid ${result.type === "resistance" ? "#22c55e" : result.type === "eject" ? "#f97316" : "#ef4444"}`,
                  }}
                >
                  <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff", minWidth: "80px", display: "flex" }}>
                      ${result.price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "13px", color: "#a1a1aa", display: "flex" }}>{result.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ fontSize: "18px", display: "flex" }}>
                      {result.status === "hit" ? "✅" : result.status === "broken" ? "🎯" : "⏸️"}
                    </div>
                    <div style={{ fontSize: "12px", color: result.status === "not-tested" ? "#666" : "#fff", display: "flex" }}>
                      {result.status === "hit" ? "Held" : result.status === "broken" ? "Broken" : "Not Tested"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <div style={{ fontSize: "12px", color: "#666", display: "flex" }}>End of day accuracy tracking</div>
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
