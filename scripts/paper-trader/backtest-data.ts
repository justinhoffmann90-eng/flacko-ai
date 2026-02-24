/**
 * Backtest Data Module
 * Loads historical daily reports and fetches intraday price data
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DailyReportData {
  date: string;
  mode: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  modeTrend?: string;
  priceOpen?: number;
  priceClose: number;
  priceChangePct?: number;
  postMarketPrice?: number;
  masterEject: number;
  pauseZone?: number;
  keyGammaStrike: number;
  putWall?: number;
  hedgeWall?: number;
  callWall?: number;
  weekly9EMA?: number;
  weekly13EMA?: number;
  weekly21EMA?: number;
  daily9EMA?: number;
  daily21EMA?: number;
  positioning: string;
  dailyCapPct: number;
  hiroReading?: number;
  hiro30DayLow?: number;
  hiro30DayHigh?: number;
  gammaRegime?: string;
  levels: PriceLevel[];
  tier1Signal?: string;
  tier2Signal?: string;
  tier3Signal?: string;
  tier4Signal?: string;
}

export interface PriceLevel {
  price: number;
  name: string;
  action: string;
  type: 'support' | 'resistance' | 'nibble' | 'trim' | 'watch' | 'pause' | 'eject' | 'current' | 'add';
}

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Historical TSLA intraday data for Jan 27 - Feb 6, 2026
// Simulated 15-minute bars based on actual daily OHLC and typical TSLA volatility patterns
export const HISTORICAL_INTRADAY_DATA: Record<string, OHLCV[]> = {
  // Tuesday, Jan 27, 2026 — Mode: ORANGE, Close: $430.91
  // Earnings day - tomorrow
  '2026-01-27': generateIntradayBars({
    date: '2026-01-27',
    open: 435.20,
    high: 437.50,
    low: 430.70,
    close: 430.91,
    volatility: 0.008
  }),

  // Wednesday, Jan 28, 2026 — Mode: YELLOW (Catalyst Override), Close: $431.46, Post-market: $444.95
  // Earnings reported after close
  '2026-01-28': generateIntradayBars({
    date: '2026-01-28',
    open: 428.50,
    high: 436.20,
    low: 426.80,
    close: 431.46,
    volatility: 0.012
  }),

  // Thursday, Jan 29, 2026 — Mode: ORANGE (Deteriorating), Close: $416.51
  // Post-earnings selloff
  '2026-01-29': generateIntradayBars({
    date: '2026-01-29',
    open: 431.00,
    high: 433.50,
    low: 413.69,
    close: 416.51,
    volatility: 0.025
  }),

  // Friday, Jan 30, 2026 — Mode: ORANGE (Stabilizing), Close: $429.64
  // Bounce from support
  '2026-01-30': generateIntradayBars({
    date: '2026-01-30',
    open: 416.44,
    high: 431.20,
    low: 414.80,
    close: 429.64,
    volatility: 0.018
  }),

  // Monday, Feb 2, 2026 — Mode: ORANGE (Deteriorating), Close: $424.05
  // Failed bounce
  '2026-02-02': generateIntradayBars({
    date: '2026-02-02',
    open: 430.41,
    high: 432.80,
    low: 420.50,
    close: 424.05,
    volatility: 0.015
  }),

  // Tuesday, Feb 3, 2026 — Mode: ORANGE, Close: $421.96
  // Testing support
  '2026-02-03': generateIntradayBars({
    date: '2026-02-03',
    open: 424.00,
    high: 428.56,
    low: 413.69,
    close: 421.96,
    volatility: 0.020
  }),

  // Wednesday, Feb 4, 2026 — Mode: RED, Close: $405.93
  // Capitulation day
  '2026-02-04': generateIntradayBars({
    date: '2026-02-04',
    open: 421.00,
    high: 422.50,
    low: 399.18,
    close: 405.93,
    volatility: 0.030
  }),

  // Thursday, Feb 5, 2026 — Mode: RED (Recovery Watch), Close: $396.84
  // Consolidation at lows
  '2026-02-05': generateIntradayBars({
    date: '2026-02-05',
    open: 404.50,
    high: 405.20,
    low: 394.00,
    close: 396.84,
    volatility: 0.015
  }),

  // Friday, Feb 6, 2026 — Mode: ORANGE (Improving), Close: $411.11
  // Recovery day
  '2026-02-06': generateIntradayBars({
    date: '2026-02-06',
    open: 397.50,
    high: 413.00,
    low: 397.75,
    close: 411.11,
    volatility: 0.018
  }),
};

interface DailyOHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volatility: number;
}

function generateIntradayBars(daily: DailyOHLC): OHLCV[] {
  const bars: OHLCV[] = [];
  const marketOpen = 9.5; // 9:30 AM
  const marketClose = 16; // 4:00 PM
  const barInterval = 0.25; // 15 minutes = 0.25 hours
  const numBars = (marketClose - marketOpen) / barInterval; // 26 bars

  // Generate realistic intraday price path
  let currentPrice = daily.open;
  const priceRange = daily.high - daily.low;
  const intradayVolatility = daily.volatility;

  // Create a realistic price path that hits high and low
  const path = generatePricePath(daily.open, daily.high, daily.low, daily.close, numBars, intradayVolatility);

  for (let i = 0; i < numBars; i++) {
    const barTime = new Date(`${daily.date}T${String(Math.floor(marketOpen + i * barInterval)).padStart(2, '0')}:${String(((marketOpen + i * barInterval) % 1) * 60).padStart(2, '0')}:00-05:00`);
    
    const open = path[i];
    const close = path[i + 1] || daily.close;
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    const volume = Math.floor(500000 + Math.random() * 1500000);

    bars.push({
      timestamp: barTime,
      open,
      high,
      low,
      close,
      volume
    });
  }

  return bars;
}

function generatePricePath(
  open: number,
  high: number,
  low: number,
  close: number,
  numBars: number,
  volatility: number
): number[] {
  const path: number[] = [open];
  let currentPrice = open;

  // Determine when high and low occur (random but realistic)
  const highBar = Math.floor(Math.random() * numBars * 0.7) + Math.floor(numBars * 0.1);
  const lowBar = Math.floor(Math.random() * numBars * 0.7) + Math.floor(numBars * 0.2);

  for (let i = 0; i < numBars; i++) {
    // Add random walk with drift toward close
    const drift = (close - currentPrice) / (numBars - i) * 0.5;
    const noise = (Math.random() - 0.5) * volatility * currentPrice;
    
    currentPrice = currentPrice + drift + noise;

    // Ensure we hit high and low at designated bars
    if (i === highBar) currentPrice = high;
    if (i === lowBar) currentPrice = low;

    // Keep price within daily range with some buffer
    currentPrice = Math.max(low * 0.995, Math.min(high * 1.005, currentPrice));

    path.push(currentPrice);
  }

  // Force last price to close
  path[path.length - 1] = close;

  return path;
}

/**
 * Parse daily report markdown and extract key data
 */
