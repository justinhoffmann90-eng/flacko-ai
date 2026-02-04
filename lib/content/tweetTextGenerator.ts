/**
 * Tweet Text Generator
 * 
 * Generates ready-to-post tweet text in @ssj100trunks voice.
 * 
 * STYLE RULES:
 * - Always lowercase
 * - Short punchy sentences
 * - White space between ideas
 * - Fun metaphors for complex concepts
 * - Make reader feel smarter
 * - Leave them wanting more
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

interface ForecastTweetData {
  date: string;
  accuracy: {
    held: number;
    notTested: number;
    total: number;
    percentage: number;
  };
  results: Array<{
    name: string;
    price: number;
    type: "resistance" | "support";
    status: "held" | "broken" | "not_tested";
    actualPrice: number | null;
  }>;
}

// Mode metaphors for engaging descriptions
const MODE_METAPHORS: Record<string, string[]> = {
  GREEN: [
    "the casino is calm. trends are smooth.",
    "dealers are buying dips for you.",
    "positive gamma = wind at your back.",
  ],
  YELLOW: [
    "mixed signals. trade what you see.",
    "not smooth, not chaos. somewhere in between.",
    "respect the levels, size accordingly.",
  ],
  ORANGE: [
    "elevated caution. the house is watching.",
    "volatility compression before expansion.",
    "smaller bets, tighter stops.",
  ],
  RED: [
    "the casino is on fire. nothing holds.",
    "negative gamma = amplified chaos.",
    "defense wins championships.",
  ],
};

/**
 * Get a random metaphor for a mode
 */
function getModeMeta(mode: string): string {
  const modeUpper = mode.toUpperCase();
  const metaphors = MODE_METAPHORS[modeUpper] || MODE_METAPHORS.YELLOW;
  return metaphors[Math.floor(Math.random() * metaphors.length)];
}

/**
 * Generate morning levels tweet in trunks voice.
 */
export function generateMorningTweet(data: MorningTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d").toLowerCase();
  const modeUpper = data.mode.toUpperCase();
  const modeMeta = getModeMeta(modeUpper);
  
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
  
  let tweet = `tsla levels — ${dateFormatted}\n\n`;
  tweet += `${data.modeEmoji} ${modeUpper.toLowerCase()} mode\n`;
  tweet += `${modeMeta}\n\n`;
  
  if (r1) {
    tweet += `ceiling: $${r1.price} (${r1.name.toLowerCase()})\n`;
  }
  if (s1) {
    tweet += `floor: $${s1.price} (${s1.name.toLowerCase()})\n`;
  }
  
  tweet += `\ndaily cap: ${data.dailyCap}%\n\n`;
  tweet += `full playbook → flacko.ai`;
  
  return tweet;
}

/**
 * Generate EOD accuracy tweet in trunks voice.
 */
export function generateEODTweet(data: EODTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d").toLowerCase();
  
  // Find best call (hit level with smallest distance)
  const hitLevels = data.results.filter(r => r.status === "hit");
  
  let tweet = `tsla accuracy check — ${dateFormatted}\n\n`;
  
  if (hitLevels.length > 0) {
    const bestHit = hitLevels.sort((a, b) => 
      (a.distance || 999) - (b.distance || 999)
    )[0];
    
    const isSupport = bestHit.type === "support";
    
    if (isSupport) {
      tweet += `called $${bestHit.price.toFixed(0)} support.\n`;
      tweet += `actual low: $${bestHit.actualPrice?.toFixed(2)}\n\n`;
      tweet += `dealers bought the dip exactly where we said they would.\n\n`;
    } else {
      tweet += `called $${bestHit.price.toFixed(0)} resistance.\n`;
      tweet += `actual high: $${bestHit.actualPrice?.toFixed(2)}\n\n`;
      tweet += `ceiling bouncer did its job.\n\n`;
    }
  }
  
  const pct = data.accuracy.percentage;
  if (pct >= 80) {
    tweet += `${pct.toFixed(0)}% accuracy. structure > opinion.\n\n`;
  } else if (pct >= 60) {
    tweet += `${pct.toFixed(0)}% accuracy. some levels missed, most held.\n\n`;
  } else {
    tweet += `${pct.toFixed(0)}% accuracy. volatile day broke structure.\n\n`;
  }
  
  tweet += `track record → flacko.ai/accuracy`;
  
  return tweet;
}

