/**
 * Orb Score — production config
 * 
 * Quality-weighted composite of 17 setup states.
 * 4 zones: FULL_SEND / NEUTRAL / CAUTION / DEFENSIVE
 * Validated: 7.64pp spread at 20D across 1,005 trading days.
 */

export type OrbZone = "FULL_SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";

export const ZONE_CONFIG: Record<OrbZone, { emoji: string; label: string; color: string; hex: string; description: string }> = {
  FULL_SEND:  { emoji: "🟢", label: "FULL SEND",  color: "text-emerald-400", hex: "#22c55e", description: "Multiple strong buys, no avoids. Deploy leveraged." },
  NEUTRAL:    { emoji: "⚪", label: "NEUTRAL",     color: "text-zinc-300",    hex: "#d4d4d8", description: "Normal conditions. Hold existing, don't add." },
  CAUTION:    { emoji: "🟡", label: "CAUTION",     color: "text-amber-400",   hex: "#eab308", description: "Avoid signals present. Take profits, reduce leverage." },
  DEFENSIVE:  { emoji: "🔴", label: "DEFENSIVE",   color: "text-red-400",     hex: "#ef4444", description: "Multiple avoids. Cash. Wait." },
};

export const SETUP_TYPES: Record<string, "buy" | "avoid"> = {
  "smi-oversold-gauge": "buy", "oversold-extreme": "buy", "regime-shift": "buy",
  "deep-value": "buy", "green-shoots": "buy", "momentum-flip": "buy",
  "trend-confirm": "buy", "trend-ride": "buy", "trend-continuation": "buy",
  "goldilocks": "buy", "capitulation": "buy",
  "smi-overbought": "avoid", "dual-ll": "avoid", "overextended": "avoid",
  "momentum-crack": "avoid", "ema-shield-caution": "avoid", "ema-shield-break": "avoid",
};

export const WEIGHTS: Record<string, number> = {
  "oversold-extreme": 0.60, "capitulation": 0.51, "momentum-crack": 0.22,
  "overextended": 0.49, "deep-value": 0.47, "goldilocks": 0.44,
  "smi-overbought": 0.44, "trend-confirm": 0.43, "regime-shift": 0.28,
  "ema-shield-caution": 0.39, "dual-ll": 0.39, "trend-ride": 0.35,
  "momentum-flip": 0.33, "green-shoots": 0.32, "smi-oversold-gauge": 0.47,
  "trend-continuation": 0.47, "ema-shield-break": 0.30,
};

// Zone thresholds from v3 backtest (percentile-calibrated)
const THRESHOLDS = {
  FULL_SEND: 0.686,
  NEUTRAL: -0.117,
  CAUTION: -0.729,
};

export function computeOrbScore(setupStates: { setup_id: string; status: string }[]): number {
  let score = 0;
  for (const snap of setupStates) {
    const type = SETUP_TYPES[snap.setup_id];
    if (!type) continue;
    const w = WEIGHTS[snap.setup_id] || 0.3;
    const dir = type === "buy" ? 1 : -1;
    if (snap.status === "active") score += dir * w;
    else if (snap.status === "watching") score += dir * w * 0.3;
  }
  return Math.round(score * 1000) / 1000;
}

export function assignZone(score: number): OrbZone {
  if (score >= THRESHOLDS.FULL_SEND) return "FULL_SEND";
  if (score >= THRESHOLDS.NEUTRAL) return "NEUTRAL";
  if (score >= THRESHOLDS.CAUTION) return "CAUTION";
  return "DEFENSIVE";
}

/** Generate transition message for subscribers */
export function transitionMessage(from: OrbZone, to: OrbZone): string {
  const key = `${from}->${to}`;
  const messages: Record<string, string> = {
    "NEUTRAL->FULL_SEND": "Score shifted to FULL SEND. Multiple buy signals active, no avoids. Historically +6.2% avg over 20 days with 66% win rate. Favorable for leveraged positions.",
    "FULL_SEND->NEUTRAL": "Score shifted from FULL SEND to NEUTRAL. Conditions are still positive -- hold positions, no need to trim. Just not exceptional anymore.",
    "NEUTRAL->CAUTION": "Score shifted to CAUTION. Avoid signals are present. Consider taking profits and reducing leverage. Historically negative forward returns from here.",
    "CAUTION->NEUTRAL": "Score improved to NEUTRAL. Conditions normalizing. Still not a buy signal -- wait for confirmation before adding.",
    "CAUTION->DEFENSIVE": "Score dropped to DEFENSIVE. Multiple avoid signals active. Reduce exposure, raise cash. Historically -5.3% over 20 days from this transition.",
    "DEFENSIVE->CAUTION": "Score ticked up from DEFENSIVE to CAUTION. Still unfavorable -- wait for NEUTRAL before reloading. The data says CAUTION after DEFENSIVE is still negative.",
    "DEFENSIVE->NEUTRAL": "Score jumped from DEFENSIVE to NEUTRAL. This is the reload signal. The worst appears to be over. Historically +3.9% over 20 days.",
    "FULL_SEND->CAUTION": "Score dropped from FULL SEND to CAUTION. Sharp shift -- take profits on leveraged positions. Conditions deteriorating.",
  };
  return messages[key] || `Orb Score shifted from ${ZONE_CONFIG[from].label} to ${ZONE_CONFIG[to].label}.`;
}
