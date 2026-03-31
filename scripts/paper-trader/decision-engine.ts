/**
 * Flacko Paper Trader Bot — Decision Engine
 * v3 rewrite: the report is the brain, Taylor is the hands.
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
  Instrument,
  TrimRegime,
  V3State,
  AlertInstruction,
  ActiveStop,
  TradeMode,
} from './types';
import {
  MODE_CONFIGS,
  TRIM_CAPS,
  MAX_INVESTED,
  DAILY_TRIM_CAPS,
  CORE_HOLD_FLOOR_PCT,
} from './types';

const NO_NEW_POSITIONS_AFTER_HOUR = 15;
const MAX_POSITIONS_PER_DAY = 2;
const SUPPORT_THRESHOLD_PERCENT = 0.015;

interface DecisionContext {
  quote: TSLAQuote;
  tsllQuote: TSLAQuote;
  hiro: HIROData; // kept for reasoning/logging, not entry gating
  report: DailyReport | null;
  orb: OrbData; // kept for compatibility; ignored for decisioning in v3
  portfolio: Portfolio;
  multiPortfolio: MultiPortfolio;
  todayTradesCount: number;
  previousOrbZone?: string;
  v3State: V3State;
}

export function parseAlertAction(actionText: string): AlertInstruction {
  const raw = (actionText || '').trim();
  if (!raw || raw === '--') return { type: 'unknown' };

  const normalized = raw.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();

  if (lower.includes('master eject') || lower.includes('all leverage cut') || lower.includes('eject confirmed')) {
    return { type: 'eject' };
  }

  const percentMatch = normalized.match(/(trim|reduce)\s*(\d+(?:\.\d+)?)\s*%/i);
  if (percentMatch) {
    const pct = Number(percentMatch[2]) / 100;
    if (percentMatch[1].toLowerCase() === 'reduce') return { type: 'reduce', trimPercent: pct };
    return { type: 'trim', trimPercent: pct };
  }

  if (lower.includes('cap reduces') || lower.includes('hold') || lower.includes('no action')) {
    return { type: 'hold' };
  }

  if (lower.includes('buy')) {
    const stopMatch = normalized.match(/stop\s*\$?\s*(\d+(?:\.\d+)?)/i);
    return {
      type: 'buy',
      useDailyCap: /daily cap/i.test(normalized),
      stopPrice: stopMatch ? Number(stopMatch[1]) : undefined,
    };
  }

  return { type: 'unknown' };
}

function detectTrimRegime(report: DailyReport, price: number): TrimRegime {
  const d9 = report.daily_9ema;
  const d21 = report.daily_21ema;
  const w9 = report.weekly_9ema;
  const w13 = report.weekly_13ema;
  const w21 = report.weekly_21ema;
  if ([d9, d21, w9, w13, w21].some(v => v == null || v <= 0)) return 'A';
  const aboveAll = price > d9! && price > d21! && price > w9! && price > w13! && price > w21!;
  const belowSomeWeekly = price < w9! || price < w13! || price < w21!;
  if (aboveAll) return 'B';
  if (belowSomeWeekly || price < d9! || price < d21!) return 'A';
  return 'MIXED';
}

function shouldSkipTrimForRegime(levelName: string, regime: TrimRegime): boolean {
  if (regime !== 'B') return false;
  const lower = levelName.toLowerCase();
  return lower.includes('ema') || lower.includes('d9') || lower.includes('d21') || lower.includes('w9') || lower.includes('w13') || lower.includes('w21');
}

function levelKey(level: { name: string; price: number }): string {
  return `${level.name}:${level.price}`;
}

function getMode(report: DailyReport | null, v3State: V3State): TradeMode {
  if (!report) return 'YELLOW';
  if (v3State.consecutive_below_w21 >= 2) return 'EJECTED';
  return report.mode;
}

function getExposureFraction(multiPortfolio: MultiPortfolio): number {
  const total = multiPortfolio.totalValue || 1;
  return ((multiPortfolio.tsla?.value || 0) + (multiPortfolio.tsll?.value || 0)) / total;
}

function getTslaExposureFraction(multiPortfolio: MultiPortfolio): number {
  const total = multiPortfolio.totalValue || 1;
  return (multiPortfolio.tsla?.value || 0) / total;
}

function getSlowZoneMultiplier(mode: TradeMode): number {
  if (mode === 'GREEN' || mode === 'YELLOW_IMPROVING') return 1;
  if (mode === 'ORANGE' || mode === 'RED') return 0.25;
  return 0.5;
}

/**
 * Instrument selection — v3 system logic:
 * 1. Below Kill Leverage → TSLA only (always)
 * 2. RED/ORANGE/YELLOW/EJECTED → TSLA only
 * 3. Orb DEFENSIVE → TSLA only (and exit TSLL handled in KL/EJECTED handler)
 * 4. Orb CAUTION → TSLA only
 * 5. Orb NEUTRAL + override setup (Deep Value/Capitulation/Oversold Extreme) → TSLL
 * 6. Orb FULL_SEND + GREEN/YI → TSLL
 * 7. Orb NEUTRAL + GREEN/YI (no override) → TSLA
 * 8. 200 SMA Oversold Override Tier 2/3 → TSLL (handled separately)
 */
