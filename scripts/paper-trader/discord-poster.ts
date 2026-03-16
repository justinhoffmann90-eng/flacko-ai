/**
 * Flacko Paper Trader Bot — Discord Poster
 * Formats and posts messages to Discord in Lord Pretty Flacko voice
 */

import { WebhookClient, EmbedBuilder } from 'discord.js';
import type {
  TSLAQuote,
  HIROData,
  Position,
  Portfolio,
  MultiPortfolio,
  Trade,
  DailyReport,
  OrbData,
  OrbZone,
  Instrument,
  WeeklyPerformanceData,
} from './types';
import { getMarketStatus } from './data-feed';

// Webhook URL — can be set via env or defaults to #axe-capital
const DISCORD_WEBHOOK_URL = process.env.PAPER_TRADER_WEBHOOK_URL 
  || 'https://discord.com/api/webhooks/1471201795404595414/ENwqrjgFHWk387SQ7jYqv6sHCFNTAicwkztTzd367xkDNowmWOHPJXn82e4-vpaKpHph';

/** HIRO channel ID for cross-referencing instead of raw API data */
const HIRO_CHANNEL_ID = '1465366178099630292';

let webhookClient: WebhookClient | null = null;

// Name and avatar controlled from Discord webhook settings — no code changes needed

/** Helper: send via Taylor's webhook */
async function sendAsTaylor(options: { content?: string; embeds?: any[] }): Promise<void> {
  if (!webhookClient) return;
  await webhookClient.send(options);
}

/**
 * Initialize Discord webhook client
 */
export function initDiscord(): boolean {
  try {
    webhookClient = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
    return true;
  } catch (error) {
    console.error('Failed to initialize Discord webhook:', error);
    return false;
  }
}

/**
 * Format dollar amount with commas (e.g., 1234567.89 → "1,234,567.89")
 */
function fmtDollar(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Format number with sign and commas
 */
function withSign(num: number): string {
  const formatted = fmtDollar(Math.abs(num), 2);
  return num >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

function withSignPercent(num: number): string {
  return num >= 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
}

/**
 * Build consistent portfolio footer for all trading posts
 */
function portfolioFooter(portfolio: Portfolio | MultiPortfolio): string {
  const isMulti = 'tsla' in portfolio;
  const totalVal = portfolio.totalValue;
  let lines: string[] = [''];
  
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla && multi.tsla.shares > 0) {
      const pct = ((multi.tsla.shares * multi.tsla.currentPrice) / totalVal * 100).toFixed(0);
      const costDiff = ((multi.tsla.currentPrice - multi.tsla.avgCost) / multi.tsla.avgCost * 100);
      lines.push(`TSLA: ${multi.tsla.shares.toLocaleString()} shares (${pct}% of port) | avg: $${fmtDollar(multi.tsla.avgCost, 2)} → $${fmtDollar(multi.tsla.currentPrice, 2)} (${withSignPercent(costDiff)})`);
    } else {
      lines.push(`TSLA: 0 shares`);
    }
    if (multi.tsll && multi.tsll.shares > 0) {
      const pct = ((multi.tsll.shares * multi.tsll.currentPrice) / totalVal * 100).toFixed(0);
      const costDiff = ((multi.tsll.currentPrice - multi.tsll.avgCost) / multi.tsll.avgCost * 100);
      lines.push(`TSLL: ${multi.tsll.shares.toLocaleString()} shares (${pct}% of port) | avg: $${fmtDollar(multi.tsll.avgCost, 2)} → $${fmtDollar(multi.tsll.currentPrice, 2)} (${withSignPercent(costDiff)})`);
    }
    const cashPct = ((multi.cash / totalVal) * 100).toFixed(0);
    lines.push(`cash: $${fmtDollar(multi.cash)} (${cashPct}%)`);
    if (multi.unrealizedPnl !== 0) {
      lines.push(`unrealized: ${withSign(multi.unrealizedPnl)}`);
    }
  } else {
    const single = portfolio as Portfolio;
    if (single.position && single.position.shares > 0) {
      const posVal = single.position.currentValue;
      const pct = ((posVal / totalVal) * 100).toFixed(0);
      const costDiff = ((single.position.entryPrice - single.position.avgCost) / single.position.avgCost * 100);
      lines.push(`TSLA: ${single.position.shares.toLocaleString()} shares (${pct}% of port) | avg: $${fmtDollar(single.position.avgCost, 2)} → $${fmtDollar(single.position.entryPrice, 2)} (${withSignPercent(costDiff)})`);
      lines.push(`unrealized: ${withSign(single.position.unrealizedPnl)}`);
    } else {
      lines.push(`TSLA: 0 shares`);
    }
    const cashPct = ((single.cash / totalVal) * 100).toFixed(0);
    lines.push(`cash: $${fmtDollar(single.cash)} (${cashPct}%)`);
  }
  
  lines.push(`portfolio: $${fmtDollar(totalVal)} (${withSignPercent(portfolio.totalReturnPercent)})`);
  
  return lines.join('\n');
}

