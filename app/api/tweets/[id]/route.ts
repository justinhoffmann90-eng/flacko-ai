import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const status = String(body?.status || "");
    const allowed = ["pending", "approved", "rejected", "posted"];

    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();
    const { data, error } = await serviceSupabase
      .from("tweet_drafts")
      .update({ status })
      .eq("id", params.id)
      .select("id, status")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, draft: data });
  } catch (error) {
    console.error("Tweet draft update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
