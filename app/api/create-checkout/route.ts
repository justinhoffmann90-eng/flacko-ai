import { NextResponse } from "next/server";
import Stripe from "stripe";

// Lazy-load Stripe to avoid build-time errors
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
  }
  return _stripe;
}

// Price ID - LIVE MODE (same as lib/stripe/server.ts)
const PRICE_ID = "price_1SuK6dRNdSDJbZbl4uNc0EkH"; // $29.99/mo

export async function POST() {
  try {
    const stripe = getStripe();
    
    // Use same URL format as working signup-checkout endpoint
    const baseUrl = "https://flacko.ai";
    
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      // Metadata for webhook to create user
      metadata: {
        source: "direct_checkout",
        price_tier: "1",
        locked_price_cents: "2999",
      },
      subscription_data: {
        metadata: {
          source: "direct_checkout",
          price_tier: "1",
        },
      },
      success_url: `${baseUrl}/welcome`,
      cancel_url: `${baseUrl}/signup?canceled=true`,
    });

    if (!session.url) {
      console.error("Stripe session created but no URL returned:", session);
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
