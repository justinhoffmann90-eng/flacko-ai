import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/admin/orb/pipeline/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = await createServiceClient();
  const { data, error } = await serviceSupabase
    .from("orb_setup_pipeline")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ setup: data });
}

// PATCH /api/admin/orb/pipeline/[id] — update (status, notes, stats, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = await createServiceClient();
  const body = await request.json();
  const now = new Date().toISOString();

  // Auto-set timestamps based on status transitions
  const updates: Record<string, any> = {
    ...body,
    updated_at: now,
  };
  if (body.status === "active" && !body.promoted_at) updates.promoted_at = now;
  if (body.status === "archived" && !body.archived_at) updates.archived_at = now;

  const { data, error } = await serviceSupabase
    .from("orb_setup_pipeline")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ setup: data });
}

// DELETE /api/admin/orb/pipeline/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = await createServiceClient();
  const { error } = await serviceSupabase
    .from("orb_setup_pipeline")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