/**
 * Get mode emoji
 */
function modeEmoji(mode: string): string {
  const map: Record<string, string> = {
    GREEN: '🟢',
    YELLOW: '🟡',
    ORANGE: '🟠',
    RED: '🔴',
  };
  return map[mode.toUpperCase()] || '⚪';
}

/**
 * Get Orb zone emoji
 */
function orbZoneEmoji(zone: OrbZone): string {
  const map: Record<OrbZone, string> = {
    FULL_SEND: '🟢',
    NEUTRAL: '⚪',
    CAUTION: '🟡',
    DEFENSIVE: '🔴',
  };
  return map[zone];
}

/**
 * Post regular status update (every 15 min) - multi-instrument
 */
export async function postStatusUpdate(
  quote: TSLAQuote,
  tsllQuote: TSLAQuote,
  portfolio: Portfolio | MultiPortfolio,
  report: DailyReport | null,
  hiro: HIROData,
  orb: OrbData,
  flackoTake: string
): Promise<void> {
  if (!webhookClient) return;
  
  const marketStatus = getMarketStatus();
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  let content = `**⚔️ TAYLOR — STATUS UPDATE — ${timeStr} CT**\n\n`;
  content += `TSLA $${fmtDollar(quote.price, 2)} (${withSignPercent(quote.changePercent)})\n`;
  
  // Per-position breakdown: current price vs avg cost
  const isMulti = 'tsla' in portfolio;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla && multi.tsla.shares > 0) {
      const costDiff = ((multi.tsla.currentPrice - multi.tsla.avgCost) / multi.tsla.avgCost * 100);
      content += `  TSLA ${multi.tsla.shares.toLocaleString()} sh | avg $${fmtDollar(multi.tsla.avgCost, 2)} → $${fmtDollar(multi.tsla.currentPrice, 2)} (${withSignPercent(costDiff)}) | unreal: ${withSign(multi.tsla.unrealizedPnl)}\n`;
    }
    if (multi.tsll && multi.tsll.shares > 0) {
      const costDiff = ((multi.tsll.currentPrice - multi.tsll.avgCost) / multi.tsll.avgCost * 100);
      content += `  TSLL ${multi.tsll.shares.toLocaleString()} sh | avg $${fmtDollar(multi.tsll.avgCost, 2)} → $${fmtDollar(multi.tsll.currentPrice, 2)} (${withSignPercent(costDiff)}) | unreal: ${withSign(multi.tsll.unrealizedPnl)}\n`;
    }
    if (multi.unrealizedPnl !== 0) {
      content += `total unrealized: ${withSign(multi.unrealizedPnl)}\n`;
    }
  } else {
    const single = portfolio as Portfolio;
    if (single.position && single.position.shares > 0) {
      const costDiff = single.position.unrealizedPnlPercent;
      content += `  TSLA ${single.position.shares.toLocaleString()} sh | avg $${fmtDollar(single.position.avgCost, 2)} → $${fmtDollar(single.position.entryPrice, 2)} (${withSignPercent(costDiff)}) | unreal: ${withSign(single.position.unrealizedPnl)}\n`;
    }
  }

  // Day's mark-to-market change
  const portfolioVal = portfolio.totalValue || 100000;
  const startingCap = portfolio.startingCapital || 100000;
  const dayChange = portfolio.totalValue - startingCap;
  if (dayChange !== 0) {
    content += `day mtm: ${withSign(dayChange)} (${withSignPercent(dayChange / startingCap * 100)})\n`;
  }

  content += `\n${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})\n`;
  content += `take: ${flackoTake}\n`;
  
  // Key levels context
  if (report) {
    content += `\nlevels:`;
    content += ` γ:${report.gammaStrike.toFixed(0)}`;
    content += ` | kl:${report.masterEject.toFixed(0)}`;
  }
  
  content += `\n\n${modeEmoji(report?.mode || 'YELLOW')} ${marketStatus.message}`;
  content += portfolioFooter(portfolio);
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting status update:', error);
  }
}

/**
 * Post HIRO update (every 1 hour) — references #hiro channel for data
 */
export async function postHIROUpdate(
  hiro: HIROData,
  position: Position | null
): Promise<void> {
  // Taylor doesn't post separate HIRO updates — she references #hiro in her trades.
  // This function is kept for the conviction logic used internally.
  // No Discord post.
  return;
}

/**
 * Post trade entry alert (multi-instrument)
 */