export function parseDailyReport(filePath: string): DailyReportData | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract REPORT_DATA JSON if present
    const reportDataMatch = content.match(/<!-- REPORT_DATA\s*([\s\S]*?)-->/);
    if (reportDataMatch) {
      try {
        const jsonData = JSON.parse(reportDataMatch[1].trim());
        return normalizeReportData(jsonData);
      } catch (e) {
        // Fall through to manual parsing
      }
    }

    // Manual parsing fallback
    return parseReportManually(content, filePath);
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

function normalizeReportData(data: any): DailyReportData {
  return {
    date: data.date || '',
    mode: (data.mode || 'YELLOW').toUpperCase(),
    modeTrend: data.mode_trend || data.modeTrend || '',
    priceClose: data.price_close || data.priceClose || 0,
    priceChangePct: data.price_change_pct || data.priceChangePct,
    masterEject: data.master_eject || data.masterEject || 0,
    pauseZone: data.pause_zone || data.pauseZone,
    keyGammaStrike: data.key_gamma_strike || data.keyGammaStrike || 0,
    putWall: data.put_wall || data.putWall,
    hedgeWall: data.hedge_wall || data.hedgeWall,
    callWall: data.call_wall || data.callWall,
    weekly9EMA: data.weekly_9ema || data.weekly9EMA,
    weekly13EMA: data.weekly_13ema || data.weekly13EMA,
    weekly21EMA: data.weekly_21ema || data.weekly21EMA,
    daily9EMA: data.daily_9ema || data.daily9EMA,
    daily21EMA: data.daily_21ema || data.daily21EMA,
    positioning: data.positioning || 'Neutral',
    dailyCapPct: data.daily_cap_pct || data.dailyCapPct || 15,
    hiroReading: parseHIRO(data.hiro_reading || data.hiroReading),
    hiro30DayLow: data.hiro_30day_low || data.hiro30DayLow,
    hiro30DayHigh: data.hiro_30day_high || data.hiro30DayHigh,
    gammaRegime: data.gamma_regime || data.gammaRegime,
    levels: (data.levels || []).map((l: any) => ({
      price: l.price,
      name: l.name,
      action: l.action || '',
      type: l.type || 'watch'
    })),
    tier1Signal: data.tier1_long || data.tier1Signal,
    tier2Signal: data.tier2_medium || data.tier2Signal,
    tier3Signal: data.tier3_short || data.tier3Signal,
    tier4Signal: data.tier4_hourly || data.tier4Signal,
  };
}

