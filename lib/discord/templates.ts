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
const modeGuidance: Record<string, { cap: string; trimCap: string; guidance: string }> = {
  green: { cap: "up to 30%", trimCap: "10% of remaining per level", guidance: "Favorable conditions. Full deployment permitted. Trim slowly." },
  yellow_improving: { cap: "20%", trimCap: "15% of remaining per level", guidance: "Recovery building. Meaningful accumulation. Daily leading Weekly." },
  yellow: { cap: "17.5%", trimCap: "20% of remaining per level", guidance: "Warning signs present. Spread entries over 5-6 days." },
  orange: { cap: "10% or less", trimCap: "25% of remaining per level", guidance: "Elevated caution. Small nibbles only. Bounces suspect." },
  red: { cap: "5% or less", trimCap: "30% of remaining per level", guidance: "Defensive stance. Protect capital. Bounces are exits." },
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
  description += `${modeEmoji} **${mode.toUpperCase()} MODE** — Daily Cap: ${modeInfo.cap} | Trim: ${modeInfo.trimCap}\n`;
  description += `_${modeInfo.guidance}_\n\n`;

  // 3. POSTURE SECTION
  if (positioning) {
    description += `**📊 Posture:** ${positioning}\n\n`;
  }

  // 4. KILL LEVERAGE
  if (masterEject && masterEject > 0) {
    description += `**⚠️ Kill Leverage: ${formatPrice(masterEject)}**\n`;
    description += `_2 consecutive daily closes below = cut TSLL + options. Hold shares._`;
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
  masterEject,
  modeSummary,
  flackoTake,
  scenarios,
}: {
  mode: TrafficLightMode;
  reportDate: string;
  closePrice: number;
  changePct: number;
  alerts: ReportAlert[];
  positioning?: Positioning;
  masterEject?: number;
  modeSummary?: string;
  flackoTake?: string;
  scenarios?: { bull?: string; base?: string; bear?: string };
}): DiscordMessage {
  const modeEmoji = getColorEmoji(mode);
  const modeInfo = modeGuidance[mode] || modeGuidance.yellow;

  // Format date for title (e.g., "Monday, Feb 9")
  const dateObj = new Date(reportDate + "T12:00:00");
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Format change
  const changeSign = changePct >= 0 ? "+" : "";
  const changeStr = `${changeSign}${changePct.toFixed(2)}%`;

  // Build description
  let description = `**Mode: ${mode.toUpperCase()}${modeSummary ? ` (${modeSummary})` : ""}** -- ${modeInfo.cap}\n\n`;
  description += `**Price:** ${formatPrice(closePrice)} (${changeStr})\n`;
  description += `**Daily Cap:** ${positioning?.daily_cap || modeInfo.cap}\n`;
  description += `**Lean:** ${positioning?.posture || "—"}\n\n`;

  // Flacko's Take
  if (flackoTake) {
    description += `> ${flackoTake}\n\n`;
  }

  // Key Levels (top 2 upside + top 2 downside + eject)
  const upsideAlerts = alerts.filter((a) => a.price > closePrice).slice(0, 2);
  const downsideAlerts = alerts.filter((a) => a.price <= closePrice && !a.level_name?.toLowerCase().includes("master eject")).slice(0, 2);
  const slowZone = alerts.find((a) => a.level_name?.toLowerCase().includes("slow zone"));

  description += `**Key Levels:**\n`;
  upsideAlerts.forEach((a) => {
    description += `🎯 ${a.level_name}: ${formatPrice(a.price)} -- ${a.action}\n`;
  });
  downsideAlerts.forEach((a) => {
    description += `🛡️ ${a.level_name}: ${formatPrice(a.price)} -- ${a.action}\n`;
  });
  if (slowZone) {
    description += `⏸️ Slow Zone: ${formatPrice(slowZone.price)} -- ${slowZone.action}\n`;
  }
  if (masterEject && masterEject > 0) {
    description += `❌ Kill Leverage: ${formatPrice(masterEject)}\n`;
  }
  description += "\n";

  // Scenarios
  if (scenarios) {
    description += `**Scenarios:**\n`;
    if (scenarios.bull) description += `🐂 ${scenarios.bull}\n`;
    if (scenarios.base) description += `⚖️ ${scenarios.base}\n`;
    if (scenarios.bear) description += `🐻 ${scenarios.bear}\n`;
  }

  const embed: DiscordEmbed = {
    title: `${modeEmoji} TSLA Daily Report -- ${dayName}, ${monthDay}`,
    url: "https://www.flacko.ai/reports",
    description: description.trim(),
    color: DISCORD_COLORS[mode],
    footer: {
      text: "Flacko AI -- Read full report at flacko.ai/reports",
    },
  };

  return {
    username: "Flacko Reports",
    embeds: [embed],
  } as DiscordMessage & { username: string };
}
