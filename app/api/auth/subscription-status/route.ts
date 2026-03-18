import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isSubscriber: false, isLoggedIn: false });
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      isSubscriber: hasSubscriptionAccess(subscription),
      isLoggedIn: true,
    });
  } catch {
    return NextResponse.json({ isSubscriber: false, isLoggedIn: false });
  }
}
