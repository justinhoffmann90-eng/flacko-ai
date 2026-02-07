import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { generateDailyModeCard } from "@/lib/content/daily-mode-card";
import { generateEODAccuracyCard } from "@/lib/content/eod-accuracy-card";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check admin status
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const date = searchParams.get("date");

    if (!type || !date) {
      return new NextResponse("Missing type or date parameter", { status: 400 });
    }

    let result;

    if (type === "daily-mode-card") {
      result = await generateDailyModeCard(date);
    } else if (type === "eod-accuracy-card") {
      result = await generateEODAccuracyCard(date);
    } else {
      return new NextResponse(`Unknown type: ${type}`, { status: 400 });
    }

    if (result.error) {
      return new NextResponse(result.error, { status: 400 });
    }

    if (!result.html) {
      return new NextResponse("No HTML generated", { status: 500 });
    }

    // Return HTML with proper content type
    return new NextResponse(result.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
