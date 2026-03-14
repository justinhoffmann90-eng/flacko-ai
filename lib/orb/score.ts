/**
 * Orb Score — production config
 * 
 * Quality-weighted composite of 17 setup states.
 * 4 zones: FULL_SEND / NEUTRAL / CAUTION / DEFENSIVE
 * Validated: 7.64pp spread at 20D across 1,005 trading days.
 */

export type OrbZone = "FULL_SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";

export const ZONE_CONFIG: Record<OrbZone, { emoji: string; label: string; color: string; hex: string; description: string }> = {
  FULL_SEND:  { emoji: "🟢", label: "FULL SEND",  color: "text-emerald-400", hex: "#22c55e", description: "Multiple buy signals converging with no avoids active. The structure favors adding exposure and deploying leveraged positions. Historically averages +6.2% over 20 days (66% win rate) and +16.3% over 60 days." },
  NEUTRAL:    { emoji: "⚪", label: "NEUTRAL",     color: "text-zinc-300",    hex: "#d4d4d8", description: "Mixed or baseline conditions. Hold existing positions at current size -- no urgency to add or trim. The setup environment isn't giving a clear edge in either direction." },
  CAUTION:    { emoji: "🟡", label: "CAUTION",     color: "text-amber-400",   hex: "#eab308", description: "Avoid signals are outweighing buy signals. Take partial profits, reduce leverage, and tighten stops. Forward returns from CAUTION historically average -1.2% over 20 days (41% win rate)." },
  DEFENSIVE:  { emoji: "🔴", label: "DEFENSIVE",   color: "text-red-400",     hex: "#ef4444", description: "Multiple avoid signals are active and the structure is hostile. Raise cash, cut leverage, protect capital. Forward returns from DEFENSIVE average -1.8% over 20 days (43% win) and -6.7% over 60 days." },
};

export const SETUP_TYPES: Record<string, "buy" | "avoid"> = {
  "smi-oversold-gauge": "buy", "oversold-extreme": "buy", "regime-shift": "buy",
  "deep-value": "buy", "green-shoots": "buy", "momentum-flip": "buy",
  "trend-confirm": "buy", "trend-ride": "buy", "trend-continuation": "buy",
  "goldilocks": "buy", "capitulation": "buy", "vix-spike-reversal": "buy",
  "climactic-volume-reversal": "buy",
  "smi-overbought": "avoid", "dual-ll": "avoid", "overextended": "avoid",
  "momentum-crack": "avoid", "ema-shield-caution": "avoid", "ema-shield-break": "avoid",
};

// Weights v4 — recalibrated 2026-03-14 using edge × sample-confidence
// Edge = avg 20D return (buy) or -avg 20D return (avoid)
// Confidence = min(1, sqrt(N/20)) to penalize small samples
// Final weight = clamp(0.15, edge_rank × confidence, 0.60)
export const WEIGHTS: Record<string, number> = {
  "oversold-extreme": 0.55,           // edge=53.5% but N=2, penalized for sample
  "deep-value": 0.45,                 // edge=8.8%, N=14, 57% win, 86% at 60D
  "trend-confirm": 0.42,              // edge=6.4%, N=45, 62% win — workhorse
  "goldilocks": 0.42,                 // edge=5.8%, N=40, 63% win — reliable
  "climactic-volume-reversal": 0.42,  // edge=5.6%, N=20, 70% win — volume-based
  "trend-ride": 0.35,                 // edge=4.8%, N=18, 61% win
  "momentum-crack": 0.35,             // edge=4.5%, N=8, 88% win at 20D — small N but strong
  "overextended": 0.35,               // edge=4.4%, N=18, 61% win — was overweighted at 0.49
  "momentum-flip": 0.33,              // edge=3.5%, N=21, 71% win
  "dual-ll": 0.33,                    // edge=2.8%, N=46, consistent across timeframes
  "ema-shield-caution": 0.30,         // edge=1.7%, N=33, early warning
  "capitulation": 0.30,               // edge=2.9%, N=14, 50% win — was overweighted at 0.51
  "regime-shift": 0.28,               // edge=7.3% but N=7 — penalized for sample
  "green-shoots": 0.28,               // edge=3.1%, N=40, 53% win — weak conviction
  "ema-shield-break": 0.25,           // edge=2.9%, N=31, follow-through signal
  "vix-spike-reversal": 0.25,         // edge unknown (VIX data was broken), N=12
  "trend-continuation": 0.20,         // edge=0.07%, N=45 — near zero, was 0.47
  "smi-oversold-gauge": 0.20,         // edge=-0.8%, N=20 — negative edge, was 0.47
  "smi-overbought": 0.18,             // edge=-1.9% (wrong direction), N=12, was 0.44
};

