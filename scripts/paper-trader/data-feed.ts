/**
 * Flacko Paper Trader Bot — Data Feed
 * Fetches TSLA price, HIRO data, and daily report from various sources
 */

import yahooFinance from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';
import type {
  TSLAQuote,
  HIROData,
  DailyReport,
  OrbData,
  OrbZone,
} from './types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SPOT_GAMMA_API_KEY = process.env.SPOT_GAMMA_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Orb Score constants (copied from lib/orb/score.ts)
const SETUP_TYPES: Record<string, "buy" | "avoid"> = {
  "smi-oversold-gauge": "buy", "oversold-extreme": "buy", "regime-shift": "buy",
  "deep-value": "buy", "green-shoots": "buy", "momentum-flip": "buy",
  "trend-confirm": "buy", "trend-ride": "buy", "trend-continuation": "buy",
  "goldilocks": "buy", "capitulation": "buy",
  "smi-overbought": "avoid", "dual-ll": "avoid", "overextended": "avoid",
  "momentum-crack": "avoid", "ema-shield-caution": "avoid", "ema-shield-break": "avoid",
};

const WEIGHTS: Record<string, number> = {
  "oversold-extreme": 0.60, "capitulation": 0.51, "momentum-crack": 0.22,
  "overextended": 0.49, "deep-value": 0.47, "goldilocks": 0.44,
  "smi-overbought": 0.44, "trend-confirm": 0.43, "regime-shift": 0.28,
  "ema-shield-caution": 0.39, "dual-ll": 0.39, "trend-ride": 0.35,
  "momentum-flip": 0.33, "green-shoots": 0.32, "smi-oversold-gauge": 0.47,
  "trend-continuation": 0.47, "ema-shield-break": 0.30,
};

const THRESHOLDS = { FULL_SEND: 0.686, NEUTRAL: -0.117, CAUTION: -0.729 };

// Cache for HIRO data (fallback if API unavailable)
let hiroCache: HIROData | null = null;
let lastHiroFetch = 0;
const HIRO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch price via Yahoo Finance chart API (more reliable than quote endpoint)
 */
async function fetchPriceViaChart(symbol: string): Promise<TSLAQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Chart API ${res.status}: ${res.statusText}`);
  const json = await res.json() as any;
  const meta = json.chart.result[0].meta;
  return {
    symbol: meta.symbol,
    price: meta.regularMarketPrice || 0,
    change: (meta.regularMarketPrice || 0) - (meta.previousClose || meta.chartPreviousClose || 0),
    changePercent: meta.previousClose ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 : 0,
    volume: meta.regularMarketVolume || 0,
    open: json.chart.result[0].indicators?.quote?.[0]?.open?.[0] || 0,
    high: meta.regularMarketDayHigh || 0,
    low: meta.regularMarketDayLow || 0,
    previousClose: meta.previousClose || meta.chartPreviousClose || 0,
    timestamp: new Date(),
  };
}

/**
 * Fetch current TSLA price (chart API with yahoo-finance2 fallback)
 */
export async function fetchTSLAPrice(): Promise<TSLAQuote> {
  try {
    return await fetchPriceViaChart('TSLA');
  } catch {
    try {
      const quote = await yahooFinance.quote('TSLA');
      return {
        symbol: quote.symbol, price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0, changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0, open: quote.regularMarketOpen || 0,
        high: quote.regularMarketDayHigh || 0, low: quote.regularMarketDayLow || 0,
        previousClose: quote.regularMarketPreviousClose || 0, timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch TSLA price: ${error}`);
    }
  }
}

/**
 * Fetch current TSLL price (chart API with yahoo-finance2 fallback)
 */
