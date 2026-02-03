import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateTweetDrafts } from "@/lib/tweets/generator";

export async function POST() {
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

    const drafts = await generateTweetDrafts();

    if (drafts.length === 0) {
      return NextResponse.json({ error: "No drafts generated" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();
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
