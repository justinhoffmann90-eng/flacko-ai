// Subscription helper functions

export interface SubscriptionData {
  status?: string;
  trial_ends_at?: string;
}

/**
 * Check if a subscription grants access to protected content
 * Allows: active, comped, or valid trial (not expired)
 */
export function hasSubscriptionAccess(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  const { status, trial_ends_at } = subscription;
  
  // Active or comped always have access
  if (status === 'active' || status === 'comped') return true;
  
  // Trial has access if not expired
  if (status === 'trial' && trial_ends_at) {
    return new Date(trial_ends_at) > new Date();
  }
  
  return false;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: SubscriptionData | null): number | null {
  if (!subscription || subscription.status !== 'trial' || !subscription.trial_ends_at) {
    return null;
  }
  
  const now = new Date();
  const trialEnd = new Date(subscription.trial_ends_at);
  const diffMs = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Check if subscription is in trial period
 */
export function isTrialSubscription(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'trial' && hasSubscriptionAccess(subscription);
}
