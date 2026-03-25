export interface Indicators {
  date: string;
  close: number;
  vix_close: number;
  vix_weekly_change_pct: number;
  bx_daily: number;
  bx_daily_prev: number;
  bx_daily_state: "HH" | "LH" | "HL" | "LL";
  bx_daily_state_prev: "HH" | "LH" | "HL" | "LL";
  bx_weekly_state: "HH" | "LH" | "HL" | "LL";
  bx_weekly_state_prev: "HH" | "LH" | "HL" | "LL";
  bx_weekly_transition: string | null;
  rsi: number;
  rsi_prev: number;
  rsi_change_3d: number;
  smi: number;
  smi_signal: number;
  smi_prev: number;
  smi_signal_prev: number;
  smi_change_3d: number;
  smi_bull_cross: boolean;
  smi_bear_cross: boolean;
  smi_weekly?: number;
  smi_4h?: number;
  ema9: number;
  ema13?: number;
  ema21: number;
  sma200: number;
  sma200_dist: number;
  price_vs_ema9: number;
  price_vs_ema21: number;
  consecutive_down: number;
  consecutive_up: number;
  stabilization_days: number; // consecutive days where low >= prior day's low
  weekly_emas_stacked: boolean;
  price_above_weekly_all: boolean;
  price_above_weekly_13: boolean;
  price_above_weekly_21: boolean;
  weekly_ema9: number;
  weekly_ema13: number;
  weekly_ema21: number;
  bx_weekly: number;
  bx_weekly_prev: number;
  daily_hh_streak: number; // consecutive days with BX state HH
  bx_weekly_consec_ll: number; // consecutive weekly BXT lower-lows (negative & falling)
  ema9_slope_5d: number; // 5-day rate of change of Daily 9 EMA (%)
  days_below_ema9: number; // consecutive days close < ema9
  was_full_bull_5d: boolean; // was close > ema9 AND ema9 > ema21 on any of last 5 days
  volume?: number; // today's volume
  volumes?: number[]; // last ~30 daily volumes for relative volume calc
}

export interface SetupResult {
  setup_id: string;
  is_active: boolean;
  is_watching: boolean;
  conditions_met: Record<string, boolean>;
  reason: string;
  gauge_entry_value?: number;
  gauge_current_value?: number;
  gauge_target_value?: number;
  active_since_override?: string;
  active_day_override?: number;
}

export interface PreviousState {
  setup_id: string;
  status: "active" | "watching" | "inactive";
  gauge_entry_value?: number;
  entry_price?: number;
  active_since?: string;
  active_day?: number;
}

function countTradingDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function suggestMode(
  indicators: Indicators,
  activeSetups: SetupResult[]
): { suggestion: string; confidence: "high" | "medium" | "low"; reasoning: string[] } {
  const avoidIds = new Set(["smi-overbought", "dual-ll", "overextended", "momentum-crack"]);
  const avoids = activeSetups.filter((s) => avoidIds.has(s.setup_id) && s.is_active);

  if (avoids.some((a) => a.setup_id === "dual-ll")) {
    return {
      suggestion: "RED",
      confidence: "high",
      reasoning: ["Dual LL active (Daily + Weekly BX in LL)"],
    };
  }

  if (!indicators.price_above_weekly_21) {
    return {
      suggestion: "RED / EJECTED",
      confidence: "high",
      reasoning: ["Price below Weekly 21 EMA - Master Eject territory"],
    };
  }

  if (indicators.bx_weekly_state === "LL" && indicators.bx_daily_state === "LL") {
    return {
      suggestion: "ORANGE",
      confidence: "high",
      reasoning: ["Weekly LL + Daily LL - no recovery signal yet"],
    };
  }

  if (indicators.bx_weekly_state === "LL" && ["HL", "HH"].includes(indicators.bx_daily_state)) {
    return {
      suggestion: "ORANGE (Improving)",
      confidence: "medium",
      reasoning: [
        "Weekly still LL but Daily leading recovery",
        `Daily BX: ${indicators.bx_daily_state} (2 stages ahead of Weekly)`,
      ],
    };
  }

  if (indicators.bx_weekly_state === "HL") {
    return {
      suggestion: "YELLOW",
      confidence: "medium",
      reasoning: ["Weekly BX HL - correction exhausting, not yet confirmed"],
    };
  }

  if (indicators.bx_weekly_state === "LH") {
    return {
      suggestion: "YELLOW",
      confidence: "medium",
      reasoning: ["Weekly BX LH - momentum fading from prior strength"],
    };
  }

  if (indicators.bx_weekly_state === "HH" && indicators.weekly_emas_stacked && indicators.price_above_weekly_all) {
    if (avoids.some((a) => a.setup_id === "overextended")) {
      return {
        suggestion: "GREEN (Extended)",
        confidence: "medium",
        reasoning: [
          "Weekly HH + stacked EMAs, but >25% above 200 SMA",
          "Trim territory despite bullish structure",
        ],
      };
    }
    return {
      suggestion: "GREEN",
      confidence: "high",
      reasoning: ["Weekly HH + EMAs stacked + price above all - full bullish alignment"],
    };
  }

  if (indicators.bx_weekly_state === "HH") {
    return {
      suggestion: "YELLOW (Improving)",
      confidence: "medium",
      reasoning: ["Weekly HH but EMAs not fully stacked yet"],
    };
  }

  return {
    suggestion: "YELLOW",
    confidence: "low",
    reasoning: ["Mixed signals - requires manual assessment"],
  };
}

