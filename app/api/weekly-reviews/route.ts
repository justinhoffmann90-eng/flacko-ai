import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseWeeklyReview, validateWeeklyReview, WEEKLY_PARSER_VERSION } from "@/lib/parser/weekly-review";

export const dynamic = "force-dynamic";

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

    const { data: reviews, error } = await supabase
      .from("weekly_reviews")
      .select("*")
      .order("week_end", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Weekly reviews GET error:", error);
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

    // Parse the weekly review
    const { raw_markdown, extracted_data, parser_warnings } = parseWeeklyReview(markdown);

    // Validate
    const validationErrors = validateWeeklyReview(extracted_data);
    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: "Validation failed",
        errors: validationErrors,
      }, { status: 400 });
    }

    // Upsert the weekly review
    const { data: review, error: insertError } = await serviceSupabase
      .from("weekly_reviews")
      .upsert({
        week_start: extracted_data.week_start,
        week_end: extracted_data.week_end,
        raw_markdown,
        extracted_data,
        parser_version: WEEKLY_PARSER_VERSION,
        parser_warnings,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "week_start,week_end",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Weekly review insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.log(`✅ Weekly review uploaded for ${extracted_data.week_start} to ${extracted_data.week_end}`);

    return NextResponse.json({
      success: true,
      review,
      warnings: parser_warnings,
    });
  } catch (error) {
    console.error("Weekly review upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