/**
 * Generate forecast vs actual tweet in trunks voice.
 */
export function generateForecastTweet(data: ForecastTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d").toLowerCase();
  
  // Group results
  const held = data.results.filter(r => r.status === "held");
  const broken = data.results.filter(r => r.status === "broken");
  const notTested = data.results.filter(r => r.status === "not_tested");
  
  let tweet = `morning forecast vs reality — ${dateFormatted}\n\n`;
  
  // Highlight key results
  if (held.length > 0) {
    const bestHold = held[0];
    const typeWord = bestHold.type === "support" ? "floor" : "ceiling";
    tweet += `called $${bestHold.price.toFixed(0)} ${typeWord} → held ✅\n`;
  }
  
  if (broken.length > 0) {
    const worstBreak = broken[0];
    const typeWord = worstBreak.type === "support" ? "floor" : "ceiling";
    tweet += `$${worstBreak.price.toFixed(0)} ${typeWord} → broke ❌\n`;
  }
  
  if (notTested.length > 0 && notTested.length <= 2) {
    tweet += `${notTested.length} level${notTested.length > 1 ? 's' : ''} not tested\n`;
  }
  
  tweet += `\n`;
  
  // Summary with personality
  const pct = data.accuracy.percentage;
  if (pct >= 80) {
    tweet += `${pct.toFixed(0)}% accuracy.\n\n`;
    tweet += `same patterns. same outcomes.\n`;
    tweet += `structure doesn't lie.`;
  } else if (pct >= 60) {
    tweet += `${pct.toFixed(0)}% accuracy.\n\n`;
    tweet += `some chaos, but levels mostly held.\n`;
    tweet += `good enough to stay profitable.`;
  } else {
    tweet += `${pct.toFixed(0)}% accuracy.\n\n`;
    tweet += `wild day broke the playbook.\n`;
    tweet += `that's why we have modes.`;
  }
  
  tweet += `\n\n$tsla`;
  
  return tweet;
}

function formatModePrice(value?: number | null) {
  if (!value || Number.isNaN(value)) return "—";
  return `$${value.toFixed(0)}`;
}

/**
 * Generate mode tweet in trunks voice with metaphors.
 */
export function generateModeTweet(data: ModeTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d").toLowerCase();
  const modeUpper = data.mode.toUpperCase();
  const modeMeta = getModeMeta(modeUpper);
  const dailyCapText = String(data.dailyCap).replace('%', '');
  
  let tweet = `tsla mode update — ${dateFormatted}\n\n`;
  tweet += `${modeUpper.toLowerCase()} mode active.\n`;
  tweet += `${modeMeta}\n\n`;
  
  // Key levels with metaphors
  if (data.levels.call_wall) {
    tweet += `call wall $${data.levels.call_wall.toFixed(0)} (ceiling bouncer)\n`;
  }
  if (data.levels.gamma_strike) {
    tweet += `gamma strike $${data.levels.gamma_strike.toFixed(0)} (vibe shift line)\n`;
  }
  if (data.levels.put_wall) {
    tweet += `put wall $${data.levels.put_wall.toFixed(0)} (floor manager)\n`;
  }
  
  tweet += `\nmax exposure: ${dailyCapText}%\n\n`;
  tweet += `full report → flacko.ai`;
  
  return tweet;
}

/**
 * Generate alternative tweet variations in trunks voice.
 * Returns 3 different styles for the same content.
 */
