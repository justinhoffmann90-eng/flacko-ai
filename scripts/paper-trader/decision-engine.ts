/**
 * Flacko Paper Trader Bot — Decision Engine
 * Core trading logic based on Flacko AI methodology
 */

import type {
  TSLAQuote,
  HIROData,
  DailyReport,
  Position,
  Portfolio,
  MultiPortfolio,
  TradeSignal,
  OrbData,
  OrbZone,
  Instrument,
} from './types';
import { MODE_CONFIGS, TIER_MULTIPLIERS, TRIM_CAPS, MAX_INVESTED } from './types';

// Risk management constants
const NO_NEW_POSITIONS_AFTER_HOUR = 15; // 3 PM CT
const MAX_POSITIONS_PER_DAY = 2;
const SUPPORT_THRESHOLD_PERCENT = 0.015; // 1.5% from support = "near"
const SUPPORT_THRESHOLD_RED = 0.02; // 2.0% in RED mode (catch capitulation bounces)
const RESISTANCE_THRESHOLD_PERCENT = 0.005; // keep resistance proximity at 0.5%
const TARGET_THRESHOLD_PERCENT = 0.003; // 0.3% from target = consider exit

// Orb zone instrument mapping
const ORB_ZONE_CONFIG: Record<OrbZone, { canBuy: boolean; instrument: Instrument | null; emoji: string }> = {
  FULL_SEND: { canBuy: true, instrument: 'TSLL', emoji: '🟢' },
  NEUTRAL: { canBuy: true, instrument: 'TSLA', emoji: '⚪' },
  CAUTION: { canBuy: true, instrument: 'TSLA', emoji: '🟡' },
  DEFENSIVE: { canBuy: false, instrument: null, emoji: '🔴' },
};

interface DecisionContext {
  quote: TSLAQuote;
  tsllQuote: TSLAQuote;
  hiro: HIROData;
  report: DailyReport | null;
  orb: OrbData;
  portfolio: Portfolio;
  multiPortfolio: MultiPortfolio;
  todayTradesCount: number;
  previousOrbZone?: OrbZone;
}

/**
 * Evaluate Orb zone transitions for forced exits
 * CAUTION → sell TSLL first before TSLA
 * DEFENSIVE → sell ALL TSLL immediately
 */
function evaluateOrbTransition(
  fromZone: OrbZone,
  toZone: OrbZone,
  multiPortfolio: MultiPortfolio,
  tsllQuote: TSLAQuote
): TradeSignal | null {
  const reasoning: string[] = [];
  
  // Transition to DEFENSIVE → exit ALL TSLL immediately
  if (toZone === 'DEFENSIVE' && multiPortfolio.tsll && multiPortfolio.tsll.shares > 0) {
    reasoning.push(`⚠️ ORB ZONE CHANGE: ${fromZone} → 🔴 DEFENSIVE`);
    reasoning.push('selling ALL TSLL immediately (forced liquidation)');
    reasoning.push('defensive conditions — leverage must exit');
    
    return {
      action: 'sell',
      instrument: 'TSLL',
      shares: multiPortfolio.tsll.shares,
      price: tsllQuote.price,
      reasoning,
      confidence: 'high',
    };
  }
  
  // Transition to CAUTION → trim TSLL first (if holding)
  if (toZone === 'CAUTION' && multiPortfolio.tsll && multiPortfolio.tsll.shares > 0) {
    reasoning.push(`⚠️ ORB ZONE CHANGE: ${fromZone} → 🟡 CAUTION`);
    reasoning.push('trimming TSLL first (leveraged exit priority)');
    reasoning.push('elevated risk — reducing leverage');
    
    return {
      action: 'sell',
      instrument: 'TSLL',
      shares: multiPortfolio.tsll.shares,
      price: tsllQuote.price,
      reasoning,
      confidence: 'high',
    };
  }
  
  // FULL_SEND → NEUTRAL: hold existing TSLL, no new TSLL
  // (no forced exit, just note the transition)
  if (fromZone === 'FULL_SEND' && toZone === 'NEUTRAL' && multiPortfolio.tsll && multiPortfolio.tsll.shares > 0) {
    console.log('⚪ Zone transition FULL_SEND → NEUTRAL: holding existing TSLL, no new TSLL entries');
  }
  
  return null;
}

