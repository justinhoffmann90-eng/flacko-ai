/**
 * Axelrod — Commentary Engine for Paper Trading Bot
 * 
 * Bobby Axelrod provides substantive market commentary on every Taylor post.
 * 100% template-driven. NO external API calls. All analysis from trade data.
 * 
 * Taylor posts → 3-5s delay → Axelrod reacts.
 * Taylor NEVER responds to Axelrod. One-way dynamic.
 */

import { WebhookClient } from 'discord.js';
import type { TSLAQuote, HIROData, DailyReport, OrbData, MultiPortfolio, Trade } from './types';

// Axe's own webhook — avatar/name controlled from Discord settings
const AXE_WEBHOOK_URL = process.env.AXE_WEBHOOK_URL
  || 'https://discord.com/api/webhooks/1471207800238506157/AVmjV5NUoUg9URenzZxRSawYs-xUuTh5qlx3kIWRt2jRnAgNWO2m72HdG8kJH1WIIlrw';

let webhookClient: WebhookClient | null = null;

interface AxelrodContext {
  taylorPost: string;
  quote?: TSLAQuote;
  report?: DailyReport | null;
  hiro?: HIROData;
  orb?: OrbData;
  portfolio?: MultiPortfolio;
  trade?: Trade;
}

/**
 * Initialize Axelrod's webhook client
 */
export function initAxelrod(): boolean {
  try {
    webhookClient = new WebhookClient({ url: AXE_WEBHOOK_URL });
    return true;
  } catch (error) {
    console.error('Failed to initialize Axelrod webhook:', error);
    return false;
  }
}

/**
 * Generate Axelrod's commentary — pure data analysis, no LLM
 */
function generateCommentary(ctx: AxelrodContext): string {
  const lines: string[] = [];
  
  // Determine what kind of post this is
  const isEntry = ctx.trade?.action === 'buy';
  const isExit = ctx.trade?.action === 'sell';
  const isMarketOpen = ctx.taylorPost.includes('market open');
  
  if (isEntry && ctx.trade && ctx.report && ctx.orb) {
    lines.push(...generateEntryValidation(ctx));
  } else if (isExit && ctx.trade) {
    lines.push(...generateExitValidation(ctx));
  } else if (isMarketOpen) {
    lines.push(...generateMarketOpenReaction(ctx));
  } else {
    return ''; // Don't comment on routine updates
  }
  
  return lines.join(' ');
}

/**
 * Validate an entry trade — the core of Axe's job
 */