export async function fetchTSLLPrice(): Promise<TSLAQuote> {
  try {
    return await fetchPriceViaChart('TSLL');
  } catch {
    try {
      const quote = await yahooFinance.quote('TSLL');
      return {
        symbol: quote.symbol, price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0, changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0, open: quote.regularMarketOpen || 0,
        high: quote.regularMarketDayHigh || 0, low: quote.regularMarketDayLow || 0,
        previousClose: quote.regularMarketPreviousClose || 0, timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch TSLL price: ${error}`);
    }
  }
}

/**
 * Fetch Orb Score from Supabase orb_setup_states and compute score/zone inline.
 */
export async function fetchOrbScore(): Promise<OrbData> {
  try {
    const { data: states, error } = await supabase
      .from('orb_setup_states')
      .select('setup_id, status');

    if (error) throw error;

    const setupStates = states || [];

    let score = 0;
    for (const snap of setupStates) {
      const type = SETUP_TYPES[snap.setup_id];
      if (!type) continue;
      const w = WEIGHTS[snap.setup_id] || 0.3;
      const dir = type === 'buy' ? 1 : -1;
      if (snap.status === 'active') score += dir * w;
      else if (snap.status === 'watching') score += dir * w * 0.3;
    }
    score = Math.round(score * 1000) / 1000;

    let zone: OrbZone;
    if (score >= THRESHOLDS.FULL_SEND) zone = 'FULL_SEND';
    else if (score >= THRESHOLDS.NEUTRAL) zone = 'NEUTRAL';
    else if (score >= THRESHOLDS.CAUTION) zone = 'CAUTION';
    else zone = 'DEFENSIVE';

    const activeSetups = setupStates
      .filter(s => s.status === 'active' || s.status === 'watching')
      .map(s => ({
        setup_id: s.setup_id,
        status: s.status,
        type: (SETUP_TYPES[s.setup_id] || 'buy') as 'buy' | 'avoid',
      }));

    return {
      score,
      zone,
      activeSetups,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching Orb score:', error);
    return {
      score: -1.0,
      zone: 'DEFENSIVE',
      activeSetups: [],
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch HIRO data from SpotGamma API
 * Falls back to cached/mock data if API unavailable
 */
export async function fetchHIRO(): Promise<HIROData> {
  const now = Date.now();
  
  // Return cached data if fresh (5 min)
  if (hiroCache && (now - lastHiroFetch) < HIRO_CACHE_TTL) {
    return hiroCache;
  }

  try {
    // Read latest HIRO from Discord #hiro-intraday channel
    const botToken = process.env.DISCORD_BOT_TOKEN || process.env.PAPER_TRADER_DISCORD_TOKEN;
    const HIRO_CHANNEL_ID = '1465366178099630292';
    
    const response = await fetch(
      `https://discord.com/api/v10/channels/${HIRO_CHANNEL_ID}/messages?limit=1`,
      { headers: { 'Authorization': `Bot ${botToken}` } }
    );

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const messages = await response.json() as any[];
    if (!messages.length) throw new Error('No HIRO messages found');
    
    const content = messages[0].content;
    
    // Parse HIRO reading from message: "HIRO: -479M" or "HIRO: +123M"
    const hiroMatch = content.match(/HIRO:\s*([+-]?\d+)M/i);
    if (!hiroMatch) throw new Error('Could not parse HIRO from message');
    
    const readingM = parseInt(hiroMatch[1]);
    const reading = readingM * 1000000;
    
    // Parse 30-day range if available: "-1.1B to +1.4B"
    const rangeMatch = content.match(/30-Day Range:\s*([+-]?[\d.]+)([BM])\s*to\s*([+-]?[\d.]+)([BM])/i);
    let percentile30Day = 50;
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1]) * (rangeMatch[2] === 'B' ? 1000 : 1);
      const high = parseFloat(rangeMatch[3]) * (rangeMatch[4] === 'B' ? 1000 : 1);
      percentile30Day = Math.max(0, Math.min(100, ((readingM - low) / (high - low)) * 100));
    }
    
    // Determine character from reading
    let character = 'neutral';
    if (readingM > 200) character = 'aggressive dealer buying';
    else if (readingM > 0) character = 'mild buying';
    else if (readingM > -200) character = 'mild selling';
    else character = 'aggressive dealer selling';

    const hiroData: HIROData = {
      reading,
      percentile30Day,
      character,
      timestamp: new Date(),
    };

    hiroCache = hiroData;
    lastHiroFetch = now;
    await cacheHIRO(hiroData);

    return hiroData;
  } catch (error) {
    console.warn('HIRO fetch from Discord failed, using fallback:', error);
    
    // Try Supabase cache
    const cached = await getCachedHIRO();
    if (cached) return cached;

    // Last resort — but return clearly stale data, not random
    return {
      reading: 0,
      percentile30Day: 50,
      character: 'unavailable',
      timestamp: new Date(),
    };
  }
}

/**
 * Store HIRO data in cache table
 */
async function cacheHIRO(data: HIROData): Promise<void> {
  try {
    await supabase.from('paper_hiro_cache').insert({
      reading: data.reading,
      percentile_30day: data.percentile30Day,
      character: data.character,
      timestamp: data.timestamp.toISOString(),
    });
  } catch (error) {
    console.error('Error caching HIRO:', error);
  }
}

/**
 * Get most recent cached HIRO from Supabase
 */
async function getCachedHIRO(): Promise<HIROData | null> {
  try {
    const { data, error } = await supabase
      .from('paper_hiro_cache')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      reading: data.reading,
      percentile30Day: data.percentile_30day,
      character: data.character,
      timestamp: new Date(data.timestamp),
    };
  } catch (error) {
    console.error('Error fetching cached HIRO:', error);
    return null;
  }
}

/**
 * Generate mock HIRO data for testing/fallback
 */
