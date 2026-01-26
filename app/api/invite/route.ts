import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/invite?code=XXXX
 * Validates an invite code and returns its details
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  
  const { data: inviteCode, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !inviteCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if expired
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite code has expired" }, { status: 410 });
  }

  // Check if max uses reached
  if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
    return NextResponse.json({ error: "Invite code has reached max uses" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    isBetaFounder: inviteCode.is_beta_founder_code,
    discountPercent: inviteCode.discount_percent,
    fixedPriceCents: inviteCode.fixed_price_cents,
  });
}

/**
 * POST /api/invite/redeem
 * Redeems an invite code for the current user
 */
export async function POST(request: NextRequest) {
  const { code } = await request.json();
  
  if (!code) {
    return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
  }

  const supabase = await createClient();
  const serviceSupabase = await createServiceClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Validate invite code
  const { data: inviteCode, error: codeError } = await serviceSupabase
    .from("invite_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (codeError || !inviteCode) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if expired
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite code has expired" }, { status: 410 });
  }

  // Check if max uses reached
  if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
    return NextResponse.json({ error: "Invite code has reached max uses" }, { status: 410 });
  }

  // Start trial and apply invite code to user
  const trialStartsAt = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30 day trial

  const { error: updateError } = await serviceSupabase
    .from("users")
    .update({
      trial_starts_at: trialStartsAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
      is_beta_founder: inviteCode.is_beta_founder_code || false,
      invite_code: code.toUpperCase(),
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error updating user:", updateError);
    return NextResponse.json({ error: "Failed to apply invite code" }, { status: 500 });
  }

  // Increment invite code usage
  await serviceSupabase
    .from("invite_codes")
    .update({ current_uses: inviteCode.current_uses + 1 })
    .eq("id", inviteCode.id);

  return NextResponse.json({
    success: true,
    trialEndsAt: trialEndsAt.toISOString(),
    isBetaFounder: inviteCode.is_beta_founder_code,
  });
}
