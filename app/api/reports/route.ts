import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseReport, PARSER_VERSION, validateReport } from "@/lib/parser";
import { sendDiscordMessage } from "@/lib/discord/client";
import { getNewReportDiscordMessage } from "@/lib/discord/templates";
import { logReportGeneration, logApiError } from "@/lib/api-logger";

export async function GET() {
  try {
    const supabase = await createClient();
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";

    if (!devBypass) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";

    if (!devBypass) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if admin
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!userData?.is_admin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    const { markdown } = await request.json();

    if (!markdown) {
      return NextResponse.json({ error: "Markdown content required" }, { status: 400 });
    }

    // Parse the report
    const { parsed_data, extracted_data, warnings } = parseReport(markdown);

    // Validate
    const validationErrors = validateReport(extracted_data);
    if (validationErrors.length > 0) {
      await logReportGeneration({
        reportDate: new Date().toISOString().split("T")[0],
        status: 'failed',
        source: 'api',
        errorMessage: validationErrors.join(', '),
      });
      return NextResponse.json({
        error: "Validation failed",
        errors: validationErrors,
      }, { status: 400 });
    }

    // Get report date (today's date)
    const today = new Date().toISOString().split("T")[0];

    // Insert report
    const { data: report, error: insertError } = await serviceSupabase
      .from("reports")
      .upsert({
        report_date: today,
        raw_markdown: markdown,
        parsed_data,
        extracted_data,
        parser_version: PARSER_VERSION,
        parser_warnings: warnings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "report_date",
      })
      .select()
      .single();

    if (insertError) {
      await logReportGeneration({
        reportDate: today,
        status: 'failed',
        source: 'api',
        errorMessage: insertError.message,
      });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log successful report generation
    await logReportGeneration({
      reportDate: today,
      status: warnings.length > 0 ? 'partial' : 'success',
      source: 'api',
      parseWarnings: warnings,
      fieldsParsed: Object.keys(extracted_data).length,
    });

    // Create alerts for all active subscribers
    const { data: subscribers } = await serviceSupabase
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "comped"]);

    if (subscribers && extracted_data.alerts) {
      const alertInserts = [];
      for (const sub of subscribers) {
        // Check if user has alerts enabled
        const { data: settings } = await serviceSupabase
          .from("user_settings")
          .select("alerts_enabled")
          .eq("user_id", sub.user_id)
          .single();

        if (settings?.alerts_enabled !== false) {
          for (const alert of extracted_data.alerts) {
            alertInserts.push({
              report_id: report.id,
              user_id: sub.user_id,
              price: alert.price,
              type: alert.type,
              level_name: alert.level_name,
              action: alert.action,
              reason: alert.reason,
            });
          }
        }
      }

      if (alertInserts.length > 0) {
        await serviceSupabase.from("report_alerts").insert(alertInserts);
      }
    }

    // Send Discord notification for new report
    const discordMessage = getNewReportDiscordMessage({
      mode: extracted_data.mode?.current || "yellow",
      reportDate: today,
      closePrice: extracted_data.price?.close || 0,
      changePct: extracted_data.price?.change_pct || 0,
      alerts: extracted_data.alerts || [],
      positioning: extracted_data.positioning,
      tiers: extracted_data.tiers,
      masterEject: extracted_data.master_eject?.price,
    });
    await sendDiscordMessage(discordMessage);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Report upload error:", error);
    await logApiError({
      endpoint: '/api/reports',
      method: 'POST',
      statusCode: 500,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