export async function postEntryAlert(
  trade: Trade,
  report: DailyReport | null,
  portfolio: Portfolio | MultiPortfolio,
  orb: OrbData,
  hiro?: HIROData
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  const reasoningArray = Array.isArray(trade.reasoning) ? trade.reasoning : [trade.reasoning];
  
  // Extract structured data from reasoning
  const fullReasoning = reasoningArray.join('\n');
  
  // Parse target/stop/rr — handle both separate lines and combined "target: $X | stop: $Y"
  const targetMatch = fullReasoning.match(/target:\s*\$([\d.]+)/);
  const stopMatch = fullReasoning.match(/stop:\s*\$([\d.]+)/);
  const rrMatch = fullReasoning.match(/r\/r:\s*([\d.]+)/);
  
  // Generate Taylor's commentary
  const commentary = generateEntryCommentary(trade, report, orb, reasoningArray);
  
  const overrideTag = trade.isOverride ? ` ⚡ OVERRIDE` : '';
  let content = `**⚔️ TAYLOR — 🟢 BUY${overrideTag} — ${timeStr} CT**\n\n`;
  
  // Trade details — clean, no duplication
  content += `🟢 BOUGHT ${trade.shares.toLocaleString()} shares ${trade.instrument} @ $${fmtDollar(trade.price, 2)}\n`;
  
  // Override explanation
  if (trade.isOverride && trade.overrideSetups?.length) {
    const setupNames = trade.overrideSetups.map(s => s.replace(/-/g, ' ')).join(', ');
    content += `⚡ override: ${setupNames} active — TSLL deployed in NEUTRAL zone\n`;
  }
  const isMulti = 'tsla' in portfolio;
  const totalPortfolio = isMulti ? (portfolio as MultiPortfolio).totalValue : (portfolio as Portfolio).totalValue;
  const cashBefore = (isMulti ? (portfolio as MultiPortfolio).cash : (portfolio as Portfolio).cash) + trade.totalValue;
  const pctUsed = ((trade.totalValue / cashBefore) * 100).toFixed(1);
  const cashAfter = cashBefore - trade.totalValue;
  const pctCashLeft = ((cashAfter / totalPortfolio) * 100).toFixed(0);
  
  content += `size: $${fmtDollar(trade.totalValue)} (${pctUsed}% of cash)`;
  if (report) {
    content += ` | ${report.mode} mode, tier ${report.tier}`;
  }
  content += `\n`;
  
  // Risk parameters on one line
  if (targetMatch && stopMatch) {
    content += `target: $${targetMatch[1]} | stop: $${stopMatch[1]}`;
    if (rrMatch) content += ` | r/r: ${rrMatch[1]}`;
    content += `\n`;
  }
  
  // Orb context
  content += `\n${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})`;
  if (orb.zone === 'FULL_SEND' && trade.instrument === 'TSLL') {
    content += ` — 2x cleared`;
  } else if (orb.zone === 'NEUTRAL') {
    content += ` — shares only`;
  }
  content += `\n`;
  
  // HIRO — Taylor's reading of the flow
  if (hiro) {
    const readingM = hiro.reading / 1000000;
    const readingStr = readingM >= 0 ? `+$${readingM.toFixed(0)}M` : `-$${Math.abs(readingM).toFixed(0)}M`;
    content += `flow: HIRO ${readingStr} (${hiro.percentile30Day.toFixed(0)}th pctl) — ${describeHiro(hiro)}\n`;
  }
  
  // Taylor's commentary — the WHY
  content += `\n**why this trade:**\n${commentary}\n`;
  content += portfolioFooter(portfolio);
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting entry alert:', error);
  }
}

/**
 * Describe HIRO reading in plain English
 */
function describeHiro(hiro: HIROData): string {
  const readingM = hiro.reading / 1000000;
  const isPositive = readingM >= 0;
  const pctl = hiro.percentile30Day;
  
  // Description must match the SIGN of the reading, not just percentile
  if (isPositive && pctl >= 70) return 'strong institutional buying. flow supports longs.';
  if (isPositive && pctl >= 40) return 'moderate buying. flow is constructive.';
  if (isPositive) return 'mild buying. not enough to lean on.';
  
  // Negative reading
  if (pctl <= 20) return 'heavy selling. institutional flow is aggressively negative.';
  if (pctl <= 40) return 'selling pressure. dealers hedging.';
  if (pctl <= 60) return 'mild selling, but within normal range. not alarming yet.';
  // Negative but high percentile = less negative than usual
  return 'negative but improving. selling pressure is fading.';
}

/**
 * Generate Taylor's commentary explaining WHY she's taking the trade
 */
