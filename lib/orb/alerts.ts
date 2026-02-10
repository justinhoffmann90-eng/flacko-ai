import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { createServiceClient } from "@/lib/supabase/server";

const DISCORD_ALERTS_WEBHOOK = process.env.DISCORD_ALERTS_WEBHOOK;

async function sendDiscordAlert(setupId: string, newStatus: string, reason: string, indicators: { close: number; smi: number; rsi: number; bx_daily_state: string; sma200_dist: number }) {
  if (!DISCORD_ALERTS_WEBHOOK) return;

  const isActivation = newStatus === "active";
  const emoji = isActivation ? "🔮" : "📊";
  const color = isActivation ? 0x10b981 : 0x71717a; // emerald : zinc

  try {
    await fetch(DISCORD_ALERTS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `${emoji} Orb: ${setupId} ${newStatus.toUpperCase()}`,
          description: reason,
          color,
          fields: [
            { name: "TSLA", value: `$${indicators.close.toFixed(2)}`, inline: true },
            { name: "SMI", value: indicators.smi.toFixed(1), inline: true },
            { name: "RSI", value: indicators.rsi.toFixed(1), inline: true },
            { name: "BX State", value: indicators.bx_daily_state, inline: true },
            { name: "200 SMA", value: `${indicators.sma200_dist.toFixed(1)}%`, inline: true },
          ],
          footer: { text: "Orb Signal Tracker | flacko.ai/orb" },
        }],
      }),
    });
  } catch (error) {
    console.error("Orb Discord alert failed:", error);
  }
}

export async function sendAlert(setupId: string, newStatus: string, reason: string, indicators: { close: number; smi: number; rsi: number; bx_daily_state: string; sma200_dist: number; }) {
  const supabase = await createServiceClient();

  const { data: subscribers } = await supabase
    .from("subscriptions")
    .select(`
      user_id,
      users!inner(id, email)
    `)
    .in("status", ["active", "comped", "trial", "canceled"]);

  if (!subscribers || subscribers.length === 0) return;

  const userIds = subscribers.map((s: any) => s.user_id);
  const { data: settings } = await supabase
    .from("user_settings")
    .select("user_id, email_alerts")
    .in("user_id", userIds);

  const settingsMap = new Map((settings || []).map((s: any) => [s.user_id, s]));

  // Send Discord alert (non-blocking)
  sendDiscordAlert(setupId, newStatus, reason, indicators).catch(() => {});

  const subject = newStatus === "active" ? `Orb: ${setupId} ACTIVATED` : `Orb: ${setupId} DEACTIVATED`;

  for (const sub of subscribers as any[]) {
    const email = sub.users?.email as string | undefined;
    if (!email) continue;

    const userSetting = settingsMap.get(sub.user_id);
    if (userSetting && userSetting.email_alerts === false) continue;

    const html = `
      <h2>Orb Signal Update</h2>
      <p><strong>Signal:</strong> ${setupId}</p>
      <p><strong>Status:</strong> ${newStatus.toUpperCase()}</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <hr />
      <p><strong>TSLA Close:</strong> $${indicators.close.toFixed(2)}</p>
      <p><strong>SMI:</strong> ${indicators.smi.toFixed(1)}</p>
      <p><strong>RSI:</strong> ${indicators.rsi.toFixed(1)}</p>
      <p><strong>BX State:</strong> ${indicators.bx_daily_state}</p>
      <p><strong>200 SMA Distance:</strong> ${indicators.sma200_dist.toFixed(1)}%</p>
      <p><a href="https://www.flacko.ai/orb">View Orb</a></p>
    `;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject,
        html,
      });
    } catch (error) {
      console.error("Orb alert email failed:", error);
    }
  }
}
