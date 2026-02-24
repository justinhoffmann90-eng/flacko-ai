import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPercent } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight, Calendar, CalendarDays } from "lucide-react";
import { ExtractedReportData } from "@/types";
import { WeeklyReviewData } from "@/types/weekly-review";

interface ReportListItem {
  id: string;
  report_date: string;
  extracted_data: ExtractedReportData;
}

interface WeeklyReviewListItem {
  id: string;
  week_start: string;
  week_end: string;
  extracted_data: WeeklyReviewData;
}

type HistoryItem =
  | { type: "daily"; data: ReportListItem }
  | { type: "weekly"; data: WeeklyReviewListItem };

// Format week range: "Feb 3-7, 2026" or "Jan 27 – Feb 2, 2026"
function formatWeekRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

// Format date for daily reports
function formatDate(date: string | Date): string {
  let dateObj: Date;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    dateObj = new Date(date + "T12:00:00");
  } else {
    dateObj = new Date(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
}

// Get sort date for an item
function getSortDate(item: HistoryItem): Date {
  if (item.type === "daily") {
    return new Date(item.data.report_date + "T12:00:00");
  } else {
    return new Date(item.data.week_end + "T12:00:00");
  }
}

export default async function HistoryPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";

  // Use service client in dev mode to bypass RLS
  const supabase = devBypass
    ? await createServiceClient()
    : await createClient();

  if (!devBypass) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  // Fetch past reports
  const { data: reportsData } = await supabase
    .from("reports")
    .select("id, report_date, extracted_data")
    .order("report_date", { ascending: false })
    .limit(30);

  // Fetch weekly reviews
  const { data: weeklyData } = await supabase
    .from("weekly_reviews")
    .select("id, week_start, week_end, extracted_data")
    .order("week_end", { ascending: false })
    .limit(10);

  const reports = (reportsData || []) as ReportListItem[];
  const weeklyReviews = (weeklyData || []) as WeeklyReviewListItem[];

  // Combine into history items
  const historyItems: HistoryItem[] = [
    ...reports.map((r) => ({ type: "daily" as const, data: r })),
    ...weeklyReviews.map((w) => ({ type: "weekly" as const, data: w })),
  ];

  // Sort by date (most recent first)
  historyItems.sort((a, b) => getSortDate(b).getTime() - getSortDate(a).getTime());

  return (
    <>
      <Header title="Report History" />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {historyItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No reports available yet.</p>
            </CardContent>
          </Card>
        ) : (
          historyItems.map((item, index) => {
            if (item.type === "daily") {
              const report = item.data;
              const extracted = report.extracted_data;
              const mode = extracted?.mode?.current || "yellow";
              const closePrice = extracted?.price?.close || 0;
              const changePct = extracted?.price?.change_pct || 0;

              return (
                <Link key={`daily-${report.id}`} href={`/history/${report.id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Daily
                            </span>
                          </div>
                          <p className="font-medium truncate">
                            {formatDate(report.report_date)}
                          </p>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={
                                mode as "green" | "yellow" | "orange" | "red"
                              }
                              className="text-xs"
                            >
                              {mode.toUpperCase()}
                            </Badge>
                            <span className="text-sm">
                              {formatPrice(closePrice)}
                            </span>
                            <span
                              className={`text-sm ${
                                changePct >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {formatPercent(changePct)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            } else {
              const review = item.data;
              const extracted = review.extracted_data;
              const mode = extracted?.mode || "yellow";
              const closePrice = extracted?.candle?.close || 0;
              const changePct = extracted?.candle?.change_pct || 0;
              const weekRange = formatWeekRange(
                review.week_start,
                review.week_end
              );

              return (
                <Link key={`weekly-${review.id}`} href="/weekly">
                  <Card className="hover:bg-accent transition-colors cursor-pointer border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">
                              Weekly Review
                            </span>
                          </div>
                          <p className="font-medium truncate">{weekRange}</p>
                          <div className="flex items-center space-x-3">
                            <Badge
                              variant={
                                mode as "green" | "yellow" | "orange" | "red"
                              }
                              className="text-xs"
                            >
                              {mode.toUpperCase()}
                            </Badge>
                            <span className="text-sm">
                              {formatPrice(closePrice)}
                            </span>
                            <span
                              className={`text-sm ${
                                changePct >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {formatPercent(changePct)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            }
          })
        )}
      </main>
    </>
  );
}
