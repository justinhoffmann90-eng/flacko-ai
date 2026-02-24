import { ImageResponse } from "@vercel/og";
import ForecastVsActualCard from "@/components/cards/ForecastVsActualCard";
import { createServiceClient } from "@/lib/supabase/server";
import { getIntradayPriceData } from "@/lib/price/yahoo-finance";
import { compareForecastLevels, calculateForecastAccuracy } from "@/lib/accuracy/compareLevels";

export const runtime = "edge";

const MODE_DAILY_CAP: Record<string, number> = {
  GREEN: 25,
  YELLOW: 15,
  ORANGE: 10,
  RED: 5,
};

function getModeEmoji(mode: string): string {
  const modeUpper = mode.toUpperCase();
  if (modeUpper.includes("GREEN") || modeUpper.includes("ACCUMULATION")) return "🟢";
  if (modeUpper.includes("YELLOW")) return "🟡";
  if (modeUpper.includes("ORANGE")) return "🟠";
  if (modeUpper.includes("RED") || modeUpper.includes("DEFENSIVE")) return "🔴";
  return "🟡";
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
      .or("report_type.is.null,report_type.eq.daily")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (!latestReport) {
      return new Response(`Report not found for ${dateParam}`, { status: 404 });
    }

    report = latestReport;
  }

  const extracted = (report.extracted_data || {}) as any;
  const levels = extracted?.alerts || [];

  const resistanceLevels = levels
    .filter((level: any) => level.type === "above" || level.type === "upside")
    .sort((a: any, b: any) => a.price - b.price);
  const supportLevels = levels
    .filter((level: any) => level.type === "below" || level.type === "downside")
    .sort((a: any, b: any) => b.price - a.price);

  const forecastLevels = [
    resistanceLevels[0] && { name: "R1", price: resistanceLevels[0].price, type: "resistance" as const },
    resistanceLevels[1] && { name: "R2", price: resistanceLevels[1].price, type: "resistance" as const },
    supportLevels[0] && { name: "S1", price: supportLevels[0].price, type: "support" as const },
    supportLevels[1] && { name: "S2", price: supportLevels[1].price, type: "support" as const },
  ].filter(Boolean) as Array<{ name: string; price: number; type: "resistance" | "support" }>;

  const priceData = await getIntradayPriceData(report.report_date || dateParam);

  if (!priceData || priceData.high === 0) {
    return new Response(`Price data not available for ${dateParam}`, { status: 404 });
  }

  const results = compareForecastLevels(forecastLevels, {
    high: priceData.high,
    low: priceData.low,
  });

  const accuracy = calculateForecastAccuracy(results);

  const mode = extracted?.mode?.current || "YELLOW";
  const modeKey = String(mode).toUpperCase();
  const dailyCapValue =
    extracted?.position?.daily_cap_pct ||
    extracted?.mode?.daily_cap ||
    MODE_DAILY_CAP[modeKey] ||
    15;

  const rangePct = priceData.open ? ((priceData.high - priceData.low) / priceData.open) * 100 : 0;
  const modeAssessment = rangePct <= Number(dailyCapValue) ? "Correct" : "Incorrect";

  return new ImageResponse(
    (
      <ForecastVsActualCard
        date={report.report_date || dateParam}
        mode={modeKey}
        modeEmoji={getModeEmoji(mode)}
        modeAssessment={modeAssessment}
        accuracy={accuracy}
        results={results}
        actual={{
          high: priceData.high,
          low: priceData.low,
          close: priceData.close,
        }}
      />
    ),
    {
      width: 1200,
      height: 675,
    }
  );
}