export function evaluateAllSetups(indicators: Indicators, previousStates: Map<string, PreviousState>): SetupResult[] {
  const oversoldExtreme = evaluateOversoldExtreme(indicators);
  const trendCont = evaluateTrendContinuation(indicators);
  return [
    evaluateSmiOversoldGauge(indicators, previousStates.get("smi-oversold-gauge")),
    oversoldExtreme,
    evaluateRegimeShift(indicators),
    evaluateDeepValue(indicators, oversoldExtreme.is_active),
    evaluateGreenShoots(indicators),
    evaluateMomentumFlip(indicators),
    evaluateTrendConfirmation(indicators),
    evaluateTrendRide(indicators, trendCont.is_active),
    trendCont,
    evaluateGoldilocks(indicators),
    evaluateCapitulationBounce(indicators),
    evaluateSmiOverboughtGauge(indicators, previousStates.get("smi-overbought")),
    evaluateDualLL(indicators),
    evaluateOverextended(indicators),
    evaluateMomentumCrack(indicators),
    evaluateEmaShieldCaution(indicators, previousStates.get("ema-shield-caution")),
    evaluateEmaShieldBreak(indicators, previousStates.get("ema-shield-break"), previousStates.get("ema-shield-caution")),
    evaluateVixSpikeReversal(indicators, previousStates.get("vix-spike-reversal")),
    evaluateClimacticVolumeReversal(indicators),
    evaluateBxtWeeklyStreak(indicators, previousStates.get("bxt-weekly-streak")),
  ];
}

function evaluateSmiOversoldGauge(ind: Indicators, prev?: PreviousState): SetupResult {
  const wasActive = prev?.status === "active";
  const crossedBelow = ind.smi_prev > -60 && ind.smi <= -60;

  if (wasActive) {
    if (ind.smi >= 30) {
      return {
        setup_id: "smi-oversold-gauge",
        is_active: false,
        is_watching: false,
        conditions_met: { target_reached: true },
        reason: `Target reached: SMI hit ${ind.smi.toFixed(1)} (>=+30)`,
        gauge_entry_value: prev?.gauge_entry_value,
        gauge_current_value: ind.smi,
        gauge_target_value: 30,
      };
    }

    return {
      setup_id: "smi-oversold-gauge",
      is_active: true,
      is_watching: false,
      conditions_met: { smi_below_neg60: true, target_not_reached: true },
      reason: `Active - SMI at ${ind.smi.toFixed(1)}, tracking to +30`,
      gauge_entry_value: prev?.gauge_entry_value,
      gauge_current_value: ind.smi,
      gauge_target_value: 30,
    };
  }

  if (crossedBelow) {
    return {
      setup_id: "smi-oversold-gauge",
      is_active: true,
      is_watching: false,
      conditions_met: { smi_crossed_below_neg60: true },
      reason: `NEW - SMI crossed below -60 (${ind.smi.toFixed(1)})`,
      gauge_entry_value: ind.smi,
      gauge_current_value: ind.smi,
      gauge_target_value: 30,
    };
  }

  const isWatching = ind.smi < -40 && ind.smi > -60;
  return {
    setup_id: "smi-oversold-gauge",
    is_active: false,
    is_watching: isWatching,
    conditions_met: { smi_approaching: isWatching },
    reason: isWatching
      ? `SMI at ${ind.smi.toFixed(1)} - approaching -60 entry`
      : `SMI at ${ind.smi.toFixed(1)} - far from -60 trigger`,
  };
}

