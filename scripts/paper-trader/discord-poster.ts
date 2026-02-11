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
 * Format number with sign
 */
function withSign(num: number): string {
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}

function withSignPercent(num: number): string {
  return num >= 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
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
  
  let content = `⚔️ paper flacko — ${timeStr} ct\n\n`;
  content += `tsla: $${quote.price.toFixed(2)} (${withSignPercent(quote.changePercent)} today)\n`;
  content += `tsll: $${tsllQuote.price.toFixed(2)} (${withSignPercent(tsllQuote.changePercent)} today)\n`;
  
  const isMulti = 'tsla' in portfolio;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla || multi.tsll) {
      content += `\npositions:\n`;
      if (multi.tsla) {
        content += `• TSLA: ${multi.tsla.shares} shares @ $${multi.tsla.avgCost.toFixed(2)} — ${withSign(multi.tsla.unrealizedPnl)} (${withSignPercent(multi.tsla.pnlPercent)})\n`;
      }
      if (multi.tsll) {
        content += `• TSLL: ${multi.tsll.shares} shares @ $${multi.tsll.avgCost.toFixed(2)} — ${withSign(multi.tsll.unrealizedPnl)} (${withSignPercent(multi.tsll.pnlPercent)})\n`;
      }
    } else {
      content += `position: FLAT\n`;
    }
    content += `cash: $${multi.cash.toFixed(0)}\n`;
  } else {
    const single = portfolio as Portfolio;
    if (single.position) {
      const pos = single.position;
      content += `position: LONG ${pos.shares} shares TSLA @ $${pos.avgCost.toFixed(2)}\n`;
      content += `unrealized: ${withSign(pos.unrealizedPnl)} (${withSignPercent(pos.unrealizedPnlPercent)})\n`;
    } else {
      content += `position: FLAT\n`;
    }
    content += `cash: $${single.cash.toFixed(0)}\n`;
  }
  
  content += `\n${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})\n`;
  content += `take: ${flackoTake}\n`;
  
  // Key levels context
  if (report) {
    content += `\nlevels:`;
    content += ` γ:${report.gammaStrike.toFixed(0)}`;
    content += ` | pw:${report.putWall.toFixed(0)}`;
    content += ` | hw:${report.hedgeWall.toFixed(0)}`;
    content += ` | cw:${report.callWall.toFixed(0)}`;
    content += ` | eject:${report.masterEject.toFixed(0)}`;
  }
  
  content += `\n\n${modeEmoji(report?.mode || 'YELLOW')} ${marketStatus.message}`;
  
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
  
  let content = `⚔️ paper flacko — **ENTRY** — ${timeStr} ct\n\n`;
  
  // Trade details — clean, no duplication
  content += `**${trade.instrument}** — bought ${trade.shares} shares @ $${trade.price.toFixed(2)}\n`;
  content += `size: $${trade.totalValue.toFixed(0)}`;
  if (report) {
    content += ` (${report.mode} mode, tier ${report.tier})`;
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
  
  // Portfolio summary
  const isMulti = 'tsla' in portfolio;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    content += `\nportfolio:`;
    if (multi.tsla) content += ` TSLA ${multi.tsla.shares}`;
    if (multi.tsll) content += ` | TSLL ${multi.tsll.shares}`;
    content += ` | cash: $${multi.cash.toFixed(0)}`;
  } else {
    const single = portfolio as Portfolio;
    content += `\nportfolio: ${single.position?.shares || trade.shares} ${trade.instrument}`;
    content += ` | cash: $${single.cash.toFixed(0)}`;
  }
  
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
  
  // Master eject context
  if (report && Math.abs(trade.price - report.masterEject) < 5) {
    lines.push(`Close to master eject ($${report.masterEject.toFixed(2)}) — tight leash. If this breaks, I'm out immediately.`);
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
  
  let content = `⚔️ paper flacko — **EXIT** — ${timeStr} ct\n\n`;
  content += `**${trade.instrument}** — sold ${trade.shares} shares @ $${trade.price.toFixed(2)}\n`;
  content += `result: ${withSign(trade.realizedPnl || 0)} (${withSignPercent(returnPct)})\n`;
  
  // Taylor's exit commentary
  const reasoningArray = Array.isArray(trade.reasoning) ? trade.reasoning : [trade.reasoning];
  content += `\n**why I exited:**\n`;
  content += generateExitCommentary(trade, reasoningArray, orb);
  
  // Portfolio after
  const isMulti = 'tsla' in portfolio;
  content += `\n\nportfolio:`;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla) content += ` TSLA ${multi.tsla.shares}`;
    if (multi.tsll) content += ` | TSLL ${multi.tsll.shares}`;
    if (!multi.tsla && !multi.tsll) content += ` FLAT`;
  } else {
    content += ` FLAT`;
  }
  content += ` | cash: $${portfolio.cash.toFixed(0)}`;
  content += `\nday p&l: ${withSign(todayPnl)} (${withSignPercent(todayPnl / 100000 * 100)})`;
  
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
    return `Stop triggered. Price broke below the line in the sand. Small loss, capital preserved. That's the system working — you don't fight the eject level.`;
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
  
  let content = `⚔️ paper flacko — **ORB ZONE CHANGE** — ${timeStr} ct\n\n`;
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
export async function postMarketOpen(
  quote: TSLAQuote,
  tsllQuote: TSLAQuote,
  report: DailyReport | null,
  orb: OrbData,
  hiro?: HIROData
): Promise<void> {
  if (!webhookClient) return;
  
  let content = `⚔️ paper flacko — **market open**\n\n`;
  content += `TSLA $${quote.price.toFixed(2)} | TSLL $${tsllQuote.price.toFixed(2)}\n`;
  
  if (report) {
    content += `${modeEmoji(report.mode)} ${report.mode} mode (tier ${report.tier}) | eject: $${report.masterEject.toFixed(2)}\n`;
  }
  
  content += `${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})`;
  
  // Active setups
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  if (activeSetups.length > 0) {
    content += `\nactive: ${activeSetups.map(s => s.setup_id.replace(/-/g, ' ')).join(', ')}`;
  }
  
  // Today's plan based on conditions
  content += `\n\n`;
  if (orb.zone === 'FULL_SEND') {
    content += `TSLL cleared. Multiple signals converging — looking for entries with conviction.`;
  } else if (orb.zone === 'NEUTRAL') {
    content += `Shares only today. Conditions are fine, not exceptional. Selective entries.`;
  } else if (orb.zone === 'CAUTION') {
    content += `Elevated risk. Staying defensive — no new longs unless price hits a key level.`;
  } else if (orb.zone === 'DEFENSIVE') {
    content += `Capital preservation mode. No new positions. Protecting what we have.`;
  }
  
  if (hiro) {
    const readingM = hiro.reading / 1000000;
    const readingStr = readingM >= 0 ? `+$${readingM.toFixed(0)}M` : `-$${Math.abs(readingM).toFixed(0)}M`;
    content += `\nflow: HIRO ${readingStr} (${hiro.percentile30Day.toFixed(0)}th pctl) — ${describeHiro(hiro)}`;
  }
  
  try {
    await sendAsTaylor({ content });
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
  
  let content = `⚔️ paper flacko — **market close**\n\n`;
  
  const isMulti = 'tsla' in portfolio;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla || multi.tsll) {
      content += `holding overnight:\n`;
      if (multi.tsla) {
        content += `• TSLA: ${multi.tsla.shares} shares — ${withSign(multi.tsla.unrealizedPnl)}\n`;
      }
      if (multi.tsll) {
        content += `• TSLL: ${multi.tsll.shares} shares — ${withSign(multi.tsll.unrealizedPnl)}\n`;
      }
    }
  } else {
    const single = portfolio as Portfolio;
    if (single.position) {
      content += `holding ${single.position.shares} shares TSLA overnight\n`;
      content += `unrealized: ${withSign(single.position.unrealizedPnl)}\n`;
    }
  }
  
  content += `\nday's p&l: ${withSign(dayPnl)} (${withSignPercent(dayPnl / 100000 * 100)})\n`;
  
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
  content += `portfolio value: $${portfolio.totalValue.toFixed(0)}\n`;
  content += `total return: ${withSignPercent(portfolio.totalReturnPercent)}\n\n`;
  content += `back at it tomorrow. 🤙`;
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting market close:', error);
  }
}

