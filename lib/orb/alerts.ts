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

  // Skip deactivation emails — only send activation alerts
  if (!isActivation) {
    console.log(`[Orb Alerts] Skipping deactivation email for ${displayName} (${setupId})`);
    return;
  }

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

  if (isActivation && tradeInfo?.days_active && tradeInfo.days_active > 1) {
    console.log(`[Orb Alerts] Skipping Day ${tradeInfo.days_active} email for ${displayName} — only send on activation`);
    return;
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

  const backtestBars = setupDef?.backtest_n ?? "—";
  const medianStat =
    setupDef?.gauge_median_return != null && setupDef?.gauge_median_days != null
      ? `${setupDef.gauge_median_return > 0 ? "+" : ""}${setupDef.gauge_median_return}% median return over ~${setupDef.gauge_median_days} days`
      : "";
  const horizonStats = [
    { label: "5d", wr: setupDef?.backtest_win_rate_5d, ret: setupDef?.backtest_avg_return_5d },
    { label: "20d", wr: setupDef?.backtest_win_rate_20d, ret: setupDef?.backtest_avg_return_20d },
    { label: "60d", wr: setupDef?.backtest_win_rate_60d, ret: setupDef?.backtest_avg_return_60d },
  ].filter((h) => h.wr != null);
  const horizonGridHtml = horizonStats.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          ${horizonStats.map((stat, index) => {
            const isFirst = index === 0;
            const isLast = index === horizonStats.length - 1;
            const borderRadius = isFirst ? "8px 0 0 8px" : isLast ? "0 8px 8px 0" : "0";
            const divider = isLast ? "" : "border-right:1px solid #18181b;";
            const winRate = stat.wr != null ? `${stat.wr}%` : "—";
            const avgReturn = stat.ret != null ? `${stat.ret > 0 ? "+" : ""}${stat.ret}%` : "—";
            return `
            <td width="${Math.round(100 / horizonStats.length)}%" style="background-color:#27272a;padding:12px;text-align:center;${divider}border-radius:${borderRadius};">
              <div style="font-size:16px;font-weight:700;color:#fafafa;">${winRate}</div>
              <div style="font-size:13px;color:#d4d4d8;margin-top:2px;">${avgReturn}</div>
              <div style="font-size:11px;color:#71717a;letter-spacing:0.4px;text-transform:uppercase;margin-top:6px;">${stat.label}</div>
            </td>`;
          }).join("")}
        </tr>
      </table>`
    : "";

  // Determine signal color and action guidance
  let statusEmoji: string;
  let actionText: string;

  if (isActivation && isBuy) {
    statusEmoji = "🟢";
    actionText = "Use your daily report's mode for position sizing.";
  } else if (isActivation && !isBuy) {
    statusEmoji = "🔴";
    actionText = "This is an AVOID signal. Do not open new call positions.";
  } else {
    statusEmoji = "⚪";
    actionText = "";
  }

  const subject = isActivation
    ? `${statusEmoji} Orb: ${displayName} ${isBuy ? "BUY" : "AVOID"} Signal Activated`
    : `${statusEmoji} Orb: ${displayName} Deactivated`;

  const categoryTags = Array.isArray(setupDef?.category_tags) ? setupDef?.category_tags : [];
  const categoryTagsHtml = categoryTags.length
    ? `<div style="margin-top:8px;">${categoryTags.map((t: string) => `<span style="display:inline-block;padding:3px 8px;border-radius:4px;font-size:11px;color:#a1a1aa;background-color:#27272a;margin:0 4px 4px 0;">${t}</span>`).join("")}</div>`
    : "";
  const oneLinerHtml = setupDef?.one_liner
    ? `<p style="margin:10px 0 0;font-size:13px;color:#a1a1aa;font-style:italic;">${setupDef.one_liner}</p>`
    : "";
  const actionBoxBg = isBuy ? "#052e16" : "#450a0a";
  const actionBoxBorder = isBuy ? "#166534" : "#7f1d1d";
  const actionBoxTextColor = isBuy ? "#10b981" : "#ef4444";
  const actionBoxHtml = actionText
    ? `<div style="margin-top:12px;padding:10px 12px;border-radius:8px;background-color:${actionBoxBg};border:1px solid ${actionBoxBorder};font-size:13px;font-weight:600;color:${actionBoxTextColor};">${actionText}</div>`
    : "";
  const entryPrice = typeof tradeInfo?.entry_price === "number" ? tradeInfo.entry_price : null;
  const returnPct = entryPrice != null && entryPrice !== 0
    ? ((indicators.close - entryPrice) / entryPrice) * 100
    : null;
  const returnPctLabel = returnPct != null ? `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(1)}%` : "—";
  const returnPctColor = returnPct != null ? (returnPct >= 0 ? "#10b981" : "#ef4444") : "#a1a1aa";
  const entryPriceLabel = entryPrice != null ? `$${entryPrice.toFixed(2)}` : "—";
  const medianStatHtml = medianStat
    ? `<p style="margin:0 0 12px;font-size:14px;color:#d4d4d8;">${medianStat}</p>`
    : "";
  const historicalHeaderMargin = medianStat || horizonGridHtml ? "8px" : "0";

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
                <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.5px;color:white;background-color:${isBuy ? "#10b981" : "#ef4444"};">${isBuy ? "BUY" : "AVOID"}</span>
                <span style="display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;color:#a1a1aa;background-color:#27272a;margin-left:6px;">Grade ${setupDef?.grade || "—"}</span>
              </td>
              <td align="right">
                <span style="font-size:13px;font-weight:700;color:${isBuy ? "#10b981" : "#ef4444"};text-transform:uppercase;">${statusEmoji} ACTIVATED</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:12px 0 4px;font-size:22px;font-weight:700;color:#fafafa;">${displayName}</h1>
          ${categoryTagsHtml}
          ${oneLinerHtml}
        </td></tr>

        <!-- Description -->
        <tr><td style="padding:16px 24px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#d4d4d8;">${setupDef?.public_description || reason}</p>
          ${actionBoxHtml}
        </td></tr>

        <!-- Price -->
        <tr><td style="padding:0 24px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="33%" style="padding:10px;background-color:#27272a;border-radius:8px 0 0 8px;border-right:1px solid #18181b;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">Entry</div>
                <div style="font-size:16px;font-weight:700;color:#fafafa;">${entryPriceLabel}</div>
              </td>
              <td width="34%" style="padding:10px;background-color:#27272a;border-right:1px solid #18181b;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">TSLA Now</div>
                <div style="font-size:16px;font-weight:700;color:#fafafa;">$${indicators.close.toFixed(2)}</div>
              </td>
              <td width="33%" style="padding:10px;background-color:#27272a;border-radius:0 8px 8px 0;text-align:center;">
                <div style="font-size:11px;color:#71717a;margin-bottom:4px;">Return</div>
                <div style="font-size:16px;font-weight:700;color:${returnPctColor};">${returnPctLabel}</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Historical Edge -->
        <tr><td style="padding:0 24px 16px;">
          <div style="font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:${historicalHeaderMargin};">Historical Edge (${backtestBars} bars)</div>
          ${medianStatHtml}
          ${horizonGridHtml}
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
          <p style="margin:12px 0 0;font-size:11px;color:#52525b;">Flacko AI &bull; flacko.ai/orb</p>
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
