import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Force dynamic rendering — never cache this route
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Create client per-request to avoid stale module-level initialization
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // "daily" | "weekly" | null (default: latest daily)

    let query = supabase
      .from("reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1);

    // Filter by report type if requested
    if (type === "weekly") {
      query = query.eq("parsed_data->>report_type", "weekly");
    } else if (type === "daily" || !type) {
      // Default: return latest daily report (exclude weekly)
      query = query.or("parsed_data->>report_type.is.null,parsed_data->>report_type.neq.weekly");
    }

    const { data, error } = await query.single();

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

    // Prevent any caching
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