function activeInstrumentForMode(mode: TradeMode, report: DailyReport, price: number, orb?: OrbData): Instrument {
  // Kill Leverage overrides everything
  const belowKillLeverage = !!report.weekly_21ema && price < report.weekly_21ema;
  if (belowKillLeverage) return 'TSLA';

  // Mode constraint: only GREEN and YI allow leverage
  const leverageAllowed = mode === 'GREEN' || mode === 'YELLOW_IMPROVING';
  if (!leverageAllowed) return 'TSLA';

  // Orb zone constraint
  if (orb) {
    if (orb.zone === 'DEFENSIVE' || orb.zone === 'CAUTION') return 'TSLA';
    if (orb.zone === 'FULL_SEND') return 'TSLL';
    if (orb.zone === 'NEUTRAL') {
      // Check for override setups: Deep Value, Capitulation, Oversold Extreme
      const overrideSetups = ['deep-value', 'capitulation', 'oversold-extreme', 'deep_value', 'oversold_extreme'];
      const hasOverride = orb.activeSetups.some(s =>
        s.status === 'active' && overrideSetups.some(o => s.setup_id.toLowerCase().includes(o))
      );
      return hasOverride ? 'TSLL' : 'TSLA';
    }
  }

  // Fallback: leverage allowed by mode but no Orb data → TSLA (conservative)
  return 'TSLA';
}

function isNear(price: number, level: number, threshold = SUPPORT_THRESHOLD_PERCENT): boolean {
  return Math.abs(price - level) <= level * threshold;
}

function computeCoreFloorTrimShares(shares: number, currentPrice: number, requestedTrimShares: number, v3State: V3State): number {
  let trimShares = requestedTrimShares;
  if (trimShares <= 0) return 0;
  if (v3State.peakPositionValue <= 0) return trimShares;
  const floorValue = v3State.peakPositionValue * CORE_HOLD_FLOOR_PCT;
  const maxSellableValue = Math.max(0, shares * currentPrice - floorValue);
  const maxSellableShares = Math.floor(maxSellableValue / currentPrice);
  return Math.max(0, Math.min(trimShares, maxSellableShares));
}

function remainingDailyTrim(mode: TradeMode, v3State: V3State): number {
  const dailyCap = DAILY_TRIM_CAPS[mode] ?? 0;
  return Math.max(0, dailyCap - v3State.dailyTrimPercent);
}

function ensureV3State(v3State: V3State): void {
  v3State.activeStops ??= [];
  v3State.firedLevelsToday ??= [];
}

function trimModePercent(mode: TradeMode): number {
  if (mode === 'EJECTED') return 0.30;
  return TRIM_CAPS[mode] ?? 0.20;
}

