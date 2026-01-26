import { DiscordMessage, DiscordEmbed, DISCORD_COLORS } from "./client";
import { ReportAlert, TrafficLightMode, Positioning, TierSignals } from "@/types";
import { formatPrice } from "@/lib/utils";

export function getAlertDiscordMessage({
  alerts,
  mode,
  positioning,
}: {
  alerts: ReportAlert[];
  currentPrice?: number; // deprecated, not used in new format
  mode: TrafficLightMode;
  reportDate?: string; // deprecated, not used in new format
  positioning?: string; // e.g., "Lean Bullish"
}): DiscordMessage {
  const modeEmoji = mode === "green" ? "🟢" : mode === "yellow" ? "🟡" : "🔴";
  const modeLabel = positioning
    ? `${modeEmoji} ${mode.toUpperCase()} MODE (${positioning})`
    : `${modeEmoji} ${mode.toUpperCase()} MODE`;

  // Build alert lines with simplified format
  const alertLines = alerts
    .map((alert) => {
      const isUpside = alert.type === "upside";
      const emoji = isUpside ? "🟢" : "🔴";
      const actionEmoji = isUpside ? "📈" : "💰";

      let line = `${emoji} **${formatPrice(alert.price)}** - ${alert.level_name}`;
      line += `\n${actionEmoji} ${alert.action}`;
      if (alert.reason) {
        line += `\n_${alert.reason}_`;
      }
      return line;
    })
    .join("\n\n");

  const embed: DiscordEmbed = {
    title: "⚡ TSLA Price Alert Triggered!",
    description: `${modeLabel}\n\n${alertLines}`,
    color: DISCORD_COLORS[mode],
    footer: {
      text: "Flacko AI • Check app for full details",
    },
  };

  return {
    embeds: [embed],
  };
}

export function getNewReportDiscordMessage({
  mode,
  reportDate,
  closePrice,
  changePct,
  alerts,
  positioning,
  tiers,
  masterEject,
}: {
  mode: TrafficLightMode;
  reportDate: string;
  closePrice: number;
  changePct: number;
  alerts: ReportAlert[];
  positioning?: Positioning;
  tiers?: TierSignals;
  masterEject?: number;
}): DiscordMessage {
  const modeEmoji = mode === "green" ? "🟢" : mode === "yellow" ? "🟡" : "🔴";

  const upsideAlerts = alerts.filter((a) => a.type === "upside");
  const downsideAlerts = alerts.filter((a) => a.type === "downside");

  // Build description
  let description = `## ${modeEmoji} ${mode.toUpperCase()} MODE\n`;
  description += `**${reportDate}**\n\n`;

  // Tier signals if available
  if (tiers) {
    const tierEmoji = (s: string) => s === 'green' ? '🟢' : s === 'red' ? '🔴' : '🟡';
    description += `**Tiers:** ${tierEmoji(tiers.regime)} Regime | ${tierEmoji(tiers.trend)} Trend | ${tierEmoji(tiers.timing)} Timing | ${tierEmoji(tiers.flow)} Flow\n\n`;
  }

  // Positioning if available
  if (positioning) {
    description += `**Today's Positioning**\n`;
    if (positioning.daily_cap) description += `• Daily Cap: ${positioning.daily_cap}\n`;
    if (positioning.vehicle) description += `• Vehicle: ${positioning.vehicle}\n`;
    if (positioning.posture) description += `• Posture: ${positioning.posture}\n`;
    description += '\n';
  }

  // Take Profit levels (price first)
  if (upsideAlerts.length > 0) {
    description += `**📈 Take Profit Levels**\n`;
    description += upsideAlerts
      .map((a) => `🟢 **${formatPrice(a.price)}** — ${a.level_name} → ${a.action}`)
      .join("\n");
    description += "\n\n";
  }

  // Buy the Dip levels (price first)
  if (downsideAlerts.length > 0) {
    description += `**💰 Buy the Dip Levels**\n`;
    description += downsideAlerts
      .map((a) => `🔴 **${formatPrice(a.price)}** — ${a.level_name} → ${a.action}`)
      .join("\n");
    description += "\n\n";
  }

  // Master Eject
  if (masterEject && masterEject > 0) {
    description += `**⚠️ Master Eject: ${formatPrice(masterEject)}**\n`;
    description += `_Daily close below = exit all positions_`;
  }

  const embed: DiscordEmbed = {
    title: "📊 New TSLA Daily Report",
    description: description.trim(),
    color: DISCORD_COLORS[mode],
    footer: {
      text: "Flacko AI • Alerts auto-set • View app for full analysis",
    },
  };

  return {
    embeds: [embed],
  };
}
