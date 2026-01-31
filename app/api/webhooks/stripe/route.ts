import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { addRoleToMember, removeRoleFromMember } from "@/lib/discord/bot";
import Stripe from "stripe";

// Lazy-load Stripe for webhook verification
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const priceTier = parseInt(session.metadata?.price_tier || "1");
        const lockedPriceCents = parseInt(session.metadata?.locked_price_cents || "2999");

        if (userId) {
          // Create or update subscription
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: "active",
            price_tier: priceTier,
            locked_price_cents: lockedPriceCents,
            current_period_start: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          });

          // Create default user settings if not exists
          await supabase.from("user_settings").upsert({
            user_id: userId,
          }, {
            onConflict: "user_id",
          });

          // Send password setup email so user can set their password
          // customer_email may be null after checkout; use customer_details.email as fallback
          const customerEmail = session.customer_email || session.customer_details?.email;
          console.log("Checkout completed for user:", userId, "email:", customerEmail);
          if (customerEmail) {
            try {
              // Generate the magic link
              const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                type: "recovery",
                email: customerEmail,
                options: {
                  redirectTo: "https://flacko.ai/reset-password",
                },
              });
              
              if (linkError) {
                console.error("Failed to generate password link:", linkError, "for email:", customerEmail);
              } else if (linkData?.properties?.action_link) {
                console.log("Generated password link for:", customerEmail);
                // Send email via Resend
                const { resend, EMAIL_FROM } = await import("@/lib/resend/client");
                await resend.emails.send({
                  from: EMAIL_FROM,
                  to: customerEmail,
                  subject: "Set Your Password | Flacko AI",
                  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #18181b; border-radius: 12px; border: 1px solid #27272a;">
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #27272a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Flacko AI</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #ffffff;">Set Your Password</h2>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #a1a1aa;">
                Welcome to Flacko AI! Click the button below to set your password and access your trading dashboard.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${linkData.properties.action_link}" style="display: inline-block; padding: 14px 28px; background-color: #ffffff; color: #0a0a0a; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 8px;">
                      Set Password →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                This link expires in 24 hours. If you didn't create a Flacko AI account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #27272a; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #52525b;">
                © 2026 Flacko AI · TSLA Trading Intelligence
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
                  `,
                });
                console.log("Password setup email sent to:", customerEmail);
              }
            } catch (e) {
              console.error("Failed to send password setup email:", e);
            }
          }

          // Add Discord subscriber role if user has linked Discord
          const { data: userData } = await supabase
            .from("users")
            .select("discord_user_id")
            .eq("id", userId)
            .single();

          if (userData?.discord_user_id) {
            await addRoleToMember(userData.discord_user_id);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          const newStatus = subscription.status === "active" ? "active" :
                           subscription.status === "past_due" ? "past_due" :
                           subscription.status;
          
          await supabase
            .from("subscriptions")
            .update({
              status: newStatus,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          // Sync Discord role based on subscription status
          const { data: userData } = await supabase
            .from("users")
            .select("discord_user_id")
            .eq("id", userId)
            .single();

          if (userData?.discord_user_id) {
            if (newStatus === "active") {
              // Re-add role when subscription becomes active (e.g., payment fixed)
              await addRoleToMember(userData.discord_user_id);
            } else if (newStatus === "past_due" || newStatus === "canceled" || newStatus === "unpaid") {
              // Remove role for non-active statuses
              await removeRoleFromMember(userData.discord_user_id);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;

        if (userId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          // Remove Discord subscriber role
          const { data: userData } = await supabase
            .from("users")
            .select("discord_user_id")
            .eq("id", userId)
            .single();

          if (userData?.discord_user_id) {
            await removeRoleFromMember(userData.discord_user_id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find subscription by customer ID and update status
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", sub.user_id);

          // Remove Discord role until payment is fixed
          const { data: userData } = await supabase
            .from("users")
            .select("discord_user_id")
            .eq("id", sub.user_id)
            .single();

          if (userData?.discord_user_id) {
            await removeRoleFromMember(userData.discord_user_id);
          }

          // Create notification
          await supabase.from("notifications").insert({
            user_id: sub.user_id,
            type: "payment_failed",
            title: "Payment Failed",
            body: "Your payment failed. Please update your payment method to continue access.",
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find subscription by customer ID
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id, status")
          .eq("stripe_customer_id", customerId)
          .single();

        if (sub) {
          // If recovering from past_due, reactivate
          if (sub.status === "past_due") {
            await supabase
              .from("subscriptions")
              .update({
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", sub.user_id);

            // Re-add Discord role
            const { data: userData } = await supabase
              .from("users")
              .select("discord_user_id")
              .eq("id", sub.user_id)
              .single();

            if (userData?.discord_user_id) {
              await addRoleToMember(userData.discord_user_id);
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
