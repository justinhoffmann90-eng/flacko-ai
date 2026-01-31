import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, xHandle, source } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Upsert lead (don't create duplicates)
    const { error } = await supabase
      .from("leads")
      .upsert({
        email: email.toLowerCase().trim(),
        x_handle: xHandle?.trim() || null,
        source: source || "signup",
      }, {
        onConflict: "email",
        ignoreDuplicates: true,
      });

    if (error) {
      console.error("Lead capture error:", error);
      // Don't fail the request - lead capture is non-critical
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ ok: true }); // Silent fail
  }
}
