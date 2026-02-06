import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Bell, Calendar, Radio, Database, Wifi, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { DiscordAlertLog } from "@/components/admin/discord-alert-log";
import { ApiErrorLog } from "@/components/admin/api-error-log";
import { ReportGenerationLog } from "@/components/admin/report-generation-log";
import { TemplateEditor } from "@/components/admin/template-editor";

// Check if a date is stale (more than expected days old, accounting for weekends)
function isReportStale(reportDate: string): { stale: boolean; daysSince: number; reason?: string } {
  const report = new Date(reportDate + 'T12:00:00');
  const now = new Date();
  const diffMs = now.getTime() - report.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Get current day of week (0 = Sunday)
  const today = now.getDay();
  const reportDay = report.getDay();
  
  // If it's weekend and last report was Friday, that's fine
  if ((today === 0 || today === 6) && reportDay === 5 && daysSince <= 2) {
    return { stale: false, daysSince };
  }
  
  // If it's Monday and last report was Friday, that's fine
  if (today === 1 && reportDay === 5 && daysSince <= 3) {
    return { stale: false, daysSince };
  }
  
  // Otherwise, more than 1 business day is stale
  if (daysSince > 1) {
    return { stale: true, daysSince, reason: `${daysSince} days old` };
  }
  
  return { stale: false, daysSince };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const startTime = Date.now();

  // Test database connection with timing
  let dbHealthy = false;
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    const { error } = await supabase.from("reports").select("id").limit(1);
    dbLatencyMs = Date.now() - dbStart;
    dbHealthy = !error;
  } catch {
    dbHealthy = false;
  }

  // Get stats
  const { count: totalSubscribers } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "comped"]);

  const { count: totalReports } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true });

  const { count: pendingAlerts } = await supabase
    .from("report_alerts")
    .select("*", { count: "exact", head: true })
    .is("triggered_at", null);

  const { data: latestReportData } = await supabase
    .from("reports")
    .select("report_date")
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  // Get upcoming catalysts
  const today = new Date().toISOString().split('T')[0];
  const { count: upcomingCatalysts } = await supabase
    .from("catalysts")
    .select("*", { count: "exact", head: true })
    .gte("event_date", today);

  const latestReport = latestReportData as { report_date: string } | null;
  const reportStatus = latestReport ? isReportStale(latestReport.report_date) : null;
  
  // Format the report date properly
  const formatReportDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const totalLoadTime = Date.now() - startTime;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <span className="text-xs text-muted-foreground">
          Page loaded in {totalLoadTime}ms
        </span>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSubscribers || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalReports || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming Catalysts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{upcomingCatalysts || 0}</p>
          </CardContent>
        </Card>

        <Card className={reportStatus?.stale ? "border-yellow-500/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Latest Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestReport ? (
              <>
                <p className="text-lg font-medium">
                  {formatReportDate(latestReport.report_date)}
                </p>
                {reportStatus?.stale ? (
                  <p className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {reportStatus.reason}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    {reportStatus?.daysSince === 0 ? "Today" : `${reportStatus?.daysSince} day(s) ago`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg font-medium text-muted-foreground">None</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/reports"
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <p className="font-medium">Upload New Report</p>
              <p className="text-sm text-muted-foreground">
                Publish today&apos;s daily analysis
              </p>
            </a>
            <a
              href="/admin/subscribers"
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <p className="font-medium">Manage Subscribers</p>
              <p className="text-sm text-muted-foreground">
                View and manage subscriber accounts
              </p>
            </a>
            <a
              href="/catalysts"
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <p className="font-medium">Manage Catalysts</p>
              <p className="text-sm text-muted-foreground">
                Add or edit upcoming events
              </p>
            </a>
            <a
              href="/admin/command-center"
              className="block p-3 rounded-lg border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <p className="font-medium flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Command Center
              </p>
              <p className="text-sm text-muted-foreground">
                Clawd operations dashboard
              </p>
            </a>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              System Health
              <span className="text-xs font-normal text-muted-foreground">
                Live checks
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Database */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Supabase Connection</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Live query to database</p>
                </div>
                <div className="flex items-center gap-2">
                  {dbHealthy ? (
                    <>
                      <span className="text-xs text-muted-foreground">{dbLatencyMs}ms</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-red-500">Error</span>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </>
                  )}
                </div>
              </div>

              {/* Report Status */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Daily Report</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Is latest report current? (accounts for weekends)</p>
                </div>
                <div className="flex items-center gap-2">
                  {!latestReport ? (
                    <>
                      <span className="text-xs text-red-500">No reports</span>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </>
                  ) : reportStatus?.stale ? (
                    <>
                      <span className="text-xs text-yellow-500">Stale</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">Current</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </>
                  )}
                </div>
              </div>

              {/* Pending Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Price Alerts</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">User alerts waiting to trigger</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{pendingAlerts || 0} queued</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>

              {/* Catalysts */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Catalyst Calendar</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Upcoming TSLA/macro events</p>
                </div>
                <div className="flex items-center gap-2">
                  {(upcomingCatalysts || 0) > 0 ? (
                    <>
                      <span className="text-xs text-muted-foreground">{upcomingCatalysts} upcoming</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-xs text-yellow-500">None scheduled</span>
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                {dbHealthy && !reportStatus?.stale ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-600 dark:text-green-400">All systems operational</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-yellow-600 dark:text-yellow-400">Some items need attention</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error & Generation Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiErrorLog />
        <ReportGenerationLog />
      </div>

      {/* Discord Alert Log */}
      <DiscordAlertLog />

      {/* AI Template Editor */}
      <TemplateEditor />
    </div>
  );
}