/**
 * Main decision function - evaluates whether to buy, sell, or hold
 * Now includes Orb zone-based instrument selection
 */
export function makeTradeDecision(context: DecisionContext): TradeSignal {
  const { quote, tsllQuote, hiro, report, orb, portfolio, multiPortfolio, todayTradesCount, previousOrbZone } = context;
  
  // Check for Orb zone transitions that require forced exits
  if (previousOrbZone && previousOrbZone !== orb.zone) {
    const transitionSignal = evaluateOrbTransition(previousOrbZone, orb.zone, multiPortfolio, tsllQuote);
    if (transitionSignal) {
      return transitionSignal;
    }
  }
  
  // Check time restriction
  const hour = new Date().getHours();
  const canEnterNewPosition = hour < NO_NEW_POSITIONS_AFTER_HOUR;
  
  // If we have a position, evaluate exit first
  if (portfolio.position || multiPortfolio.tsla || multiPortfolio.tsll) {
    return evaluateExit(context);
  }
  
  // No position - evaluate entry
  if (!canEnterNewPosition) {
    return {
      action: 'hold',
      price: quote.price,
      reasoning: ['after 3pm. no new positions.'],
      confidence: 'high',
    };
  }
  
  if (todayTradesCount >= MAX_POSITIONS_PER_DAY) {
    return {
      action: 'hold',
      price: quote.price,
      reasoning: [`max trades reached (${MAX_POSITIONS_PER_DAY}). sitting out.`],
      confidence: 'high',
    };
  }
  
  return evaluateEntry(context);
}

/**
 * Evaluate whether to enter a long position
 * Now considers Orb zone for instrument selection
 */