function getMockHIRO(): HIROData {
  // Generate a reasonable mock reading between -500M and +500M
  const mockReading = (Math.random() * 1000 - 500) * 1000000;
  const mockPercentile = Math.random() * 100;
  
  let character = 'neutral';
  if (mockPercentile > 75) character = 'aggressive dealer buying';
  else if (mockPercentile > 50) character = 'mild buying';
  else if (mockPercentile > 25) character = 'mild selling';
  else character = 'aggressive dealer selling';

  return {
    reading: Math.round(mockReading),
    percentile30Day: Math.round(mockPercentile),
    character,
    timestamp: new Date(),
  };
}

/**
 * Fetch today's daily report from Supabase
 */
export async function fetchDailyReport(): Promise<DailyReport | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: report, error } = await supabase
      .from('reports')
      .select('report_date, extracted_data')
      .eq('report_date', today)
      .single();

    if (error || !report) {
      // Try most recent report if today's not found
      const { data: latest } = await supabase
        .from('reports')
        .select('report_date, extracted_data')
        .order('report_date', { ascending: false })
        .limit(1)
        .single();
      
      if (!latest?.extracted_data) {
        console.warn('No daily report found:', error);
        return null;
      }
      console.log(`Using latest report from ${latest.report_date} (today's not uploaded yet)`);
      return parseExtractedData(latest.report_date, latest.extracted_data);
    }

    return parseExtractedData(report.report_date, report.extracted_data);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return null;
  }
}

function parseExtractedData(date: string, ed: any): DailyReport {
  const levels = ed.levels_map || [];
  const mode = ed.mode?.current || ed.mode?.label || 'YELLOW';
  
  // Find tier from tiers array (first active tier)
  const tier = ed.tiers?.[0]?.tier || 2;
  
  return {
    date,
    mode: mode.toUpperCase(),
    tier,
    masterEject: ed.master_eject?.price || findLevelByType(levels, 'eject')?.price || 0,
    gammaStrike: ed.key_gamma_strike?.price || findLevelByName(levels, 'gamma')?.price || 0,
    putWall: findLevelByName(levels, 'put wall')?.price || 0,
    hedgeWall: findLevelByName(levels, 'hedge wall')?.price || 0,
    callWall: findLevelByName(levels, 'call wall')?.price || 0,
    levels: levels.map((l: any) => ({
      name: l.level || l.name,
      price: l.price,
      type: l.type || 'neutral',
    })),
    commentary: ed.game_plan || '',
  };
}

function findLevelByType(levels: any[], type: string): any {
  return levels.find((l: any) => l.type === type);
}

function findLevelByName(levels: any[], name: string): any {
  return levels.find((l: any) => (l.level || l.name || '').toLowerCase().includes(name.toLowerCase()));
}

/**
 * Helper to find level price by name
 */
function findLevelPrice(levels: any[], name: string): number | null {
  const level = levels.find(
    (l) => (l.name || l.level) === name
  );
  return level ? (level.price || level.value) : null;
}

/**
 * Fetch key levels directly from key_levels table
 */
export async function fetchKeyLevels(): Promise<Record<string, number>> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('key_levels')
      .select('*')
      .eq('date', today)
      .single();

    if (error || !data) {
      return {};
    }

    return {
      masterEject: data.master_eject || data.masterEject,
      gammaStrike: data.gamma_strike || data.gammaStrike,
      putWall: data.put_wall || data.putWall,
      hedgeWall: data.hedge_wall || data.hedgeWall,
      callWall: data.call_wall || data.callWall,
      pauseZone: data.pause_zone || data.pauseZone,
    };
  } catch (error) {
    console.error('Error fetching key levels:', error);
    return {};
  }
}

/**
 * Check if market is open
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeDecimal = hour + minute / 60;

  // Market hours: 9:30 AM - 4:00 PM ET, Mon-Fri
  // Convert to CT: 8:30 AM - 3:00 PM CT
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = timeDecimal >= 8.5 && timeDecimal < 15;

  return isWeekday && isMarketHours;
}

/**
 * Get time until market open/close
 */
export function getMarketStatus(): { isOpen: boolean; message: string } {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // CT hours: 8:30 AM open, 3:00 PM close
  const openHour = 8;
  const openMinute = 30;
  const closeHour = 15;
  const closeMinute = 0;

  if (day === 0 || day === 6) {
    const daysUntilMonday = day === 0 ? 1 : 2;
    return { isOpen: false, message: `market closed. opens in ${daysUntilMonday} day(s).` };
  }

  const currentMinutes = hour * 60 + minute;
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  if (currentMinutes < openMinutes) {
    const minsUntilOpen = openMinutes - currentMinutes;
    return { isOpen: false, message: `market opens in ${minsUntilOpen} min.` };
  }

  if (currentMinutes >= closeMinutes) {
    return { isOpen: false, message: 'market closed for the day.' };
  }

  const minsUntilClose = closeMinutes - currentMinutes;
  return { isOpen: true, message: `${minsUntilClose} min until close.` };
}
