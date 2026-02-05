import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/server";

interface ExistingSubscription {
  status: string;
  is_founder?: boolean;
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
      .select("status, is_founder")
      .eq("user_id", user.id)
      .single();

    const existingSubscription = existingSubData as ExistingSubscription | null;
    if (existingSubscription?.status === "active") {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    // Check if user is a beta founder (determines pricing tier)
    const { data: userData } = await supabase
      .from("users")
      .select("is_beta_founder")
      .eq("id", user.id)
      .single();

    const isFounder = userData?.is_beta_founder === true || existingSubscription?.is_founder === true;

    // Create Stripe checkout session using the correct price ID
    // Founder: $14.99/mo + 45-day trial | Public: $29.99/mo
    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email!,
      successUrl: `https://flacko.ai/dashboard?success=true`,
      cancelUrl: `https://flacko.ai/signup?canceled=true`,
      isFounder,
    });

    // Create pending subscription record if not exists
    if (!existingSubscription) {
      await serviceSupabase.from("subscriptions").insert({
        user_id: user.id,
        status: "pending",
        is_founder: isFounder,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
