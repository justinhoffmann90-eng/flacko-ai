/**
 * Stripe Pricing Configuration
 * 
 * Pricing tiers with .99 pricing:
 * - Beta Founders: $19.99/mo (locked forever for early supporters)
 * - Launch: $34.99/mo (first 20 public signups)
 * - Growth: +$5 per 20 signups, capped at $99.99/mo
 */

export const STRIPE_PRODUCT_ID = "prod_TrhCXfr2Q770eX";

export const PRICE_TIERS = {
  beta_founders: {
    id: "price_1StxnwRNdSDJbZblI7zBHuG1",
    amount: 1999,
    label: "$19.99/mo",
    description: "Beta Founders (locked forever)",
    memberMin: 0,
    memberMax: 0, // Special tier, not count-based
  },
  launch: {
    id: "price_1StxnwRNdSDJbZbl1AcZKCar",
    amount: 3499,
    label: "$34.99/mo",
    description: "Launch pricing",
    memberMin: 1,
    memberMax: 20,
  },
  growth_1: {
    id: "price_1StxnwRNdSDJbZbleYSN3bWk",
    amount: 3999,
    label: "$39.99/mo",
    memberMin: 21,
    memberMax: 40,
  },
  growth_2: {
    id: "price_1StxnxRNdSDJbZblYGOAE2ZJ",
    amount: 4499,
    label: "$44.99/mo",
    memberMin: 41,
    memberMax: 60,
  },
  growth_3: {
    id: "price_1StxnxRNdSDJbZbldarulk5Z",
    amount: 4999,
    label: "$49.99/mo",
    memberMin: 61,
    memberMax: 80,
  },
  growth_4: {
    id: "price_1StxnxRNdSDJbZbloT3ypcOf",
    amount: 5499,
    label: "$54.99/mo",
    memberMin: 81,
    memberMax: 100,
  },
  growth_5: {
    id: "price_1StxnyRNdSDJbZblflP6FYDq",
    amount: 5999,
    label: "$59.99/mo",
    memberMin: 101,
    memberMax: 120,
  },
  growth_6: {
    id: "price_1StxnyRNdSDJbZbluhe9o3jp",
    amount: 6499,
    label: "$64.99/mo",
    memberMin: 121,
    memberMax: 140,
  },
  growth_7: {
    id: "price_1StxnyRNdSDJbZblpqpWOBy9",
    amount: 6999,
    label: "$69.99/mo",
    memberMin: 141,
    memberMax: 160,
  },
  growth_8: {
    id: "price_1StxnzRNdSDJbZblaZm2rnpn",
    amount: 7499,
    label: "$74.99/mo",
    memberMin: 161,
    memberMax: 180,
  },
  growth_9: {
    id: "price_1StxnzRNdSDJbZblGfZDYNmi",
    amount: 7999,
    label: "$79.99/mo",
    memberMin: 181,
    memberMax: 200,
  },
  growth_10: {
    id: "price_1StxnzRNdSDJbZblJFIdjXfH",
    amount: 8499,
    label: "$84.99/mo",
    memberMin: 201,
    memberMax: 220,
  },
  growth_11: {
    id: "price_1Stxo0RNdSDJbZblOb2gM1mD",
    amount: 8999,
    label: "$89.99/mo",
    memberMin: 221,
    memberMax: 240,
  },
  growth_12: {
    id: "price_1Stxo0RNdSDJbZbl9PNRh9BM",
    amount: 9499,
    label: "$94.99/mo",
    memberMin: 241,
    memberMax: 260,
  },
  growth_13: {
    id: "price_1Stxo0RNdSDJbZbloIMGDTjx",
    amount: 9999,
    label: "$99.99/mo",
    description: "Price cap reached",
    memberMin: 261,
    memberMax: Infinity,
  },
} as const;

export const PRICE_CAP = 9999; // $99.99
export const TRIAL_DAYS = 30;

export type PriceTier = keyof typeof PRICE_TIERS;

/**
 * Get the current price tier based on paid subscriber count
 */
export function getCurrentPriceTier(paidSubscriberCount: number): PriceTier {
  // Find the tier that matches the current count
  for (const [tierKey, tier] of Object.entries(PRICE_TIERS)) {
    if (tierKey === "beta_founders") continue; // Skip special tier
    if (paidSubscriberCount >= tier.memberMin && paidSubscriberCount <= tier.memberMax) {
      return tierKey as PriceTier;
    }
  }
  // Default to capped price
  return "growth_13";
}

/**
 * Get price ID for a tier
 */
export function getPriceId(tier: PriceTier): string {
  return PRICE_TIERS[tier].id;
}

/**
 * Get display price for current subscriber count
 */
export function getCurrentPrice(paidSubscriberCount: number): {
  amount: number;
  label: string;
  spotsRemaining: number;
  nextPrice: string | null;
} {
  const tier = getCurrentPriceTier(paidSubscriberCount);
  const tierData = PRICE_TIERS[tier];
  const spotsRemaining = tierData.memberMax === Infinity ? 0 : tierData.memberMax - paidSubscriberCount;
  
  // Find next tier price
  let nextPrice: string | null = null;
  const tierKeys = Object.keys(PRICE_TIERS).filter(k => k !== "beta_founders");
  const currentIndex = tierKeys.indexOf(tier);
  if (currentIndex < tierKeys.length - 1) {
    const nextTier = tierKeys[currentIndex + 1] as PriceTier;
    nextPrice = PRICE_TIERS[nextTier].label;
  }

  return {
    amount: tierData.amount,
    label: tierData.label,
    spotsRemaining,
    nextPrice,
  };
}
