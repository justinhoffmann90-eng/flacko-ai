import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/content/prompts?section=section_key
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
    const section = searchParams.get("section");

    const serviceSupabase = await createServiceClient();

    if (section) {
      // Get specific prompt
      const { data, error } = await serviceSupabase
        .from("content_prompts")
        .select("*")
        .eq("section_key", section)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = not found
        throw error;
      }

      return NextResponse.json(data || { section_key: section, prompt_text: null });
    } else {
      // Get all prompts
      const { data, error } = await serviceSupabase
        .from("content_prompts")
        .select("*")
        .order("section_key", { ascending: true });

      if (error) throw error;

      return NextResponse.json({ prompts: data || [] });
    }
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/content/prompts
export async function PUT(request: Request) {
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
    const { section_key, prompt_text } = body;

    if (!section_key || typeof prompt_text !== "string") {
      return NextResponse.json(
        { error: "Missing required fields: section_key, prompt_text" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    // Upsert the prompt
    const { data, error } = await serviceSupabase
      .from("content_prompts")
      .upsert(
        {
          section_key,
          prompt_text,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "section_key",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error saving prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/prompts?section=section_key
export async function DELETE(request: Request) {
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
    const section = searchParams.get("section");

    if (!section) {
      return NextResponse.json(
        { error: "Missing required parameter: section" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    const { error } = await serviceSupabase
      .from("content_prompts")
      .delete()
      .eq("section_key", section);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
