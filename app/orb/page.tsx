import { createClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";
import { redirect } from "next/navigation";
import OrbClient from "./OrbClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orb - Live Signal Tracker | Flacko AI",
  description: "Track which TSLA setups are active, watching, or inactive based on backtested patterns. 11 buy setups + 4 avoid signals.",
};

export default async function OrbPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at, current_period_end")
    .eq("user_id", user.id)
    .single();

  if (!hasSubscriptionAccess(subscription)) {
    redirect("/signup");
  }

  return <OrbClient />;
}