/**
 * Orb DEFENSIVE zone: exit ALL TSLL immediately.
 * DEFENSIVE = sell signals dominating, no leverage should be held.
 */
function handleOrbDefensive(context: DecisionContext): TradeSignal | null {
  const { orb, multiPortfolio, tsllQuote } = context;
  if (orb.zone !== 'DEFENSIVE') return null;
  if (!multiPortfolio.tsll || multiPortfolio.tsll.shares <= 0) return null;

  return {
    action: 'sell',
    instrument: 'TSLL',
    shares: multiPortfolio.tsll.shares,
    price: tsllQuote.price,
    reasoning: ['orb DEFENSIVE — exiting ALL TSLL (sell signals dominating)'],
    confidence: 'high',
  };
}

function handleStops(context: DecisionContext): TradeSignal | null {
  const { quote, multiPortfolio, v3State } = context;
  ensureV3State(v3State);
  if (!v3State.activeStops.length) return null;

  for (const stop of [...v3State.activeStops]) {
    if (quote.price > stop.stopPrice) continue;
    const heldShares = multiPortfolio.tsla?.shares || 0;
    const sharesToSell = Math.min(stop.sharesAtRisk, heldShares);
    if (sharesToSell <= 0) continue;

    stop.sharesAtRisk -= sharesToSell;
    v3State.activeStops = v3State.activeStops.filter(s => s.id !== stop.id || s.sharesAtRisk > 0);

    return {
      action: 'sell',
      instrument: 'TSLA',
      shares: sharesToSell,
      price: quote.price,
      reasoning: [`stop hit at $${stop.stopPrice.toFixed(2)}`, `selling ${sharesToSell} TSLA from ${stop.sourceLevel}`],
      confidence: 'high',
    };
  }

  return null;
}

function handleTrimLevels(context: DecisionContext, mode: TradeMode): TradeSignal | null {
  const { quote, report, multiPortfolio, v3State } = context;
  if (!report || !multiPortfolio.tsla) return null;
  ensureV3State(v3State);

  const regime = detectTrimRegime(report, quote.price);
  const remainingTrim = remainingDailyTrim(mode, v3State);
  if (remainingTrim <= 0) return null;

  const trims = report.levels
    .filter(level => level.type === 'trim' && level.price > 0 && quote.price >= level.price)
    .sort((a, b) => a.price - b.price);

  for (const level of trims) {
    const key = levelKey(level);
    if (v3State.firedLevelsToday!.includes(key)) continue;
    if (shouldSkipTrimForRegime(level.name, regime)) continue;

    const instruction = parseAlertAction(level.action || '');
    let trimPct = instruction.trimPercent ?? trimModePercent(mode);
    trimPct = Math.min(trimPct, remainingTrim);
    let shares = Math.floor(multiPortfolio.tsla.shares * trimPct);
    shares = computeCoreFloorTrimShares(multiPortfolio.tsla.shares, quote.price, shares, v3State);
    if (shares <= 0) continue;

    v3State.firedLevelsToday!.push(key);
    v3State.dailyTrimPercent += shares / multiPortfolio.tsla.shares;
    return {
      action: 'sell',
      instrument: 'TSLA',
      shares,
      price: quote.price,
      reasoning: [`trim level hit: ${level.name} ($${level.price.toFixed(2)})`, `regime ${regime}`, `trim ${(trimPct * 100).toFixed(1)}% of remaining`],
      confidence: 'high',
    };
  }

  return null;
}

