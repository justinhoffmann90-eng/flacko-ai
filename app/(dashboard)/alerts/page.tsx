import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowUp, ArrowDown, AlertTriangle, MessageCircle } from "lucide-react";
import { ExtractedReportData, ReportAlert } from "@/types";

export const dynamic = "force-dynamic";

interface ReportData {
  report_date: string;
  extracted_data: ExtractedReportData;
}

export default async function AlertsPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      redirect("/login");
    }
  }

  // Fetch latest report with alert levels
  const { data: reportData } = await supabase
    .from("reports")
    .select("report_date, extracted_data")
    .or("report_type.is.null,report_type.eq.daily")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  const report = reportData as ReportData | null;
  const extractedData = report?.extracted_data || null;
  const alerts = extractedData?.alerts || [];
  const masterEject = extractedData?.master_eject?.price || 0;

  // Separate upside and downside alerts
  const upsideAlerts = alerts.filter((a: ReportAlert) => a.type === "upside");
  const downsideAlerts = alerts.filter((a: ReportAlert) => a.type === "downside");

  return (
    <>
      <Header title="Alert Levels" />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Report Date */}
        {report && (
          <p className="text-sm text-muted-foreground text-center">
            From {formatDate(report.report_date)} report
          </p>
        )}

        {/* Discord Alert Info */}
        <Card className="border-indigo-500/30 bg-indigo-500/5">
          <CardContent className="py-4 px-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-400">Alerts via Discord</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Price alerts are automatically posted to the <span className="font-medium text-foreground">#alerts</span> channel. Turn on notifications to get notified when key levels are hit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Master Eject */}
        {masterEject > 0 && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-500">Master Eject</p>
                  <p className="text-2xl font-bold">{formatPrice(masterEject)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Exit all positions if price closes below
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upside Levels */}
        {upsideAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <h2 className="font-semibold text-green-500">Upside Targets</h2>
            </div>
            <div className="space-y-2">
              {upsideAlerts.map((alert: ReportAlert, idx: number) => (
                <Card key={idx} className="border-green-500/20">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {alert.level_name && (
                          <Badge variant="upside" className="mb-1">
                            {alert.level_name}
                          </Badge>
                        )}
                        <p className="text-xl font-bold">{formatPrice(alert.price)}</p>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-sm font-medium">{alert.action}</p>
                        {alert.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{alert.reason}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Downside Levels */}
        {downsideAlerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <h2 className="font-semibold text-red-500">Downside Support</h2>
            </div>
            <div className="space-y-2">
              {downsideAlerts.map((alert: ReportAlert, idx: number) => (
                <Card key={idx} className="border-red-500/20">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {alert.level_name && (
                          <Badge variant="downside" className="mb-1">
                            {alert.level_name}
                          </Badge>
                        )}
                        <p className="text-xl font-bold">{formatPrice(alert.price)}</p>
                      </div>
                      <div className="text-right flex-1">
                        <p className="text-sm font-medium">{alert.action}</p>
                        {alert.reason && (
                          <p className="text-xs text-muted-foreground mt-1">{alert.reason}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No alert levels yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Key price levels with buy/sell actions will appear here once today&apos;s report is published. Alerts auto-fire to Discord when levels are hit.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Key levels from today&apos;s report. You can also set alerts in your broker for these prices.
        </p>
      </main>
    </>
  );
}
