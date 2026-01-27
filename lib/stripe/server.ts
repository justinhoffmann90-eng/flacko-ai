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

// Price tiers in cents (matches system_config)
export const PRICE_TIERS = [
  2999, 3499, 3999, 4499, 4999, 5499, 5999, 6499, 6999, 7499, 7999, 8499, 8999, 9499, 9999,
];

export const SUBSCRIBERS_PER_TIER = 40;

export function getCurrentTier(activeSubscriberCount: number): number {
  const tier = Math.floor(activeSubscriberCount / SUBSCRIBERS_PER_TIER) + 1;
  return Math.min(tier, PRICE_TIERS.length);
}

export function getPriceForTier(tier: number): number {
  const index = Math.min(tier - 1, PRICE_TIERS.length - 1);
  return PRICE_TIERS[index];
}

export function formatPriceForDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function createCheckoutSession({
  userId,
  email,
  priceInCents,
  tier,
  successUrl,
  cancelUrl,
  trialDays = 0,
}: {
  userId: string;
  email: string;
  priceInCents: number;
  tier: number;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Flacko AI Subscription",
            description: `TSLA Trading Operating System`,
          },
          unit_amount: priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId,
      price_tier: tier.toString(),
      locked_price_cents: priceInCents.toString(),
    },
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: trialDays > 0 ? trialDays : undefined,
      metadata: {
        user_id: userId,
        price_tier: tier.toString(),
        locked_price_cents: priceInCents.toString(),
      },
    },
  });

  return session;
}

export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Export getStripe for modules that need direct access
export { getStripe };