function evaluateEntry(context: DecisionContext): TradeSignal {
  const { quote, tsllQuote, hiro, report, orb, portfolio } = context;
  const reasoning: string[] = [];
  
  // Import TradeMode type for mode variable
  type TradeMode = 'GREEN' | 'YELLOW' | 'YELLOW_IMPROVING' | 'ORANGE' | 'RED';
  
  // Check Orb zone
  const zoneConfig = ORB_ZONE_CONFIG[orb.zone];
  const isCautionZone = orb.zone === 'CAUTION';
  const isDefensiveZone = orb.zone === 'DEFENSIVE';
  
  if (isDefensiveZone) {
    return {
      action: 'hold',
      price: quote.price,
      reasoning: [
        `orb zone: ${zoneConfig.emoji} ${orb.zone} — no new buys`,
        `score: ${orb.score.toFixed(3)} — defensive posture`,
      ],
      confidence: 'high',
    };
  }
  
  if (!zoneConfig.canBuy && !isCautionZone) {
    return {
      action: 'hold',
      price: quote.price,
      reasoning: [
        `orb zone: ${zoneConfig.emoji} ${orb.zone} — no new buys`,
        `score: ${orb.score.toFixed(3)} — defensive posture`,
      ],
      confidence: 'high',
    };
  }
  
  // Determine instrument based on Orb zone
  let instrument: Instrument = isCautionZone ? 'TSLA' : zoneConfig.instrument!;
  if (isCautionZone) {
    reasoning.push(`🟡 CAUTION zone — TSLA nibbles only at support (no leverage)`);
  }
  
  // ⚡ OVERRIDE: High-conviction dip buys upgrade NEUTRAL to TSLL
  const OVERRIDE_SETUPS = ['oversold-extreme', 'deep-value', 'capitulation'];
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  const activeOverrides = activeSetups.filter(s => OVERRIDE_SETUPS.includes(s.setup_id));
  let isOverride = false;
  
  if (!isCautionZone && orb.zone === 'NEUTRAL' && activeOverrides.length > 0) {
    instrument = 'TSLL';
    isOverride = true;
    const overrideNames = activeOverrides.map(s => s.setup_id.replace(/-/g, ' ')).join(', ');
    reasoning.push(`⚡ OVERRIDE: ${overrideNames} active — upgrading to TSLL`);
    
    // Note dirty/clean Capitulation for journal
    const hasCap = activeOverrides.some(s => s.setup_id === 'capitulation');
    const hasDualLL = activeSetups.some(s => s.setup_id === 'dual-ll' && s.status === 'active');
    if (hasCap && hasDualLL) {
      reasoning.push(`dirty capitulation (dual LL active) — historically weaker (+6.2% avg 20d) but still positive. sized accordingly.`);
    } else if (hasCap) {
      reasoning.push(`clean capitulation — historically explosive (+59.7% avg 20d). high conviction.`);
    }
  }
  
  const instrumentQuote = instrument === 'TSLL' ? tsllQuote : quote;
  const price = instrumentQuote.price;
  
  // Must have a daily report to trade
  if (!report) {
    return {
      action: 'hold',
      price: quote.price,
      reasoning: ['no daily report. sitting on hands until guidance arrives.'],
      confidence: 'high',
    };
  }
  
  const mode = report.mode;
  const tier = report.tier;
  
  // Check Kill Leverage — below KL allows nibbles at named support only (shares, halved sizing)
  // KL is a leverage/options kill switch, not a complete buy freeze.
  // The alert system still fires "nibble at support" below KL.
  const belowKillLeverage = report.masterEject > 0 && quote.price < report.masterEject;
  if (belowKillLeverage) {
    instrument = 'TSLA'; // Force shares only below KL, never leverage
    const nearSupportKL = checkNearSupport(quote.price, report, 'RED');
    if (!nearSupportKL.isNear) {
      return {
        action: 'hold',
        price: quote.price,
        reasoning: [
          `TSLA ($${quote.price.toFixed(2)}) below kill leverage ($${report.masterEject.toFixed(2)})`,
          'below KL — nibbles allowed at named support only. not near one.',
        ],
        confidence: 'high',
      };
    }
    reasoning.push(`⚠️ below kill leverage ($${report.masterEject.toFixed(2)}) — nibble only at ${nearSupportKL.level}`);
    reasoning.push('shares only, halved sizing. controlled accumulation.');
  }
  
  // RED mode = defensive, but NOT zero buying.
  // System allows nibbles at support levels with 5% cap (2.5% w/ Slow Zone).
  // Only shares (no TSLL) in RED. Skip entry if not near a support level.
  // UNDERWEIGHT RULE: If exposure < 50% of RED max (< 10%) AND in Slow Zone,
  // allow buying at current price even without named support proximity.
  if (mode === 'RED') {
    instrument = 'TSLA'; // No leverage in RED, shares only
    const nearSupport = checkNearSupport(quote.price, report, mode);
    
    // Check if drastically underweight
    const tslaVal = context.multiPortfolio.tsla?.value || 0;
    const tsllVal = context.multiPortfolio.tsll?.value || 0;
    const currentExp = (tslaVal + tsllVal) / context.multiPortfolio.totalValue;
    const maxInvRed = MAX_INVESTED['RED'] || 0.20;
    const isUnderweight = currentExp < (maxInvRed * 0.75); // < 15% when RED max is 20%
    
    // Slow Zone check for underweight accumulation
    const slowZoneLvl = report.daily_21ema ? report.daily_21ema * 0.98 : null;
    const inSlowZone = slowZoneLvl && quote.price < slowZoneLvl;
    
    if (!nearSupport.isNear) {
      // Underweight accumulation: if < 50% of max AND in Slow Zone, buy anyway
      if (isUnderweight && inSlowZone) {
        reasoning.push(`🔴 RED mode — underweight accumulation (${(currentExp * 100).toFixed(1)}% vs ${(maxInvRed * 100).toFixed(0)}% max)`);
        reasoning.push(`in Slow Zone ($${slowZoneLvl!.toFixed(2)}) — accumulating at current price`);
        reasoning.push('shares only, no leverage.');
      } else {
        return {
          action: 'hold',
          price: price,
          reasoning: [
            'mode is RED. defensive posture — nibbles at support only.',
            `not near a support level. ${isUnderweight ? 'underweight but not in Slow Zone — waiting.' : 'sitting tight.'}`,
            `exposure: ${(currentExp * 100).toFixed(1)}% (max: ${(maxInvRed * 100).toFixed(0)}%)`,
          ],
          confidence: 'high',
        };
      }
    } else {
      reasoning.push(`🔴 RED mode — nibble at support: ${nearSupport.level} ($${nearSupport.price.toFixed(2)})`);
      reasoning.push('shares only, no leverage.');
    }
    
    // Catch-up sizing: first entry from 0% gets 2x daily cap
    if (currentExp === 0) {
      reasoning.push('⚡ CATCH-UP: first entry from 0% exposure — 2x daily cap');
    }
  }
  
  // Check HIRO - avoid entry if heavy selling (lower quartile)
  if (hiro.percentile30Day < 25) {
    reasoning.push(`hiro in lower quartile (${hiro.percentile30Day.toFixed(0)}%) — heavy selling`);
  }
  
  // Check if price is near support (good entry) - use TSLA price for levels
  const nearSupport = checkNearSupport(quote.price, report);
  const nearResistance = checkNearResistance(quote.price, report);
  
  if (nearSupport.isNear) {
    reasoning.push(`price near support: ${nearSupport.level} ($${nearSupport.price.toFixed(2)})`);
  }
  
  if (isCautionZone && !nearSupport.isNear) {
    return {
      action: 'hold',
      price: price,
      reasoning: [
        ...reasoning,
        'CAUTION zone buys require support proximity (within 1.0%). not near a support level.',
      ],
      confidence: 'high',
    };
  }
  
  if (nearResistance.isNear) {
    reasoning.push(`price near resistance: ${nearResistance.level} — wait for breakout or pullback`);
    return {
      action: 'hold',
      price: price,
      reasoning,
      confidence: 'medium',
    };
  }
  
  // Check max invested cap before entry
  const maxInvestedCap = MAX_INVESTED[mode] || 0.60;
  const tslaValue = context.multiPortfolio.tsla?.value || 0;
  const tsllValue = context.multiPortfolio.tsll?.value || 0;
  const currentExposure = (tslaValue + tsllValue) / context.multiPortfolio.totalValue;
  
  if (currentExposure >= maxInvestedCap) {
    reasoning.push(`at max invested cap for ${mode} mode (${(maxInvestedCap * 100).toFixed(0)}%)`);
    reasoning.push(`current exposure: ${(currentExposure * 100).toFixed(0)}% — staying defensive`);
    return {
      action: 'hold',
      price: price,
      reasoning,
      confidence: 'high',
    };
  }
  
  // Calculate position size based on mode and tier
  const modeConfig = MODE_CONFIGS[mode] || MODE_CONFIGS.YELLOW;
  const tierMultiplier = TIER_MULTIPLIERS[tier] || 0.5;
  let positionPercent = modeConfig.maxPositionPercent * tierMultiplier;
  
  // TSLL position sizing: 50% of mode allocation (2x leverage = same exposure)
  if (instrument === 'TSLL') {
    positionPercent *= 0.5;
    reasoning.push(`TSLL sizing: 50% of mode allocation (2x leverage)`);
  }
  
  // Slow Zone check — reduce cap if price below D21 EMA × 0.98
  const slowZoneLevel = report.daily_21ema ? report.daily_21ema * 0.98 : null;
  const isSlowZoneActive = slowZoneLevel && quote.price < slowZoneLevel;
  const isSlowZoneExempt = mode === 'GREEN' || mode === 'YELLOW_IMPROVING';
  
  if (isSlowZoneActive && !isSlowZoneExempt) {
    // Slow Zone halves daily buy cap (all modes)
    const slowZoneMultiplier = 0.5;
    positionPercent *= slowZoneMultiplier;
    reasoning.push(`Slow Zone active ($${slowZoneLevel.toFixed(2)}) — cap halved to ${(positionPercent * 100).toFixed(1)}%`);
  }
  
  // Below Kill Leverage: halve position size (controlled nibbles only)
  if (belowKillLeverage) {
    positionPercent *= 0.5;
    reasoning.push(`below KL sizing: halved to ${(positionPercent * 100).toFixed(1)}%`);
  }
  
  // Catch-up sizing: when significantly underweight in RED, deploy faster
  // Goal: reach 50% of max (10%) within 2 trading days from 0%
  if (mode === 'RED') {
    const redMax = MAX_INVESTED['RED'] || 0.20;
    const redTarget = redMax * 0.5; // 10% target
    if (currentExposure < redTarget) {
      // Scale multiplier based on how underweight: 0% → 2x, 5% → 1.5x, approaching 10% → 1x
      const underweightRatio = 1 - (currentExposure / redTarget); // 1.0 at 0%, 0.5 at 5%, 0.0 at 10%
      const catchupMultiplier = 1 + underweightRatio; // 2.0 at 0%, 1.5 at 5%, 1.0 at 10%
      positionPercent *= catchupMultiplier;
      reasoning.push(`catch-up: ${(currentExposure * 100).toFixed(1)}% exposure → ${catchupMultiplier.toFixed(1)}x sizing (target: ${(redTarget * 100).toFixed(0)}% in 2 days)`);
    }
  }
  
  const positionValue = portfolio.cash * positionPercent;
  const shares = Math.floor(positionValue / price);
  
  if (shares < 1) {
    return {
      action: 'hold',
      price: price,
      reasoning: ['position size too small. skipping.'],
      confidence: 'high',
    };
  }
  
  // Determine target and stop
  const targetPrice = determineTarget(price, report);
  const stopPrice = determineStop(price, report);
  
  // Calculate risk/reward (skip r/r gate when below KL — support nibbles are conviction-based)
  const risk = price - stopPrice;
  const reward = targetPrice - price;
  const riskRewardRatio = risk > 0 ? reward / risk : 0;
  
  if (!belowKillLeverage && riskRewardRatio < 1.5) {
    reasoning.push(`r/r ratio ${riskRewardRatio.toFixed(2)} — need 1.5+ for entry`);
    return {
      action: 'hold',
      price: price,
      reasoning,
      confidence: 'medium',
    };
  }
  
  // All systems go - generate BUY signal
  reasoning.push(`${zoneConfig.emoji} orb ${orb.zone} (score: ${orb.score.toFixed(2)}) → ${instrument}`);
  reasoning.push(`${mode} mode, tier ${tier} — ${(positionPercent * 100).toFixed(0)}% position size`);
  reasoning.push(`hiro: ${hiro.character} (${hiro.percentile30Day.toFixed(0)}%)`);
  reasoning.push(`target: $${targetPrice.toFixed(2)} | stop: $${stopPrice.toFixed(2)} (TSLA equiv)`);
  reasoning.push(`r/r: ${riskRewardRatio.toFixed(1)}`);
  
  return {
    action: 'buy',
    instrument,
    shares,
    price,
    reasoning,
    confidence: nearSupport.isNear ? 'high' : 'medium',
    targetPrice,
    stopPrice,
    isOverride,
    overrideSetups: activeOverrides.map(s => s.setup_id),
  };
}