function evaluateOversoldExtreme(ind: Indicators): SetupResult {
  const belowNeg40 = ind.sma200_dist < -40;
  const stabilized = ind.stabilization_days >= 2;
  const isActive = belowNeg40 && stabilized;
  const isWatching = belowNeg40 && !stabilized;
  return {
    setup_id: "oversold-extreme",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { below_neg40_sma200: belowNeg40, stabilization: stabilized },
    reason: isActive
      ? `Price ${ind.sma200_dist.toFixed(1)}% below 200 SMA + ${ind.stabilization_days}d stabilized - GENERATIONAL`
      : isWatching
      ? `Price ${ind.sma200_dist.toFixed(1)}% below 200 SMA - waiting for stabilization (${ind.stabilization_days}d)`
      : `Price ${ind.sma200_dist.toFixed(1)}% from 200 SMA`,
  };
}

function evaluateRegimeShift(ind: Indicators): SetupResult {
  const weeklyTransition = ind.bx_weekly_transition === "LL_to_HL";
  const aboveW13 = ind.price_above_weekly_13;
  const hhStreak = ind.daily_hh_streak >= 3;
  const isActive = weeklyTransition && aboveW13 && hhStreak;
  const isWatching = (ind.bx_weekly_state === "LL" && ind.bx_daily_state === "HL") || (weeklyTransition && (!aboveW13 || !hhStreak));
  return {
    setup_id: "regime-shift",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { weekly_ll_to_hl: weeklyTransition, above_weekly_13: aboveW13, daily_hh_streak_3: hhStreak },
    reason: isActive
      ? `Weekly BX LL->HL + above W13 + ${ind.daily_hh_streak}d HH streak - REGIME SHIFT`
      : isWatching
      ? `Weekly BX approaching transition (HH streak: ${ind.daily_hh_streak}d)`
      : `Weekly BX: ${ind.bx_weekly_state} - needs LL->HL + above W13 + 3d HH`,
  };
}

function evaluateDeepValue(ind: Indicators, oversoldExtremeActive: boolean): SetupResult {
  const inZone = ind.sma200_dist > -20 && ind.sma200_dist < -10;
  const bxHL = ind.bx_daily_state === "HL";
  const notGenerational = !oversoldExtremeActive;
  const isActive = inZone && bxHL && notGenerational;
  const isWatching = (inZone && ind.bx_daily_state === "LL") || (ind.sma200_dist > -25 && ind.sma200_dist < -10 && bxHL);
  return {
    setup_id: "deep-value",
    is_active: isActive,
    is_watching: isWatching && !isActive,
    conditions_met: { sma200_neg20_to_neg10: inZone, bx_hl: bxHL, not_generational: notGenerational },
    reason: isActive
      ? `200 SMA at ${ind.sma200_dist.toFixed(1)}% + BX HL - DEEP VALUE`
      : `200 SMA at ${ind.sma200_dist.toFixed(1)}%, BX: ${ind.bx_daily_state}`,
  };
}