function generateEntryValidation(ctx: AxelrodContext): string[] {
  const lines: string[] = [];
  const { trade, report, orb, hiro, quote } = ctx;
  if (!trade || !report || !orb) return [];
  
  const price = trade.price;
  const mode = report.mode;
  const zone = orb.zone;
  
  // --- MODE vs SIZE CHECK ---
  const modeCaps: Record<string, number> = { GREEN: 25, YELLOW: 15, ORANGE: 10, RED: 5 };
  const maxCap = modeCaps[mode] || 15;
  const actualPct = (trade.totalValue / 100000) * 100;
  
  if (actualPct > maxCap * 1.2) {
    lines.push(`Taylor's sizing at ${actualPct.toFixed(0)}% — that's above the ${maxCap}% cap for ${mode} mode. Aggressive.`);
  } else if (actualPct < maxCap * 0.5) {
    lines.push(`Only ${actualPct.toFixed(0)}% deployed in ${mode} mode. Conservative. She's leaving room, which tells you she's not fully convicted.`);
  }
  
  // --- ORB ZONE vs INSTRUMENT CHECK ---
  if (trade.instrument === 'TSLL' && zone !== 'FULL_SEND') {
    lines.push(`Hold on — she's buying TSLL in ${zone} zone? Leveraged positions are only cleared in FULL_SEND. That's a rule violation.`);
  } else if (trade.instrument === 'TSLA' && zone === 'FULL_SEND') {
    lines.push(`FULL_SEND zone and she's going shares instead of TSLL. Playing it safe. I'd take the leverage here — that's what the signal is for.`);
  }
  
  if (zone === 'CAUTION' || zone === 'DEFENSIVE') {
    lines.push(`Buying in ${zone} conditions. The Orb says sit on your hands. If she's right, it's a great entry. If she's wrong, the system literally warned her.`);
  }
  
  // --- MASTER EJECT PROXIMITY ---
  const ejectDist = ((price - report.masterEject) / price) * 100;
  if (ejectDist < 0.5 && ejectDist >= 0) {
    lines.push(`She's ${ejectDist.toFixed(1)}% from the eject level. That's threading a needle. One bad candle and this is a forced exit. The risk/reward better be worth it.`);
  } else if (ejectDist < 0) {
    lines.push(`Price is BELOW master eject. Why is she buying? The system says no longs here. Full stop.`);
  }
  
  // --- GAMMA REGIME ---
  if (report.gammaStrike > 0) {
    if (price < report.gammaStrike) {
      lines.push(`We're below the gamma strike ($${report.gammaStrike.toFixed(0)}). Negative gamma territory — dealers amplify moves both ways. Expect volatility. That stop needs to be respected.`);
    } else {
      lines.push(`Above gamma strike. Positive gamma regime — dealers are stabilizing. That's a tailwind for holding.`);
    }
  }
  
  // --- HIRO FLOW ---
  if (hiro) {
    const pctl = hiro.percentile30Day;
    const readingM = hiro.reading / 1000000;
    
    if (pctl < 25 && trade.action === 'buy') {
      lines.push(`HIRO is in the bottom quartile (${pctl.toFixed(0)}th pctl, ${readingM.toFixed(0)}M). Institutional flow is selling. Buying against the flow — she better have strong conviction on the levels.`);
    } else if (pctl > 75) {
      lines.push(`Flow is backing this up. HIRO at ${pctl.toFixed(0)}th percentile — institutions are buying. That's the kind of confirmation you want on an entry.`);
    } else if (pctl >= 40 && pctl <= 60) {
      lines.push(`Flow is flat — HIRO at ${pctl.toFixed(0)}th percentile. No strong edge from the options market. This is a levels play, not a flow play.`);
    }
    
    // Divergence check
    if (quote && quote.changePercent > 0.5 && readingM < -100) {
      lines.push(`Interesting divergence here — price is green but HIRO is negative. Smart money hedging into the rally. Keep that in mind.`);
    } else if (quote && quote.changePercent < -0.5 && readingM > 100) {
      lines.push(`Price is red but HIRO is positive — dealers buying the dip. That's usually a sign the selloff is running out of steam.`);
    }
  }
  
  // --- ACTIVE SETUPS ---
  const activeSetups = orb.activeSetups.filter(s => s.status === 'active');
  if (activeSetups.length >= 3) {
    lines.push(`${activeSetups.length} Orb setups active simultaneously. That's signal convergence. When the system is this aligned, the forward returns are historically strong.`);
  } else if (activeSetups.length === 0) {
    lines.push(`Zero active Orb setups. She's buying on levels alone, no signal backing. That's discretionary, not systematic.`);
  }
  
  // --- KEY LEVEL PROXIMITY ---
  const levels = report.levels || [];
  const nearestSupport = levels.filter(l => l.price < price).sort((a, b) => b.price - a.price)[0];
  const nearestResist = levels.filter(l => l.price > price).sort((a, b) => a.price - b.price)[0];
  
  if (nearestSupport && (price - nearestSupport.price) / price < 0.005) {
    lines.push(`Entry right at ${nearestSupport.name} ($${nearestSupport.price.toFixed(0)}). That's discipline — buying the level, not chasing.`);
  } else if (nearestResist && (nearestResist.price - price) / price < 0.005) {
    lines.push(`She's buying into resistance at ${nearestResist.name} ($${nearestResist.price.toFixed(0)}). Needs a clean break to work. I'd wait for confirmation.`);
  }
  
  // --- VERDICT ---
  const flags = lines.filter(l => l.includes('?') || l.includes('violation') || l.includes('BELOW') || l.includes('against'));
  if (flags.length === 0 && lines.length > 0) {
    lines.push(`The logic checks out. Levels, flow, and signal are aligned. Clean entry.`);
  } else if (flags.length >= 2) {
    lines.push(`Multiple flags here. She's pushing against the system on this one. Let's see if she's right.`);
  }
  
  return lines;
}

