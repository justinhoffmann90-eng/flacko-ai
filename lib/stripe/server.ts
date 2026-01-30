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

// Rising price tiers - price increases $10/mo each month
// Cents: $35, $45, $55, $65, $75, $85, $95, $100 (cap)
export const PRICE_TIERS = [3500, 4500, 5500, 6500, 7500, 8500, 9500, 10000];

// Launch date - month 1 starts here
export const LAUNCH_DATE = new Date('2026-02-01'); // Update to actual launch

export function getCurrentTier(_activeSubscriberCount?: number): number {
  const now = new Date();
  const monthsSinceLaunch = Math.floor(
    (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  // Before launch = tier 1, after launch = month-based
  const tier = Math.max(1, monthsSinceLaunch + 1);
  return Math.min(tier, PRICE_TIERS.length);
}

export function getPriceForTier(tier: number): number {
  const index = Math.min(tier - 1, PRICE_TIERS.length - 1);
  return PRICE_TIERS[index];
}

export function getNextTierPrice(): number | null {
  const currentTier = getCurrentTier();
  if (currentTier >= PRICE_TIERS.length) return null;
  return PRICE_TIERS[currentTier]; // next tier = current index
}

export function formatPriceForDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Price IDs - hardcoded to avoid env var conflicts
export const PRICE_IDS = {
  founder: "price_1Sv6zLRNdSDJbZblqWBJYnIc", // $14.99/mo
  public: "price_1SuKNSRNdSDJbZblxblHmkcn",   // $29.99/mo
};

export async function createCheckoutSession({
  userId,
  email,
  successUrl,
  cancelUrl,
  isFounder = false,
}: {
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  isFounder?: boolean;
}) {
  const stripe = getStripe();
  
  // Founder: $14.99 + 45-day trial
  // Public: $29.99 + no trial
  const priceId = isFounder ? PRICE_IDS.founder : PRICE_IDS.public;
  const trialDays = isFounder ? 45 : 0;
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      user_id: userId,
      is_founder: isFounder ? "true" : "false",
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: trialDays > 0 ? trialDays : undefined,
      metadata: {
        user_id: userId,
        is_founder: isFounder ? "true" : "false",
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
// deploy 1769554473