function evaluateGreenShoots(ind: Indicators): SetupResult {
  const transition = ind.bx_daily_state === "HL" && ind.bx_daily_state_prev === "LL";
  const below200 = ind.sma200_dist < 0;
  const isActive = transition && below200;
  const isWatching = ind.bx_daily_state === "LL" && below200;
  return {
    setup_id: "green-shoots",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { ll_to_hl: transition, below_200sma: below200 },
    reason: isActive
      ? `BX flipped LL->HL below 200 SMA (${ind.sma200_dist.toFixed(1)}%) - GREEN SHOOTS`
      : isWatching
      ? `BX in LL below 200 SMA (${ind.sma200_dist.toFixed(1)}%) - watching for flip`
      : `BX: ${ind.bx_daily_state}, 200 SMA: ${ind.sma200_dist.toFixed(1)}%`,
  };
}

function evaluateMomentumFlip(ind: Indicators): SetupResult {
  const transition = ind.bx_daily_state === "HH" && ind.bx_daily_state_prev === "HL";
  const rsiRoom = ind.rsi < 55;
  const isActive = transition && rsiRoom;
  const isWatching = ind.bx_daily_state === "HL" && rsiRoom;
  return {
    setup_id: "momentum-flip",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { hl_to_hh: transition, rsi_below_55: rsiRoom },
    reason: isActive
      ? `BX flipped HL->HH + RSI ${ind.rsi.toFixed(1)} (room to run)`
      : isWatching
      ? `BX in HL + RSI ${ind.rsi.toFixed(1)} - one flip from trigger`
      : `BX: ${ind.bx_daily_state}, RSI: ${ind.rsi.toFixed(1)}`,
  };
}

function evaluateTrendConfirmation(ind: Indicators): SetupResult {
  const bullCross = ind.smi_bull_cross;
  const bxHH = ind.bx_daily_state === "HH";
  const isActive = bullCross && bxHH;
  const isWatching = bxHH && ind.smi > ind.smi_signal && !bullCross;
  return {
    setup_id: "trend-confirm",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { smi_bull_cross: bullCross, bx_hh: bxHH },
    reason: isActive ? "SMI bull cross + BX HH - TREND CONFIRMED" : `SMI cross: ${bullCross}, BX: ${ind.bx_daily_state}`,
  };
}

function evaluateTrendRide(ind: Indicators, trendContActive: boolean): SetupResult {
  const bxHH = ind.bx_daily_state === "HH";
  const d9AboveD21 = ind.ema9 > ind.ema21;
  const aboveD21 = ind.close > ind.ema21;
  const aboveW21 = ind.price_above_weekly_21;
  const notTrendCont = !trendContActive;
  const isActive = bxHH && d9AboveD21 && aboveD21 && aboveW21 && notTrendCont;
  const isWatching = bxHH && aboveD21 && aboveW21 && !d9AboveD21;
  return {
    setup_id: "trend-ride",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { bx_hh: bxHH, d9_above_d21: d9AboveD21, above_d21: aboveD21, above_w21: aboveW21, not_trend_cont: notTrendCont },
    reason: isActive ? "BX HH + D9>D21 + above D21 + above W21 - TREND RIDE" : `BX: ${ind.bx_daily_state}, D9>D21: ${d9AboveD21 ? "Y" : "N"}, D21: ${aboveD21 ? "Y" : "N"}, W21: ${aboveW21 ? "Y" : "N"}`,
  };
}

function evaluateTrendContinuation(ind: Indicators): SetupResult {
  const stacked = ind.weekly_emas_stacked;
  const aboveAll = ind.price_above_weekly_all;
  const bxHH = ind.bx_daily_state === "HH";
  const isActive = stacked && aboveAll && bxHH;
  return {
    setup_id: "trend-continuation",
    is_active: isActive,
    is_watching: stacked && bxHH && !aboveAll,
    conditions_met: { weekly_stacked: stacked, above_all_weekly: aboveAll, bx_hh: bxHH },
    reason: isActive
      ? "Weekly stacked + above all + BX HH - CONTINUATION"
      : `Stacked: ${stacked ? "Y" : "N"}, Above: ${aboveAll ? "Y" : "N"}, BX: ${ind.bx_daily_state}`,
  };
}

