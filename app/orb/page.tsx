import { createClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";
import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// Lazy-load the heavy OrbClient component (1171 lines, lots of state/rendering logic)
const OrbClient = dynamicImport(() => import("./OrbClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen p-4 bg-[#0a0a0c] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400 font-mono">Loading Orb signals...</p>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Orb - Live Signal Tracker | Flacko AI",
  description: "Track which TSLA setups are active, watching, or inactive based on backtested patterns. 11 buy setups + 4 avoid signals.",
};

const ADMIN_USER_ID = (process.env.ADMIN_USER_ID || "bf0babb8-2559-4498-ab3a-1039079bb70d").trim();

export default async function OrbPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Admin always has access
  if (user.id !== ADMIN_USER_ID) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (!hasSubscriptionAccess(subscription)) {
      redirect("/signup");
    }
  }

  return <OrbClient />;
}
