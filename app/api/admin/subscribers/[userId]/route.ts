import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const userId = params.userId;

    // Get user's subscription to cancel it in Stripe if needed
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    // Cancel Stripe subscription if exists
    if (subscription?.stripe_subscription_id) {
      try {
        const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } catch (stripeError) {
        console.error("Error canceling Stripe subscription:", stripeError);
        // Continue with deletion even if Stripe cancel fails
      }
    }

    // Delete related data (cascading deletes should handle most of this)
    // But explicitly delete some tables to be sure
    await supabase.from("subscriptions").delete().eq("user_id", userId);
    await supabase.from("user_settings").delete().eq("user_id", userId);
    await supabase.from("report_alerts").delete().eq("user_id", userId);
    await supabase.from("chat_sessions").delete().eq("user_id", userId);
    await supabase.from("chat_usage").delete().eq("user_id", userId);
    await supabase.from("notifications").delete().eq("user_id", userId);

    // Delete from auth.users (this will cascade to public.users)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in delete subscriber API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
