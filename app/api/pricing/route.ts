import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentPrice, getCurrentPriceTier, PRICE_TIERS, TRIAL_DAYS, PRICE_CAP } from "@/lib/stripe/pricing";

/**
 * GET /api/pricing
 * Returns the current dynamic pricing based on subscriber count
 */
export async function GET(request: NextRequest) {
  const supabase = await createServiceClient();

  // Get current paid subscriber count
  const { data: stats } = await supabase
    .from("subscriber_stats")
    .select("stat_value")
    .eq("stat_key", "paid_subscriber_count")
    .single();

  const paidCount = stats?.stat_value ?? 0;
  const pricing = getCurrentPrice(paidCount);
  const tier = getCurrentPriceTier(paidCount);

  return NextResponse.json({
    currentPrice: pricing.label,
    currentPriceCents: pricing.amount,
    spotsRemaining: pricing.spotsRemaining,
    nextPrice: pricing.nextPrice,
    priceCap: `$${(PRICE_CAP / 100).toFixed(2)}/mo`,
    trialDays: TRIAL_DAYS,
    tier,
    subscriberCount: paidCount,
    // For landing page urgency messaging
    urgencyMessage: pricing.spotsRemaining > 0 && pricing.spotsRemaining <= 5
      ? `Only ${pricing.spotsRemaining} spots left at ${pricing.label}!`
      : pricing.nextPrice
        ? `${pricing.spotsRemaining} spots remaining before price increases to ${pricing.nextPrice}`
        : null,
  });
}
