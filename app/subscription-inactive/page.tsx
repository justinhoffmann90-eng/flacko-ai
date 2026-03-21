import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasSubscriptionAccess } from "@/lib/subscription";
import { BillingPortalButton } from "./billing-portal-button";

export default async function SubscriptionInactivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check subscription status
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, stripe_customer_id, trial_ends_at, current_period_end")
    .eq("user_id", user.id)
    .single();

  const status = subscription?.status;
  const isPastDue = status === "past_due";

  // If they have active access, send them to dashboard
  if (hasSubscriptionAccess(subscription)) {
    redirect("/dashboard");
  }

  // If no subscription at all, send to signup
  if (!subscription) {
    redirect("/signup");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-5xl mb-4">
            {isPastDue ? "⚠️" : "🔒"}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isPastDue ? "Payment Failed" : "Subscription Inactive"}
          </h1>
          <p className="text-muted-foreground">
            {isPastDue
              ? "Your most recent payment was declined. Your access to Flacko AI reports, alerts, and Discord has been paused until payment is resolved."
              : "Your subscription is no longer active. Resubscribe to regain access to daily reports, real-time alerts, and the Discord community."}
          </p>
        </div>

        {isPastDue && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-medium text-yellow-400">What to do:</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Check your card on file — it may be expired or have insufficient funds</li>
              <li>Update your payment method using the button below</li>
              <li>Access will be restored automatically once payment succeeds</li>
            </ol>
          </div>
        )}

        <div className="space-y-3">
          {isPastDue ? (
            <BillingPortalButton />
          ) : (
            <Link
              href="/signup"
              className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg py-3 px-4 font-medium transition-colors text-center"
            >
              Resubscribe
            </Link>
          )}
          <Link
            href="/login"
            className="block w-full text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Sign in with a different account
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          Questions? Email{" "}
          <a href="mailto:support@flacko.ai" className="text-primary hover:underline">
            support@flacko.ai
          </a>
        </p>
      </div>
    </div>
  );
}