function parseHIRO(value: any): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Parse strings like "+480M" or "-982M"
    const match = value.match(/([+-]?)([\d.]+)M?/);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const num = parseFloat(match[2]);
      return sign * num;
    }
  }
  return undefined;
}

function parseReportManually(content: string, filePath: string): DailyReportData | null {
  const dateMatch = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';

  // Extract mode
  const modeMatch = content.match(/Mode:\s*([🟢🟡🟠🔴])\s*(GREEN|YELLOW|ORANGE|RED)/i);
  const mode = (modeMatch?.[2] || 'YELLOW').toUpperCase() as 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

  // Extract master eject
  const ejectMatch = content.match(/Master Eject[:\s]+\$?(\d+(?:\.\d+)?)/i);
  const masterEject = ejectMatch ? parseFloat(ejectMatch[1]) : 0;

  // Extract close price
  const closeMatch = content.match(/(?:Close|price_close)[:\s]+\$?(\d+(?:\.\d+)?)/i);
  const priceClose = closeMatch ? parseFloat(closeMatch[1]) : 0;

  // Extract daily cap
  const capMatch = content.match(/(\d+)%[^\n]*(?:daily cap|cap)/i);
  const dailyCapPct = capMatch ? parseInt(capMatch[1]) : 15;

  return {
    date,
    mode,
    priceClose,
    masterEject,
    dailyCapPct,
    positioning: 'Unknown',
    keyGammaStrike: 0,
    levels: [],
  };
}

/**
 * Load all daily reports for the backtest period
 */
export function loadDailyReports(reportsDir: string, startDate: string, endDate: string): DailyReportData[] {
  const reports: DailyReportData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate list of trading days (skip weekends)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = d.toISOString().split('T')[0];
    
    // Try different file patterns
    const possiblePaths = [
      path.join(reportsDir, `TSLA_Daily_Report_${dateStr}.md`),
      path.join(reportsDir, `TSLA_Daily_Report_${dateStr}_v2.md`),
      path.join(reportsDir, `TSLA_Daily_Report_${dateStr}_v3.md`),
      path.join(reportsDir, `TSLA_Daily_Report_${dateStr}_v4.md`),
      path.join(reportsDir, `TSLA_Daily_Report_${dateStr}_v5.md`),
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const report = parseDailyReport(filePath);
        if (report) {
          reports.push(report);
          break;
        }
      }
    }
  }

  return reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get intraday price bars for a specific date
 */
export function getIntradayData(date: string): OHLCV[] {
  return HISTORICAL_INTRADAY_DATA[date] || [];
}

/**
 * Calculate HIRO percentile based on 30-day range
 */
export function calculateHIROPercentile(reading: number, low: number, high: number): number {
  if (high === low) return 50;
  return ((reading - low) / (high - low)) * 100;
}

/**
 * Get buy-and-hold benchmark performance
 */
export function calculateBuyAndHold(startPrice: number, endPrice: number): {
  returnPercent: number;
  returnDollars: number;
} {
  const returnPercent = ((endPrice - startPrice) / startPrice) * 100;
  return {
    returnPercent,
    returnDollars: returnPercent * 1000, // $100k invested
  };
}
