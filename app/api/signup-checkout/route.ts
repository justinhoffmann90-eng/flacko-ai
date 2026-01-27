import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCheckoutSession, getCurrentTier, getPriceForTier } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;

    if (existingUser) {
      // User exists - check if they have active subscription
      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", existingUser.id)
        .single();

      if (existingSub?.status === "active") {
        return NextResponse.json({ error: "Already subscribed. Please sign in." }, { status: 400 });
      }
      
      userId = existingUser.id;
    } else {
      // Create new user via admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm so they can log in later
        user_metadata: {},
      });

      if (authError || !authData.user) {
        console.error("Auth error:", authError);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }

      userId = authData.user.id;
    }

    // Calculate tier and price
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "comped"]);

    const tier = getCurrentTier(count || 0);
    const priceInCents = getPriceForTier(tier);

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      userId,
      email,
      priceInCents,
      tier,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signup?canceled=true`,
    });

    // Create pending subscription record
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      status: "pending",
      price_tier: tier,
      locked_price_cents: priceInCents,
    }, {
      onConflict: "user_id",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Signup checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
