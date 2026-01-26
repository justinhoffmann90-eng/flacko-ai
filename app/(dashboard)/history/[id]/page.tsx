import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatPercent, formatDate } from "@/lib/utils";
import { MarkdownContent } from "@/components/report/markdown-content";
import { ExtractedReportData } from "@/types";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface ReportData {
  id: string;
  report_date: string;
  raw_markdown: string;
  extracted_data: ExtractedReportData;
}

export default async function HistoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const devBypass = process.env.DEV_BYPASS_AUTH === "true";
  const supabase = devBypass ? await createServiceClient() : await createClient();

  if (!devBypass) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
  }

  const { data: reportData, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !reportData) {
    notFound();
  }

  const report = reportData as ReportData;
  const extractedData = report.extracted_data;
  const mode = extractedData?.mode?.current || "yellow";
  const closePrice = extractedData?.price?.close || 0;
  const changePct = extractedData?.price?.change_pct || 0;
  const masterEject = extractedData?.master_eject?.price || 0;
  const entryScore = extractedData?.entry_quality?.score || 0;

  return (
    <>
      <Header title={`Report - ${formatDate(report.report_date)}`} />
      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/history">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </Link>

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
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Close</p>
            <p className="text-lg font-bold">{formatPrice(closePrice)}</p>
            <p className={`text-xs ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatPercent(changePct)}
            </p>
          </div>
          <div className="bg-card border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Entry</p>
            <p className="text-lg font-bold">{entryScore}/5</p>
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
