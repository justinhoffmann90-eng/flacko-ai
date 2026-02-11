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
 * Fetch current TSLA price from Yahoo Finance
 */
export async function fetchTSLAPrice(): Promise<TSLAQuote> {
  try {
    const quote = await yahooFinance.quote('TSLA');
    
    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      open: quote.regularMarketOpen || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching TSLA price:', error);
    throw new Error(`Failed to fetch TSLA price: ${error}`);
  }
}

/**
 * Fetch current TSLL price from Yahoo Finance
 */
export async function fetchTSLLPrice(): Promise<TSLAQuote> {
  try {
    const quote = await yahooFinance.quote('TSLL');
    
    return {
      symbol: quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      open: quote.regularMarketOpen || 0,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching TSLL price:', error);
    throw new Error(`Failed to fetch TSLL price: ${error}`);
  }
}

/**
 * Fetch Orb Score from Supabase — reads PRE-COMPUTED values.
 * The Orb compute route (/api/orb/compute) writes orb_score and orb_zone
 * to orb_daily_indicators. We just read. Never recompute.
 */
export async function fetchOrbScore(): Promise<OrbData> {
  try {
    // 1. Read the latest computed score + zone from orb_daily_indicators
    const { data: scoreRow, error: scoreError } = await supabase
      .from('orb_daily_indicators')
      .select('orb_score, orb_zone, date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (scoreError) throw scoreError;

    // 2. Read active setup states (for display in Discord messages only)
    const { data: states, error: statesError } = await supabase
      .from('orb_setup_states')
      .select('setup_id, status');

    if (statesError) throw statesError;

    const activeSetups = (states || [])
      .filter(s => s.status === 'active' || s.status === 'watching')
      .map(s => ({
        setup_id: s.setup_id,
        status: s.status,
      }));

    return {
      score: scoreRow?.orb_score ?? 0,
      zone: (scoreRow?.orb_zone ?? 'NEUTRAL') as OrbZone,
      activeSetups,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching Orb score:', error);
    // Return defensive fallback
    return {
      score: -1.0,
      zone: "DEFENSIVE",
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
  
  // Return cached data if fresh
  if (hiroCache && (now - lastHiroFetch) < HIRO_CACHE_TTL) {
    return hiroCache;
  }

  try {
    // Try to fetch from SpotGamma API
    const response = await fetch(
      'https://api.spotgamma.com/v1/hiro/tsla',
      {
        headers: {
          'Authorization': `Bearer ${SPOT_GAMMA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`SpotGamma API error: ${response.status}`);
    }

    const data = await response.json();
    
    const hiroData: HIROData = {
      reading: data.reading || 0,
      percentile30Day: data.percentile_30day || 50,
      character: data.character || 'neutral',
      timestamp: new Date(),
    };

    // Cache and store
    hiroCache = hiroData;
    lastHiroFetch = now;
    await cacheHIRO(hiroData);

    return hiroData;
  } catch (error) {
    console.warn('SpotGamma HIRO fetch failed, using fallback:', error);
    
    // Try to get cached data from Supabase
    const cached = await getCachedHIRO();
    if (cached) {
      return cached;
    }

    // Return mock data as last resort
    return getMockHIRO();
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
      .select('*')
      .eq('date', today)
      .single();

    if (error || !report) {
      console.warn('No daily report found for today:', error);
      return null;
    }

    // Parse key levels from the report
    const levels = report.key_levels || [];
    
    return {
      date: report.date,
      mode: (report.mode || 'YELLOW').toUpperCase(),
      tier: report.tier || 2,
      masterEject: findLevelPrice(levels, 'master_eject') || findLevelPrice(levels, 'Master Eject') || 0,
      gammaStrike: findLevelPrice(levels, 'gamma_strike') || findLevelPrice(levels, 'Gamma Strike') || 0,
      putWall: findLevelPrice(levels, 'put_wall') || findLevelPrice(levels, 'Put Wall') || 0,
      hedgeWall: findLevelPrice(levels, 'hedge_wall') || findLevelPrice(levels, 'Hedge Wall') || 0,
      callWall: findLevelPrice(levels, 'call_wall') || findLevelPrice(levels, 'Call Wall') || 0,
      levels: levels.map((l: any) => ({
        name: l.name || l.level,
        price: l.price || l.value,
        type: l.type || 'neutral',
      })),
      commentary: report.commentary,
    };
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return null;
  }
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
