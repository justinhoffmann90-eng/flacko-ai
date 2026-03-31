/**
 * Axelrod — Commentary Engine for Paper Trading Bot
 * 
 * Bobby Axelrod provides substantive market commentary on every Taylor post.
 * Uses Gemini for LLM-powered contextual analysis with Axelrod's voice.
 * 
 * Taylor posts → 3-5s delay → Axelrod reacts.
 * Taylor NEVER responds to Axelrod. One-way dynamic.
 */

import { WebhookClient } from 'discord.js';
import type { TSLAQuote, HIROData, DailyReport, OrbData, MultiPortfolio, Trade } from './types';

const AXE_WEBHOOK_URL = process.env.AXE_WEBHOOK_URL
  || 'https://discord.com/api/webhooks/1471207800238506157/AVmjV5NUoUg9URenzZxRSawYs-xUuTh5qlx3kIWRt2jRnAgNWO2m72HdG8kJH1WIIlrw';

let webhookClient: WebhookClient | null = null;

const AXELROD_SYSTEM_PROMPT = `You are Bobby Axelrod from Billions — but you're commenting on a paper trading bot's moves in a Discord channel.

Your role: You are the VALIDATION LAYER. Taylor now executes the daily report, constrained by system rules. Your job is to check whether Taylor's action matches the report instructions, the key levels, the mode caps, the stop logic, and the risk framework — and call out anything that doesn't add up. When the logic is sound, explain why. When something is off, flag it.

Your personality:
- Confident, sharp, sometimes cutting — but always backed by real insight
- You respect good trades and call out risky ones honestly
- You think in probabilities, not certainties
- You reference real market dynamics: gamma positioning, dealer flows, support/resistance
- You have opinions. "I'd have sized bigger." "That stop is too tight."
- You're not a cheerleader. If the trade contradicts the data, say so.
- You're entertaining but INFORMATIVE. Every comment teaches something.

System knowledge for validation:
- Max Portfolio Invested by mode: GREEN=85%, YELLOW_IMPROVING=70%, YELLOW=60%, ORANGE=40%, RED=20%, EJECTED=50% core TSLA. If exposure exceeds the mode cap, NO new buys allowed. MAX_INVESTED is an accumulation ceiling, not a forced sell-down trigger.
- Daily Trim Caps (max % of holdings trimmed per day): GREEN=10%, YELLOW_IMPROVING=15%, YELLOW=15%, ORANGE=25%, RED=30%.
- Trim caps = % of REMAINING holdings per level, not original position. Compounding: 25% of 100 = 25, then 25% of 75 = 19, etc.
- Daily Buy Caps by mode: GREEN=30%, YELLOW_IMPROVING=20%, YELLOW=17.5%, ORANGE=10%, RED=5%, EJECTED=0% (except 200 SMA oversold override). Slow Zone halves these in normal modes; in ORANGE/RED it cuts to 25% of normal.
- Report = brain. Taylor should execute report actions like 'Buy up to daily cap. Stop $340.' or 'Trim 30% of remaining' rather than inventing entries from independent signals
- Leverage allowed only in GREEN and YELLOW_IMPROVING. RED/ORANGE/YELLOW/EJECTED are TSLA shares only
- Kill Leverage (Master Eject) is the exact W21 EMA. It is ESCALATING defense (4 steps): Step 1=cut ALL leverage (exit all TSLL), Step 2=stop new buys between W21 and Put Wall, Step 3=assess at Put Wall, Step 4=trim TSLA to 50% below Put Wall. Never assume "exit all shares."
- Kill Leverage is ACTIVE when price is BELOW the Master Eject level. If Kill Leverage is active, mode constraints tighten further — daily caps halve again on top of Slow Zone.
- Put Wall = SpotGamma level where dealer put hedging creates buying pressure (floor). NOT the same as Master Eject/Kill Leverage.
- Hedge Wall = overhead resistance from dealer hedging. Key Gamma Strike = where positive gamma regime starts.
- HIRO positive=bullish flow, negative=bearish. Quartile context matters. Direction intraday: up=trim later, down=nibble later.
- Above gamma strike=positive gamma (stabilizing). Below=negative gamma (volatile).
- Slow Zone = D21 EMA × 0.98. Inactive in GREEN/YELLOW_IMPROVING. In ORANGE/RED reduces daily buy cap to 25% of normal.
- EJECTED mode triggers after 2 consecutive daily closes below W21 EMA. In EJECTED: block all buys except 200 SMA oversold override, hold 50% core TSLA, and on W21 reclaim the recovery posture resets to ORANGE — not GREEN/YELLOW.
- EMA Extension Zone is based on weekly 9 EMA: 8-12% = warming note, 12-18% = trim at mode rate (except GREEN exactly at 12%), 18-25% = trim regardless of mode, 25%+ = 1.5x trim rate.
- CRITICAL: Always check if Kill Leverage is active (price < masterEject). If active, state it explicitly. Do NOT say "if we're not in Kill Leverage" when the data shows price is below masterEject.

Voice: First person. No emojis. No headers. Just prose, like talking across the desk. 3-5 sentences, around 400-500 characters. Substantive but tight. Don't repeat Taylor — validate, challenge, or confirm.`;

