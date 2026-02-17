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
    extracted?.flacko_take?.what_id_do ||
    "See report for details";
  
  // Try multiple sources for key levels
  let levels = extracted?.key_levels || {};
  
  // If key_levels is empty, try to extract from spotgamma_context
  if (!levels.gamma_strike && !levels.put_wall && !levels.call_wall && !levels.hedge_wall) {
    const spotgamma = extracted?.spotgamma_context || {};
    levels = {
      gamma_strike: spotgamma.key_gamma_strike || spotgamma.gamma_strike || extracted?.key_gamma_strike,
      put_wall: spotgamma.put_wall,
      call_wall: spotgamma.call_wall,
      hedge_wall: spotgamma.hedge_wall,
    };
  }
  
  // Also check alerts array for SpotGamma levels
  const alerts = extracted?.alerts || [];
  if (!levels.gamma_strike) {
    const gammaAlert = alerts.find((a: any) => 
      a.name?.toLowerCase().includes('gamma strike') || 
      a.confluence?.toLowerCase().includes('gamma strike')
    );
    if (gammaAlert) levels.gamma_strike = gammaAlert.price;
  }
  if (!levels.put_wall) {
    const putAlert = alerts.find((a: any) => 
      a.name?.toLowerCase().includes('put wall') ||
      a.confluence?.toLowerCase().includes('put wall')
    );
    if (putAlert) levels.put_wall = putAlert.price;
  }
  if (!levels.hedge_wall) {
    const hedgeAlert = alerts.find((a: any) => 
      a.name?.toLowerCase().includes('hedge wall') ||
      a.confluence?.toLowerCase().includes('hedge wall')
    );
    if (hedgeAlert) levels.hedge_wall = hedgeAlert.price;
  }
  if (!levels.call_wall) {
    const callAlert = alerts.find((a: any) => 
      a.name?.toLowerCase().includes('call wall') ||
      a.confluence?.toLowerCase().includes('call wall')
    );
    if (callAlert) levels.call_wall = callAlert.price;
  }

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
