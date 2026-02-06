import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Use service role for internal API access (Content Hub)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest report:", error);
      return NextResponse.json(
        { error: "Failed to fetch latest report" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No reports found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
