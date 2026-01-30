import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/server";

export async function POST(request: Request) {
  try {
    const { email, founder, xHandle } = await request.json();
    const isFounder = founder === true;
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Clean and format X handle
    const cleanXHandle = xHandle && typeof xHandle === "string" 
      ? `@${xHandle.trim().replace(/^@/, "")}` 
      : null;

    const supabase = await createServiceClient();
    let userId: string;

    // Try to create user - if already exists, we'll get an error
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {},
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        // Get existing user
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error("List users error:", listError);
          return NextResponse.json({ error: "Failed to check existing account" }, { status: 500 });
        }

        const existingUser = users.users.find(u => u.email === email);
        if (!existingUser) {
          return NextResponse.json({ error: "Account error. Please try again." }, { status: 500 });
        }

        // Check if they have active subscription
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", existingUser.id)
          .single();

        if (existingSub?.status === "active") {
          return NextResponse.json({ error: "Already subscribed. Please sign in." }, { status: 400 });
        }

        userId = existingUser.id;
      } else {
        console.error("Auth create error:", authError);
        return NextResponse.json({ error: `Failed to create account: ${authError.message}` }, { status: 500 });
      }
    } else if (authData?.user) {
      userId = authData.user.id;
    } else {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Create Stripe checkout session
    // Founder: $14.99/mo + 45-day trial
    // Public: $29.99/mo + no trial
    const appUrl = "https://flacko.ai";
    const session = await createCheckoutSession({
      userId,
      email,
      successUrl: `${appUrl}/welcome?email=${encodeURIComponent(email)}`,
      cancelUrl: isFounder ? `${appUrl}/founder?canceled=true` : `${appUrl}/signup?canceled=true`,
      isFounder,
    });

    // Update user record with x_handle (upsert in case it doesn't exist yet)
    await supabase.from("users").upsert({
      id: userId,
      email,
      x_handle: cleanXHandle || "@unknown",
      is_beta_founder: isFounder,
    }, {
      onConflict: "id",
    });

    // Create pending subscription record
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      status: "pending",
      is_founder: isFounder,
    }, {
      onConflict: "user_id",
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Signup checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      error: `Server error: ${message}`,
    }, { status: 500 });
  }
}
