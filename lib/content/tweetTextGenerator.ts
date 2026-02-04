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

// Mode metaphors for engaging descriptions - DIVERSE, rotate through these
const MODE_METAPHORS: Record<string, string[]> = {
  GREEN: [
    "smooth sailing. the wind is at your back.",
    "the tide is rising. all boats float.",
    "gravity is working in your favor.",
    "it's a tailwind day. lean into it.",
    "the current is with you. swim easy.",
    "green lights all the way down.",
    "the DJ is playing your song.",
    "momentum is a hell of a drug.",
  ],
  YELLOW: [
    "fog on the highway. drive carefully.",
    "mixed signals at the intersection.",
    "the weather can't decide what it wants.",
    "treading water. not sinking, not swimming.",
    "the jury is still out.",
    "neither here nor there. patience.",
    "the music is between songs.",
    "waiting room vibes. sit tight.",
  ],
  ORANGE: [
    "storm clouds forming. check your gear.",
    "the pressure is building.",
    "smoke before fire. stay alert.",
    "the referee is getting twitchy.",
    "something's brewing. smaller sips.",
    "tension in the air. feel it?",
    "the calm before... something.",
    "tread lightly. the floor is creaky.",
  ],
  RED: [
    "turbulence ahead. buckle up.",
    "the tide is going out fast.",
    "gravity just doubled.",
    "it's a headwind hurricane.",
    "the current is a riptide. don't fight it.",
    "all red lights. full stop.",
    "the DJ dropped the bass... and the speakers.",
    "chaos mode. defense wins championships.",
  ],
};

// Level metaphors - rotate these for variety
const LEVEL_METAPHORS = {
  call_wall: [
    "ceiling", "cap", "lid", "roof", "resistance zone", "upper bound", "glass ceiling",
  ],
  put_wall: [
    "floor", "foundation", "safety net", "trampoline", "lower bound", "support zone",
  ],
  gamma_strike: [
    "pivot point", "inflection zone", "mood line", "regime boundary", "character change level",
  ],
  hedge_wall: [
    "dealer defense", "hedge line", "risk boundary", "institutional anchor",
  ],
};

// Action descriptions for levels
const SUPPORT_ACTIONS = [
  "buyers showed up on schedule",
  "the floor held",
  "bounce city",
  "trampoline activated",
  "safety net caught it",
  "support did its job",
  "bulls defended the line",
];

const RESISTANCE_ACTIONS = [
  "sellers stepped in",
  "ceiling rejected it",
  "lid stayed on",
  "couldn't break through",
  "resistance held firm",
  "bears defended the zone",
];

/**
 * Get a random metaphor for a mode
 */
function getModeMeta(mode: string): string {
  const modeUpper = mode.toUpperCase();
  const metaphors = MODE_METAPHORS[modeUpper] || MODE_METAPHORS.YELLOW;
  return metaphors[Math.floor(Math.random() * metaphors.length)];
}

/**
 * Get a random level metaphor
 */
