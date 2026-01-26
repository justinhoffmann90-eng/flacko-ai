import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatPercent, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ExtractedReportData } from "@/types";

interface ReportListItem {
  id: string;
  report_date: string;
  extracted_data: ExtractedReportData;
}

export default async function HistoryPage() {
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";

  // Use service client in dev mode to bypass RLS
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
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

  const reports = (reportsData || []) as ReportListItem[];

  return (
    <>
      <Header title="Report History" />
      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No reports available yet.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => {
            const extracted = report.extracted_data;
            const mode = extracted?.mode?.current || "yellow";
            const closePrice = extracted?.price?.close || 0;
            const changePct = extracted?.price?.change_pct || 0;

            return (
              <Link key={report.id} href={`/history/${report.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{formatDate(report.report_date)}</p>
                        <div className="flex items-center space-x-3">
                          <Badge variant={mode as "green" | "yellow" | "red"} className="text-xs">
                            {mode.toUpperCase()}
                          </Badge>
                          <span className="text-sm">{formatPrice(closePrice)}</span>
                          <span
                            className={`text-sm ${
                              changePct >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {formatPercent(changePct)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </main>
    </>
  );
}