/**
 * Validate an exit trade
 */
function generateExitValidation(ctx: AxelrodContext): string[] {
  const lines: string[] = [];
  const { trade } = ctx;
  if (!trade) return [];
  
  const pnl = trade.realizedPnl || 0;
  const pnlPct = trade.totalValue > 0 ? (pnl / trade.totalValue) * 100 : 0;
  
  if (pnl > 0) {
    if (pnlPct > 3) {
      lines.push(`${pnlPct.toFixed(1)}% on the trade. That's a solid hit. Taking profit at the right level separates the pros from the bagholders.`);
    } else {
      lines.push(`Small win — ${pnlPct.toFixed(1)}%. Sometimes the best trade is the one you don't overstay.`);
    }
  } else {
    if (pnlPct > -2) {
      lines.push(`Small loss, ${pnlPct.toFixed(1)}%. That's what stops are for. The system works because the losses stay small.`);
    } else {
      lines.push(`${pnlPct.toFixed(1)}% loss. Painful but controlled. The worst thing you can do is turn a small loss into a big one. She cut it. That's the right call.`);
    }
  }
  
  // Check if exit was forced by system
  if (ctx.orb && (ctx.orb.zone === 'DEFENSIVE' || ctx.orb.zone === 'CAUTION')) {
    lines.push(`Orb went ${ctx.orb.zone} — this wasn't discretionary, this was the system talking. You follow the system or you don't. She followed it.`);
  }
  
  return lines;
}

/**
 * React to market open
 */
function generateMarketOpenReaction(ctx: AxelrodContext): string[] {
  const lines: string[] = [];
  const { report, orb, quote, hiro } = ctx;
  
  if (!report || !orb || !quote) return [];
  
  const mode = report.mode;
  const zone = orb.zone;
  const ejectDist = ((quote.price - report.masterEject) / quote.price) * 100;
  
  // Set the scene
  if (mode === 'RED' || mode === 'ORANGE') {
    lines.push(`${mode} mode. The system is telling you to be careful. Most traders lose money trying to be heroes in these conditions. Small bets, tight stops.`);
  } else if (mode === 'GREEN' && zone === 'FULL_SEND') {
    lines.push(`Green mode, FULL_SEND zone. Everything aligned. This is the environment where you push.`);
  } else {
    lines.push(`${mode} mode, ${zone} zone. Mixed signals. The money today is in patience — wait for the setup, don't force it.`);
  }
  
  if (ejectDist < 1) {
    lines.push(`Eject level at $${report.masterEject.toFixed(2)} — that's ${ejectDist.toFixed(1)}% away. One wrong move and the emergency brake triggers. Not a day for heroics.`);
  }
  
  if (hiro) {
    const pctl = hiro.percentile30Day;
    if (pctl > 70) {
      lines.push(`Flow is strong out of the gate — institutions are buying. That matters.`);
    } else if (pctl < 30) {
      lines.push(`Flow is weak. Dealers selling. Watch for traps on any early bounce.`);
    }
  }
  
  // Active setups
  const active = orb.activeSetups.filter(s => s.status === 'active');
  if (active.length > 0) {
    lines.push(`Active setups: ${active.map(s => s.setup_id.replace(/-/g, ' ')).join(', ')}. Let them work.`);
  }
  
  return lines;
}

/**
 * Post Axelrod's commentary to Discord
 * Call this AFTER every Taylor post with a delay
 */
export async function postAxelrodCommentary(context: AxelrodContext): Promise<void> {
  if (!webhookClient) {
    initAxelrod();
  }
  if (!webhookClient) return;

  try {
    const commentary = generateCommentary(context);
    if (!commentary) return;

    // Wait 3-5 seconds after Taylor's post
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    await webhookClient.send({ content: commentary });

    console.log('🎩 axelrod commentary posted');
  } catch (error) {
    console.error('Error posting Axelrod commentary:', error);
  }
}
