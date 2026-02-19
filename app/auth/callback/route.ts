import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // Handle PKCE code exchange (OAuth/magic link via email)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Code exchange error:", error);
  }

  // Handle token_hash flow (recovery, magic link verification)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "magiclink" | "recovery" | "email",
    });
    if (!error) {
      // Recovery flows must land on the reset-password page so the user can set their password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Token verification error:", error);
    // Link expired or already used — send to reset-password with error context
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password?error=link_expired`);
    }
  }

  // Return the user to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