function evaluateGoldilocks(ind: Indicators): SetupResult {
  const rsiInRange = ind.rsi >= 45 && ind.rsi <= 65;
  const smiInRange = ind.smi >= 0 && ind.smi <= 40;
  const bxHH = ind.bx_daily_state === "HH";
  const isActive = rsiInRange && smiInRange && bxHH;
  const condCount = [rsiInRange, smiInRange, bxHH].filter(Boolean).length;
  const isWatching = condCount === 2;

  return {
    setup_id: "goldilocks",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { rsi_45_65: rsiInRange, smi_0_40: smiInRange, bx_hh: bxHH },
    reason: isActive
      ? `GOLDILOCKS - RSI ${ind.rsi.toFixed(1)}, SMI ${ind.smi.toFixed(1)}, BX HH`
      : isWatching
      ? `${condCount}/3 conditions met`
      : `RSI: ${ind.rsi.toFixed(1)}, SMI: ${ind.smi.toFixed(1)}, BX: ${ind.bx_daily_state}`,
  };
}

function evaluateCapitulationBounce(ind: Indicators): SetupResult {
  const fourDown = ind.consecutive_down >= 4;
  const rsiLow = ind.rsi < 40;
  const isActive = fourDown && rsiLow;
  const isWatching = (ind.consecutive_down >= 2 && rsiLow) || (fourDown && ind.rsi < 45);
  return {
    setup_id: "capitulation",
    is_active: isActive,
    is_watching: isWatching && !isActive,
    conditions_met: { four_plus_down: fourDown, rsi_below_40: rsiLow },
    reason: isActive
      ? `${ind.consecutive_down} straight down days + RSI ${ind.rsi.toFixed(1)} - CAPITULATION`
      : isWatching
      ? `${ind.consecutive_down} down days, RSI ${ind.rsi.toFixed(1)} - developing`
      : `Down streak: ${ind.consecutive_down}, RSI: ${ind.rsi.toFixed(1)}`,
  };
}

function evaluateVixSpikeReversal(ind: Indicators, prev?: PreviousState): SetupResult {
  const spike = ind.vix_weekly_change_pct >= 30;
  const wasActive = prev?.status === "active";

  if (spike) {
    const resetNote = wasActive ? " (resetting 5d window)" : "";
    return {
      setup_id: "vix-spike-reversal",
      is_active: true,
      is_watching: false,
      conditions_met: { vix_weekly_spike_30: true },
      reason: `VIX weekly change ${ind.vix_weekly_change_pct.toFixed(1)}% >= 30%${resetNote}`,
      active_since_override: ind.date,
      active_day_override: 1,
    };
  }

  if (wasActive) {
    const daysActive = prev?.active_since
      ? countTradingDays(prev.active_since, ind.date)
      : typeof prev?.active_day === "number"
      ? prev.active_day + 1
      : 1;

    if (daysActive > 0 && daysActive <= 5) {
      return {
        setup_id: "vix-spike-reversal",
        is_active: true,
        is_watching: false,
        conditions_met: { vix_weekly_spike_30: false, within_5d_window: true },
        reason: `Active - day ${daysActive}/5 since VIX spike`,
        active_day_override: daysActive,
      };
    }
  }

  return {
    setup_id: "vix-spike-reversal",
    is_active: false,
    is_watching: false,
    conditions_met: { vix_weekly_spike_30: false },
    reason: `VIX weekly change ${ind.vix_weekly_change_pct.toFixed(1)}% < 30%`,
  };
}