/**
 * Evaluate whether to exit current position
 * Now handles multi-instrument positions (TSLA + TSLL)
 */
function evaluateExit(context: DecisionContext): TradeSignal {
  const { quote, tsllQuote, hiro, report, orb, portfolio, multiPortfolio } = context;
  const reasoning: string[] = [];
  
  // Determine which position to evaluate
  // Priority: TSLL in CAUTION/DEFENSIVE zones, then normal exit logic
  let instrument: Instrument;
  let shares: number;
  let avgCost: number;
  let currentPrice: number;
  
  // In CAUTION/DEFENSIVE, prioritize TSLL exits
  if ((orb.zone === 'CAUTION' || orb.zone === 'DEFENSIVE') && multiPortfolio.tsll && multiPortfolio.tsll.shares > 0) {
    instrument = 'TSLL';
    shares = multiPortfolio.tsll.shares;
    avgCost = multiPortfolio.tsll.avgCost;
    currentPrice = tsllQuote.price;
    reasoning.push(`🟡 ${orb.zone} zone — exiting TSLL first (leveraged exit priority)`);
  } else if (multiPortfolio.tsll && multiPortfolio.tsll.shares > 0) {
    // Have TSLL position in non-defensive zone
    instrument = 'TSLL';
    shares = multiPortfolio.tsll.shares;
    avgCost = multiPortfolio.tsll.avgCost;
    currentPrice = tsllQuote.price;
  } else if (multiPortfolio.tsla && multiPortfolio.tsla.shares > 0) {
    // Have TSLA position
    instrument = 'TSLA';
    shares = multiPortfolio.tsla.shares;
    avgCost = multiPortfolio.tsla.avgCost;
    currentPrice = quote.price;
  } else if (portfolio.position) {
    // Fallback to legacy single-instrument portfolio
    instrument = 'TSLA';
    shares = portfolio.position.shares;
    avgCost = portfolio.position.avgCost;
    currentPrice = quote.price;
  } else {
    // No position
    return {
      action: 'hold',
      price: quote.price,
      reasoning: ['no position to exit'],
      confidence: 'high',
    };
  }
  
  const unrealizedPnl = (currentPrice - avgCost) * shares;
  const unrealizedPnlPercent = (currentPrice / avgCost - 1) * 100;
  
  // Check for trim opportunities (partial profit-taking at resistance levels)
  if (report && unrealizedPnlPercent > 0) {
    const trimLevels = report.levels.filter(l => l.type === 'trim' && l.price > 0);
    const crossedTrims = trimLevels.filter(t => quote.price >= t.price && avgCost < t.price);
    
    if (crossedTrims.length > 0) {
      // Take first uncrossed trim (assume sequential trimming)
      const trimLevel = crossedTrims[0];
      const trimCapPercent = TRIM_CAPS[report.mode] || 0.20;
      const trimShares = Math.floor(shares * trimCapPercent);
      
      if (trimShares > 0) {
        reasoning.push(`trim level hit: ${trimLevel.name} ($${trimLevel.price.toFixed(2)})`);
        reasoning.push(`trimming ${trimShares} shares (${(trimCapPercent * 100).toFixed(0)}% of remaining) — ${report.mode} mode`);
        reasoning.push(`locking in profit on ${(trimCapPercent * 100).toFixed(0)}% while letting rest ride`);
        
        return {
          action: 'sell',
          instrument,
          shares: trimShares,
          price: currentPrice,
          reasoning,
          confidence: 'high',
        };
      }
    }
  }
  
  // Check target hit — only at TRIM levels from the report, not gamma strike
  // Gamma strike is a structural level, not necessarily a sell target
  const trimLevels = report ? report.levels.filter(l => l.type === 'trim' && l.price > 0) : [];
  const targetHit = false; // Trim logic handled separately above in the trim section
  
  // Kill Leverage check: requires 2 CONSECUTIVE DAILY CLOSES below the level
  // During intraday, we do NOT sell just because price dipped below KL
  // The actual KL trigger is handled at market close (see tradingLoop close logic)
  const stopHit = false; // Disabled intraday — KL is a close-based trigger only
  
  // Check if mode flipped to RED (exit signal)
  const modeFlip = report && report.mode === 'RED';
  
  // Check HIRO extreme negative (momentum shift)
  const hiroNegative = hiro.percentile30Day < 15;
  
  if (targetHit && report) {
    reasoning.push(`target hit: gamma strike ($${report.gammaStrike.toFixed(2)})`);
    reasoning.push(`unrealized: +$${unrealizedPnl.toFixed(2)} (+${unrealizedPnlPercent.toFixed(1)}%)`);
    return {
      action: 'sell',
      instrument,
      shares,
      price: currentPrice,
      reasoning,
      confidence: 'high',
    };
  }
  
  if (stopHit && report) {
    reasoning.push(`stop hit: below master eject ($${report.masterEject.toFixed(2)})`);
    reasoning.push(`loss: $${unrealizedPnl.toFixed(2)} — kept it small.`);
    return {
      action: 'sell',
      instrument,
      shares,
      price: currentPrice,
      reasoning,
      confidence: 'high',
    };
  }
  
  if (modeFlip) {
    // RED mode = defensive, NOT liquidate. Cut leverage (TSLL), HOLD shares (TSLA).
    // Shares are only trimmed at overhead resistance levels per the trim schedule.
    if (instrument === 'TSLL') {
      reasoning.push('mode flipped to RED — cutting ALL leverage (TSLL)');
      reasoning.push('defensive mode: leverage exits, shares hold');
      return {
        action: 'sell',
        instrument: 'TSLL',
        shares,
        price: currentPrice,
        reasoning,
        confidence: 'high',
      };
    }
    // For TSLA shares: do NOT sell. Hold and trim at resistance levels only.
    reasoning.push('mode flipped to RED — defensive posture');
    reasoning.push('holding shares. will trim at overhead EMAs per trim schedule (30% per level).');
    reasoning.push('RED mode = reduced cap (5%), not liquidation.');
    return {
      action: 'hold',
      price: currentPrice,
      reasoning,
      confidence: 'high',
    };
  }
  
  if (hiroNegative) {
    // Extreme negative HIRO — log it but DON'T auto-trim.
    // Today (Mar 4) proved HIRO can be -1.6B while TSLA rallies +3.44%.
    // HIRO divergences are informational, not automatic sell triggers.
    // Trimming is handled by trim levels (T1-T4) and mode changes only.
    reasoning.push(`hiro extreme negative (${hiro.percentile30Day.toFixed(0)}%) — monitoring, not auto-trimming`);
    reasoning.push('HIRO divergence noted — exits driven by levels and mode, not flow alone');
  }
  
  // Time-based exit REMOVED — Taylor is a SWING TRADER (3-6-9 month positions).
  // Holding overnight is expected behavior, not a risk to avoid.
  // Exits are driven by: trim levels, mode changes, Kill Leverage, NOT time of day.
  
  // Hold position
  reasoning.push(`${instrument} position looking good`);
  reasoning.push(`unrealized: ${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)} (${unrealizedPnlPercent >= 0 ? '+' : ''}${unrealizedPnlPercent.toFixed(1)}%)`);
  
  if (report) {
    const distanceToTarget = ((report.gammaStrike - quote.price) / quote.price * 100);
    reasoning.push(`${distanceToTarget.toFixed(1)}% to gamma strike target (TSLA)`);
  }
  
  return {
    action: 'hold',
    price: currentPrice,
    reasoning,
    confidence: 'high',
  };
}

