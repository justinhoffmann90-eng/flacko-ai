/**
 * Tweet Text Generator - Lord Pretty Flacko Persona
 * 
 * Battlefield briefing style - all lowercase, punchy, confident.
 * More content is better than too little.
 */

import { format, parseISO } from "date-fns";
import type { LevelResult } from "@/lib/accuracy/compareLevels";

interface MorningTweetData {
  date: string;
  mode: string;
  modeEmoji: string;
  dailyCap: string;
  levels: Array<{
    name: string;
    price: number;
    type: string;
  }>;
}

interface EODTweetData {
  date: string;
  accuracy: {
    hit: number;
    total: number;
    percentage: number;
    broken?: number;
    notTested?: number;
  };
  results: LevelResult[];
  ohlc: {
    high: number;
    low: number;
  };
}

interface ModeTweetData {
  date: string;
  mode: string;
  dailyCap: string | number;
  levels: {
    call_wall?: number | null;
    gamma_strike?: number | null;
    hedge_wall?: number | null;
    put_wall?: number | null;
  };
}

/**
 * Generate morning levels tweet - Lord Pretty Flacko battlefield briefing
 */
export function generateMorningTweet(data: MorningTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  const modeUpper = data.mode.toUpperCase();
  
  // Find key resistance and support levels
  const resistanceLevels = data.levels
    .filter(l => l.type === "upside" || l.type === "above")
    .sort((a, b) => a.price - b.price)
    .slice(0, 2);
  
  const supportLevels = data.levels
    .filter(l => l.type === "downside" || l.type === "below")
    .sort((a, b) => b.price - a.price)
    .slice(0, 2);
  
  const r1 = resistanceLevels[0];
  const s1 = supportLevels[0];
  
  // Mode context with battlefield metaphors
  const modeContext: Record<string, string> = {
    GREEN: "favorable conditions for expansion. the wind is at your back — use it.",
    YELLOW: "mixed signals on the battlefield. proceed with caution, size accordingly.",
    ORANGE: "storm clouds forming. defensive positioning required.",
    RED: "full defensive mode. capital preservation is the mission.",
  };
  
  let tweet = `intel update: $tsla daily levels — ${dateFormatted}\n\n`;
  tweet += `${data.modeEmoji} ${modeUpper} MODE\n`;
  tweet += `${modeContext[modeUpper] || modeContext.YELLOW}\n\n`;
  
  tweet += `key defensive lines:\n`;
  if (r1) tweet += `• resistance: $${r1.price} — ${r1.name} (ceiling)\n`;
  if (s1) tweet += `• support: $${s1.price} — ${s1.name} (floor)\n`;
  
  tweet += `\ndaily position cap: ${data.dailyCap}%\n\n`;
  tweet += `full war room intel + alerts → flacko.ai`;
  
  return tweet.toLowerCase();
}

/**
 * Generate EOD accuracy tweet - battlefield debrief style
 */
export function generateEODTweet(data: EODTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  
  // Find best call (hit level with smallest distance)
  const hitLevels = data.results.filter(r => r.status === "hit");
  const brokenLevels = data.results.filter(r => r.status === "broken");
  
  let tweet = `battlefield report: $tsla accuracy check — ${dateFormatted}\n\n`;
  
  if (hitLevels.length > 0) {
    const bestHit = hitLevels.sort((a, b) => 
      (a.distance || 999) - (b.distance || 999)
    )[0];
    
    const isSupport = bestHit.type === "support";
    const levelType = isSupport ? "support" : "resistance";
    const priceType = isSupport ? "Low" : "High";
    const action = isSupport ? "bounced" : "rejected";
    
    tweet += `morning defensive line: $${bestHit.price.toFixed(0)} ${levelType}\n`;
    tweet += `actual ${priceType.toLowerCase()}: $${bestHit.actualPrice?.toFixed(2)}\n`;
    tweet += `result: price ${action} within $${Math.abs((bestHit.distance || 0)).toFixed(2)} — defensive line held ✓\n\n`;
  }
  
  // Summary stats
  const pct = data.accuracy.percentage;
  tweet += `session results:\n`;
  tweet += `• ${data.accuracy.hit}/${data.accuracy.total} levels accurate\n`;
  tweet += `• ${pct.toFixed(0)}% hit rate\n\n`;
  
  // Battlefield insight based on performance
  if (pct >= 80) {
    tweet += `structure held well today. the defensive lines are solid.\n\n`;
  } else if (pct >= 60) {
    tweet += `solid session with some noise. key defensive positions mostly held.\n\n`;
  } else {
    tweet += `volatile session broke several lines. structural damage — reassess tomorrow.\n\n`;
  }
  
  tweet += `full battle log → flacko.ai/accuracy`;
  
  return tweet.toLowerCase();
}