function generateEntryCommentary(
  trade: Trade,
  report: DailyReport | null,
  orb: OrbData,
  reasoning: string[]
): string {
  const lines: string[] = [];
  
  // Instrument selection reasoning
  if (trade.instrument === 'TSLL') {
    lines.push(`Orb is in FULL_SEND — multiple buy signals converging. Taking the 2x leveraged position.`);
  } else if (orb.zone === 'NEUTRAL') {
    lines.push(`Orb is neutral — conditions are fine but not screaming. Going with shares, no leverage.`);
  } else if (orb.zone === 'CAUTION') {
    lines.push(`Orb is cautious but I see a setup here. Small size, tight stop.`);
  }
  
  // Mode context
  if (report) {
    if (report.mode === 'GREEN') {
      lines.push(`Green mode — full conviction. Market conditions favor longs.`);
    } else if (report.mode === 'YELLOW') {
      lines.push(`Yellow mode — conditions are decent but keeping size measured.`);
    } else if (report.mode === 'ORANGE') {
      lines.push(`Orange mode — elevated caution. Smaller position, tighter risk management.`);
    } else if (report.mode === 'RED') {
      lines.push(`Red mode — this is a nibble only. Defensive conditions but price is at a key level.`);
    }
  }
  
  // Level context
  const nearSupport = reasoning.find(r => r.includes('near support'));
  const nearResistance = reasoning.find(r => r.includes('near resistance'));
  if (nearSupport) {
    lines.push(`Price is sitting near a support level — that's my entry zone.`);
  }
  if (nearResistance) {
    lines.push(`Resistance nearby — watching for a clean break before adding.`);
  }
  
  // Active setup context
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  if (activeSetups.length > 0) {
    const names = activeSetups.map(s => s.setup_id.replace(/-/g, ' ')).join(', ');
    lines.push(`Active Orb setups: ${names}. These have historically led to positive forward returns.`);
  }
  
  // Kill Leverage context
  if (report && Math.abs(trade.price - report.masterEject) < 5) {
    lines.push(`Close to kill leverage ($${report.masterEject.toFixed(2)}) — tight leash. If this breaks, I'm cutting leverage immediately.`);
  }
  
  return lines.join(' ');
}

/**
 * Post trade exit alert (multi-instrument)
 */
export async function postExitAlert(
  trade: Trade,
  portfolio: Portfolio | MultiPortfolio,
  todayPnl: number,
  orb?: OrbData
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  const isWin = (trade.realizedPnl || 0) > 0;
  const returnPct = trade.realizedPnl && trade.totalValue ? (trade.realizedPnl / trade.totalValue) * 100 : 0;
  
  let content = `**⚔️ TAYLOR — 🔴 SELL — ${timeStr} CT**\n\n`;
  content += `🔴 SOLD ${trade.shares.toLocaleString()} shares ${trade.instrument} @ $${fmtDollar(trade.price, 2)}\n`;
  content += `result: ${withSign(trade.realizedPnl || 0)} (${withSignPercent(returnPct)})\n`;
  
  // Taylor's exit commentary
  const reasoningArray = Array.isArray(trade.reasoning) ? trade.reasoning : [trade.reasoning];
  content += `\n**why I exited:**\n`;
  content += generateExitCommentary(trade, reasoningArray, orb);
  content += portfolioFooter(portfolio);
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting exit alert:', error);
  }
}

/**
 * Generate Taylor's exit commentary
 */
function generateExitCommentary(trade: Trade, reasoning: string[], orb?: OrbData): string {
  // Check for common exit triggers
  const hasTarget = reasoning.some(r => r.includes('target hit'));
  const hasStop = reasoning.some(r => r.includes('stop hit') || r.includes('eject'));
  const hasModeFlip = reasoning.some(r => r.includes('mode flipped'));
  const hasHiro = reasoning.some(r => r.includes('hiro extreme'));
  const hasClose = reasoning.some(r => r.includes('close'));
  const hasZoneChange = reasoning.some(r => r.includes('ZONE CHANGE') || r.includes('CAUTION') || r.includes('DEFENSIVE'));
  
  if (hasTarget) {
    return `Hit the target. The system said take profit here, so I took it. No ego, no "maybe it goes higher." Discipline is the edge.`;
  }
  if (hasStop) {
    return `Stop triggered. Price broke below kill leverage. Small loss, capital preserved. That's the system working — you don't fight the kill leverage level.`;
  }
  if (hasModeFlip) {
    return `Mode flipped to RED. When the system says get defensive, you get defensive. Doesn't matter what I think the stock "should" do.`;
  }
  if (hasHiro) {
    return `Flow turned aggressively negative. HIRO shifted hard — institutional selling pressure building. Trimming before it gets worse.`;
  }
  if (hasZoneChange) {
    return `Orb zone shifted — risk conditions changed. When the signal environment deteriorates, leveraged positions exit first. That's the rule.`;
  }
  if (hasClose) {
    return `Approaching market close. Taking profit off the table rather than holding overnight risk. Can always re-enter tomorrow.`;
  }
  
  return reasoning.map(r => r.replace(/^[•\s]+/, '')).join('. ');
}

/**
 * Post zone change alert
 */