/**
 * Check if price is near a support level
 */
function checkNearSupport(
  price: number,
  report: DailyReport,
  mode?: string
): { isNear: boolean; level: string; price: number } {
  // Use wider threshold in RED mode to catch capitulation bounces
  const threshold_pct = (mode === 'RED') ? SUPPORT_THRESHOLD_RED : SUPPORT_THRESHOLD_PERCENT;
  const isValidLevel = (value: number | null | undefined): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value > 0;

  // SpotGamma walls (support levels only — gamma strike excluded, it's in the report levels)
  const wallSupports: { name: string; price: number }[] = [
    { name: 'put wall', price: report.putWall },
    { name: 'hedge wall', price: report.hedgeWall },
  ].filter(s => isValidLevel(s.price));

  // Report levels (support + nibble levels)
  const reportSupports = (report.levels || [])
    .filter(l => {
      const name = (l.name || '').toLowerCase();
      const levelType = String(l.type || '').toLowerCase();
      const isNibble = levelType === 'nibble' || name.includes('nibble');
      return isValidLevel(l.price) && (l.type === 'support' || isNibble);
    })
    .map(l => ({ name: l.name, price: l.price }));

  const allSupports = [...wallSupports, ...reportSupports]
    .map(s => ({ ...s, distance: Math.abs(price - s.price) }))
    .sort((a, b) => a.distance - b.distance);
  
  for (const support of allSupports) {
    const threshold = support.price * threshold_pct;
    if (support.distance <= threshold) {
      return { isNear: true, level: support.name, price: support.price };
    }
  }
  
  return { isNear: false, level: '', price: 0 };
}