/**
 * Generate mode tweet - battlefield intelligence style
 */
export function generateModeTweet(data: ModeTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  const modeUpper = String(data.mode).toUpperCase();
  const dailyCapText = String(data.dailyCap).replace('%', '');
  
  // Mode descriptions with war metaphors
  const modeDesc: Record<string, string> = {
    GREEN: "conditions favor expansion campaigns. offensive posture warranted.",
    YELLOW: "mixed intelligence from the field. trade what you see, not what you hope.",
    ORANGE: "elevated volatility risk detected. defensive formations required.",
    RED: "full defensive mode. survive to fight another day.",
  };
  
  let tweet = `intel update: $tsla mode — ${dateFormatted}\n\n`;
  tweet += `${getModeEmoji(modeUpper)} ${modeUpper} MODE\n`;
  tweet += `${modeDesc[modeUpper] || modeDesc.YELLOW}\n\n`;
  
  tweet += `key structural levels:\n`;
  if (data.levels.call_wall) {
    tweet += `• call wall: $${data.levels.call_wall.toFixed(0)} (dealer selling pressure)\n`;
  }
  if (data.levels.gamma_strike) {
    tweet += `• gamma strike: $${data.levels.gamma_strike.toFixed(0)} (regime change line)\n`;
  }
  if (data.levels.put_wall) {
    tweet += `• put wall: $${data.levels.put_wall.toFixed(0)} (dealer buying support)\n`;
  }
  
  tweet += `\nmax position size: ${dailyCapText}% of portfolio\n\n`;
  tweet += `full war room brief → flacko.ai`;
  
  return tweet.toLowerCase();
}

function getModeEmoji(mode: string): string {
  const m = mode.toUpperCase();
  if (m.includes('GREEN')) return '🟢';
  if (m.includes('YELLOW')) return '🟡';
  if (m.includes('ORANGE')) return '🟠';
  if (m.includes('RED')) return '🔴';
  return '🟡';
}

/**
 * Generate alternative tweet variations - Lord Pretty Flacko style
 */
export function generateTweetVariations(data: EODTweetData): string[] {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  const hitLevels = data.results.filter(r => r.status === "hit");
  
  const variations: string[] = [];
  
  // Variation 1: Story-based with mechanics explanation
  if (hitLevels.length > 0) {
    const bestHit = hitLevels[0];
    const levelType = bestHit.type === "support" ? "support" : "resistance";
    const action = bestHit.type === "support" ? "bounced" : "rejected";
    const mechanic = bestHit.type === "support" 
      ? "dealer hedging flows created mechanical buying at this level — not prediction, just how options structure works"
      : "dealer hedging flows created selling pressure at this level — structural resistance, not opinion";
    
    variations.push(
      (`$tsla level accuracy — ${dateFormatted}\n\n` +
      `this morning we flagged $${bestHit.price.toFixed(0)} as key ${levelType}.\n\n` +
      `what happened: price ${action} at $${bestHit.actualPrice?.toFixed(2)}\n\n` +
      `the mechanics: ${mechanic}\n\n` +
      `${data.accuracy.percentage.toFixed(0)}% accuracy today\n\n` +
      `battle log → flacko.ai/accuracy`).toLowerCase()
    );
  }
  
  // Variation 2: Data-focused with explanation
  const notTested = data.accuracy.notTested || 0;
  const broken = data.accuracy.broken || 0;
  variations.push(
    (`$tsla daily scorecard — ${dateFormatted}\n\n` +
    `levels called this morning vs actual price action:\n\n` +
    `✓ ${data.accuracy.hit} levels held — price respected the structure\n` +
    `✗ ${broken} levels broken — volatility exceeded defensive lines\n` +
    `— ${notTested} levels not tested — price stayed in range\n\n` +
    `overall: ${data.accuracy.percentage.toFixed(0)}% accuracy\n\n` +
    `these levels come from spotgamma dealer positioning data — mechanical, not magic.\n\n` +
    `methodology → flacko.ai`).toLowerCase()
  );
  
  // Variation 3: Insight-focused with education
  if (hitLevels.length > 0) {
    const supportHits = hitLevels.filter(h => h.type === "support");
    const resistanceHits = hitLevels.filter(h => h.type === "resistance");
    
    let insight = "";
    if (supportHits.length > 0) {
      insight = `support levels held today. when price approaches these zones, dealer hedging creates mechanical buying pressure — this is how gamma exposure works. not a prediction, just market structure.`;
    } else if (resistanceHits.length > 0) {
      insight = `resistance levels capped price today. at these levels, dealer hedging creates selling pressure that's difficult to push through without significant volume. structure beats opinion.`;
    }
    
    if (insight) {
      variations.push(
        (`$tsla structure check — ${dateFormatted}\n\n` +
        `${insight}\n\n` +
        `${data.accuracy.percentage.toFixed(0)}% of levels accurate today.\n\n` +
        `battle log → flacko.ai/accuracy`).toLowerCase()
      );
    }
  }
  
  return variations;
}

