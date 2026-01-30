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

// Mode descriptions for Discord alerts
const modeGuidance: Record<string, { cap: string; guidance: string }> = {
  green: { cap: "20% daily cap", guidance: "Favorable conditions for swing entries." },
  yellow: { cap: "15% daily cap", guidance: "Proceed with caution. Tighter stops." },
  orange: { cap: "10% daily cap", guidance: "Elevated caution. Respect key levels. Size positions conservatively." },
  red: { cap: "10% daily cap", guidance: "Defensive stance. Protect capital." },
};

export function getAlertDiscordMessage({
  alerts,
  mode,
  positioning,
  keyLevels,
  masterEject,
}: {
  alerts: ReportAlert[];
  currentPrice?: number; // deprecated, not used in new format
  mode: TrafficLightMode;
  reportDate?: string; // deprecated, not used in new format
  positioning?: string; // e.g., "Lean Bearish"
  keyLevels?: {
    callWall?: number;
    hedgeWall?: number;
    gammaStrike?: number;
    putWall?: number;
  };
  masterEject?: number;
}): DiscordMessage {
  // CRITICAL: Use validated color emoji (throws error if invalid mode)
  const modeEmoji = getColorEmoji(mode);
  const modeInfo = modeGuidance[mode] || modeGuidance.yellow;

  // 1. BUILD TRIGGERED ALERTS SECTION (first)
  const alertLines = alerts
    .map((alert) => {
      const isUpside = alert.type === "upside";
      const emoji = isUpside ? "🟢" : "🔴";
      const actionEmoji = isUpside ? "📈" : "💰";

      let line = `${emoji} **${formatPrice(alert.price)}** — ${alert.level_name}`;
      line += `\n${actionEmoji} ${alert.action}`;
      if (alert.reason) {
        line += `\n_${alert.reason}_`;
      }
      return line;
    })
    .join("\n\n");

  let description = `**Triggered:**\n${alertLines}\n\n`;

  // 2. MODE SECTION
  description += `${modeEmoji} **${mode.toUpperCase()} MODE** — ${modeInfo.cap}\n`;
  description += `_${modeInfo.guidance}_\n\n`;

  // 3. POSTURE SECTION
  if (positioning) {
    description += `**📊 Posture:** ${positioning}\n\n`;
  }

  // 4. KEY LEVELS SECTION
  if (keyLevels && (keyLevels.callWall || keyLevels.gammaStrike || keyLevels.hedgeWall || keyLevels.putWall)) {
    description += `**📍 Key Levels**\n\`\`\`\n`;
    if (keyLevels.callWall) description += `Call Wall     $${keyLevels.callWall}  ▲ Resistance\n`;
    if (keyLevels.gammaStrike) description += `Gamma Strike  $${keyLevels.gammaStrike}  ◆ Pivot\n`;
    if (keyLevels.hedgeWall) description += `Hedge Wall    $${keyLevels.hedgeWall}  ◆ Pivot\n`;
    if (keyLevels.putWall) description += `Put Wall      $${keyLevels.putWall}  ▼ Support\n`;
    description += `\`\`\`\n`;
  }

  // 5. MASTER EJECT
  if (masterEject && masterEject > 0) {
    description += `**⚠️ Master Eject: ${formatPrice(masterEject)}**\n`;
    description += `_Daily close below = exit all positions_`;
  }

  const embed: DiscordEmbed = {
    title: "⚡ TSLA Price Alert Triggered!",
    description: description.trim(),
    color: DISCORD_COLORS[mode],
    footer: {
      text: "Flacko AI • Set it and forget it",
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
