import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createBillingPortalSession, getStripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's Stripe customer ID
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // If no stripe_customer_id saved, try to find it by email in Stripe
    if (!customerId && user.email) {
      try {
        const stripe = getStripe();
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          // Backfill the missing stripe_customer_id so this self-heals
          const serviceSupabase = await createServiceClient();
          await serviceSupabase
            .from("subscriptions")
            .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);
          console.log(`Backfilled stripe_customer_id ${customerId} for user ${user.id}`);
        }
      } catch (lookupErr) {
        console.error("Stripe customer lookup by email failed:", lookupErr);
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Build return URL - prefer env var, fall back to request host
    let returnUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\\n/g, "");
    if (!returnUrl) {
      const headersList = await headers();
      const host = headersList.get("host") || "www.flacko.ai";
      const protocol = host.includes("localhost") ? "http" : "https";
      returnUrl = `${protocol}://${host}`;
    }

    const session = await createBillingPortalSession({
      customerId,
      returnUrl: `${returnUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    // Return more specific error info
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
      // Check for common Stripe errors
      if (error.message.includes("No such customer")) {
        return NextResponse.json({ error: "Customer not found in Stripe. Please contact support." }, { status: 404 });
      }
      if (error.message.includes("STRIPE_SECRET_KEY")) {
        return NextResponse.json({ error: "Stripe configuration error. Please contact support." }, { status: 500 });
      }
      return NextResponse.json({ error: `Billing error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