function getLevelMeta(levelType: keyof typeof LEVEL_METAPHORS): string {
  const options = LEVEL_METAPHORS[levelType];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get a random action description
 */
function getSupportAction(): string {
  return SUPPORT_ACTIONS[Math.floor(Math.random() * SUPPORT_ACTIONS.length)];
}

function getResistanceAction(): string {
  return RESISTANCE_ACTIONS[Math.floor(Math.random() * RESISTANCE_ACTIONS.length)];
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
      tweet += `called $${bestHit.price.toFixed(0)} ${getLevelMeta("put_wall")}.\n`;
      tweet += `actual low: $${bestHit.actualPrice?.toFixed(2)}\n\n`;
      tweet += `${getSupportAction()}.\n\n`;
    } else {
      tweet += `called $${bestHit.price.toFixed(0)} ${getLevelMeta("call_wall")}.\n`;
      tweet += `actual high: $${bestHit.actualPrice?.toFixed(2)}\n\n`;
      tweet += `${getResistanceAction()}.\n\n`;
    }
  }
  
  const pct = data.accuracy.percentage;
  const closers = [
    "structure > opinion.",
    "pattern recognition pays.",
    "levels don't lie.",
    "same playbook, different day.",
    "the math keeps mathing.",
  ];
  const closer = closers[Math.floor(Math.random() * closers.length)];
  
  if (pct >= 80) {
    tweet += `${pct.toFixed(0)}% accuracy. ${closer}\n\n`;
  } else if (pct >= 60) {
    tweet += `${pct.toFixed(0)}% accuracy. solid day.\n\n`;
  } else {
    tweet += `${pct.toFixed(0)}% accuracy. chaos won this round.\n\n`;
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
  
  let tweet = `tsla mode — ${dateFormatted}\n\n`;
  tweet += `${modeUpper.toLowerCase()} mode.\n`;
  tweet += `${modeMeta}\n\n`;
  
  // Key levels with rotating metaphors
  if (data.levels.call_wall) {
    tweet += `${getLevelMeta("call_wall")}: $${data.levels.call_wall.toFixed(0)}\n`;
  }
  if (data.levels.gamma_strike) {
    tweet += `${getLevelMeta("gamma_strike")}: $${data.levels.gamma_strike.toFixed(0)}\n`;
  }
  if (data.levels.put_wall) {
    tweet += `${getLevelMeta("put_wall")}: $${data.levels.put_wall.toFixed(0)}\n`;
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
 * Multiple metaphor sets for variety.
 */
export function generateEducationalThread(topic: string): string[] {
  const threads: Record<string, string[][]> = {
    // Multiple versions of gamma basics - pick one randomly
    "gamma-basics": [
      // Casino version
      [
        `how tsla actually moves — explained like you're five:\n\nthe casino analogy 🎰\n\nput wall = the floor manager\n\nwhen price drops here, dealers HAVE to buy. not because they want to — because their risk models force them to.\n\nmechanical bounce, not hope.`,
        `call wall = the ceiling bouncer\n\nwhen price hits here, dealers HAVE to sell.\n\nthey're not bearish. just hedging. but the effect is the same — price struggles to break through.`,
        `gamma strike = the vibe shift line\n\nabove it: smooth trends. dips get bought.\nbelow it: chaos. moves are violent.\n\nsame stock. completely different game.`,
      ],
      // Ocean/weather version
      [
        `how tsla actually moves — the ocean analogy 🌊\n\nput wall = the sea floor\n\nwhen price sinks here, a massive wave of buying kicks in. not voluntary — it's physics.\n\nthe tide has to come back in.`,
        `call wall = the storm ceiling\n\nwhen price rises here, pressure builds until it can't anymore.\n\nthe atmosphere literally pushes back.\n\nbreaking through takes serious energy.`,
        `gamma strike = the pressure line\n\nabove it: calm seas. smooth sailing.\nbelow it: storm mode. waves amplify.\n\nsame ocean. different weather systems.`,
      ],
      // Traffic version
      [
        `how tsla actually moves — the highway analogy 🚗\n\nput wall = the speed bump\n\nwhen price drops here, institutional traffic HAS to slow down and buy.\n\nit's not optional. it's how their engines work.`,
        `call wall = the toll booth\n\nwhen price hits here, everyone has to stop and pay.\n\nselling pressure backs up. breaking through costs extra.`,
        `gamma strike = the highway split\n\nabove it: express lane. smooth acceleration.\nbelow it: construction zone. stop and go chaos.\n\nsame road. different rules.`,
      ],
    ],
    "mode-system": [
      [
        `why modes matter more than predictions:\n\nthe market doesn't care about your opinion.\n\nbut it does respect structure.\n\nmodes = how much chaos to expect.`,
        `green mode = tailwind\n\nthe current is with you. trends persist. dips get bought.\n\nbigger swings make sense.`,
        `yellow mode = crosswind\n\nno clear direction. turbulence possible.\n\nsmaller positions. wait for clarity.`,
        `orange mode = headwind building\n\npressure rising. something's coming.\n\ntighten up. stay nimble.`,
        `red mode = hurricane\n\neverything amplifies. nothing holds.\n\ndefense only. cash is a position.`,
      ],
    ],
    "flow-basics": [
      [
        `why most traders are always late:\n\nprice is the last thing to move.\n\nflow moves first. (institutions repositioning)\nstructure moves second. (levels shifting)\nprice moves third. (what you see)\n\nmost watch price and react.\nthe edge is watching flow and anticipating.`,
        `hiro = institutional whisper network\n\npositive = big money accumulating\nnegative = big money distributing\n\nthis updates in real time.\n\nmost traders don't even know it exists.`,
        `the trap:\n\nretail watches price.\ninstitutions watch flow.\n\none group consistently wins.\n\nbe the flow watcher.`,
      ],
    ],
  };
  
  const topicThreads = threads[topic];
  if (!topicThreads || topicThreads.length === 0) return [];
  
  // Pick a random version
  const version = topicThreads[Math.floor(Math.random() * topicThreads.length)];
  return version;
}
