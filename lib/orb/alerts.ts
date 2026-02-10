import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { createServiceClient } from "@/lib/supabase/server";

const DISCORD_ALERTS_WEBHOOK = process.env.DISCORD_ALERTS_WEBHOOK;

async function sendDiscordAlert(setupId: string, newStatus: string, reason: string, indicators: { close: number; smi: number; rsi: number; bx_daily_state: string; sma200_dist: number }, displayName?: string, setupType?: string, grade?: string) {
  if (!DISCORD_ALERTS_WEBHOOK) return;

  const isActivation = newStatus === "active";
  const isBuy = setupType === "buy";
  const emoji = isActivation ? (isBuy ? "🟢" : "🔴") : "⚪";
  const color = isActivation ? (isBuy ? 0x10b981 : 0xef4444) : 0x71717a;
  const name = displayName || setupId;

  try {
    await fetch(DISCORD_ALERTS_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: `${emoji} Orb: ${name} ${newStatus.toUpperCase()}`,
          description: `**${isBuy ? "BUY" : "AVOID"}** signal ${grade ? `(Grade ${grade})` : ""}\n\n${reason}`,
          color,
          fields: [
            { name: "TSLA", value: `$${indicators.close.toFixed(2)}`, inline: true },
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

  // Fetch setup definition for public-facing info
  const { data: setupDef } = await supabase
    .from("orb_setup_definitions")
    .select("public_name, name, type, grade, one_liner, public_description, category_tags, backtest_n, backtest_win_rate_5d, backtest_avg_return_5d, backtest_win_rate_10d, backtest_avg_return_10d, backtest_win_rate_20d, backtest_avg_return_20d, backtest_win_rate_60d, backtest_avg_return_60d, gauge_median_days, gauge_median_return, risk_note")
    .eq("id", setupId)
    .maybeSingle();

  const displayName = setupDef?.public_name || setupDef?.name || setupId;
  const isBuy = setupDef?.type === "buy";
  const isActivation = newStatus === "active";

  // Fetch active trade info if activation
  let tradeInfo = null;
  if (isActivation) {
    const { data: trade } = await supabase
      .from("orb_tracker")
      .select("entry_price, entry_date, current_return_pct, max_return_pct, max_drawdown_pct, days_active")
      .eq("setup_id", setupId)
      .eq("status", "open")
      .order("entry_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    tradeInfo = trade;
  }

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
  sendDiscordAlert(setupId, newStatus, reason, indicators, displayName, setupDef?.type, setupDef?.grade).catch(() => {});

  // Build best backtest stat line
  let bestStat = "";
  if (setupDef?.gauge_median_return) {
    bestStat = `${setupDef.gauge_median_return > 0 ? "+" : ""}${setupDef.gauge_median_return}% median return over ~${setupDef.gauge_median_days} days (N=${setupDef.backtest_n})`;
  } else {
    const horizons = [
      { label: "60d", wr: setupDef?.backtest_win_rate_60d, ret: setupDef?.backtest_avg_return_60d },
      { label: "20d", wr: setupDef?.backtest_win_rate_20d, ret: setupDef?.backtest_avg_return_20d },
      { label: "10d", wr: setupDef?.backtest_win_rate_10d, ret: setupDef?.backtest_avg_return_10d },
      { label: "5d", wr: setupDef?.backtest_win_rate_5d, ret: setupDef?.backtest_avg_return_5d },
    ];
    const best = horizons.find(h => h.wr != null);
    if (best) {
      bestStat = `${best.wr}% win rate at ${best.label}, ${best.ret! > 0 ? "+" : ""}${best.ret}% avg return (N=${setupDef?.backtest_n})`;
    }
  }

  // Determine signal color and action guidance
  let statusColor: string;
  let statusEmoji: string;
  let actionText: string;

  if (isActivation && isBuy) {
    statusColor = "#10b981"; // green
    statusEmoji = "🟢";
    actionText = `This is a BUY signal (Grade ${setupDef?.grade || "—"}). Review the Orb page for sizing guidance based on your mode.`;
  } else if (isActivation && !isBuy) {
    statusColor = "#ef4444"; // red
    statusEmoji = "🔴";
    actionText = "This is an AVOID signal. Do NOT open new call positions. Consider trimming existing short-dated calls.";
  } else if (!isActivation && isBuy) {
    statusColor = "#71717a"; // zinc
    statusEmoji = "⚪";
    actionText = "This buy signal has deactivated. If you entered on this setup, review your position.";
  } else {
    statusColor = "#71717a";
    statusEmoji = "⚪";
    actionText = "This avoid signal has cleared. Conditions have normalized.";
  }

  const subject = isActivation
    ? `${statusEmoji} Orb: ${displayName} ${isBuy ? "BUY" : "AVOID"} Signal Activated`
    : `${statusEmoji} Orb: ${displayName} Deactivated`;

  for (const sub of subscribers as any[]) {
    const email = sub.users?.email as string | undefined;
    if (!email) continue;

    const userSetting = settingsMap.get(sub.user_id);
    if (userSetting && userSetting.email_alerts === false) continue;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:20px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:12px;border:1px solid #27272a;overflow:hidden;">
        
        <!-- Header -->
        <tr><td style="padding:24px 24px 16px;border-bottom:1px solid #27272a;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.5px;color:white;background-color:${isBuy ? "#10b981" : "#ef4444"};">${isBuy ? "BUY" : "AVOID"} #${setupDef?.number || ""}</span>
                <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;color:#a1a1aa;background-color:#27272a;margin-left:6px;">${setupDef?.grade || ""}</span>
              </td>
              <td align="right">
                <span style="font-size:13px;font-weight:700;color:${statusColor};text-transform:uppercase;">${statusEmoji} ${newStatus}</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:12px 0 4px;font-size:22px;font-weight:700;color:#fafafa;">${displayName}</h1>
          ${(setupDef?.category_tags || []).map((t: string) => `<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;color:#a1a1aa;background-color:#27272a;margin-right:4px;">${t}</span>`).join("")}
          <p style="margin:10px 0 0;font-size:14px;color:#a1a1aa;font-style:italic;">${setupDef?.one_liner || ""}</p>
        </td></tr>

        <!-- Description -->
        <tr><td style="padding:16px 24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;">${setupDef?.public_description || reason}</p>
        </td></tr>

        <!-- Action -->
        <tr><td style="padding:0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${isActivation && isBuy ? "#052e16" : isActivation ? "#450a0a" : "#27272a"};border-radius:8px;border:1px solid ${isActivation && isBuy ? "#166534" : isActivation ? "#7f1d1d" : "#3f3f46"};">
            <tr><td style="padding:12px 16px;">
              <p style="margin:0;font-size:13px;font-weight:600;color:${isActivation && isBuy ? "#86efac" : isActivation ? "#fca5a5" : "#a1a1aa"};">${actionText}</p>
            </td></tr>
          </table>
        </td></tr>

        ${tradeInfo ? `
        <!-- Trade Info -->
        <tr><td style="padding:0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding:10px;background-color:#27272a;border-radius:8px 0 0 8px;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">Entry</div>
                <div style="font-size:16px;font-weight:700;color:#fafafa;">$${tradeInfo.entry_price?.toFixed(2) || "—"}</div>
              </td>
              <td width="34%" style="padding:10px;background-color:#27272a;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">TSLA Now</div>
                <div style="font-size:16px;font-weight:700;color:#fafafa;">$${indicators.close.toFixed(2)}</div>
              </td>
              <td width="33%" style="padding:10px;background-color:#27272a;border-radius:0 8px 8px 0;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">Day</div>
                <div style="font-size:16px;font-weight:700;color:#fafafa;">${tradeInfo.days_active || 1}</div>
              </td>
            </tr>
          </table>
        </td></tr>
        ` : `
        <!-- Price -->
        <tr><td style="padding:0 24px 16px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px;background-color:#27272a;border-radius:8px;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">TSLA at Signal</div>
                <div style="font-size:16px;font-weight:700;color:#fafafa;">$${indicators.close.toFixed(2)}</div>
              </td>
            </tr>
          </table>
        </td></tr>
        `}

        <!-- Backtest Stats -->
        <tr><td style="padding:0 24px 16px;">
          <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Backtest Edge (905 bars)</div>
          <p style="margin:0;font-size:14px;color:#d4d4d8;">${bestStat}</p>
        </td></tr>

        ${setupDef?.risk_note ? `
        <!-- Risk Note -->
        <tr><td style="padding:0 24px 16px;">
          <p style="margin:0;font-size:12px;color:#f59e0b;">&#9888; ${setupDef.risk_note}</p>
        </td></tr>
        ` : ""}

        <!-- CTA -->
        <tr><td style="padding:16px 24px 24px;text-align:center;border-top:1px solid #27272a;">
          <a href="https://www.flacko.ai/orb" style="display:inline-block;padding:12px 32px;background-color:#10b981;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">View on Orb</a>
          <p style="margin:12px 0 0;font-size:11px;color:#52525b;">Flacko AI | flacko.ai/orb</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
