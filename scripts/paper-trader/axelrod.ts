/**
 * Axelrod — Commentary Engine for Paper Trading Bot
 * 
 * Bobby Axelrod provides substantive market commentary on every Taylor post.
 * Uses LLM to generate contextual, informative reactions with Axelrod's voice.
 * 
 * Taylor posts → 3-5s delay → Axelrod reacts.
 * Taylor NEVER responds to Axelrod. One-way dynamic.
 */

import { WebhookClient } from 'discord.js';
import type { TSLAQuote, HIROData, DailyReport, OrbData, MultiPortfolio, Trade } from './types';

// Same webhook, different persona
const DISCORD_WEBHOOK_URL = process.env.PAPER_TRADER_WEBHOOK_URL 
  || 'https://discord.com/api/webhooks/1471201795404595414/ENwqrjgFHWk387SQ7jYqv6sHCFNTAicwkztTzd367xkDNowmWOHPJXn82e4-vpaKpHph';

let webhookClient: WebhookClient | null = null;

const AXELROD_USERNAME = 'Axe';
const AXELROD_AVATAR = 'https://www.flacko.ai/avatars/axe.jpg';

const AXELROD_SYSTEM_PROMPT = `You are Bobby Axelrod from Billions — but you're commenting on a paper trading bot's moves in a Discord channel.

Your role: You are the VALIDATION LAYER. Your job is to check whether Taylor's decisions and commentary actually make sense given the data. You cross-reference the trade against the levels, the Orb zone, the flow data, the mode — and you call out anything that doesn't add up. When the logic is sound, you explain WHY it's sound so subscribers learn something. When something is off, you flag it clearly.

Your personality:
- Confident, sharp, sometimes cutting — but always backed by real insight
- You respect good trades and call out risky ones honestly
- You size up risk/reward like a pro. You think in probabilities, not certainties.
- You reference real market dynamics: gamma positioning, dealer flows, support/resistance, catalysts
- You have opinions. "I'd have sized bigger." "That stop is too tight." "This is the right read."
- You're not a cheerleader. If the trade contradicts the data, say so. If it's brilliant, give credit.
- You occasionally reference the bigger picture — macro, sentiment, what other players are doing
- You're entertaining but INFORMATIVE. Every comment teaches something.

Validation checks you should run:
- Does the trade direction match the Orb zone? (e.g., buying in CAUTION = flag it)
- Does the entry price align with a key level from the report? Or is it in no-man's-land?
- Does the position size match the mode guidance? (GREEN=25%, YELLOW=15%, ORANGE=10%, RED=5%)
- Is HIRO flow confirming or diverging from the trade direction?
- Is the instrument choice correct for the zone? (TSLL only in FULL_SEND)
- Does the stop/target make sense relative to key levels?
- Are there catalysts (earnings, CPI, FOMC) that add risk Taylor didn't mention?
- If Taylor is holding through a zone downgrade, is that justified?

When validating:
- If everything checks out: explain the confluence — "Three things line up here: ..."
- If something's off: flag it specifically — "The Orb says NEUTRAL but Taylor's sizing like it's FULL SEND. That's a 2x overweight."
- If there's hidden risk: surface it — "CPI prints in 14 hours and this position has no hedge."

Voice rules:
- Write in first person. You're Bobby Axelrod.
- No emojis (maybe one occasionally for emphasis)
- No headers or formatting — just prose, like you're talking across the desk
- Length depends on what's happening. Quick validation for routine stuff, detailed breakdown for trades.
- Don't repeat what Taylor just said. Validate it, challenge it, or confirm it.
- Never address Taylor directly or expect a response. You're talking to the room.

You will receive:
1. Taylor's post (what was just posted to Discord)
2. Full market context (price, levels, Orb zone, HIRO, report data, portfolio)

SYSTEM KNOWLEDGE (source of truth — use this to validate Taylor):

Modes & Daily Caps:
- GREEN: up to 25% daily cap. Favorable conditions.
- YELLOW: 15% or less. Proceed with caution.
- ORANGE: 10% or less. Elevated caution.
- RED: 5% or less. Defensive, nibbles only.
- Trim cap: 25% of remaining per level hit.

Slow Zone:
- A price level (from the daily report) where the cap reduces to 2.5%.
- If price is in the Slow Zone, even a GREEN mode becomes constrained. Flag any trades that ignore Slow Zone.
- It's called "Slow Zone" (NOT "Pause Zone" — rebranded Jan 30, 2026).

Master Eject (MULTI-STEP):
- The master eject is NOT a single "exit everything" level.
- It can have multiple steps, e.g.: Step 1 at $423.75 = "cut leverage, hold shares" / Step 2 at $380 = "trim to 50%"
- The ACTION for each eject level comes from the daily report. Never assume "exit all."
- Validate that Taylor follows the correct step for the current price.

Alert Levels Structure:
- T1-T4: Trim targets (resistance levels where you take profit)
- S1-S2: Support/buy zones (where you add position)
- Each level has a specific action: "Nibble 10% of cap", "Trim 25% of remaining", etc.
- Validate entries happen near S levels and exits near T levels. Buying at T levels or selling at S levels = flag it.

Orb Zones (from backtested data):
- FULL_SEND: Multiple buy signals active, no avoids. Avg +6.2% at 20 days (66% win rate). Use TSLL (2x leverage).
- NEUTRAL: Mixed signals. Hold existing, no urgency. Use TSLA shares only.
- CAUTION: Avoid signals outweigh buys. Avg -1.2% at 20 days (41% win rate). No new buys. Trim TSLL first.
- DEFENSIVE: Multiple avoids active. Avg -1.8% at 20 days. Exit ALL TSLL immediately. Protect capital.

TSLL Rules:
- TSLL (2x leveraged TSLA ETF) is ONLY used in FULL_SEND zone.
- TSLL position size = 50% of mode allocation (because 2x = same notional exposure).
- Zone drops from FULL_SEND to NEUTRAL: hold existing TSLL, no new TSLL.
- Zone drops to CAUTION: sell TSLL before trimming TSLA.
- Zone drops to DEFENSIVE: liquidate ALL TSLL immediately regardless of P&L.

HIRO (Hedging Impact on Real-time Options):
- Positive HIRO = dealers buying = bullish flow support
- Negative HIRO = dealers selling/hedging = bearish pressure
- Context matters: HIRO in upper quartile of 30-day range = strong conviction. Lower quartile = caution.
- HIRO divergence from price (price up but HIRO negative) is a warning signal.

Gamma Regime:
- Above Key Gamma Strike = positive gamma. Dealers buy dips, sell rips. Stabilizing.
- Below Key Gamma Strike = negative gamma. Dealers amplify moves. Volatile.

Key Gamma Strike is in the report. If Taylor enters a position below the gamma strike, flag the increased volatility risk.

Cross-reference everything. Give your verdict. No preamble — just start talking.`;

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
    webhookClient = new WebhookClient({ url: DISCORD_WEBHOOK_URL });
    return true;
  } catch (error) {
    console.error('Failed to initialize Axelrod webhook:', error);
    return false;
  }
}

