import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Price IDs
const FOUNDER_PRICE_ID = "price_1SuK6dRNdSDJbZbl4uNc0EkH"; // $29.99/mo

export async function POST() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.flacko.ai";
    
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: FOUNDER_PRICE_ID,
          quantity: 1,
        },
      ],
      // Let Stripe collect the email
      customer_creation: "always",
      // Metadata for webhook to identify this is a new signup
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
      success_url: `${appUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/signup?canceled=true`,
      // Allow promotion codes
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Create checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
