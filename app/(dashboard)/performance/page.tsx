import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtractedReportData } from "@/types";

interface ReportRow {
  report_date: string;
  extracted_data: ExtractedReportData;
}

export default async function PerformancePage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";

  // Use service client in dev mode to bypass RLS
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  // Fetch reports with performance data
  const { data: reportsData } = await supabase
    .from("reports")
    .select("report_date, extracted_data")
    .order("report_date", { ascending: false })
    .limit(30);

  const reports = (reportsData || []) as ReportRow[];

  // Calculate aggregate stats
  let totalForecasts = 0;
  let correctForecasts = 0;

  reports.forEach((report) => {
    const extracted = report.extracted_data;
    if (extracted?.performance) {
      totalForecasts += extracted.performance.total;
      correctForecasts += extracted.performance.score;
    }
  });

  const accuracyRate = totalForecasts > 0 ? (correctForecasts / totalForecasts) * 100 : 0;

  return (
    <>
      <Header title="Performance" />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Overall Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold">{accuracyRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground mt-2">
                {correctForecasts} of {totalForecasts} forecasts correct
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <p className="text-muted-foreground">No performance data yet</p>
                <p className="text-sm text-muted-foreground">Accuracy tracking starts once reports include previous-day forecast scores.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 10).map((report) => {
                  const extracted = report.extracted_data;
                  const perf = extracted?.performance;

                  return (
                    <div
                      key={report.report_date}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm">
                        {new Date(report.report_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      {perf ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {perf.score}/{perf.total}
                          </span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${(perf.score / perf.total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">
              Performance tracking is based on previous day forecasts reviewed in each
              report. Past performance does not guarantee future results.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