/**
 * Generate Axelrod's commentary via LLM
 */
async function generateCommentary(context: AxelrodContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  // Build context message
  let contextMsg = `Taylor just posted this to Discord:\n\n---\n${context.taylorPost}\n---\n\n`;
  
  if (context.quote) {
    contextMsg += `Current market data:\n`;
    contextMsg += `TSLA: $${context.quote.price.toFixed(2)} (${context.quote.changePercent >= 0 ? '+' : ''}${context.quote.changePercent.toFixed(2)}% today)\n`;
    contextMsg += `Volume: ${(context.quote.volume / 1000000).toFixed(1)}M\n`;
    contextMsg += `Day range: $${context.quote.low.toFixed(2)} - $${context.quote.high.toFixed(2)}\n`;
  }
  
  if (context.report) {
    contextMsg += `\nDaily Report context:\n`;
    contextMsg += `Mode: ${context.report.mode} | Tier: ${context.report.tier}\n`;
    contextMsg += `Key SpotGamma levels: Gamma Strike $${context.report.gammaStrike}, Put Wall $${context.report.putWall}, Hedge Wall $${context.report.hedgeWall}, Call Wall $${context.report.callWall}\n`;
    contextMsg += `Master Eject: $${context.report.masterEject}\n`;
    if (context.report.levels && context.report.levels.length > 0) {
      contextMsg += `Full alert levels from report:\n`;
      for (const level of context.report.levels) {
        contextMsg += `  ${level.name}: $${level.price} (${level.type})\n`;
      }
    }
    if (context.report.commentary) {
      contextMsg += `Report commentary: ${context.report.commentary}\n`;
    }
  }
  
  if (context.hiro) {
    const readingM = context.hiro.reading / 1000000;
    contextMsg += `\nHIRO: ${readingM >= 0 ? '+' : ''}${readingM.toFixed(0)}M (${context.hiro.percentile30Day.toFixed(0)}th percentile, ${context.hiro.character})\n`;
  }
  
  if (context.orb) {
    contextMsg += `\nOrb Score: ${context.orb.score.toFixed(3)} (${context.orb.zone})\n`;
    const active = context.orb.activeSetups.filter(s => s.status === 'active');
    const watching = context.orb.activeSetups.filter(s => s.status === 'watching');
    if (active.length > 0) contextMsg += `Active setups: ${active.map(s => s.setup_id).join(', ')}\n`;
    if (watching.length > 0) contextMsg += `Watching: ${watching.map(s => s.setup_id).join(', ')}\n`;
  }
  
  if (context.portfolio) {
    contextMsg += `\nPortfolio: $${context.portfolio.totalValue.toFixed(0)} total`;
    if (context.portfolio.tsla) {
      contextMsg += ` | TSLA: ${context.portfolio.tsla.shares} shares @ $${context.portfolio.tsla.avgCost.toFixed(2)} (${context.portfolio.tsla.pnlPercent >= 0 ? '+' : ''}${context.portfolio.tsla.pnlPercent.toFixed(1)}%)`;
    }
    if (context.portfolio.tsll) {
      contextMsg += ` | TSLL: ${context.portfolio.tsll.shares} shares @ $${context.portfolio.tsll.avgCost.toFixed(2)} (${context.portfolio.tsll.pnlPercent >= 0 ? '+' : ''}${context.portfolio.tsll.pnlPercent.toFixed(1)}%)`;
    }
    contextMsg += `\n`;
  }

  if (context.trade) {
    contextMsg += `\nTrade details: ${context.trade.action.toUpperCase()} ${context.trade.shares} ${context.trade.instrument} @ $${context.trade.price.toFixed(2)}`;
    if (context.trade.realizedPnl) contextMsg += ` | Realized P&L: $${context.trade.realizedPnl.toFixed(2)}`;
    if (context.trade.orbActiveSetups && context.trade.orbActiveSetups.length > 0) {
      contextMsg += `\nOrb setups at entry: ${context.trade.orbActiveSetups.map(s => s.setup_id).join(', ')}`;
    }
    contextMsg += `\n`;
  }

  // Try Anthropic first, then OpenAI
  if (process.env.ANTHROPIC_API_KEY) {
    return await generateViaAnthropic(contextMsg);
  } else if (process.env.OPENAI_API_KEY) {
    return await generateViaOpenAI(contextMsg);
  }
  
  // Fallback — no API key available
  console.warn('No LLM API key for Axelrod commentary');
  return '';
}

/**
 * Generate via Anthropic Claude
 */
async function generateViaAnthropic(contextMsg: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 800,
        system: AXELROD_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: contextMsg }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (error) {
    console.error('Anthropic Axelrod generation failed:', error);
    return '';
  }
}

/**
 * Generate via OpenAI
 */
async function generateViaOpenAI(contextMsg: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        messages: [
          { role: 'system', content: AXELROD_SYSTEM_PROMPT },
          { role: 'user', content: contextMsg },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI Axelrod generation failed:', error);
    return '';
  }
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
    // Generate commentary
    const commentary = await generateCommentary(context);
    if (!commentary) return;

    // Wait 3-5 seconds after Taylor's post
    const delay = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Post as Axelrod
    await webhookClient.send({
      content: commentary,
      username: AXELROD_USERNAME,
      avatarURL: AXELROD_AVATAR,
    });

    console.log('🎩 axelrod commentary posted');
  } catch (error) {
    console.error('Error posting Axelrod commentary:', error);
    // Don't throw — Axelrod failing shouldn't break Taylor
  }
}
