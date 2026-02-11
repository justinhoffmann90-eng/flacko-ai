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

let webhookClient: WebhookClient | null = null;

const TAYLOR_USERNAME = 'Taylor';
const TAYLOR_AVATAR = 'https://www.flacko.ai/avatars/taylor.jpg';

/** Helper: send as Taylor with consistent identity */
async function sendAsTaylor(options: { content?: string; embeds?: any[] }): Promise<void> {
  if (!webhookClient) return;
  await webhookClient.send({
    ...options,
    username: TAYLOR_USERNAME,
    avatarURL: TAYLOR_AVATAR,
  });
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
 * Post HIRO update (every 1 hour)
 */
export async function postHIROUpdate(
  hiro: HIROData,
  position: Position | null
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  const readingM = hiro.reading / 1000000;
  const readingStr = readingM >= 0 ? `+$${readingM.toFixed(0)}M` : `-$${Math.abs(readingM).toFixed(0)}M`;
  
  let content = `⚔️ paper flacko — hiro update — ${timeStr} ct\n\n`;
  content += `hiro: ${readingStr} (${hiro.percentile30Day.toFixed(0)}% of 30-day range)\n`;
  content += `character: ${hiro.character}\n\n`;
  
  // Conviction based on position and HIRO
  if (position) {
    if (hiro.percentile30Day > 60) {
      content += `conviction: HIGH — flow supports the long. holding full size.`;
    } else if (hiro.percentile30Day > 30) {
      content += `conviction: MODERATE — flow neutral. watching for shift.`;
    } else {
      content += `conviction: LOW — selling pressure. considering trim.`;
    }
  } else {
    if (hiro.percentile30Day > 70) {
      content += `conviction: BULLISH — strong buying flow. looking for entry.`;
    } else if (hiro.percentile30Day < 30) {
      content += `conviction: BEARISH — selling flow. staying flat.`;
    } else {
      content += `conviction: NEUTRAL — no edge from flow. waiting.`;
    }
  }
  
  content += `\nno action taken.`;
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting HIRO update:', error);
  }
}

/**
 * Post trade entry alert (multi-instrument)
 */
export async function postEntryAlert(
  trade: Trade,
  report: DailyReport | null,
  portfolio: Portfolio | MultiPortfolio,
  orb: OrbData
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  let content = `⚔️ paper flacko — **ENTRY ALERT** — ${timeStr} ct\n\n`;
  content += `bought: ${trade.shares} shares ${trade.instrument} @ $${trade.price.toFixed(2)}\n`;
  content += `size: $${trade.totalValue.toFixed(0)}`;
  
  if (report) {
    const modeConfig = {
      GREEN: '25%',
      YELLOW: '15%',
      ORANGE: '10%',
      RED: '5%',
    }[report.mode] || '15%';
    content += ` (${modeConfig} — ${report.mode} mode)`;
  }
  
  content += `\nreasoning:`;
  const reasoningArray = Array.isArray(trade.reasoning) ? trade.reasoning : [trade.reasoning];
  const reasons = reasoningArray.filter(r => 
    !r.includes('target:') && !r.includes('stop:') && !r.includes('r/r:')
  );
  reasons.forEach(r => {
    content += `\n• ${r}`;
  });
  
  // Extract target and stop from reasoning
  const targetReason = reasoningArray.find(r => r.includes('target:'));
  const stopReason = reasoningArray.find(r => r.includes('stop:'));
  
  if (targetReason) content += `\n• ${targetReason}`;
  if (stopReason) content += `\n• ${stopReason}`;
  
  // Show portfolio breakdown
  const isMulti = 'tsla' in portfolio;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    content += `\n\nportfolio:`;
    if (multi.tsla) content += ` TSLA ${multi.tsla.shares} shares`;
    if (multi.tsll) content += ` | TSLL ${multi.tsll.shares} shares`;
    content += ` | cash: $${multi.cash.toFixed(0)}`;
  } else {
    const single = portfolio as Portfolio;
    content += `\n\nportfolio: ${single.position?.shares || trade.shares} shares`;
    content += ` | cash: $${single.cash.toFixed(0)}`;
  }
  
  if (trade.instrument === 'TSLL') {
    content += `\n\n⚡ leveraged position — ${orbZoneEmoji(orb.zone)} ${orb.zone} conditions justify 2x.`;
  }
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting entry alert:', error);
  }
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
  
  let content = `⚔️ paper flacko — **EXIT ALERT** — ${timeStr} ct\n\n`;
  content += `sold: ${trade.shares} shares ${trade.instrument} @ $${trade.price.toFixed(2)}\n`;
  content += `realized: ${withSign(trade.realizedPnl || 0)}`;
  
  if (trade.realizedPnl) {
    const returnPct = (trade.realizedPnl / trade.totalValue) * 100;
    content += ` (${withSignPercent(returnPct)} on trade)`;
  }
  
  content += `\nreasoning:`;
  const reasoningArray2 = Array.isArray(trade.reasoning) ? trade.reasoning : [trade.reasoning];
  reasoningArray2.forEach(r => {
    content += `\n• ${r}`;
  });
  
  // Show remaining positions
  const isMulti = 'tsla' in portfolio;
  content += `\n\nportfolio:`;
  if (isMulti) {
    const multi = portfolio as MultiPortfolio;
    if (multi.tsla) {
      content += ` TSLA ${multi.tsla.shares} shares`;
    }
    if (multi.tsll) {
      content += ` | TSLL ${multi.tsll.shares} shares`;
    }
    if (!multi.tsla && !multi.tsll) {
      content += ` FLAT`;
    }
  } else {
    content += ` FLAT`;
  }
  content += ` | cash: $${portfolio.cash.toFixed(0)}`;
  content += `\ntoday's p&l: ${withSign(todayPnl)} (${withSignPercent(todayPnl / 100000 * 100)})`;
  
  if (isWin) {
    content += `\n\n✓ win secured.`;
  } else {
    content += `\n\n✗ loss taken. on to the next.`;
  }
  
  try {
    await sendAsTaylor({ content });
  } catch (error) {
    console.error('Error posting exit alert:', error);
  }
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
  orb: OrbData
): Promise<void> {
  if (!webhookClient) return;
  
  let content = `⚔️ paper flacko — **market open**\n\n`;
  content += `starting capital: $100,000\n`;
  content += `tsla open: $${quote.price.toFixed(2)}\n`;
  content += `tsll open: $${tsllQuote.price.toFixed(2)}\n`;
  
  if (report) {
    content += `mode: ${modeEmoji(report.mode)} ${report.mode} (tier ${report.tier})\n`;
    content += `master eject: $${report.masterEject.toFixed(2)} — no longs below this.\n`;
  }
  
  content += `\n${orbZoneEmoji(orb.zone)} orb: ${orb.zone} (${orb.score >= 0 ? '+' : ''}${orb.score.toFixed(2)})\n`;
  
  if (orb.zone === 'FULL_SEND') {
    content += `cleared for TSLL (2x leverage).\n`;
  } else if (orb.zone === 'NEUTRAL') {
    content += `TSLA shares only today.\n`;
  } else if (orb.zone === 'CAUTION') {
    content += `no new buys — defensive posture.\n`;
  } else if (orb.zone === 'DEFENSIVE') {
    content += `🔴 DEFENSIVE — capital preservation mode.\n`;
  }
  
  content += `\nscanning for setups. let's get it.`;
  
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
