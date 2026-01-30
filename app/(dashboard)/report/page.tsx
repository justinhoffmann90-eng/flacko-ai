import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPercent, formatDate } from "@/lib/utils";
import { MarkdownContent } from "@/components/report/markdown-content";
import { ReportToggle } from "@/components/report/report-toggle";
import { ExtractedReportData } from "@/types";
import { AlertTriangle } from "lucide-react";

interface ReportRow {
  id: string;
  report_date: string;
  raw_markdown: string;
  extracted_data: ExtractedReportData;
  parser_warnings?: string[];
}

export default async function ReportPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  const { data: reportData } = await supabase
    .from("reports")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  const report = reportData as ReportRow | null;

  if (!report) {
    return (
      <>
        <Header title="Today's Report" />
        <main className="px-4 py-6 max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No report available yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Reports are published daily after market close.
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

  // Get positioning data
  const posture = extractedData?.positioning?.posture || extractedData?.position?.current_stance || "—";

  // Parse daily cap % and format as "X% of avail. cash"
  const dailyCapStr = extractedData?.positioning?.daily_cap || "";
  const dailyCapMatch = dailyCapStr.match(/(\d+)/);
  const dailyCapPct = dailyCapMatch ? parseInt(dailyCapMatch[1]) : (extractedData?.position?.daily_cap_pct || null);
  const dailyCap = dailyCapPct ? `${dailyCapPct}% of cash` : "—";

  // Format date as "Thursday, Jan 29"
  const reportDate = new Date(report.report_date + 'T12:00:00');
  const dayName = reportDate.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = reportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedTitle = `TSLA Report - ${dayName}, ${monthDay}`;

  return (
    <>
      <Header title={formattedTitle} />
      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Daily/Weekly Toggle */}
        <ReportToggle />

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Mode</p>
            <Badge
              variant={mode as "green" | "yellow" | "red"}
              className="mt-1 text-sm px-3"
            >
              {mode.toUpperCase()}
            </Badge>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Positioning</p>
            <p className="text-base font-semibold mt-1">{posture}</p>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Daily Cap</p>
            <p className="text-base font-semibold mt-1">{dailyCap}</p>
          </div>
          <div className="bg-card border border-red-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-red-500 uppercase tracking-wide flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Eject
            </p>
            <p className="text-lg font-bold text-red-500">{formatPrice(masterEject)}</p>
          </div>
        </div>

        {/* Full Report Content */}
        <div className="bg-card border rounded-lg p-4 sm:p-6">
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