function evaluateSmiOverboughtGauge(ind: Indicators, prev?: PreviousState): SetupResult {
  const wasActive = prev?.status === "active";
  const crossedAbove = ind.smi_prev < 75 && ind.smi >= 75;

  if (wasActive) {
    if (ind.smi <= -30) {
      return {
        setup_id: "smi-overbought",
        is_active: false,
        is_watching: false,
        conditions_met: { target_reached: true },
        reason: `Reset complete: SMI fell to ${ind.smi.toFixed(1)} (<=-30)`,
        gauge_entry_value: prev?.gauge_entry_value,
        gauge_current_value: ind.smi,
        gauge_target_value: -30,
      };
    }

    return {
      setup_id: "smi-overbought",
      is_active: true,
      is_watching: false,
      conditions_met: { smi_was_above_75: true },
      reason: `AVOID ACTIVE - SMI at ${ind.smi.toFixed(1)}`,
      gauge_entry_value: prev?.gauge_entry_value,
      gauge_current_value: ind.smi,
      gauge_target_value: -30,
    };
  }

  if (crossedAbove) {
    return {
      setup_id: "smi-overbought",
      is_active: true,
      is_watching: false,
      conditions_met: { smi_crossed_above_75: true },
      reason: `NEW AVOID - SMI crossed above +75 (${ind.smi.toFixed(1)})`,
      gauge_entry_value: ind.smi,
      gauge_current_value: ind.smi,
      gauge_target_value: -30,
    };
  }

  const isWatching = ind.smi > 60;
  return {
    setup_id: "smi-overbought",
    is_active: false,
    is_watching: isWatching,
    conditions_met: { smi_approaching: isWatching },
    reason: isWatching ? `SMI at ${ind.smi.toFixed(1)} - approaching +75 avoid level` : `SMI at ${ind.smi.toFixed(1)}`,
  };
}

function evaluateDualLL(ind: Indicators): SetupResult {
  const dailyLL = ind.bx_daily_state === "LL";
  const weeklyLL = ind.bx_weekly_state === "LL";
  const bothLL = dailyLL && weeklyLL;

  // Transition detection: fire only when the dual-LL condition is NEWLY met
  const dailyJustEnteredLL = dailyLL && ind.bx_daily_state_prev !== "LL";
  const weeklyJustEnteredLL = weeklyLL && ind.bx_weekly_state_prev !== "LL";
  const isTransition = bothLL && (dailyJustEnteredLL || weeklyJustEnteredLL);

  // Watching: one in LL + the other deteriorating (LH), or both LL but no fresh transition
  const isWatching = (dailyLL && !weeklyLL) || (!dailyLL && weeklyLL) ||
    (bothLL && !isTransition);

  return {
    setup_id: "dual-ll",
    is_active: isTransition,
    is_watching: isWatching,
    conditions_met: { daily_ll: dailyLL, weekly_ll: weeklyLL, fresh_transition: isTransition },
    reason: isTransition
      ? `AVOID - Dual LL just triggered (Daily: ${ind.bx_daily_state_prev}→LL, Weekly: ${ind.bx_weekly_state_prev}→${ind.bx_weekly_state})`
      : bothLL
      ? `Ongoing dual LL (no new transition) - Daily: LL, Weekly: LL`
      : isWatching
      ? `Daily: ${ind.bx_daily_state}, Weekly: ${ind.bx_weekly_state} - one in LL`
      : `Daily: ${ind.bx_daily_state}, Weekly: ${ind.bx_weekly_state}`,
  };
}

function evaluateOverextended(ind: Indicators): SetupResult {
  const isActive = ind.sma200_dist > 25;
  const isWatching = ind.sma200_dist > 20 && ind.sma200_dist <= 25;
  return {
    setup_id: "overextended",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { above_25pct_200sma: isActive },
    reason: isActive ? `AVOID - Price ${ind.sma200_dist.toFixed(1)}% above 200 SMA (>25%)` : `200 SMA distance: ${ind.sma200_dist.toFixed(1)}%`,
  };
}

function evaluateMomentumCrack(ind: Indicators): SetupResult {
  const smiWasHigh = ind.smi + ind.smi_change_3d > 50;
  const droppedEnough = ind.smi_change_3d < -10;
  const isActive = smiWasHigh && droppedEnough;
  const isWatching = ind.smi > 50 && ind.smi_change_3d < -5;
  return {
    setup_id: "momentum-crack",
    is_active: isActive,
    is_watching: isWatching && !isActive,
    conditions_met: { smi_was_above_50: smiWasHigh, smi_dropped_10_plus: droppedEnough },
    reason: isActive
      ? `AVOID - SMI was >50, dropped ${ind.smi_change_3d.toFixed(1)} pts in 3d`
      : isWatching
      ? `SMI at ${ind.smi.toFixed(1)}, falling (${ind.smi_change_3d.toFixed(1)} in 3d)`
      : `SMI: ${ind.smi.toFixed(1)}, 3d change: ${ind.smi_change_3d.toFixed(1)}`,
  };
}