export function generateTweetVariations(data: EODTweetData): string[] {
  const dateFormatted = format(parseISO(data.date), "MMM d").toLowerCase();
  const hitLevels = data.results.filter(r => r.status === "hit");
  
  const variations: string[] = [];
  
  // Variation 1: Story-focused
  if (hitLevels.length > 0) {
    const bestHit = hitLevels[0];
    const typeWord = bestHit.type === "support" ? "floor" : "ceiling";
    variations.push(
      `tsla — ${dateFormatted}\n\n` +
      `morning: "watch $${bestHit.price.toFixed(0)} as ${typeWord}"\n` +
      `market: tests $${bestHit.actualPrice?.toFixed(2)}, bounces\n\n` +
      `same script. different day.\n\n` +
      `${data.accuracy.percentage.toFixed(0)}% accuracy → flacko.ai`
    );
  }
  
  // Variation 2: Minimalist
  variations.push(
    `tsla levels — ${dateFormatted}\n\n` +
    `✅ ${data.accuracy.hit} held\n` +
    `❌ ${data.accuracy.broken || 0} broke\n` +
    `➖ ${data.accuracy.notTested || 0} not tested\n\n` +
    `${data.accuracy.percentage.toFixed(0)}%\n\n` +
    `structure works. → flacko.ai`
  );
  
  // Variation 3: Insight-focused
  if (hitLevels.length > 0) {
    const supportHits = hitLevels.filter(h => h.type === "support");
    
    if (supportHits.length > 0) {
      variations.push(
        `tsla — ${dateFormatted}\n\n` +
        `support held where dealers had to buy.\n\n` +
        `not magic. not luck.\n` +
        `just understanding who's forced to do what.\n\n` +
        `${data.accuracy.percentage.toFixed(0)}% accuracy\n\n` +
        `track record → flacko.ai/accuracy`
      );
    } else {
      variations.push(
        `tsla — ${dateFormatted}\n\n` +
        `resistance capped exactly where dealers hedge.\n\n` +
        `the ceiling bouncer showed up on schedule.\n\n` +
        `${data.accuracy.percentage.toFixed(0)}% accuracy\n\n` +
        `track record → flacko.ai/accuracy`
      );
    }
  }
  
  return variations;
}

/**
 * Generate a thread-style educational tweet.
 * Used for deeper content like the casino analogy.
 */
export function generateEducationalThread(topic: string): string[] {
  const threads: Record<string, string[]> = {
    "gamma-basics": [
      `how tsla actually moves — explained like you're five:\n\nthe casino analogy 🎰\n\nput wall = the floor manager who stops the bleeding\n\nwhen price drops here, dealers HAVE to buy. not because they want to — because their risk models force them to.\n\nit's a mechanical bounce, not hope.`,
      `call wall = the ceiling bouncer\n\nwhen price hits here, dealers HAVE to sell.\n\nthey're not bearish. they're just hedging. but the effect is the same — price struggles to break through.`,
      `gamma strike = the vibe shift line\n\nabove it: the casino is calm. trends are smooth. dips get bought.\n\nbelow it: the casino is chaos. moves are violent. nothing holds.\n\nsame tsla. completely different game depending on which side you're on.`,
      `hiro = the pit boss whispering in your ear\n\npositive hiro = "big money is quietly buying"\nnegative hiro = "big money is heading for the exits"\n\nthis updates in real time. most traders don't even know it exists.`,
      `the trap:\n\nretail watches the cards (price).\nthe house watches the chip flow.\n\nguess who wins more often.`,
    ],
    "mode-system": [
      `why modes matter more than predictions:\n\nthe market doesn't care about your opinion.\n\nbut it does respect structure.\n\nmodes tell you how much chaos to expect — and how much risk to take.`,
      `green mode = positive gamma\n\nthe casino is calm. dips get bought mechanically.\n\nlarger positions make sense. trends are your friend.`,
      `yellow mode = mixed signals\n\nsome structure, some chaos. nothing clear.\n\nreduce size. trade what you see, not what you think.`,
      `orange mode = elevated caution\n\nvolatility compression before expansion.\n\nsmaller bets. tighter stops. wait for clarity.`,
      `red mode = negative gamma\n\nthe casino is on fire. nothing holds.\n\ndefense wins. nibbles only. cash is a position.`,
    ],
  };
  
  return threads[topic] || [];
}
