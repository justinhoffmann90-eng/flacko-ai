import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Check auth with regular client
    const supabase = await createClient();
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

    // Use service client for admin operations
    const serviceClient = await createServiceClient();
    const userId = params.userId;

    // Get user's subscription to cancel it in Stripe if needed
    const { data: subscription } = await serviceClient
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

    // Delete related data using service client
    // Must delete in order due to foreign key constraints
    console.log(`Deleting user ${userId}...`);

    // Delete all related records first
    const deleteOps = [
      serviceClient.from("chat_messages").delete().eq("session_id", userId),
      serviceClient.from("chat_sessions").delete().eq("user_id", userId),
      serviceClient.from("chat_usage").delete().eq("user_id", userId),
      serviceClient.from("report_alerts").delete().eq("user_id", userId),
      serviceClient.from("notifications").delete().eq("user_id", userId),
      serviceClient.from("user_settings").delete().eq("user_id", userId),
      serviceClient.from("subscriptions").delete().eq("user_id", userId),
    ];

    for (const op of deleteOps) {
      const { error } = await op;
      if (error) {
        console.error("Error deleting related data:", error);
        // Continue anyway
      }
    }

    // Delete from public.users explicitly
    const { error: publicUserError } = await serviceClient
      .from("users")
      .delete()
      .eq("id", userId);

    if (publicUserError) {
      console.error("Error deleting from public.users:", publicUserError);
    }

    // Delete from auth.users last
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting from auth.users:", deleteError);
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteError.message}` },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in delete subscriber API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