/**
 * Check if price is near resistance
 */
function checkNearResistance(
  price: number,
  report: DailyReport
): { isNear: boolean; level: string; price: number } {
  const hardcodedResistances = [
    { name: 'call wall', price: report.callWall },
  ].filter(r => r.price > 0 && r.price > price);

  // Include trim levels (T1-T4) from report as resistance
  const trimResistances = (report.levels || [])
    .filter(l => l.type === 'trim' && l.price > 0 && l.price > price)
    .map(l => ({ name: l.name, price: l.price }));

  const allResistances = [...hardcodedResistances, ...trimResistances]
    .sort((a, b) => a.price - b.price);
  
  for (const resistance of allResistances) {
    const threshold = resistance.price * RESISTANCE_THRESHOLD_PERCENT;
    if (resistance.price - price <= threshold) {
      return { isNear: true, level: resistance.name, price: resistance.price };
    }
  }
  
  return { isNear: false, level: '', price: 0 };
}

/**
 * Determine target price for trade
 */
function determineTarget(currentPrice: number, report: DailyReport): number {
  // Use nearest resistance level above price from report
  const levels = report.levels || [];
  const resistanceLevels = levels
    .filter(l => l.price > currentPrice && (l.type === 'trim' || l.type === 'target'))
    .sort((a, b) => a.price - b.price);
  
  // First resistance above current price
  if (resistanceLevels.length > 0) {
    return resistanceLevels[0].price;
  }
  
  // Fallback to gamma strike or call wall
  if (report.gammaStrike > currentPrice) return report.gammaStrike;
  if (report.callWall > currentPrice) return report.callWall;
  
  return currentPrice * 1.02;
}