function evaluateEmaShieldCaution(ind: Indicators, prev?: PreviousState): SetupResult {
  const wasActive = prev?.status === "active";
  const wasBull = ind.was_full_bull_5d;
  const belowEma3 = ind.days_below_ema9 >= 3;
  const slopeDecline = ind.ema9_slope_5d < -2.0;
  const isActive = wasBull && belowEma3 && slopeDecline;
  // Stay active if was active and hasn't reclaimed EMA9 (cooldown: close > ema9 deactivates)
  const stayActive = wasActive && ind.close < ind.ema9;
  const active = isActive || stayActive;

  const isWatching = !active && (
    (ind.days_below_ema9 >= 2 && ind.ema9_slope_5d < -1.0 && wasBull) ||
    (belowEma3 && ind.ema9_slope_5d < -1.0 && ind.ema9_slope_5d >= -2.0)
  );

  return {
    setup_id: "ema-shield-caution",
    is_active: active,
    is_watching: isWatching,
    conditions_met: { was_full_bull_5d: wasBull, days_below_ema9_3: belowEma3, ema9_slope_below_neg2: slopeDecline },
    reason: active
      ? `CAUTION - ${ind.days_below_ema9}d below D9 EMA, slope ${ind.ema9_slope_5d.toFixed(1)}%`
      : isWatching
      ? `${ind.days_below_ema9}d below D9 EMA, slope ${ind.ema9_slope_5d.toFixed(1)}% - approaching`
      : `Days below D9: ${ind.days_below_ema9}, slope: ${ind.ema9_slope_5d.toFixed(1)}%`,
  };
}

function evaluateClimacticVolumeReversal(ind: Indicators): SetupResult {
  // Climactic Volume Reversal: 200%+ relative volume + RSI < 35
  // Backtest: N=20, 70% win at 20D (+5.6%), 75% win at 60D (+14.9%)
  const volumes = ind.volumes || [];
  const todayVol = ind.volume || 0;

  // Compute 20-day average volume (excluding today)
  const prior20 = volumes.slice(-21, -1).filter(v => Number.isFinite(v) && v > 0);
  const avgVol = prior20.length > 0 ? prior20.reduce((s, v) => s + v, 0) / prior20.length : 0;
  const relativeVolPct = avgVol > 0 ? (todayVol / avgVol) * 100 : 0;

  const climacticVolume = relativeVolPct >= 200;
  const oversoldRsi = ind.rsi < 35;
  const isActive = climacticVolume && oversoldRsi;

  // Watching: volume elevated (150%+) with RSI approaching oversold, or climactic volume without RSI confirm
  const isWatching = !isActive && (
    (relativeVolPct >= 150 && ind.rsi < 40) ||
    (climacticVolume && ind.rsi < 45)
  );

  return {
    setup_id: "climactic-volume-reversal",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: {
      climactic_volume_200pct: climacticVolume,
      rsi_below_35: oversoldRsi,
    },
    reason: isActive
      ? `Climactic volume (${relativeVolPct.toFixed(0)}% rel vol) + RSI ${ind.rsi.toFixed(1)} < 35`
      : isWatching
      ? `Watching: rel vol ${relativeVolPct.toFixed(0)}%, RSI ${ind.rsi.toFixed(1)}`
      : `Rel vol ${relativeVolPct.toFixed(0)}%, RSI ${ind.rsi.toFixed(1)}`,
  };
}

