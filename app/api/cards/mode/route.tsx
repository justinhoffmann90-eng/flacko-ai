import { ImageResponse } from "@vercel/og";
import DailyModeCard from "@/components/cards/DailyModeCard";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "edge";

const MODE_DAILY_CAP: Record<string, number> = {
  GREEN: 25,
  YELLOW: 15,
  ORANGE: 10,
  RED: 5,
};

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

  const extracted = (report.extracted_data || {}) as any;
  const mode = extracted?.mode?.current || "YELLOW";
  const modeKey = String(mode).toUpperCase();
  const dailyCap =
    extracted?.position?.daily_cap_pct ||
    extracted?.mode?.daily_cap ||
    MODE_DAILY_CAP[modeKey] ||
    15;
  const posture =
    extracted?.positioning?.posture ||
    extracted?.position?.current_stance ||
    "See report for details";
  const levels = extracted?.key_levels || {};

  return new ImageResponse(
    (
      <DailyModeCard
        mode={modeKey}
        levels={levels}
        posture={posture}
        date={report.report_date || dateParam}
        dailyCap={dailyCap}
      />
    ),
    {
      width: 1200,
      height: 675,
    }
  );
}
