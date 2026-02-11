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
import { MODE_CONFIGS, TIER_MULTIPLIERS } from './types';

// Risk management constants
const NO_NEW_POSITIONS_AFTER_HOUR = 15; // 3 PM CT
const MAX_POSITIONS_PER_DAY = 2;
const SUPPORT_THRESHOLD_PERCENT = 0.005; // 0.5% from support = "near"
const TARGET_THRESHOLD_PERCENT = 0.003; // 0.3% from target = consider exit

// Orb zone instrument mapping
const ORB_ZONE_CONFIG: Record<OrbZone, { canBuy: boolean; instrument: Instrument | null; emoji: string }> = {
  FULL_SEND: { canBuy: true, instrument: 'TSLL', emoji: '🟢' },
  NEUTRAL: { canBuy: true, instrument: 'TSLA', emoji: '⚪' },
  CAUTION: { canBuy: false, instrument: null, emoji: '🟡' },
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
  
  // Check Orb zone — CAUTION/DEFENSIVE = no new buys
  const zoneConfig = ORB_ZONE_CONFIG[orb.zone];
  if (!zoneConfig.canBuy) {
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
  let instrument = zoneConfig.instrument!;
  
  // ⚡ OVERRIDE: High-conviction dip buys upgrade NEUTRAL to TSLL
  const OVERRIDE_SETUPS = ['oversold-extreme', 'deep-value', 'capitulation'];
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  const activeOverrides = activeSetups.filter(s => OVERRIDE_SETUPS.includes(s.setup_id));
  let isOverride = false;
  
  if (orb.zone === 'NEUTRAL' && activeOverrides.length > 0) {
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
  
  // Check Master Eject - NEVER buy below it (use TSLA price, not TSLL)
  if (report.masterEject > 0 && quote.price < report.masterEject) {
    return {
      action: 'hold',
      price: quote.price,
      reasoning: [
        `TSLA ($${quote.price.toFixed(2)}) below master eject ($${report.masterEject.toFixed(2)})`,
        'no longs below eject. capital preservation mode.',
      ],
      confidence: 'high',
    };
  }
  
  // Check mode - RED mode = no new positions
  if (mode === 'RED') {
    return {
      action: 'hold',
      price: price,
      reasoning: [
        'mode is RED. defensive posture.',
        'no new longs in red conditions.',
      ],
      confidence: 'high',
    };
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
  
  if (nearResistance.isNear) {
    reasoning.push(`price near resistance: ${nearResistance.level} — wait for breakout or pullback`);
    return {
      action: 'hold',
      price: price,
      reasoning,
      confidence: 'medium',
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
  
  // Calculate risk/reward
  const risk = price - stopPrice;
  const reward = targetPrice - price;
  const riskRewardRatio = reward / risk;
  
  if (riskRewardRatio < 1.5) {
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
  
  // Check target hit (use TSLA price for levels regardless of instrument)
  const targetHit = report && quote.price >= report.gammaStrike * (1 - TARGET_THRESHOLD_PERCENT);
  
  // Check stop loss (below Master Eject or support break) - use TSLA price
  const stopHit = report && quote.price < report.masterEject;
  
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
    reasoning.push('mode flipped to RED — exiting all positions');
    reasoning.push(`securing ${unrealizedPnl >= 0 ? 'gains' : 'capital'} into defensive conditions`);
    return {
      action: 'sell',
      instrument,
      shares,
      price: currentPrice,
      reasoning,
      confidence: 'high',
    };
  }
  
  if (hiroNegative) {
    reasoning.push(`hiro extreme negative (${hiro.percentile30Day.toFixed(0)}%) — momentum shift`);
    reasoning.push('trimming exposure');
    return {
      action: 'sell',
      instrument,
      shares,
      price: currentPrice,
      reasoning,
      confidence: 'medium',
    };
  }
  
  // Time-based exit (near close with small profit)
  const hour = new Date().getHours();
  const nearClose = hour >= 14; // 2 PM CT
  if (nearClose && unrealizedPnl > 0) {
    reasoning.push('approaching close — taking profit into overnight risk');
    return {
      action: 'sell',
      instrument,
      shares,
      price: currentPrice,
      reasoning,
      confidence: 'medium',
    };
  }
  
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
  report: DailyReport
): { isNear: boolean; level: string; price: number } {
  const supports = [
    { name: 'put wall', price: report.putWall },
    { name: 'hedge wall', price: report.hedgeWall },
    { name: 'gamma strike', price: report.gammaStrike },
  ].filter(s => s.price > 0);
  
  for (const support of supports) {
    const threshold = support.price * SUPPORT_THRESHOLD_PERCENT;
    if (Math.abs(price - support.price) <= threshold || 
        (price >= support.price && price <= support.price + threshold)) {
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
  const resistances = [
    { name: 'call wall', price: report.callWall },
    { name: 'gamma strike', price: report.gammaStrike },
  ].filter(r => r.price > 0 && r.price > price);
  
  for (const resistance of resistances) {
    const threshold = resistance.price * SUPPORT_THRESHOLD_PERCENT;
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
  // Primary stop is master eject
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
