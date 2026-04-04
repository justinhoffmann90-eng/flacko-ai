import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateTicker, getTickerConfig } from "@/lib/tickers/config";
import Stripe from "stripe";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY.trim());
}

function getAppUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "https://www.flacko.ai").trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

/**
 * POST /api/checkout/ticker
 * Creates a Stripe checkout session for a ticker report subscription.
 * 
 * Public endpoint — no auth required (new users created from Stripe email).
 * Existing users can also purchase additional tickers.
 * 
 * Body: { ticker: string, email?: string }
 */
export async function POST(request: Request) {
  try {
    const { ticker: rawTicker, email } = await request.json();

    const ticker = validateTicker(rawTicker);
    if (!ticker) {
      return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
    }

    const config = getTickerConfig(ticker);
    if (!config.enabled) {
      return NextResponse.json({ error: "This ticker is not yet available" }, { status: 400 });
    }

    if (!config.stripePriceId) {
      return NextResponse.json({ error: "Pricing not configured for this ticker" }, { status: 400 });
    }

    // Check if user is logged in (optional — supports both public and authenticated purchases)
    // If session lookup fails, continue as a public checkout instead of hard-failing.
    let user: { id: string; email?: string | null } | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (error) {
      console.warn("Ticker checkout: continuing without authenticated user", error);
    }

    // If user is logged in, check if they already have this ticker
    if (user) {
      const serviceSupabase = await createServiceClient();
      const { data: existing } = await serviceSupabase
        .from("ticker_subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("ticker", ticker)
        .in("status", ["active", "comped"])
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ 
          error: "You already have an active subscription for this ticker",
          redirect: `/report/${ticker.toLowerCase()}`,
        }, { status: 409 });
      }
    }

    const appUrl = getAppUrl();

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{
        price: config.stripePriceId,
        quantity: 1,
      }],
      metadata: {
        product_type: "ticker_report",
        ticker: ticker,
        ...(user?.id ? { user_id: user.id } : {}),
      },
      success_url: `${appUrl}/report/${ticker.toLowerCase()}?checkout=success`,
      cancel_url: `${appUrl}/reports?canceled=true`,
      allow_promotion_codes: true,
    };

    // If user is logged in, use their email; otherwise require email collection
    if (user?.email) {
      sessionConfig.customer_email = user.email;
    } else if (email) {
      sessionConfig.customer_email = email;
    } else {
      // Stripe will collect email during checkout
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Ticker checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
