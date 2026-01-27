// Rising price tiers - price increases $10/mo for new subscribers
// Existing subscribers keep their locked-in rate

export const PRICE_TIERS = [
  { month: 1, price: 35, priceId: 'price_1SuEBDRNdSDJbZblT8QPCvJB' },
  { month: 2, price: 45, priceId: 'price_1SuEBNRNdSDJbZbly7nkGEz1' },
  { month: 3, price: 55, priceId: 'price_1SuEBNRNdSDJbZblrINav4RA' },
  { month: 4, price: 65, priceId: 'price_1SuEBNRNdSDJbZbljoSyv92h' },
  { month: 5, price: 75, priceId: 'price_1SuEBORNdSDJbZblk4Me7O7s' },
  { month: 6, price: 85, priceId: 'price_1SuEBORNdSDJbZblYr68ZvGg' },
  { month: 7, price: 95, priceId: 'price_1SuEBORNdSDJbZblKSLzybgP' },
  { month: 8, price: 100, priceId: 'price_1SuEBPRNdSDJbZblJ8o6Dq9j' }, // Cap
] as const;

// Launch date - month 1 starts here
export const LAUNCH_DATE = new Date('2026-02-01'); // Update this to actual launch date

export function getCurrentPriceTier() {
  const now = new Date();
  const monthsSinceLaunch = Math.floor(
    (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  // Clamp to valid tier index (0-7)
  const tierIndex = Math.min(Math.max(0, monthsSinceLaunch), PRICE_TIERS.length - 1);
  return PRICE_TIERS[tierIndex];
}

export function getNextPriceTier() {
  const current = getCurrentPriceTier();
  const currentIndex = PRICE_TIERS.findIndex(t => t.price === current.price);
  
  if (currentIndex >= PRICE_TIERS.length - 1) {
    return null; // Already at cap
  }
  
  return PRICE_TIERS[currentIndex + 1];
}

export function getDaysUntilPriceIncrease() {
  const now = new Date();
  const monthsSinceLaunch = (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const nextMonthStart = new Date(LAUNCH_DATE);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + Math.ceil(monthsSinceLaunch));
  
  const daysLeft = Math.ceil((nextMonthStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
}
