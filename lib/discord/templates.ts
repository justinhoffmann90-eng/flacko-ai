import { DiscordMessage, DiscordEmbed, DISCORD_COLORS } from "./client";
import { ReportAlert, TrafficLightMode, Positioning, TierSignals } from "@/types";
import { formatPrice } from "@/lib/utils";
import { MODE_INFO, ModeKey } from "@/lib/modes/constants";

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

// Mode guidance — delegates to shared MODE_INFO (lib/modes/constants.ts).
// Do NOT add mode strings here; edit the shared constants file instead.
const modeGuidance: Record<string, { cap: string; guidance: string }> = Object.fromEntries(
  Object.entries(MODE_INFO).map(([key, info]) => [key, { cap: info.cap, guidance: info.guidance }])
);

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
  modeSummary,
  flackoTake,
  scenarios,
  gammaRegime,
  hiro,
}: {
  mode: TrafficLightMode;
  reportDate: string;
  closePrice: number;
  changePct: number;
  alerts: ReportAlert[];
  positioning?: Positioning;
  tiers?: TierSignals;
  masterEject?: number;
  modeSummary?: string;
  flackoTake?: string;
  scenarios?: { bull?: string; base?: string; bear?: string };
  gammaRegime?: string;
  hiro?: { reading?: string; context?: string };
}): DiscordMessage {
  // CRITICAL: Use validated color emoji (throws error if invalid mode)
  const modeEmoji = getColorEmoji(mode);
  const modeInfo = modeGuidance[mode] || modeGuidance.yellow;

  // Categorize alerts by price relative to current price (not by stored type)
  // This ensures levels above current = upside, below current = downside
  const upsideAlerts = alerts.filter((a) => a.price > closePrice);
  const downsideAlerts = alerts.filter((a) => a.price <= closePrice);

  // Build description - APPROVED FORMAT
  // NOTE: Title already shows "New TSLA Daily Report", don't duplicate
  let description = `📊 **${reportDate}**\n\n`;

  // Mode header with summary
  description += `${modeEmoji} **${mode.toUpperCase()} MODE** — ${modeInfo.cap}\n`;
  if (positioning?.posture) {
    description += `**Lean:** ${positioning.posture}\n`;
  }
  if (modeSummary) {
    description += `_${modeSummary}_\n`;
  }
  description += "\n---\n\n";

  // Flacko's Take (What I'd do)
  if (flackoTake) {
    description += `**What I'd do:** ${flackoTake}\n\n---\n\n`;
  }

  // Tier signals with proper labels
  if (tiers) {
    description += `**Tiers**\n`;
    description += `• Long (Weekly): ${getColorEmoji(tiers.regime)}\n`;
    description += `• Medium (Daily): ${getColorEmoji(tiers.trend)}\n`;
    description += `• Short (4H): ${getColorEmoji(tiers.timing)}\n`;
    description += `• Hourly: ${getColorEmoji(tiers.flow)}\n\n`;
  }

  // Scenarios
  if (scenarios) {
    description += `🎯 **Scenarios**\n`;
    if (scenarios.bull) description += `🐂 ${scenarios.bull}\n`;
    if (scenarios.base) description += `⚖️ ${scenarios.base}\n`;
    if (scenarios.bear) description += `🐻 ${scenarios.bear}\n`;
    description += "\n---\n\n";
  }

  // Alert Levels
  description += `📍 **Alert Levels**\n\n`;

  // Upside targets
  if (upsideAlerts.length > 0) {
    description += `**⬆️ Upside Targets**\n`;
    description += upsideAlerts
      .map((a) => `🎯 ${formatPrice(a.price)} — ${a.level_name} — ${a.action}`)
      .join("\n");
    description += "\n\n";
  }

  // Current price marker
  if (closePrice > 0) {
    description += `**📍 Current: ~${formatPrice(closePrice)}**\n\n`;
  }

  // Downside support
  if (downsideAlerts.length > 0) {
    description += `**⬇️ Downside Support**\n`;
    description += downsideAlerts
      .filter((a) => !a.level_name?.toLowerCase().includes("master eject"))
      .map((a) => `🛡️ ${formatPrice(a.price)} — ${a.level_name} — ${a.action}`)
      .join("\n");
    description += "\n\n";
  }

  // Master Eject
  if (masterEject && masterEject > 0) {
    description += `❌ **Master Eject: ${formatPrice(masterEject)}** — daily close below = exit all\n\n`;
  }

  description += "---\n\n";

  // Gamma + HIRO
  if (gammaRegime) {
    description += `⚡ **Gamma:** ${gammaRegime}\n`;
  }
  if (hiro?.reading) {
    description += `📊 **HIRO:** ${hiro.reading}`;
    if (hiro.context) description += ` (${hiro.context})`;
    description += "\n";
  }

  description += `\n→ Full report: https://flacko.ai/report`;

  const embed: DiscordEmbed = {
    title: "📊 New TSLA Daily Report",
    description: description.trim(),
    color: DISCORD_COLORS[mode],
    footer: {
      text: "Flacko AI • Alerts auto-set",
    },
  };

  return {
    embeds: [embed],
  };
}
