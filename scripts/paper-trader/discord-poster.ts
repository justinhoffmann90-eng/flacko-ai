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
  Trade,
  DailyReport,
} from './types';
import { getMarketStatus } from './data-feed';

const DISCORD_TOKEN = process.env.PAPER_TRADER_DISCORD_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.PAPER_TRADER_CHANNEL_ID || '';

let webhookClient: WebhookClient | null = null;

/**
 * Initialize Discord webhook client
 */
export function initDiscord(): boolean {
  if (!DISCORD_TOKEN || !DISCORD_CHANNEL_ID) {
    console.error('Discord credentials not configured');
    return false;
  }
  
  try {
    webhookClient = new WebhookClient({
      id: DISCORD_CHANNEL_ID,
      token: DISCORD_TOKEN,
    });
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
 * Post regular status update (every 15 min)
 */
export async function postStatusUpdate(
  quote: TSLAQuote,
  portfolio: Portfolio,
  report: DailyReport | null,
  hiro: HIROData,
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
  content += `price: $${quote.price.toFixed(2)} (${withSignPercent(quote.changePercent)} today)\n`;
  
  if (portfolio.position) {
    const pos = portfolio.position;
    content += `position: LONG ${pos.shares} shares @ $${pos.avgCost.toFixed(2)}\n`;
    content += `unrealized: ${withSign(pos.unrealizedPnl)} (${withSignPercent(pos.unrealizedPnlPercent)})\n`;
  } else {
    content += `position: FLAT\n`;
    content += `cash: $${portfolio.cash.toFixed(0)}\n`;
  }
  
  content += `\ntake: ${flackoTake}\n`;
  
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
    await webhookClient.send({ content });
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
    await webhookClient.send({ content });
  } catch (error) {
    console.error('Error posting HIRO update:', error);
  }
}

/**
 * Post trade entry alert
 */
export async function postEntryAlert(
  trade: Trade,
  report: DailyReport | null,
  portfolio: Portfolio
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  let content = `⚔️ paper flacko — **ENTRY ALERT** — ${timeStr} ct\n\n`;
  content += `bought: ${trade.shares} shares TSLA @ $${trade.price.toFixed(2)}\n`;
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
  const reasons = trade.reasoning.filter(r => 
    !r.includes('target:') && !r.includes('stop:') && !r.includes('r/r:')
  );
  reasons.forEach(r => {
    content += `\n• ${r}`;
  });
  
  // Extract target and stop from reasoning
  const targetReason = trade.reasoning.find(r => r.includes('target:'));
  const stopReason = trade.reasoning.find(r => r.includes('stop:'));
  
  if (targetReason) content += `\n• ${targetReason}`;
  if (stopReason) content += `\n• ${stopReason}`;
  
  content += `\n\nportfolio: ${portfolio.position?.shares || trade.shares} shares`;
  content += ` | cash: $${portfolio.cash.toFixed(0)}`;
  
  try {
    await webhookClient.send({ content });
  } catch (error) {
    console.error('Error posting entry alert:', error);
  }
}

/**
 * Post trade exit alert
 */
export async function postExitAlert(
  trade: Trade,
  portfolio: Portfolio,
  todayPnl: number
): Promise<void> {
  if (!webhookClient) return;
  
  const timeStr = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Chicago',
  }).toLowerCase();
  
  const isWin = (trade.realized_pnl || 0) > 0;
  
  let content = `⚔️ paper flacko — **EXIT ALERT** — ${timeStr} ct\n\n`;
  content += `sold: ${trade.shares} shares TSLA @ $${trade.price.toFixed(2)}\n`;
  content += `realized: ${withSign(trade.realized_pnl || 0)}`;
  
  if (trade.realized_pnl) {
    const returnPct = (trade.realized_pnl / trade.totalValue) * 100;
    content += ` (${withSignPercent(returnPct)} on trade)`;
  }
  
  content += `\nreasoning:`;
  trade.reasoning.forEach(r => {
    content += `\n• ${r}`;
  });
  
  content += `\n\nportfolio: FLAT`;
  content += ` | cash: $${portfolio.cash.toFixed(0)}`;
  content += `\ntoday's p&l: ${withSign(todayPnl)} (${withSignPercent(todayPnl / 100000 * 100)})`;
  
  if (isWin) {
    content += `\n\n✓ win secured.`;
  } else {
    content += `\n\n✗ loss taken. on to the next.`;
  }
  
  try {
    await webhookClient.send({ content });
  } catch (error) {
    console.error('Error posting exit alert:', error);
  }
}

/**
 * Post market open message
 */
export async function postMarketOpen(
  quote: TSLAQuote,
  report: DailyReport | null
): Promise<void> {
  if (!webhookClient) return;
  
  let content = `⚔️ paper flacko — **market open**\n\n`;
  content += `starting capital: $100,000\n`;
  content += ` tsla open: $${quote.price.toFixed(2)}\n`;
  
  if (report) {
    content += `mode: ${modeEmoji(report.mode)} ${report.mode} (tier ${report.tier})\n`;
    content += `master eject: $${report.masterEject.toFixed(2)} — no longs below this.\n`;
  }
  
  content += `\nscanning for setups. let's get it.`;
  
  try {
    await webhookClient.send({ content });
  } catch (error) {
    console.error('Error posting market open:', error);
  }
}

/**
 * Post market close summary
 */
export async function postMarketClose(
  portfolio: Portfolio,
  dayTrades: number,
  dayPnl: number
): Promise<void> {
  if (!webhookClient) return;
  
  let content = `⚔️ paper flacko — **market close**\n\n`;
  
  if (portfolio.position) {
    content += `holding ${portfolio.position.shares} shares overnight\n`;
    content += `unrealized: ${withSign(portfolio.position.unrealizedPnl)}\n`;
  }
  
  content += `day's p&l: ${withSign(dayPnl)} (${withSignPercent(dayPnl / 100000 * 100)})\n`;
  content += `trades: ${dayTrades}\n`;
  content += `portfolio value: $${portfolio.totalValue.toFixed(0)}\n`;
  content += `total return: ${withSignPercent(portfolio.totalReturnPercent)}\n\n`;
  content += `back at it tomorrow. 🤙`;
  
  try {
    await webhookClient.send({ content });
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
    await webhookClient.send({ embeds: [embed] });
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
    await webhookClient.send({
      content: `⚔️ paper flacko — **system alert**\n\nerror: ${error}\n\ninvestigating...`,
    });
  } catch (e) {
    console.error('Error posting error alert:', e);
  }
}
