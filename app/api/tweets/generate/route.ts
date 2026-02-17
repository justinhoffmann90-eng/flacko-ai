// Force deploy: 2026-02-03 22:17 CT
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateTweetDrafts } from "@/lib/tweets/generator";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the latest report date (don't require today's report)
    const serviceSupabaseForDate = await createServiceClient();
    const { data: latestReport } = await serviceSupabaseForDate
      .from("reports")
      .select("report_date")
      .or("report_type.is.null,report_type.eq.daily")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();
    
    if (!latestReport) {
      return NextResponse.json({ error: "No reports found" }, { status: 404 });
    }
    
    const targetDate = latestReport.report_date;
    console.log(`[Tweet Generate] Using latest report date: ${targetDate}`);
    const drafts = await generateTweetDrafts(targetDate);

    if (drafts.length === 0) {
      return NextResponse.json({ error: "No drafts generated" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // Clear existing pending drafts before inserting new ones
    await serviceSupabase
      .from("tweet_drafts")
      .delete()
      .eq("status", "pending");

    const { error } = await serviceSupabase
      .from("tweet_drafts")
      .insert(
        drafts.map(draft => ({
          date: draft.date,
          type: draft.type,
          content: draft.content,
          status: "pending",
        }))
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    console.error("Tweet draft generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
