import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseReport, PARSER_VERSION } from "@/lib/parser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const adminSecretHeader = request.headers.get("authorization");
    if (adminSecretHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date } = await request.json();

    const serviceSupabase = await createServiceClient();

    // Fetch the stored report
    let query = serviceSupabase.from("reports").select("id, raw_markdown, report_date");
    if (date) {
      query = query.eq("report_date", date);
    } else {
      query = query.order("report_date", { ascending: false }).limit(1);
    }
    const { data: reports, error: fetchError } = await query;

    if (fetchError || !reports || reports.length === 0) {
      return NextResponse.json({ error: "Report not found", detail: fetchError?.message }, { status: 404 });
    }

    const report = reports[0];

    // Re-parse with updated parser
    const { parsed_data, extracted_data, warnings } = parseReport(report.raw_markdown);

    // Save back
    const { error: updateError } = await serviceSupabase
      .from("reports")
      .update({
        parsed_data,
        extracted_data,
        parser_version: PARSER_VERSION,
        parser_warnings: warnings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save", detail: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      report_date: report.report_date,
      report_id: report.id,
      positioning: extracted_data.positioning ?? null,
      daily_cap: extracted_data.positioning?.daily_cap ?? null,
      posture: extracted_data.positioning?.posture ?? null,
      warnings,
    });
  } catch (error) {
    console.error("Reparse error:", error);
    return NextResponse.json({ error: "Internal error", detail: String(error) }, { status: 500 });
  }
}