interface AxelrodContext {
  taylorPost: string;
  quote?: TSLAQuote;
  report?: DailyReport | null;
  hiro?: HIROData;
  orb?: OrbData;
  portfolio?: MultiPortfolio;
  trade?: Trade;
}

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
 * Generate commentary via Gemini
 */
async function generateCommentary(context: AxelrodContext): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('No GEMINI_API_KEY for Axelrod commentary');
    return '';
  }

  // Build context
  let contextMsg = `Taylor just posted this to Discord:\n\n---\n${context.taylorPost}\n---\n\n`;
  
  if (context.quote) {
    contextMsg += `TSLA: $${context.quote.price.toFixed(2)} (${context.quote.changePercent >= 0 ? '+' : ''}${context.quote.changePercent.toFixed(2)}% today), Vol: ${(context.quote.volume / 1000000).toFixed(1)}M, Range: $${context.quote.low.toFixed(2)}-$${context.quote.high.toFixed(2)}\n`;
  }
  
  if (context.report) {
    contextMsg += `Mode: ${context.report.mode} | Tier: ${context.report.tier}\n`;
    contextMsg += `Levels: Gamma Strike $${context.report.gammaStrike}, Put Wall $${context.report.putWall}, Hedge Wall $${context.report.hedgeWall}, Call Wall $${context.report.callWall}\n`;
    const klActive = context.quote && context.report.masterEject > 0 && context.quote.price < context.report.masterEject;
    contextMsg += `Master Eject (Kill Leverage): $${context.report.masterEject} — ${klActive ? '⛔ ACTIVE (price BELOW kill level)' : 'INACTIVE (price above kill level)'}\n`;
    if (context.report.levels?.length) {
      contextMsg += `Alert levels:\n`;
      for (const l of context.report.levels) contextMsg += `  ${l.name}: $${l.price} (${l.type})\n`;
    }
  }
  
  if (context.hiro) {
    const m = context.hiro.reading / 1000000;
    contextMsg += `HIRO: ${m >= 0 ? '+' : ''}${m.toFixed(0)}M (${context.hiro.percentile30Day.toFixed(0)}th pctl, ${context.hiro.character})\n`;
  }
  
  if (context.orb) {
    contextMsg += `Orb: ${context.orb.zone} (${context.orb.score.toFixed(3)})\n`;
    const active = context.orb.activeSetups.filter(s => s.status === 'active');
    const watching = context.orb.activeSetups.filter(s => s.status === 'watching');
    if (active.length) contextMsg += `Active: ${active.map(s => s.setup_id).join(', ')}\n`;
    if (watching.length) contextMsg += `Watching: ${watching.map(s => s.setup_id).join(', ')}\n`;
  }
  
  if (context.portfolio) {
    contextMsg += `Portfolio: $${context.portfolio.totalValue.toFixed(0)}`;
    if (context.portfolio.tsla) contextMsg += ` | TSLA: ${context.portfolio.tsla.shares}@$${context.portfolio.tsla.avgCost.toFixed(2)}`;
    if (context.portfolio.tsll) contextMsg += ` | TSLL: ${context.portfolio.tsll.shares}@$${context.portfolio.tsll.avgCost.toFixed(2)}`;
    contextMsg += `\n`;
  }

  if (context.trade) {
    contextMsg += `Trade: ${context.trade.action.toUpperCase()} ${context.trade.shares} ${context.trade.instrument} @ $${context.trade.price.toFixed(2)}`;
    if (context.trade.realizedPnl) contextMsg += ` | P&L: $${context.trade.realizedPnl.toFixed(2)}`;
    contextMsg += `\n`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: AXELROD_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: contextMsg }] }],
        generationConfig: { maxOutputTokens: 350, temperature: 0.9 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} — ${errText}`);
    }

    const data = await response.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Gemini Axelrod generation failed:', error);
    return '';
  }
}

/**
 * Post Axelrod's commentary to Discord
 */
export async function postAxelrodCommentary(context: AxelrodContext): Promise<void> {
  if (!webhookClient) initAxelrod();
  if (!webhookClient) return;

  try {
    const commentary = await generateCommentary(context);
    if (!commentary) return;

    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    await webhookClient.send({ content: commentary });
    console.log('🎩 axelrod commentary posted');
  } catch (error) {
    console.error('Error posting Axelrod commentary:', error);
  }
}