export async function postZoneChangeAlert(
  fromZone: OrbZone,
  toZone: OrbZone,
  orb: OrbData,
  action?: { instrument: Instrument; shares: number; price: number; pnl?: number }
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  let content = `**⚔️ TAYLOR — ORB ZONE CHANGE — ${timeStr} CT**\n\n`;
  content += `${orbZoneEmoji(fromZone)} ${fromZone} → ${orbZoneEmoji(toZone)} ${toZone}\n`;
  content += `score: ${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(3)}\n\n`;
  
  // Zone-specific commentary
  if (toZone === 'DEFENSIVE') {
    content += `🔴 DEFENSIVE conditions — multiple avoid signals active.\n`;
    content += `exiting leveraged positions immediately. protecting capital.\n`;
  } else if (toZone === 'CAUTION') {
    content += `🟡 CAUTION — avoid signals building.\n`;
    content += `trimming TSLL first (leveraged exits priority).\n`;
  } else if (toZone === 'FULL_SEND') {
    content += `🟢 FULL SEND — multiple buy signals converging.\n`;
    content += `cleared to deploy TSLL (2x leverage).\n`;
  } else if (toZone === 'NEUTRAL' && fromZone === 'FULL_SEND') {
    content += `⚪ NEUTRAL — holding existing TSLL, no new TSLL entries.\n`;
    content += `forward returns still positive. no panic selling.\n`;
  }
  
  // If action was taken
  if (action) {
    content += `\n**action taken:**\n`;
    content += `sold ${action.shares} shares ${action.instrument} @ $${action.price.toFixed(2)}\n`;
    if (action.pnl !== undefined) {
      content += `p&l: ${withSign(action.pnl)}\n`;
    }
  }
  
  content += `\nactive setups (${orb.activeSetups.length}):`;
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  const watchingSetups = orb.activeSetups.filter(s => s.status === 'watching');
  
  if (activeSetups.length > 0) {
    content += `\n🟢 active: ${activeSetups.map(s => s.setup_id).join(', ')}`;
  }
  if (watchingSetups.length > 0) {
    content += `\n👀 watching: ${watchingSetups.map(s => s.setup_id).join(', ')}`;
  }
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting zone change alert:', error);
  }
}

/**
 * Post market open message (multi-instrument)
 */
/**
 * Get Discord embed color hex for mode
 */
function modeColor(mode: string): number {
  const map: Record<string, number> = {
    GREEN: 0x00c853,   // bright green
    YELLOW: 0xffd600,  // bright yellow
    ORANGE: 0xff9100,  // bright orange
    RED: 0xff1744,     // bright red
  };
  return map[mode.toUpperCase()] || 0x9e9e9e; // grey fallback
}