function evaluateEmaShieldBreak(ind: Indicators, prev?: PreviousState, cautionState?: PreviousState): SetupResult {
  const wasActive = prev?.status === "active";
  const wasBull = ind.was_full_bull_5d;
  const belowEma5 = ind.days_below_ema9 >= 5;
  const slopeDecline = ind.ema9_slope_5d < -2.0;
  const isActive = wasBull && belowEma5 && slopeDecline;
  const stayActive = wasActive && ind.close < ind.ema9;
  const active = isActive || stayActive;

  const cautionActive = cautionState?.status === "active";
  const isWatching = !active && (
    cautionActive ||
    (ind.days_below_ema9 >= 4 && slopeDecline && wasBull)
  );

  return {
    setup_id: "ema-shield-break",
    is_active: active,
    is_watching: isWatching,
    conditions_met: { was_full_bull_5d: wasBull, days_below_ema9_5: belowEma5, ema9_slope_below_neg2: slopeDecline },
    reason: active
      ? `AVOID - ${ind.days_below_ema9}d below D9 EMA, slope ${ind.ema9_slope_5d.toFixed(1)}% - SHIELD BREAK`
      : isWatching
      ? cautionActive
        ? `Shield Caution active (${ind.days_below_ema9}d) - watching for escalation to Break`
        : `${ind.days_below_ema9}d below D9 EMA - one day from Shield Break`
      : `Days below D9: ${ind.days_below_ema9}, slope: ${ind.ema9_slope_5d.toFixed(1)}%`,
  };
}

function evaluateBxtWeeklyStreak(ind: Indicators, prev?: PreviousState): SetupResult {
  // BXT Weekly Streak Reversal
  // Signal: Weekly BXT has been making consecutive Lower Lows (negative & falling) for >= 8 weeks,
  // then fires on the FIRST weekly close where BXT rises (first Higher Low after the streak).
  //
  // Backtest (TSLA weekly, min_streak=8, n=9 completed):
  //   1wk: 100% win rate, avg +9.0%, median +7.4%
  //   2wk: 88%, avg +11.3%
  //   4wk: 88%, avg +12.4%
  //   8wk: 75%, avg +13.2%
  //   Worst 1-week outcome ever: +2.3% (no losses at 1 week across all instances)
  //
  // Signal fires ONLY on weekly candle closure (Friday EOD). Do NOT trigger intraweek.

  const streak = ind.bx_weekly_consec_ll ?? 0;
  const MIN_STREAK = 8;

  // Signal fires: streak was >= MIN_STREAK last week AND this week BXT rose (bx_weekly > bx_weekly_prev)
  const streakWasActive = streak >= MIN_STREAK;
  const weeklyBxtRose = ind.bx_weekly > ind.bx_weekly_prev;
  const weeklyBxtNegative = ind.bx_weekly < 0; // still negative but rising = HL pattern

  // Active: streak fired this week (first HL after >=8 week LL streak)
  const justFired = streakWasActive && weeklyBxtRose;

  // Stay active for 4 weeks (20 trading days) after firing — forward return window
  const wasActive = prev?.status === "active";
  const activeDay = prev?.active_day ?? 0;
  const stillActive = wasActive && activeDay < 20;

  const isActive = justFired || stillActive;

  // Watching: streak >= MIN_STREAK but hasn't fired yet (waiting for first HL)
  const isWatching = !isActive && streak >= MIN_STREAK;

  return {
    setup_id: "bxt-weekly-streak",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: {
      streak_ge_8: streak >= MIN_STREAK,
      weekly_bxt_rose: weeklyBxtRose,
      weekly_bxt_negative: weeklyBxtNegative,
    },
    reason: isActive
      ? justFired
        ? `BXT Weekly Streak Reversal FIRED — ${streak}w LL streak ended, first HL (n=9: 100% win at 1wk, avg +9.0%)`
        : `BXT Weekly Streak active — day ${activeDay}/20 (historical edge: 100% at 1wk, avg +9.0%)`
      : isWatching
      ? `Watching — ${streak}w weekly BXT LL streak active. Signal fires on first weekly close where BXT rises.`
      : `No streak — current weekly BXT consecutive LL count: ${streak}`,
    active_since_override: justFired ? ind.date : undefined,
    active_day_override: justFired ? 1 : stillActive ? activeDay + 1 : undefined,
  };
}