// Zone thresholds v4 — proportionally adjusted for new weight range
// Score range: -1.76 (all avoid) to +4.45 (all buy)
export const THRESHOLDS = {
  FULL_SEND: 0.584,
  NEUTRAL: -0.100,
  CAUTION: -0.621,
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

export type ZoneDisplay = {
  zone: OrbZone;
  label: string;
  qualifier: "Emerging" | "Fading" | "Deteriorating" | null;
};

const ZONE_BUFFER = 0.04;

export function getZoneDisplay(score: number): ZoneDisplay {
  const zone = assignZone(score);

  if (zone === "FULL_SEND" && score < THRESHOLDS.FULL_SEND + ZONE_BUFFER) {
    return { zone, label: "FULL SEND (Emerging)", qualifier: "Emerging" };
  }

  if (zone === "NEUTRAL" && score < THRESHOLDS.NEUTRAL + ZONE_BUFFER) {
    return { zone, label: "NEUTRAL (Fading)", qualifier: "Fading" };
  }

  if (zone === "CAUTION" && score >= THRESHOLDS.NEUTRAL - ZONE_BUFFER) {
    return { zone, label: "CAUTION (Emerging)", qualifier: "Emerging" };
  }

  if (zone === "CAUTION" && score < THRESHOLDS.CAUTION + ZONE_BUFFER) {
    return { zone, label: "CAUTION (Deteriorating)", qualifier: "Deteriorating" };
  }

  return {
    zone,
    label: ZONE_CONFIG[zone].label,
    qualifier: null,
  };
}

/** Generate transition message for subscribers */
export function transitionMessage(from: OrbZone, to: OrbZone): string {
  const key = `${from}->${to}`;
  const messages: Record<string, string> = {
    "NEUTRAL->FULL_SEND": "Score shifted to FULL SEND. Multiple buy signals are converging without opposition. This is the go-leveraged trigger -- historically TSLA averages +5.7% over 20 days (61% win) and +13.2% over 60 days (66% win) from this transition. Deploy size.",
    "FULL_SEND->NEUTRAL": "Score shifted from FULL SEND to NEUTRAL. Don't panic -- this is NOT a sell signal. Forward returns from this transition are still strongly positive (+6.0% at 20D, 62% win). The exceptional window has closed, but the environment is still constructive. Hold positions, no need to trim.",
    "NEUTRAL->CAUTION": "Score shifted to CAUTION. Avoid signals are building. The damage starts showing at 10 days (-0.6%, 43% win) and stays negative through 20 days. Consider taking partial profits and reducing leverage. Wait for a return to NEUTRAL before adding back.",
    "CAUTION->NEUTRAL": "Score improved to NEUTRAL. Conditions are normalizing, but don't rush to reload. Forward returns after this transition are muted at 10 days (-1.1%) and only turn slightly positive by 20 days (+1.2%). The signal is: stop bleeding, not start buying. Wait for FULL SEND to add meaningfully.",
    "CAUTION->DEFENSIVE": "Score dropped to DEFENSIVE. This is the get-out trigger. The damage is fast -- historically -4.5% within 10 days (only 32% win rate). Cut leverage, raise cash, and protect capital. Don't try to pick the bottom here.",
    "DEFENSIVE->CAUTION": "Score ticked up from DEFENSIVE to CAUTION. This is NOT 'the worst is over' -- it's a trap. CAUTION after DEFENSIVE historically still averages -4.8% over 20 days (44% win). Stay patient and wait for NEUTRAL before re-entering.",
    "DEFENSIVE->NEUTRAL": "Score jumped from DEFENSIVE to NEUTRAL. This IS the reload signal. When the score clears DEFENSIVE and reaches NEUTRAL, the worst is over. Historically +3.9% over 20 days (67% win). Begin rebuilding positions.",
    "FULL_SEND->CAUTION": "Score dropped sharply from FULL SEND to CAUTION. Rare and sudden deterioration -- conditions have flipped. Take profits on leveraged positions immediately. The environment that supported aggression is gone.",
  };
  return messages[key] || `Orb Score shifted from ${ZONE_CONFIG[from].label} to ${ZONE_CONFIG[to].label}.`;
}
