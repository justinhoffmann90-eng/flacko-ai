export interface Indicators {
  date: string;
  close: number;
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
  ema9: number;
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
}

export interface PreviousState {
  setup_id: string;
  status: "active" | "watching" | "inactive";
  gauge_entry_value?: number;
  entry_price?: number;
  active_since?: string;
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
  const inZone = ind.sma200_dist > -30 && ind.sma200_dist < -20;
  const bxHL = ind.bx_daily_state === "HL";
  const notGenerational = !oversoldExtremeActive;
  const isActive = inZone && bxHL && notGenerational;
  const isWatching = (inZone && ind.bx_daily_state === "LL") || (ind.sma200_dist > -35 && ind.sma200_dist < -20 && bxHL);
  return {
    setup_id: "deep-value",
    is_active: isActive,
    is_watching: isWatching && !isActive,
    conditions_met: { sma200_neg30_to_neg20: inZone, bx_hl: bxHL, not_generational: notGenerational },
    reason: isActive
      ? `200 SMA at ${ind.sma200_dist.toFixed(1)}% + BX HL - DEEP VALUE`
      : `200 SMA at ${ind.sma200_dist.toFixed(1)}%, BX: ${ind.bx_daily_state}`,
  };
}

function evaluateGreenShoots(ind: Indicators): SetupResult {
  const transition = ind.bx_daily_state === "HL" && ind.bx_daily_state_prev === "LL";
  const oversoldConfirm = ind.rsi < 35 || (ind.smi_bull_cross && ind.smi < -40);
  const isActive = transition && oversoldConfirm;
  const isWatching = ind.bx_daily_state === "LL" && (ind.rsi < 40 || ind.smi < -30);
  return {
    setup_id: "green-shoots",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { ll_to_hl: transition, rsi_below_35: ind.rsi < 35, smi_bull_cross_below_neg40: ind.smi_bull_cross && ind.smi < -40 },
    reason: isActive
      ? `BX flipped LL->HL + oversold confirm (RSI ${ind.rsi.toFixed(1)}, SMI ${ind.smi.toFixed(1)}) - GREEN SHOOTS`
      : isWatching
      ? `BX in LL, RSI ${ind.rsi.toFixed(1)}, SMI ${ind.smi.toFixed(1)} - watching for flip`
      : `BX: ${ind.bx_daily_state}, RSI: ${ind.rsi.toFixed(1)}`,
  };
}

function evaluateMomentumFlip(ind: Indicators): SetupResult {
  const transition = ind.bx_daily_state === "HH" && ind.bx_daily_state_prev === "HL";
  const rsiRoom = ind.rsi < 55; // optional quality filter (not required by source)
  const isActive = transition;
  const isWatching = ind.bx_daily_state === "HL";
  return {
    setup_id: "momentum-flip",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { hl_to_hh: transition, rsi_below_55_bonus: rsiRoom },
    reason: isActive
      ? `BX flipped HL->HH${rsiRoom ? ` + RSI ${ind.rsi.toFixed(1)} (room to run)` : ` (RSI ${ind.rsi.toFixed(1)})`}`
      : isWatching
      ? `BX in HL - one flip from trigger (RSI ${ind.rsi.toFixed(1)})`
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
  const isActive = dailyLL && weeklyLL;
  const isWatching = dailyLL || weeklyLL;
  return {
    setup_id: "dual-ll",
    is_active: isActive,
    is_watching: isWatching && !isActive,
    conditions_met: { daily_ll: dailyLL, weekly_ll: weeklyLL },
    reason: isActive
      ? "AVOID - Both Daily and Weekly BX in LL (dual downtrend)"
      : isWatching
      ? `Daily: ${ind.bx_daily_state}, Weekly: ${ind.bx_weekly_state} - one in LL`
      : `Daily: ${ind.bx_daily_state}, Weekly: ${ind.bx_weekly_state}`,
  };
}

function evaluateOverextended(ind: Indicators): SetupResult {
  const bxLH = ind.bx_daily_state === "LH";
  const rsiOverbought = ind.rsi > 70;
  const sma200Extended = ind.sma200_dist > 25;
  const condCount = [bxLH, rsiOverbought, sma200Extended].filter(Boolean).length;
  const isActive = condCount >= 2;
  const isWatching = condCount === 1 && (sma200Extended || rsiOverbought);
  return {
    setup_id: "overextended",
    is_active: isActive,
    is_watching: isWatching,
    conditions_met: { bx_lh: bxLH, rsi_above_70: rsiOverbought, above_25pct_200sma: sma200Extended },
    reason: isActive
      ? `AVOID - Extended & Fading (${condCount}/3: ${bxLH ? "BX LH" : ""}${rsiOverbought ? " RSI>70" : ""}${sma200Extended ? " >25% SMA200" : ""})`
      : `${condCount}/3 extended conditions (BX: ${ind.bx_daily_state}, RSI: ${ind.rsi.toFixed(1)}, SMA200: ${ind.sma200_dist.toFixed(1)}%)`,
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