function handleKillLeverageAndEjected(context: DecisionContext, mode: TradeMode): TradeSignal | null {
  const { quote, report, multiPortfolio, v3State } = context;
  if (!report) return null;

  if (multiPortfolio.tsll && report.weekly_21ema && quote.price < report.weekly_21ema) {
    return {
      action: 'sell',
      instrument: 'TSLL',
      shares: multiPortfolio.tsll.shares,
      price: context.tsllQuote.price,
      reasoning: [`below W21 EMA ($${report.weekly_21ema.toFixed(2)})`, 'kill leverage: sell all TSLL'],
      confidence: 'high',
    };
  }

  const totalExposure = getExposureFraction(multiPortfolio);
  const tslaExposure = getTslaExposureFraction(multiPortfolio);
  const trimToFiftyNeeded = (report.putWall > 0 && quote.price < report.putWall && totalExposure > 0.50) || (mode === 'EJECTED' && tslaExposure > 0.50);
  if (!trimToFiftyNeeded || !multiPortfolio.tsla) return null;

  const targetValue = multiPortfolio.totalValue * 0.50;
  const currentValue = multiPortfolio.tsla.value;
  let shares = Math.floor(Math.max(0, currentValue - targetValue) / quote.price);
  shares = computeCoreFloorTrimShares(multiPortfolio.tsla.shares, quote.price, shares, v3State);
  if (shares <= 0) return null;

  return {
    action: 'sell',
    instrument: 'TSLA',
    shares,
    price: quote.price,
    reasoning: [
      report.putWall > 0 && quote.price < report.putWall ? `below Put Wall ($${report.putWall.toFixed(2)}) — trim to 50%` : 'EJECTED mode — hold 50% core',
    ],
    confidence: 'high',
  };
}

function handleBuyLevels(context: DecisionContext, mode: TradeMode): TradeSignal | null {
  const { quote, report, orb, multiPortfolio, portfolio, todayTradesCount, v3State } = context;
  if (!report) return null;
  ensureV3State(v3State);

  // Orb DEFENSIVE = no new buys + exit TSLL (TSLL exit handled in KL handler)
  // Orb CAUTION = no new buys at all (wait for better conditions)
  if (orb.zone === 'DEFENSIVE') {
    return null; // TSLL exit handled in handleOrbDefensive; no buys in DEFENSIVE
  }
  if (orb.zone === 'CAUTION') {
    return null; // CAUTION = sit on hands, no new positions
  }

  const hour = new Date().getHours();
  if (hour >= NO_NEW_POSITIONS_AFTER_HOUR) {
    return { action: 'hold', price: quote.price, reasoning: ['after 3pm. no new positions.'], confidence: 'high' };
  }
  if (todayTradesCount >= MAX_POSITIONS_PER_DAY) {
    return { action: 'hold', price: quote.price, reasoning: [`max trades reached (${MAX_POSITIONS_PER_DAY})`], confidence: 'high' };
  }

  const exposure = getExposureFraction(multiPortfolio);
  const maxInvested = MAX_INVESTED[mode] ?? 0.60;
  if (exposure >= maxInvested) {
    return { action: 'hold', price: quote.price, reasoning: [`max invested gate: ${(exposure * 100).toFixed(1)}% >= ${(maxInvested * 100).toFixed(1)}%`], confidence: 'high' };
  }

  const oversoldOverride = !!report.sma_200 && quote.price <= report.sma_200;
  if (mode === 'EJECTED' && !oversoldOverride) {
    return { action: 'hold', price: quote.price, reasoning: ['EJECTED mode active — buys blocked except 200 SMA override'], confidence: 'high' };
  }

  const candidates = report.levels
    .filter(level => (level.type === 'nibble' || level.type === 'support') && level.price > 0 && isNear(quote.price, level.price))
    .sort((a, b) => a.price - b.price);

  for (const level of candidates) {
    const key = levelKey(level);
    if (v3State.firedLevelsToday!.includes(key)) continue;

    const instruction = parseAlertAction(level.action || '');
    if (instruction.type !== 'buy') continue;

    let cap = MODE_CONFIGS[mode]?.maxPositionPercent ?? 0;
    const slowZone = report.daily_21ema ? report.daily_21ema * 0.98 : null;
    if (slowZone && quote.price < slowZone) {
      cap *= getSlowZoneMultiplier(mode);
    }
    const remainingCap = Math.max(0, maxInvested - exposure);
    const remainingDailyCap = Math.max(0, (MODE_CONFIGS[mode]?.maxPositionPercent ?? 0) - exposure);
    cap = Math.min(cap, remainingCap, remainingDailyCap);
    if (cap <= 0) continue;

    const instrument = activeInstrumentForMode(mode, report, quote.price, orb);
    const tradePrice = instrument === 'TSLL' ? context.tsllQuote.price : quote.price;
    const shares = Math.floor((portfolio.cash * cap) / tradePrice);
    if (shares <= 0) continue;

    v3State.firedLevelsToday!.push(key);
    return {
      action: 'buy',
      instrument,
      shares,
      price: tradePrice,
      reasoning: [
        `buy level hit: ${level.name} ($${level.price.toFixed(2)})`,
        `orb ${orb.zone}${instrument === 'TSLL' ? ' → TSLL' : ' → TSLA'}`,
        `using ${(cap * 100).toFixed(2)}% cap`,
        instruction.stopPrice ? `stop $${instruction.stopPrice}` : 'no stop',
      ],
      confidence: 'high',
      stopPrice: instruction.stopPrice,
    };
  }

  return null;
}