export async function postMarketOpen(
  quote: TSLAQuote,
  tsllQuote: TSLAQuote,
  report: DailyReport | null,
  orb: OrbData,
  hiro?: HIROData
): Promise<void> {
  if (!webhookClient) return;
  
  const mode = report?.mode || 'YELLOW';
  
  // Build description
  let desc = `TSLA **$${fmtDollar(quote.price, 2)}** (${withSignPercent(quote.changePercent)})\n`;
  
  if (report) {
    desc += `${modeEmoji(mode)} **${mode}** mode (tier ${report.tier}) | kill leverage: $${report.masterEject.toFixed(2)}\n`;
  }
  
  desc += `${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})`;
  
  // Active setups
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  if (activeSetups.length > 0) {
    desc += `\nactive: ${activeSetups.map(s => s.setup_id.replace(/-/g, ' ')).join(', ')}`;
  }
  
  // HIRO flow
  if (hiro) {
    const readingM = hiro.reading / 1000000;
    const readingStr = readingM >= 0 ? `+$${readingM.toFixed(0)}M` : `-$${Math.abs(readingM).toFixed(0)}M`;
    desc += `\nflow: HIRO ${readingStr} (${hiro.percentile30Day.toFixed(0)}th pctl) — ${describeHiro(hiro)}`;
  }
  
  // Today's gameplan
  let plan = '';
  
  if (report) {
    const ejectDist = ((quote.price - report.masterEject) / quote.price) * 100;
    const modeCaps: Record<string, number> = { GREEN: 25, YELLOW: 15, ORANGE: 10, RED: 5 };
    const maxCap = modeCaps[mode] || 15;
    
    // Instrument
    const OVERRIDE_SETUPS = ['oversold-extreme', 'deep-value', 'capitulation'];
    const activeOverrides = activeSetups.filter(s => OVERRIDE_SETUPS.includes(s.setup_id));
    let instrument = 'TSLA';
    if (orb.zone === 'FULL_SEND') instrument = 'TSLL';
    else if (orb.zone === 'NEUTRAL' && activeOverrides.length > 0) instrument = 'TSLL';
    
    // BUY plan
    if (orb.zone === 'CAUTION' || orb.zone === 'DEFENSIVE') {
      plan += `**buys:** none. ${orb.zone} zone — sitting in cash.\n`;
    } else {
      // Support levels above kill leverage (full conviction buys)
      const supportsAboveKL = (report.levels || []).filter(l => (l.type === 'support' || l.type === 'nibble') && l.price < quote.price && l.price > report.masterEject).sort((a, b) => b.price - a.price);
      // Support levels below kill leverage (nibble-only with halved sizing)
      const supportsBelowKL = (report.levels || []).filter(l => (l.type === 'support' || l.type === 'nibble') && l.price < quote.price && l.price <= report.masterEject).sort((a, b) => b.price - a.price);
      
      if (supportsAboveKL.length > 0) {
        const buyLevel = supportsAboveKL[0];
        const distPct = ((quote.price - buyLevel.price) / quote.price * 100).toFixed(1);
        plan += `**buys:** ${instrument} at ${buyLevel.name} ($${buyLevel.price.toFixed(0)}, ${distPct}% below) — ${maxCap}% of cash per ${mode} mode cap\n`;
        if (supportsAboveKL.length > 1) {
          const buyLevel2 = supportsAboveKL[1];
          plan += `next buy: ${buyLevel2.name} ($${buyLevel2.price.toFixed(0)}) — ${buyLevel2.action || 'add to position'}\n`;
        }
      } else if (supportsBelowKL.length > 0) {
        // All support is below kill leverage — show nibble levels with risk context
        const buyLevel = supportsBelowKL[0];
        const distPct = ((quote.price - buyLevel.price) / quote.price * 100).toFixed(1);
        const halfCap = Math.round(maxCap / 2);
        plan += `**buys:** TSLA only at ${buyLevel.name} ($${buyLevel.price.toFixed(0)}, ${distPct}% below) — ⚠️ below kill leverage, nibble ${halfCap}% max, no leverage\n`;
        if (supportsBelowKL.length > 1) {
          const buyLevel2 = supportsBelowKL[1];
          plan += `next nibble: ${buyLevel2.name} ($${buyLevel2.price.toFixed(0)}) — shares only, confirmation required\n`;
        }
      } else {
        plan += `**buys:** no support levels in range. need a pullback to get involved.\n`;
      }
      
      if (activeOverrides.length > 0) {
        const names = activeOverrides.map(s => s.setup_id.replace(/-/g, ' ')).join(', ');
        plan += `⚡ override active (${names}) — using TSLL instead of shares\n`;
      }
    }
    
    // SELL plan
    const trims = (report.levels || []).filter(l => l.type === 'trim' && l.price > quote.price).sort((a, b) => a.price - b.price);
    if (trims.length > 0) {
      const trimLevel = trims[0];
      const distPct = ((trimLevel.price - quote.price) / quote.price * 100).toFixed(1);
      plan += `**sells:** trim 25% at ${trimLevel.name} ($${trimLevel.price.toFixed(0)}, ${distPct}% above)\n`;
    } else {
      plan += `**sells:** no trim targets above. holding for now.\n`;
    }
    
    // EJECT plan
    plan += `**kill leverage:** $${report.masterEject.toFixed(2)}`;
    if (ejectDist < 1) {
      plan += ` ⚠️ ${ejectDist.toFixed(1)}% away — sell all leverage, trim to 50%`;
    } else {
      plan += ` (${ejectDist.toFixed(1)}% away) — sell all leverage, trim to 50%`;
    }
    plan += `\n`;
    
    // HIRO context
    if (hiro) {
      const readingM = hiro.reading / 1000000;
      if (readingM < -200) {
        plan += `flow is negative — sizing conservatively until HIRO improves.\n`;
      } else if (readingM > 200) {
        plan += `flow confirms — institutional buying supports entries at levels.\n`;
      }
    }
  } else {
    plan += `No report uploaded yet. Sitting on hands until guidance arrives.`;
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ TAYLOR — MARKET OPEN`)
    .setColor(modeColor(mode))
    .setDescription(desc)
    .addFields({ name: "today's plan", value: plan, inline: false })
    .setTimestamp();
  
  try {
    await sendAsTaylor({ embeds: [embed] });
  } catch (error) {
    console.error('Error posting market open:', error);
  }
}

/**
 * Post market close summary (multi-instrument)
 */
export async function postMarketClose(
  portfolio: Portfolio | MultiPortfolio,
  dayTrades: number,
  dayPnl: number,
  dayPnlByInstrument?: { tsla: number; tsll: number }
): Promise<void> {
  if (!webhookClient) return;
  
  let content = `**⚔️ TAYLOR — MARKET CLOSE**\n\n`;
  
  const isMulti = 'tsla' in portfolio;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla || multi.tsll) {
      content += `holding overnight:\n`;
      if (multi.tsla) {
        content += `• TSLA: ${multi.tsla.shares.toLocaleString()} shares — ${withSign(multi.tsla.unrealizedPnl)}\n`;
      }
      if (multi.tsll) {
        content += `• TSLL: ${multi.tsll.shares.toLocaleString()} shares — ${withSign(multi.tsll.unrealizedPnl)}\n`;
      }
    }
  } else {
    const single = portfolio as Portfolio;
    if (single.position) {
      content += `holding ${single.position.shares} shares TSLA overnight\n`;
      content += `unrealized: ${withSign(single.position.unrealizedPnl)}\n`;
    }
  }
  
  const portfolioVal = portfolio.totalValue || 100000;
  content += `\nday's p&l: ${withSign(dayPnl)} (${withSignPercent(dayPnl / portfolioVal * 100)})\n`;
  
  if (dayPnlByInstrument) {
    if (dayPnlByInstrument.tsla !== 0 || dayPnlByInstrument.tsll !== 0) {
      content += `breakdown:`;
      if (dayPnlByInstrument.tsla !== 0) {
        content += ` TSLA ${withSign(dayPnlByInstrument.tsla)}`;
      }
      if (dayPnlByInstrument.tsll !== 0) {
        content += ` | TSLL ${withSign(dayPnlByInstrument.tsll)}`;
      }
      content += `\n`;
    }
  }
  
  content += `trades: ${dayTrades}\n`;
  content += portfolioFooter(portfolio);
  content += `\n\nback at it tomorrow. 🤙`;
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting market close:', error);
  }
}

