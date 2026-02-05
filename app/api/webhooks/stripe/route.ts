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
        let userId = session.metadata?.user_id;
        const priceTier = parseInt(session.metadata?.price_tier || "1");
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        // Get actual price from Stripe subscription (includes coupon discounts)
        let lockedPriceCents = parseInt(session.metadata?.locked_price_cents || "2999");
        
        if (session.subscription) {
          try {
            const subscription = await getStripe().subscriptions.retrieve(
              session.subscription as string,
              { expand: ['discount'] }
            );
            const basePrice = subscription.items.data[0]?.price?.unit_amount || lockedPriceCents;
            const couponPercent = subscription.discount?.coupon?.percent_off || 0;
            
            // Calculate actual price after discount
            if (couponPercent > 0) {
              lockedPriceCents = Math.round(basePrice * (1 - couponPercent / 100));
              console.log(`Applied ${couponPercent}% discount: $${basePrice/100} -> $${lockedPriceCents/100}`);
            } else {
              lockedPriceCents = basePrice;
            }
          } catch (e) {
            console.error("Failed to fetch subscription for price calculation:", e);
          }
        }

        // NEW FLOW: If no user_id, create user from Stripe email (direct checkout)
        if (!userId && customerEmail) {
          console.log(`[DIRECT CHECKOUT] Creating user for ${customerEmail}`);
          
          // Check if user already exists
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users?.users?.find(u => u.email === customerEmail);
          
          if (existingUser) {
            userId = existingUser.id;
            console.log(`[DIRECT CHECKOUT] Found existing user ${userId} for ${customerEmail}`);
          } else {
            // Create new user
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
            });
            
            if (authError) {
              console.error(`[DIRECT CHECKOUT] Failed to create user for ${customerEmail}:`, authError);
              // Alert via Telegram
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: process.env.TELEGRAM_CHAT_ID,
                  text: `🚨 **Direct Checkout User Creation Failed**\n\nEmail: ${customerEmail}\nSession: ${session.id}\nError: ${authError.message}`,
                  parse_mode: 'Markdown'
                })
              }).catch(console.error);
            } else if (authData?.user) {
              userId = authData.user.id;
              console.log(`[DIRECT CHECKOUT] Created user ${userId} for ${customerEmail}`);
              
              // Create user record
              await supabase.from("users").insert({
                id: userId,
                email: customerEmail,
                x_handle: "@unknown",
              });
            }
          }
          
          // Update subscription metadata with user_id for future webhook events
          if (userId && session.subscription) {
            try {
              await getStripe().subscriptions.update(session.subscription as string, {
                metadata: { user_id: userId },
              });
            } catch (e) {
              console.error("Failed to update subscription metadata:", e);
            }
          }
        }

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

          // Create price alerts for new subscriber from today's report
          try {
            const today = new Date().toISOString().split('T')[0];
            const { data: report } = await supabase
              .from("reports")
              .select("id, extracted_data")
              .eq("report_date", today)
              .single();

            if (report?.extracted_data?.alerts) {
              const alertInserts = report.extracted_data.alerts.map((alert: any) => ({
                report_id: report.id,
                user_id: userId,
                price: alert.price,
                type: alert.type,
                level_name: alert.level_name,
                action: alert.action,
                reason: alert.reason,
              }));

              const { error: alertError } = await supabase
                .from("report_alerts")
                .upsert(alertInserts, { onConflict: "report_id,user_id,price,type" });

              if (alertError) {
                console.error(`Failed to create alerts for new subscriber ${userId}:`, alertError);
              } else {
                console.log(`✅ Created ${alertInserts.length} price alerts for new subscriber ${userId}`);
              }
            } else {
              console.log(`No report for ${today} yet - new subscriber ${userId} will get alerts when report is uploaded`);
            }
          } catch (alertErr) {
            console.error(`Exception creating alerts for ${userId}:`, alertErr);
          }

          // Send password setup email so user can set their password
          // customer_email may be null after checkout; use customer_details.email as fallback
          const customerEmail = session.customer_email || session.customer_details?.email;
          console.log("Checkout completed for user:", userId, "email:", customerEmail);
          if (customerEmail) {
            try {
              // Generate the magic link
              console.log(`[EMAIL] Generating password link for ${customerEmail}...`);
              const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                type: "recovery",
                email: customerEmail,
                options: {
                  redirectTo: "https://www.flacko.ai/reset-password",
                },
              });
              
              if (linkError) {
                console.error(`[EMAIL ERROR] Failed to generate password link for ${customerEmail}:`, linkError);
                // Log to database
                await supabase.from("email_send_log").insert({
                  user_id: userId,
                  email: customerEmail,
                  type: "password_setup",
                  status: "link_generation_failed",
                  error_message: JSON.stringify(linkError),
                  metadata: { session_id: session.id }
                });
                // Alert via Telegram
                try {
                  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: process.env.TELEGRAM_CHAT_ID,
                      text: `🚨 **Password Link Generation Failed**\n\nUser: ${customerEmail}\nSession: ${session.id}\nError: ${JSON.stringify(linkError)}`,
                      parse_mode: 'Markdown'
                    })
                  });
                } catch (telegramError) {
                  console.error('Failed to send Telegram alert:', telegramError);
                }
              } else if (linkData?.properties?.action_link) {
                console.log(`[EMAIL] Generated password link for ${customerEmail}, sending email...`);
                // Send email via Resend
                const { resend, EMAIL_FROM } = await import("@/lib/resend/client");
                const emailResult = await resend.emails.send({
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
                
                if (emailResult.error) {
                  console.error(`[EMAIL ERROR] Resend returned error for ${customerEmail}:`, emailResult.error);
                  // Log failure to database
                  await supabase.from("email_send_log").insert({
                    user_id: userId,
                    email: customerEmail,
                    type: "password_setup",
                    status: "send_failed",
                    error_message: JSON.stringify(emailResult.error),
                    metadata: { session_id: session.id }
                  });
                  // Alert via Telegram
                  try {
                    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: process.env.TELEGRAM_CHAT_ID,
                        text: `🚨 **Password Email Send Failed**\n\nUser: ${customerEmail}\nSession: ${session.id}\nResend Error: ${JSON.stringify(emailResult.error)}`,
                        parse_mode: 'Markdown'
                      })
                    });
                  } catch (telegramError) {
                    console.error('Failed to send Telegram alert:', telegramError);
                  }
                } else {
                  console.log(`[EMAIL SUCCESS] Password setup email sent to ${customerEmail}, Resend ID: ${emailResult.data?.id}`);
                  // Log success to database
                  await supabase.from("email_send_log").insert({
                    user_id: userId,
                    email: customerEmail,
                    type: "password_setup",
                    status: "sent",
                    resend_id: emailResult.data?.id,
                    metadata: { session_id: session.id }
                  });
                }
              }
            } catch (e) {
              const errorMsg = e instanceof Error ? e.message : String(e);
              console.error(`[EMAIL EXCEPTION] Failed to send password setup email to ${customerEmail}:`, e);
              // Log exception to database
              await supabase.from("email_send_log").insert({
                user_id: userId,
                email: customerEmail,
                type: "password_setup",
                status: "exception",
                error_message: errorMsg,
                metadata: { session_id: session.id }
              });
              // Alert via Telegram
              try {
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: `🚨 **Password Email Exception**\n\nUser: ${customerEmail}\nSession: ${session.id}\nError: ${errorMsg}`,
                    parse_mode: 'Markdown'
                  })
                });
              } catch (telegramError) {
                console.error('Failed to send Telegram alert:', telegramError);
              }
            }
          } else {
            console.error(`[EMAIL ERROR] No customer email found for user ${userId}, session ${session.id}`);
            // Alert via Telegram
            try {
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: process.env.TELEGRAM_CHAT_ID,
                  text: `🚨 **No Email Found for Signup**\n\nUser ID: ${userId}\nSession: ${session.id}\n\nStripe checkout completed but no email address available.`,
                  parse_mode: 'Markdown'
                })
              });
            } catch (telegramError) {
              console.error('Failed to send Telegram alert:', telegramError);
            }
          }

          // Add Discord subscriber role if user has linked Discord
          const { data: userData } = await supabase
            .from("users")
            .select("discord_user_id, email")
            .eq("id", userId)
            .single();

          if (userData?.discord_user_id) {
            const result = await addRoleToMember(userData.discord_user_id);
            if (!result.success) {
              console.error(`Failed to add Discord role for user ${userId} (${userData.email}):`, result.error);
              // Log to database for debugging
              await supabase.from("discord_alert_log").insert({
                user_id: userId,
                event_type: "role_assignment_failed",
                status: "error",
                error_message: result.error || "Unknown error adding role",
              });
            } else {
              console.log(`Discord role added for user ${userId} (${userData.email})`);
            }
          } else {
            console.log(`User ${userId} has no Discord linked - skipping role assignment`);
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
          // Preserve current_period_end so user retains access until then
          const periodEnd = subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              current_period_end: periodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          // Only remove Discord role if period has ended (no grace period remaining)
          const hasAccessRemaining = periodEnd && new Date(periodEnd) > new Date();
          
          if (!hasAccessRemaining) {
            const { data: userData } = await supabase
              .from("users")
              .select("discord_user_id")
              .eq("id", userId)
              .single();

            if (userData?.discord_user_id) {
              await removeRoleFromMember(userData.discord_user_id);
            }
          }
          // Note: If user still has access, a scheduled job should remove role when period ends
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
