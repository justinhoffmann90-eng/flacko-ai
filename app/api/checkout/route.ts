import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCheckoutSession, getCurrentTier, getPriceForTier } from "@/lib/stripe/server";

interface ExistingSubscription {
  status: string;
  locked_price_cents: number | null;
  price_tier: number;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an active subscription
    const { data: existingSubData } = await supabase
      .from("subscriptions")
      .select("status, locked_price_cents, price_tier")
      .eq("user_id", user.id)
      .single();

    const existingSubscription = existingSubData as ExistingSubscription | null;
    if (existingSubscription?.status === "active") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    // Determine price - use locked price if returning subscriber
    let priceInCents: number;
    let tier: number;

    if (existingSubscription?.locked_price_cents) {
      // Returning subscriber - use their locked price
      priceInCents = existingSubscription.locked_price_cents;
      tier = existingSubscription.price_tier;
    } else {
      // New subscriber - calculate current tier
      const { count } = await serviceSupabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "comped"]);

      tier = getCurrentTier(count || 0);
      priceInCents = getPriceForTier(tier);
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      priceInCents,
      tier,
      successUrl: `https://flacko.ai/dashboard?success=true`,
      cancelUrl: `https://flacko.ai/signup?canceled=true`,
    });

    // Create pending subscription record if not exists
    if (!existingSubscription) {
      const subToInsert = {
        user_id: user.id,
        status: "pending",
        price_tier: tier,
        locked_price_cents: priceInCents,
      };
      await (serviceSupabase.from("subscriptions") as unknown as { insert: (data: typeof subToInsert) => Promise<unknown> })
        .insert(subToInsert);
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