/**
 * Post weekly performance report (full breakdown)
 */
export async function postWeeklyReport(
  data: WeeklyPerformanceData
): Promise<void> {
  if (!webhookClient) return;
  
  const isPositive = data.weeklyReturnPct >= 0;
  const winCount = data.winCount;
  const lossCount = data.lossCount;
  
  // Headline
  let headline: string;
  if (data.tradesCount === 0) {
    headline = `flat week — no trades. cash gang.`;
  } else if (isPositive) {
    headline = `up ${withSignPercent(data.weeklyReturnPct)} on ${data.tradesCount} trades (${winCount}w/${lossCount}l)`;
  } else {
    headline = `down ${data.weeklyReturnPct.toFixed(1)}% on ${data.tradesCount} trades (${winCount}w/${lossCount}l)`;
  }
  
  // Capital line
  const capitalLine = `$${fmtDollar(data.startValue)} → $${fmtDollar(data.endValue)} (${withSign(data.weeklyReturn)} / ${withSignPercent(data.weeklyReturnPct)})`;
  
  // Daily breakdown
  let dailyLines: string[] = [];
  for (const day of data.dailyBreakdown) {
    let line = `**${day.dayLabel}**`;
    if (day.trades.length === 0) {
      line += ` — held`;
    } else {
      const actions = day.trades.map(t => {
        const verb = t.action === 'buy' ? '🟢 bought' : '🔴 sold';
        let desc = `${verb} ${t.shares} ${t.instrument} @ $${t.price.toFixed(2)}`;
        if (t.pnl && t.action === 'sell') {
          desc += ` (${withSign(t.pnl)})`;
        }
        return desc;
      });
      line += ` — ${actions.join(' | ')}`;
    }
    if (day.portfolioValue) {
      const changeStr = day.dailyChange !== null ? ` (${withSignPercent(day.dailyChange)})` : '';
      line += `\nportfolio: $${fmtDollar(day.portfolioValue)}${changeStr}`;
    } else {
      line += `\n*no snapshot*`;
    }
    dailyLines.push(line);
  }
  
  // Position going into next week
  let positionLine = 'all cash — no positions';
  if (data.currentPosition) {
    const parts: string[] = [];
    if (data.currentPosition.tslaShares > 0) {
      parts.push(`TSLA: ${data.currentPosition.tslaShares} shares @ $${fmtDollar(data.currentPosition.tslaAvgCost, 2)} avg`);
    }
    if (data.currentPosition.tsllShares > 0) {
      parts.push(`TSLL: ${data.currentPosition.tsllShares} shares @ $${fmtDollar(data.currentPosition.tsllAvgCost, 2)} avg`);
    }
    if (parts.length > 0) {
      positionLine = parts.join('\n');
    }
  }
  
  // Metrics (only show non-zero)
  let metricsLines: string[] = [];
  if (data.bestTrade !== 0) metricsLines.push(`best trade: ${withSign(data.bestTrade)}`);
  if (data.worstTrade !== 0) metricsLines.push(`worst trade: ${withSign(data.worstTrade)}`);
  if (data.avgWinner !== 0) metricsLines.push(`avg winner: ${withSign(data.avgWinner)}`);
  if (data.avgLoser !== 0) metricsLines.push(`avg loser: ${withSign(data.avgLoser)}`);
  if (data.maxDrawdown > 0) metricsLines.push(`max drawdown: $${fmtDollar(data.maxDrawdown)}`);
  
  // All-time footer
  const allTimeWinRate = (data.allTime.winRate * 100).toFixed(0);
  const allTimeFooter = `all-time: ${data.allTime.totalTrades} trades | ${allTimeWinRate}% win rate | ${withSign(data.allTime.totalReturn)} (${withSignPercent(data.allTime.totalReturnPercent)})`;
  
  // Build embed
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ TAYLOR — WEEKLY PERFORMANCE`)
    .setDescription(`${headline}\n\n**capital**\n${capitalLine}`)
    .setColor(isPositive ? 0x00c853 : 0xff1744)
    .addFields(
      {
        name: '📅 daily breakdown',
        value: dailyLines.join('\n\n') || 'no data',
        inline: false,
      },
      {
        name: '📦 carrying into next week',
        value: positionLine,
        inline: false,
      },
    );
  
  if (metricsLines.length > 0) {
    embed.addFields({
      name: '📊 metrics',
      value: metricsLines.join('\n'),
      inline: false,
    });
  }
  
  embed
    .setFooter({ text: allTimeFooter })
    .setTimestamp();
  
  try {
    await sendAsTaylor({ embeds: [embed] });
  } catch (error) {
    console.error('Error posting weekly report:', error);
  }
}

/**
 * Post level reaction — Taylor's thoughts when price hits a key level
 */
export async function postLevelReaction(
  quote: TSLAQuote,
  level: { name: string; price: number; type: string },
  direction: 'above' | 'below',
  report: DailyReport | null,
  orb: OrbData,
  hiro: HIROData,
  position: { cash: number; sharesHeld: number; avgCost: number; tsllShares: number },
  approach?: 'falling_to' | 'rising_through' | 'above' | 'below'
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  const priceDiff = quote.price - level.price;
  const pctFromLevel = ((priceDiff / level.price) * 100).toFixed(2);
  
  // Describe approach direction clearly
  const approachDesc = approach === 'falling_to' 
    ? `price falling to level from above, now at $${quote.price.toFixed(2)}`
    : approach === 'rising_through'
    ? `price rising through level from below, now at $${quote.price.toFixed(2)}`
    : `price ${direction} at $${quote.price.toFixed(2)}`;
  
  let content = `**⚔️ TAYLOR — LEVEL HIT — ${timeStr} CT**\n\n`;
  content += `📍 **${level.name}** ($${level.price.toFixed(2)}) — ${approachDesc}\n\n`;
  
  // Generate Taylor's reaction based on level type, direction, AND approach
  content += `**my read:**\n`;
  
  if (level.type === 'trim') {
    if (approach === 'rising_through' || direction === 'above') {
      content += `rising into trim level. `;
      if (position.sharesHeld > 0) {
        const trimShares = Math.floor(position.sharesHeld * 0.25);
        content += `trimming ${trimShares} shares (25%) here per the rules. `;
        content += `locking in gains — don't let winners turn into losers.\n`;
      } else {
        content += `no position to trim. watching for continuation.\n`;
      }
    } else if (approach === 'falling_to') {
      content += `falling back to this level from above. previous resistance becoming support? watching for a hold here.\n`;
    } else {
      content += `lost the trim level. resistance held. watching to see if we get another push.\n`;
    }
  } else if (level.type === 'nibble') {
    if (approach === 'falling_to') {
      content += `price dropping into support zone. `;
      if (report) {
        const mode = report.mode;
        const caps: Record<string, number> = { GREEN: 25, YELLOW: 15, ORANGE: 10, RED: 5 };
        content += `${mode} mode — can deploy up to ${caps[mode] || 10}% here. `;
      }
      content += `watching for a bounce and confirmation before adding.\n`;
    } else if (approach === 'rising_through') {
      content += `reclaiming support from below. buyers stepping back in — constructive. watching for follow-through.\n`;
    } else if (direction === 'below') {
      content += `at support level. `;
      if (report) {
        const mode = report.mode;
        const caps: Record<string, number> = { GREEN: 25, YELLOW: 15, ORANGE: 10, RED: 5 };
        content += `${mode} mode — can deploy up to ${caps[mode] || 10}% here. `;
      }
      content += `watching for a bounce and confirmation before adding.\n`;
    } else {
      content += `reclaimed the nibble level. buyers stepping in. constructive.\n`;
    }
  } else if (level.type === 'eject') {
    if (approach === 'falling_to' || direction === 'below') {
      content += `⚠️ ${approach === 'falling_to' ? 'falling into' : 'below'} kill leverage. this is NOT an intraday sell trigger — need 2 consecutive daily closes below $${level.price.toFixed(2)} to activate. `;
      content += `but I'm not adding here. watching the close carefully.\n`;
    } else if (approach === 'rising_through') {
      content += `reclaiming kill leverage from below. good sign but need a daily close above $${level.price.toFixed(2)} to reset the count. not out of the woods yet.\n`;
    } else {
      content += `reclaimed kill leverage. breathing room. still cautious until we get some distance from this level.\n`;
    }
  } else if (level.type === 'slow_zone') {
    if (direction === 'below') {
      content += `entered the Slow Zone. daily cap reduces — smaller bites only. `;
      content += `this is where discipline matters most.\n`;
    } else {
      content += `back above the Slow Zone threshold. normal sizing rules apply.\n`;
    }
  } else {
    // Generic level reaction
    content += `key level ${direction === 'above' ? 'reclaimed' : 'lost'}. `;
    content += `watching how price reacts here — acceptance ${direction} or rejection back.\n`;
  }
  
  // Add flow context
  if (hiro && hiro.character !== 'unavailable') {
    const readingM = hiro.reading / 1000000;
    const readingStr = readingM >= 0 ? `+${readingM.toFixed(0)}M` : `${readingM.toFixed(0)}M`;
    content += `\nflow: HIRO ${readingStr} — ${hiro.reading > 0 ? 'dealers buying, supports the move' : 'dealers selling, stay cautious'}`;
  }
  
  // Orb context
  content += `\n${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})`;
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting level reaction:', error);
  }
}

/**
 * Post error alert
 */
export async function postError(error: string): Promise<void> {
  if (!webhookClient) return;
  
  try {
    await sendAsTaylor({
      content: `**⚔️ TAYLOR — SYSTEM ALERT**\n\nerror: ${error}\n\ninvestigating...`,
    });
  } catch (e) {
    console.error('Error posting error alert:', e);
  }
}
