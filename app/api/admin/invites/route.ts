import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

/**
 * GET /api/admin/invites
 * List all invite codes (admin only)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData } = await serviceSupabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { data: invites, error } = await serviceSupabase
    .from("invite_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites });
}

/**
 * POST /api/admin/invites
 * Create new invite code(s) (admin only)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData } = await serviceSupabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const {
    count = 1,
    isBetaFounder = false,
    maxUses = 1,
    expiresInDays,
    discountPercent,
    fixedPriceCents,
    notes,
    customCode, // Optional custom code (only for count=1)
  } = body;

  const codes: string[] = [];
  const expiresAt = expiresInDays 
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  for (let i = 0; i < count; i++) {
    const code = customCode && count === 1 
      ? customCode.toUpperCase() 
      : `FLACKO-${nanoid(8).toUpperCase()}`;
    
    codes.push(code);

    const { error } = await serviceSupabase.from("invite_codes").insert({
      code,
      created_by: user.id,
      expires_at: expiresAt,
      max_uses: maxUses,
      is_beta_founder_code: isBetaFounder,
      discount_percent: discountPercent,
      fixed_price_cents: fixedPriceCents,
      notes,
    });

    if (error) {
      console.error("Error creating invite code:", error);
      // Continue with other codes
    }
  }

  return NextResponse.json({ 
    success: true, 
    codes,
    count: codes.length,
  });
}

/**
 * DELETE /api/admin/invites
 * Delete an invite code (admin only)
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();

  // Check admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData } = await serviceSupabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await request.json();

  const { error } = await serviceSupabase
    .from("invite_codes")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
