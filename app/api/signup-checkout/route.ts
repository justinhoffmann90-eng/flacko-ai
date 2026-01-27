import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCheckoutSession, getCurrentTier, getPriceForTier } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    // Debug: check if Stripe key exists
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 8) || "NOT_SET";
    
    const { email, trial } = await request.json();
    const trialDays = trial ? 45 : 0; // 45-day trial if trial=true
    const useFounderPricing = true; // Always use $29.99 base - users apply FOUNDER code for discount
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    let userId: string;

    // Try to create user - if already exists, we'll get an error
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {},
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        // Get existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error("List users error:", listError);
          return NextResponse.json({ error: "Failed to check existing account" }, { status: 500 });
        }

        const existingUser = users.users.find(u => u.email === email);
        if (!existingUser) {
          return NextResponse.json({ error: "Account error. Please try again." }, { status: 500 });
        }

        // Check if they have active subscription
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
        console.error("Auth create error:", authError);
        return NextResponse.json({ error: `Failed to create account: ${authError.message}` }, { status: 500 });
      }
    } else if (authData?.user) {
      userId = authData.user.id;
    } else {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Calculate tier and price
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "comped"]);

    // Founder pricing: $29.99 base (users apply FOUNDER code for $19.99)
    // Regular pricing: tier-based ($35 → $100 over time)
    const tier = useFounderPricing ? 0 : getCurrentTier(count || 0);
    const priceInCents = useFounderPricing ? 2999 : getPriceForTier(tier);

    // Create Stripe checkout session
    const appUrl = "https://flacko.ai";
    const session = await createCheckoutSession({
      userId,
      email,
      priceInCents,
      tier,
      successUrl: `${appUrl}/welcome?email=${encodeURIComponent(email)}`,
      cancelUrl: useFounderPricing ? `${appUrl}/founder?canceled=true` : `${appUrl}/signup?canceled=true`,
      trialDays,
      isFounder: useFounderPricing,
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
    const message = error instanceof Error ? error.message : "Unknown error";
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 8) || "NOT_SET";
    return NextResponse.json({ 
      error: `Server error: ${message}`,
      debug: { hasStripeKey, keyPrefix }
    }, { status: 500 });
  }
}