/**
 * Generate a thread-style educational tweet - Lord Pretty Flacko teaching style
 */
export function generateEducationalThread(topic: string): string[] {
  const threads: Record<string, string[][]> = {
    "gamma-basics": [
      [
        `how $tsla actually moves — the war room explains:\n\nthe casino isn't gambling — it's hedging.\n\nwhen you buy a call, the dealer must buy stock to hedge. when you buy a put, they sell stock.\n\nthis creates mechanical support and resistance. not predictions — structure.`,
        `call wall = the ceiling\n\nheavy call open interest means dealers are short calls. as price rises toward the strike, they must buy stock to hedge.\n\nbut once price passes through, they sell.\n\nthis is why call walls act as resistance. not opinion — math.`,
        `put wall = the floor\n\nheavy put open interest means dealers are short puts. as price drops toward the strike, they must sell stock to hedge their risk.\n\nbut once price drops through, they buy back.\n\nthis is why put walls act as support. mechanical, not magic.`,
        `gamma strike = the mood line\n\nabove it: positive gamma. dealers hedge WITH price moves, dampening volatility.\nbelow it: negative gamma. dealers hedge AGAINST price moves, amplifying volatility.\n\nsame stock. completely different battlefield.`,
      ],
    ],
    "mode-system": [
      [
        `soldier reminder: why the mode system exists\n\nthe market doesn't care about your opinion. but it does respect structure.\n\nmodes = how much chaos to expect and how to size accordingly.`,
        `green mode = tailwind\n\nthe current is with you. trends persist. dips get bought.\n\nposition size: up to 25%\nposture: offensive\nexpectation: expansion campaigns likely`,
        `yellow mode = crosswind\n\nno clear direction. turbulence possible.\n\nposition size: 15% max\nposture: selective\nexpectation: wait for clarity`,
        `orange mode = headwind building\n\npressure rising. something's coming.\n\nposition size: 10% max\nposture: defensive\nexpectation: volatility expansion`,
        `red mode = hurricane\n\neverything amplifies. nothing holds.\n\nposition size: 5% max\nposture: survival\nexpectation: capital preservation only`,
      ],
    ],
    "flow-basics": [
      [
        `intel update: why most traders are always late\n\nprice is the last thing to move.\n\nflow moves first. (institutions repositioning)\nstructure moves second. (levels shifting)\nprice moves third. (what you see)\n\nmost watch price and react. the edge is watching flow and anticipating.`,
        `hiro = institutional positioning radar\n\npositive = big money accumulating\nnegative = big money distributing\n\nthis updates in real time.\n\nmost traders don't even know it exists.`,
        `the trap:\n\nretail watches price.\ninstitutions watch flow.\n\none group consistently wins.\n\nbe the flow watcher.`,
      ],
    ],
  };
  
  const topicThreads = threads[topic];
  if (!topicThreads || topicThreads.length === 0) return [];
  
  // Pick a random version
  const version = topicThreads[Math.floor(Math.random() * topicThreads.length)];
  return version.map(tweet => tweet.toLowerCase());
}
