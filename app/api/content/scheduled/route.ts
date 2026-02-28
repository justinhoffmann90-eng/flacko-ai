import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/content/scheduled - Get scheduled content
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    const serviceSupabase = await createServiceClient();

    let query = serviceSupabase
      .from("scheduled_content")
      .select("*")
      .order("scheduled_for", { ascending: true })
      .limit(limit);

    // Filter by week if provided
    if (week) {
      const weekStart = startOfWeek(parseISO(week), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      query = query
        .gte("scheduled_for", weekStart.toISOString())
        .lte("scheduled_for", weekEnd.toISOString());
    }

    // Filter by status if provided
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error("Error fetching scheduled content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/content/scheduled - Create scheduled content
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content_type, content, scheduled_for, status = "draft", metadata } = body;

    if (!content_type || !content || !scheduled_for) {
      return NextResponse.json(
        { error: "Missing required fields: content_type, content, scheduled_for" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    const { data, error } = await serviceSupabase
      .from("scheduled_content")
      .insert({
        content_type,
        content,
        scheduled_for,
        status,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating scheduled content:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