/**
 * Determine stop loss price
 */
function determineStop(currentPrice: number, report: DailyReport): number {
  // Primary stop is kill leverage
  if (report.masterEject > 0 && report.masterEject < currentPrice) {
    return report.masterEject;
  }
  // Fallback: put wall or 1.5% below
  if (report.putWall > 0 && report.putWall < currentPrice) {
    return report.putWall;
  }
  return currentPrice * 0.985;
}

/**
 * Calculate position size based on mode and available cash
 */
export function calculatePositionSize(
  cash: number,
  price: number,
  mode: string,
  tier: number
): { shares: number; value: number; percent: number } {
  const modeConfig = MODE_CONFIGS[mode] || MODE_CONFIGS.YELLOW;
  const tierMultiplier = TIER_MULTIPLIERS[tier] || 0.5;
  const positionPercent = modeConfig.maxPositionPercent * tierMultiplier;
  const positionValue = cash * positionPercent;
  const shares = Math.floor(positionValue / price);
  
  return {
    shares,
    value: shares * price,
    percent: positionPercent,
  };
}

/**
 * Generate "Flacko's Take" - 1-2 sentence market read
 */
export function generateFlackoTake(
  quote: TSLAQuote,
  report: DailyReport | null,
  hiro: HIROData,
  position: Position | null
): string {
  const takes: string[] = [];
  
  // Price action take
  if (quote.changePercent > 2) {
    takes.push('strong move higher. momentum building.');
  } else if (quote.changePercent < -2) {
    takes.push('selling pressure. defending support levels.');
  } else if (Math.abs(quote.changePercent) < 0.5) {
    takes.push('chop zone. waiting for direction.');
  } else {
    takes.push(quote.changePercent > 0 ? 'grinding higher.' : 'drifting lower.');
  }
  
  // HIRO take
  if (hiro.percentile30Day > 75) {
    takes.push('dealers buying aggressively.');
  } else if (hiro.percentile30Day < 25) {
    takes.push('flow negative. dealers selling.');
  }
  
  // Level context
  if (report) {
    const nearGamma = Math.abs(quote.price - report.gammaStrike) / report.gammaStrike < 0.01;
    if (nearGamma) {
      takes.push(`gamma strike ($${report.gammaStrike.toFixed(0)}) in play.`);
    }
  }
  
  // Position context
  if (position) {
    const pnl = (quote.price - position.avgCost) / position.avgCost * 100;
    if (pnl > 1) {
      takes.push(`sitting on +${pnl.toFixed(1)}%. letting it ride.`);
    } else if (pnl < -0.5) {
      takes.push(`underwater ${pnl.toFixed(1)}%. watching stop.`);
    }
  }
  
  return takes.join(' ') || 'scanning for setups.';
}
