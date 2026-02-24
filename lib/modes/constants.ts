/**
 * SINGLE SOURCE OF TRUTH for trading mode descriptions.
 *
 * Both email (lib/resend/templates.ts) and Discord (lib/discord/templates.ts)
 * import from here. Update once → both channels stay in sync automatically.
 *
 * DO NOT copy these strings into other files. Import this module.
 */

export type ModeKey = "green" | "yellow" | "orange" | "red";

export interface ModeInfo {
  emoji: string;
  cap: string;
  guidance: string;
  color: string; // hex, used by email template
}

export const MODE_INFO: Record<ModeKey, ModeInfo> = {
  green: {
    emoji: "🟢",
    cap: "up to 25%",
    guidance: "Favorable conditions for swing entries. Consider adding on dips to key levels.",
    color: "#22c55e",
  },
  yellow: {
    emoji: "🟡",
    cap: "15% or less",
    guidance: "Proceed with caution. Tighter stops, smaller positions. Wait for clearer signals.",
    color: "#eab308",
  },
  orange: {
    emoji: "🟠",
    cap: "10% or less",
    guidance: "Elevated caution. Respect key levels. Size positions conservatively.",
    color: "#f97316",
  },
  red: {
    emoji: "🔴",
    cap: "5% or less",
    guidance: "Defensive stance. Protect capital. Bounces are exits.",
    color: "#ef4444",
  },
};
