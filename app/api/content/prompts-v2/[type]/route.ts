import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/content/prompts-v2/[type] - Get prompt + versions
export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
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

    const serviceSupabase = await createServiceClient();
    const contentType = params.type;

    // Get prompt
    const { data: prompt, error: promptError } = await serviceSupabase
      .from("content_prompts_v2")
      .select("*")
      .eq("content_type", contentType)
      .single();

    if (promptError && promptError.code !== "PGRST116") {
      throw promptError;
    }

    // Get versions if prompt exists
    let versions = [];
    if (prompt) {
      const { data: versionsData, error: versionsError } = await serviceSupabase
        .from("content_prompt_versions")
        .select("*")
        .eq("prompt_id", prompt.id)
        .order("version", { ascending: false });

      if (!versionsError) {
        versions = versionsData || [];
      }
    }

    return NextResponse.json({
      prompt: prompt || { content_type: contentType, prompt: "" },
      versions,
    });
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/content/prompts-v2/[type] - Update prompt (creates version)
export async function PUT(
  request: Request,
  { params }: { params: { type: string } }
) {
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
    const { prompt, change_notes } = body;
    const contentType = params.type;

    if (typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    // Check if prompt exists
    const { data: existingPrompt } = await serviceSupabase
      .from("content_prompts_v2")
      .select("id, prompt")
      .eq("content_type", contentType)
      .single();

    let result;

    if (existingPrompt) {
      // Update existing - trigger will create version
      const { data, error } = await serviceSupabase
        .from("content_prompts_v2")
        .update({
          prompt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPrompt.id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Update the latest version with change notes if provided
      if (change_notes) {
        const { data: latestVersion } = await serviceSupabase
          .from("content_prompt_versions")
          .select("id")
          .eq("prompt_id", existingPrompt.id)
          .order("version", { ascending: false })
          .limit(1)
          .single();

        if (latestVersion) {
          await serviceSupabase
            .from("content_prompt_versions")
            .update({ change_notes })
            .eq("id", latestVersion.id);
        }
      }
    } else {
      // Insert new
      const { data, error } = await serviceSupabase
        .from("content_prompts_v2")
        .insert({
          content_type: contentType,
          prompt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving prompt:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