function handleExtensionTrim(context: DecisionContext, mode: TradeMode): TradeSignal | null {
  const { quote, report, multiPortfolio, v3State } = context;
  if (!report?.weekly_9ema || !multiPortfolio.tsla) return null;

  const extensionPct = ((quote.price - report.weekly_9ema) / report.weekly_9ema) * 100;
  if (extensionPct < 12) return null;

  let trimRate = trimModePercent(mode);
  let label = 'extended';
  if (extensionPct >= 25) {
    trimRate *= 1.5;
    label = 'extreme';
  } else if (extensionPct >= 18) {
    label = 'stretched';
  }

  trimRate = Math.min(trimRate, remainingDailyTrim(mode, v3State));
  if (trimRate <= 0) return null;

  let shares = Math.floor(multiPortfolio.tsla.shares * trimRate);
  shares = computeCoreFloorTrimShares(multiPortfolio.tsla.shares, quote.price, shares, v3State);
  if (shares <= 0) return null;

  v3State.dailyTrimPercent += shares / multiPortfolio.tsla.shares;
  return {
    action: 'sell',
    instrument: 'TSLA',
    shares,
    price: quote.price,
    reasoning: [`EMA extension ${label}: ${extensionPct.toFixed(1)}% above W9`, `trim rate ${(trimRate * 100).toFixed(1)}%`],
    confidence: 'high',
  };
}

export function makeTradeDecision(context: DecisionContext): TradeSignal {
  const mode = getMode(context.report, context.v3State);
  ensureV3State(context.v3State);

  return (
    handleStops(context) ||
    handleOrbDefensive(context) ||
    handleTrimLevels(context, mode) ||
    handleKillLeverageAndEjected(context, mode) ||
    handleBuyLevels(context, mode) ||
    handleExtensionTrim(context, mode) ||
    { action: 'hold', price: context.quote.price, reasoning: ['no action'], confidence: 'high' }
  );
}

export function calculatePositionSize(cash: number, price: number, mode: string): { shares: number; value: number; percent: number } {
  const percent = MODE_CONFIGS[mode]?.maxPositionPercent ?? MODE_CONFIGS.YELLOW.maxPositionPercent;
  const shares = Math.floor((cash * percent) / price);
  return { shares, value: shares * price, percent };
}

export function generateFlackoTake(quote: TSLAQuote, report: DailyReport | null, hiro: HIROData, position: Position | null): string {
  const bits: string[] = [];
  bits.push(quote.changePercent >= 0 ? 'tape green.' : 'tape red.');
  if (report) bits.push(`${report.mode.toLowerCase()} mode.`);
  bits.push(`hiro ${hiro.character}.`);
  if (position) bits.push(`holding ${position.shares} shares.`);
  return bits.join(' ');
}
