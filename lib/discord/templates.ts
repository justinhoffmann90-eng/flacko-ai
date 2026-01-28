import { DiscordMessage, DiscordEmbed, DISCORD_COLORS } from "./client";
import { ReportAlert, TrafficLightMode, Positioning, TierSignals } from "@/types";
import { formatPrice } from "@/lib/utils";

/**
 * CRITICAL: Get the correct emoji for each mode/tier signal
 * 
 * DO NOT use wrong colors or default to wrong emoji!
 * 
 * Correct mappings:
 * - green  → 🟢 (U+1F7E2 GREEN CIRCLE)
 * - yellow → 🟡 (U+1F7E1 YELLOW CIRCLE)
 * - orange → 🟠 (U+1F7E0 ORANGE CIRCLE)
 * - red    → 🔴 (U+1F534 RED CIRCLE)
 * 
 * This function validates input and throws error for invalid modes.
 */
function getColorEmoji(signal: string): string {
  const normalized = signal.toLowerCase().trim();
  
  switch (normalized) {
    case "green":
      return "🟢";
    case "yellow":
      return "🟡";
    case "orange":
      return "🟠";
    case "red":
      return "🔴";
    default:
      console.error(`[DISCORD TEMPLATE ERROR] Invalid signal color: "${signal}". Must be green/yellow/orange/red.`);
      // Throw error instead of defaulting - this forces us to catch bugs
      throw new Error(`Invalid signal color: "${signal}". Must be green/yellow/orange/red.`);
  }
}

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
  // CRITICAL: Use validated color emoji (throws error if invalid mode)
  const modeEmoji = getColorEmoji(mode);
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
  // CRITICAL: Use validated color emoji (throws error if invalid mode)
  const modeEmoji = getColorEmoji(mode);

  const upsideAlerts = alerts.filter((a) => a.type === "upside");
  const downsideAlerts = alerts.filter((a) => a.type === "downside");

  // Build description
  let description = `## ${modeEmoji} ${mode.toUpperCase()} MODE\n`;
  description += `**${reportDate}**\n\n`;

  // Tier signals if available
  if (tiers) {
    // CRITICAL: Use validated color emoji (throws error if invalid tier signal)
    description += `**Tiers:** ${getColorEmoji(tiers.regime)} Regime | ${getColorEmoji(tiers.trend)} Trend | ${getColorEmoji(tiers.timing)} Timing | ${getColorEmoji(tiers.flow)} Flow\n\n`;
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