/**
 * Post weekly performance report
 */
export async function postWeeklyReport(
  metrics: {
    startValue: number;
    endValue: number;
    totalReturn: number;
    tradesCount: number;
    winRate: number;
    avgWinner: number;
    avgLoser: number;
    maxDrawdown: number;
    bestTrade: number;
    worstTrade: number;
  },
  weekRange: string
): Promise<void> {
  if (!webhookClient) return;
  
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ paper flacko — weekly performance`)
    .setDescription(`(${weekRange})`)
    .setColor(metrics.totalReturn >= 0 ? 0x00ff00 : 0xff0000)
    .addFields(
      { 
        name: 'capital', 
        value: `$${metrics.startValue.toLocaleString()} → $${metrics.endValue.toLocaleString()} (${withSignPercent(metrics.totalReturn)})`,
        inline: false 
      },
      { name: 'trades', value: metrics.tradesCount.toString(), inline: true },
      { name: 'win rate', value: `${(metrics.winRate * 100).toFixed(0)}%`, inline: true },
      { name: 'max dd', value: `$${metrics.maxDrawdown.toFixed(0)}`, inline: true },
      { name: 'avg winner', value: `$${metrics.avgWinner.toFixed(0)}`, inline: true },
      { name: 'avg loser', value: `$${metrics.avgLoser.toFixed(0)}`, inline: true },
      { name: 'best trade', value: `$${metrics.bestTrade.toFixed(0)}`, inline: true },
      { name: 'worst trade', value: `$${metrics.worstTrade.toFixed(0)}`, inline: true }
    )
    .setTimestamp();
  
  try {
    await sendAsTaylor({ embeds: [embed] });
  } catch (error) {
    console.error('Error posting weekly report:', error);
  }
}

/**
 * Post error alert
 */
export async function postError(error: string): Promise<void> {
  if (!webhookClient) return;
  
  try {
    await sendAsTaylor({
      content: `⚔️ paper flacko — **system alert**\n\nerror: ${error}\n\ninvestigating...`,
    });
  } catch (e) {
    console.error('Error posting error alert:', e);
  }
}
