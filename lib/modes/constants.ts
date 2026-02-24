/**
 * SINGLE SOURCE OF TRUTH for trading mode descriptions.
 *
 * Both email (lib/resend/templates.ts) and Discord (lib/discord/templates.ts)
 * should derive mode text from here. Update once → both channels stay in sync.
 *
 * DO NOT copy these strings into other files. Import this module.
 */

export type ModeKey = "green" | "yellow_improving" | "yellow" | "orange" | "red";

export interface ModeInfo {
  emoji: string;
  cap: string;
  trimCap: string;
  guidance: string;
  color: string; // hex, for email templates
}

export const MODE_INFO: Record<ModeKey, ModeInfo> = {
  green: {
    emoji: "🟢",
    cap: "up to 30%",
    trimCap: "10% of remaining per level",
    guidance: "Favorable conditions. Full deployment permitted. Trim slowly — let winners run.",
    color: "#22c55e",
  },
  yellow_improving: {
    emoji: "🟡",
    cap: "20%",
    trimCap: "15% of remaining per level",
    guidance: "Recovery building. Meaningful accumulation. Daily leading Weekly.",
    color: "#eab308",
  },
  yellow: {
    emoji: "🟡",
    cap: "17.5%",
    trimCap: "20% of remaining per level",
    guidance: "Warning signs present. Spread entries over 5-6 days minimum. Tighter stops.",
    color: "#eab308",
  },
  orange: {
    emoji: "🟠",
    cap: "10% or less",
    trimCap: "25% of remaining per level",
    guidance: "Elevated caution. Small nibbles only. Bounces suspect.",
    color: "#f97316",
  },
  red: {
    emoji: "🔴",
    cap: "5% or less",
    trimCap: "30% of remaining per level",
    guidance: "Defensive stance. Protect capital. Bounces are exits.",
    color: "#ef4444",
  },
};
