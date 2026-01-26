import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parseReport, validateReport } from "@/lib/parser";

export async function POST(request: Request) {
  try {
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";

    if (!devBypass) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if admin
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!userData?.is_admin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    const { markdown } = await request.json();

    if (!markdown) {
      return NextResponse.json({ error: "Markdown content required" }, { status: 400 });
    }

    // Parse the report
    const { extracted_data, warnings } = parseReport(markdown);

    // Validate
    const validationErrors = validateReport(extracted_data);

    return NextResponse.json({
      success: validationErrors.length === 0,
      warnings: [...warnings, ...validationErrors],
      data: {
        mode: extracted_data.mode.current,
        close: extracted_data.price.close,
        masterEject: extracted_data.master_eject.price,
        alertsCount: extracted_data.alerts.length,
      },
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: "Failed to parse report" }, { status: 500 });
  }
}
