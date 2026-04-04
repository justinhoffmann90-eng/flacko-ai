import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { MarkdownContent } from "@/components/report/markdown-content";
import { ExtractedReportData } from "@/types";
import { AlertTriangle, Lock } from "lucide-react";
import { validateTicker, getTickerConfig, DEFAULT_TICKER } from "@/lib/tickers/config";

export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  report_date: string;
  raw_markdown: string;
  extracted_data: ExtractedReportData;
  parser_warnings?: string[];
  ticker: string;
}

interface Props {
  params: Promise<{ ticker: string }>;
}

export default async function TickerReportPage({ params }: Props) {
  const { ticker: rawTicker } = await params;
  const ticker = validateTicker(rawTicker);

  if (!ticker) {
    notFound();
  }

  // Redirect TSLA to the main report page (it has custom widgets like call options)
  if (ticker === DEFAULT_TICKER) {
    redirect("/report");
  }

  const config = getTickerConfig(ticker);
  if (!config.enabled) {
    notFound();
  }

  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();
  const serviceSupabase = await createServiceClient();

  // Auth check
  let userId: string | null = null;
  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/login?next=/report/${ticker.toLowerCase()}`);
    }
    userId = user.id;
  }

  // Access check — does this user have a ticker subscription?
  let hasAccess = devBypass;
  if (userId && !devBypass) {
    const { count } = await serviceSupabase
      .from("ticker_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("ticker", ticker)
      .in("status", ["active", "comped"]);

    hasAccess = (count || 0) > 0;
  }

  if (!hasAccess) {
    return (
      <>
        <Header title={`${ticker} Report`} />
        <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Subscribe to view {ticker} reports</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Get daily {ticker} trading intelligence — mode, key levels, scenarios, and a clear execution gameplan — for ${config.priceCents / 100}/month.
              </p>
              <a
                href="/reports"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow h-10 px-6 hover:bg-primary/90 transition-colors"
              >
                View Plans
              </a>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // Fetch latest report for this ticker
  const { data: reportData } = await serviceSupabase
    .from("reports")
    .select("*")
    .eq("ticker", ticker)
    .or("report_type.is.null,report_type.eq.daily")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  const report = reportData as ReportRow | null;

  if (!report) {
    return (
      <>
        <Header title={`${ticker} Report`} />
        <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No {ticker} report available yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {config.name} reports are published after market close on trading days. Check back soon.
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const extractedData = report.extracted_data;
  const mode = extractedData?.mode?.current || "yellow";
  const masterEject = extractedData?.master_eject?.price || 0;
  const closePrice = extractedData?.price?.close || 0;

  const postureFullText = extractedData?.positioning?.posture || extractedData?.position?.current_stance || "—";
  const postureTile = postureFullText === "—" ? "—"
    : postureFullText.toLowerCase().includes("bull") ? "Bullish"
    : postureFullText.toLowerCase().includes("bear") ? "Bearish"
    : postureFullText.toLowerCase().includes("neutral") ? "Neutral"
    : postureFullText.toLowerCase().includes("defensive") ? "Defensive"
    : postureFullText.toLowerCase().includes("cautious") ? "Cautious"
    : postureFullText.split(/[,—\-]/)[0].trim().split(" ").slice(0, 2).join(" ");

  const dailyCapStr = extractedData?.positioning?.daily_cap || "";
  const dailyCapMatch = dailyCapStr.match(/(\d+)/);
  const dailyCapPct = dailyCapMatch ? parseInt(dailyCapMatch[1]) : (extractedData?.position?.daily_cap_pct || null);
  const dailyCap = dailyCapPct ? `${dailyCapPct}% of cash` : "—";

  const posture = postureFullText;
  const slowZone = extractedData?.slow_zone ?? extractedData?.pause_zone;
  const slowZoneActive = extractedData?.slow_zone_active === true;
  const slowZoneNear = !!(slowZone && closePrice && Math.abs(closePrice - slowZone) / closePrice <= 0.01);
  const ejectStep = extractedData?.master_eject_step;
  const putWall = extractedData?.key_levels?.put_wall;
  const ejectLabel = ejectStep
    ? `Step ${ejectStep}: ${formatPrice(masterEject)}${putWall && putWall !== masterEject ? `→${formatPrice(putWall)}` : ""}`
    : formatPrice(masterEject);

  // Format date
  const reportDate = new Date(report.report_date + 'T12:00:00');
  const dayName = reportDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = reportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTitle = `${ticker} Report - ${dayName}, ${monthDay}`;

  return (
    <>
      <Header title={formattedTitle} />
      <main className="px-3 sm:px-4 py-4 sm:py-6 max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <div className="bg-card border rounded-lg p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Mode</p>
            <Badge
              variant={mode as "green" | "yellow" | "orange" | "red"}
              className="mt-1 text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-3 md:px-4"
            >
              {mode.toUpperCase()}
            </Badge>
          </div>

          <div className="bg-card border rounded-lg p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Positioning</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mt-1">{postureTile}</p>
          </div>

          <div className="bg-card border rounded-lg p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Daily Cap</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold mt-1">{dailyCap}</p>
            {(slowZoneActive || slowZoneNear) && slowZone && (
              <p className="text-[10px] sm:text-[11px] md:text-xs text-yellow-500 mt-1">Slow Zone {formatPrice(slowZone)}</p>
            )}
          </div>

          {masterEject > 0 && (
            <div className="bg-card border rounded-lg p-2.5 sm:p-3 md:p-4 lg:p-6 text-center">
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground uppercase tracking-wide">Kill Leverage</p>
              <p className={`text-sm sm:text-base md:text-lg lg:text-xl font-semibold mt-1 ${
                closePrice && closePrice < masterEject ? 'text-red-500' : 'text-muted-foreground'
              }`}>
                {ejectLabel}
              </p>
              {ejectStep && ejectStep >= 2 && (
                <p className="text-[10px] sm:text-[11px] md:text-xs text-red-500 mt-1">⚠️ ACTIVE</p>
              )}
            </div>
          )}
        </div>

        {posture && posture !== "—" && (
          <p className="text-xs sm:text-sm text-muted-foreground text-center -mt-2 px-2">
            {posture}
          </p>
        )}

        {/* Full Report Content */}
        <div className="bg-card border rounded-lg p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
          <MarkdownContent content={report.raw_markdown} />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center px-4">
          This report is for educational purposes only and does not constitute financial advice.
          Always do your own research before making investment decisions.
        </p>
      </main>
    </>
  );
}
