/**
 * Tweet Text Generator
 * 
 * Generates ready-to-post tweet text for morning and EOD cards.
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
 * Generate morning levels tweet text.
 */
export function generateMorningTweet(data: MorningTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  
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
  const r2 = resistanceLevels[1];
  const s1 = supportLevels[0];
  const s2 = supportLevels[1];
  
  let tweet = `$TSLA Daily Levels — ${dateFormatted}\n\n`;
  tweet += `${data.modeEmoji} ${data.mode} MODE | ${data.dailyCap}% daily cap\n\n`;
  
  if (r1 && r2) {
    tweet += `📈 ${r1.name}: $${r1.price} | ${r2.name}: $${r2.price}\n`;
  }
  
  if (s1 && s2) {
    tweet += `📉 ${s1.name}: $${s1.price} | ${s2.name}: $${s2.price}\n`;
  }
  
  tweet += `\nFull report: flacko.ai ⚔️`;
  
  return tweet;
}

/**
 * Generate EOD accuracy tweet text.
 * Highlights the best/most accurate call of the day.
 */
export function generateEODTweet(data: EODTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  
  // Find best call (hit level with smallest distance)
  const hitLevels = data.results.filter(r => r.status === "hit");
  
  let highlightText = "";
  
  if (hitLevels.length > 0) {
    // Find the most impressive hit (smallest distance)
    const bestHit = hitLevels.sort((a, b) => 
      (a.distance || 999) - (b.distance || 999)
    )[0];
    
    const isSupport = bestHit.type === "support";
    const levelType = isSupport ? "support" : "resistance";
    const action = isSupport ? "held" : "tested";
    
    highlightText = `Called $${bestHit.price.toFixed(2)} ${levelType} → ${action} at $${bestHit.actualPrice?.toFixed(2)} ✅`;
  } else if (data.results.length > 0) {
    // No hits, just mention accuracy percentage
    highlightText = `${data.accuracy.hit} levels hit, ${data.results.filter(r => r.status === "not_tested").length} not tested`;
  }
  
  let tweet = `$TSLA Accuracy Check — ${dateFormatted}\n\n`;
  
  if (highlightText) {
    tweet += `${highlightText}\n\n`;
  }
  
  tweet += `${data.accuracy.percentage.toFixed(0)}% accuracy today`;
  
  // Add context about performance
  if (data.accuracy.percentage >= 80) {
    tweet += ` 🎯`;
  }
  
  tweet += `\n\nTrack record: flacko.ai/accuracy ⚔️`;
  
  return tweet;
}

function formatModePrice(value?: number | null) {
  if (!value || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

export function generateModeTweet(data: ModeTweetData): string {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  const modeUpper = data.mode.toUpperCase();
  const dailyCapText = String(data.dailyCap).includes("%")
    ? String(data.dailyCap)
    : `${data.dailyCap}%`;

  let tweet = `🎯 TSLA Mode — ${dateFormatted}\n\n`;
  tweet += `Mode: ${modeUpper}\n\n`;
  tweet += `Key Levels:\n`;
  tweet += `• Call Wall: ${formatModePrice(data.levels.call_wall)}\n`;
  tweet += `• Gamma Strike: ${formatModePrice(data.levels.gamma_strike)}\n`;
  tweet += `• Hedge Wall: ${formatModePrice(data.levels.hedge_wall)}\n`;
  tweet += `• Put Wall: ${formatModePrice(data.levels.put_wall)}\n`;
  tweet += `\nDaily Cap: ${dailyCapText}\n\n`;
  tweet += `Full report → flacko.ai\n\n$TSLA`;

  return tweet;
}

/**
 * Generate alternative tweet variations.
 * Returns an array of 3 different tweet styles for the same content.
 */
export function generateTweetVariations(data: EODTweetData): string[] {
  const dateFormatted = format(parseISO(data.date), "MMM d");
  const hitLevels = data.results.filter(r => r.status === "hit");
  
  const variations: string[] = [];
  
  // Variation 1: Focus on best call
  if (hitLevels.length > 0) {
    const bestHit = hitLevels[0];
    variations.push(
      `$TSLA — ${dateFormatted}\n\n` +
      `✅ ${bestHit.level} at $${bestHit.price} → ` +
      `${bestHit.type === "support" ? "held" : "tested"} at $${bestHit.actualPrice?.toFixed(2)}\n\n` +
      `${data.accuracy.hit}/${data.accuracy.total} levels accurate\n\n` +
      `flacko.ai/accuracy ⚔️`
    );
  }
  
  // Variation 2: Stats-focused
  variations.push(
    `$TSLA Levels — ${dateFormatted}\n\n` +
    `✅ ${data.accuracy.hit} hit\n` +
    `❌ ${data.accuracy.broken} broken\n` +
    `⏸️ ${data.accuracy.notTested} not tested\n\n` +
    `${data.accuracy.percentage.toFixed(0)}% accuracy\n\n` +
    `flacko.ai ⚔️`
  );
  
  // Variation 3: Narrative
  if (hitLevels.length > 0) {
    const supportHits = hitLevels.filter(h => h.type === "support");
    const resistanceHits = hitLevels.filter(h => h.type === "resistance");
    
    let narrative = "";
    if (supportHits.length > 0) {
      narrative = `Support levels held exactly as called`;
    } else if (resistanceHits.length > 0) {
      narrative = `Resistance levels tested precisely`;
    }
    
    if (narrative) {
      variations.push(
        `$TSLA — ${dateFormatted}\n\n` +
        `${narrative}\n\n` +
        `${data.accuracy.percentage.toFixed(0)}% accuracy today\n\n` +
        `Full track record: flacko.ai/accuracy ⚔️`
      );
    }
  }
  
  return variations;
}
