import { createClient } from "@/lib/supabase/server";
import { hasSubscriptionAccess } from "@/lib/subscription";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import RotationClient from "./RotationClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sector Rotation | Flacko AI",
  description: "Relative Rotation Graph (RRG) showing sector leadership vs VTI.",
};

const ADMIN_USER_ID = (process.env.ADMIN_USER_ID || "bf0babb8-2559-4498-ab3a-1039079bb70d").trim();

async function getRotationData() {
  const headerList = headers();
  const host = headerList.get("host");
  if (!host) return null;
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  try {
    const response = await fetch(`${protocol}://${host}/api/rotation`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("[rotation page] failed to fetch rotation data", error);
    return null;
  }
}

export default async function RotationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  const data = await getRotationData();

  return <RotationClient data={data} />;
}
