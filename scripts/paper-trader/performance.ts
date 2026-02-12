/**
 * Flacko Paper Trader Bot — Performance Tracker
 * Calculates P&L, metrics, and generates reports
 */

import { createClient } from '@supabase/supabase-js';
import type { Trade, DailyPerformance, PerformanceMetrics, Portfolio, Position, MultiPortfolio, Instrument } from './types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Record a trade to the database
 */
export async function recordTrade(trade: Trade): Promise<void> {
  try {
    const { error } = await supabase.from('paper_trades').insert({
      timestamp: trade.timestamp.toISOString(),
      action: trade.action,
      instrument: trade.instrument,
      shares: trade.shares,
      price: trade.price,
      total_value: trade.totalValue,
      reasoning: trade.reasoning,
      mode: trade.mode,
      tier: trade.tier,
      hiro_reading: trade.hiroReading,
      realized_pnl: trade.realizedPnl,
      unrealized_pnl: trade.unrealizedPnl,
      portfolio_value: trade.portfolioValue,
      cash_remaining: trade.cashRemaining,
      orb_score: trade.orbScore ?? null,
      orb_zone: trade.orbZone ?? null,
      orb_active_setups: trade.orbActiveSetups ?? null,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording trade:', error);
    throw error;
  }
}

/**
 * Update bot state in database (multi-instrument)
 */
export async function updateBotState(
  portfolio: Portfolio | MultiPortfolio,
  todayTradesCount: number,
  orbZone?: string,
  orbScore?: number,
  levelsHitToday?: string[]
): Promise<void> {
  try {
    const isMulti = 'tsla' in portfolio;
    
    const { error } = await supabase.from('paper_bot_state').upsert({
      id: 1,
      cash: portfolio.cash,
      shares_held: isMulti ? (portfolio as MultiPortfolio).tsla?.shares || 0 : (portfolio as Portfolio).position?.shares || 0,
      avg_cost: isMulti ? (portfolio as MultiPortfolio).tsla?.avgCost || null : (portfolio as Portfolio).position?.avgCost || null,
      tsll_shares: isMulti ? (portfolio as MultiPortfolio).tsll?.shares || 0 : 0,
      tsll_avg_cost: isMulti ? (portfolio as MultiPortfolio).tsll?.avgCost || null : null,
      realized_pnl: portfolio.realizedPnl,
      last_update_at: new Date().toISOString(),
      today_trades_count: todayTradesCount,
      bot_date: new Date().toISOString().split('T')[0],
      current_orb_zone: orbZone || null,
      current_orb_score: orbScore || null,
      levels_hit_today: levelsHitToday || [],
    }, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating bot state:', error);
  }
}

/**
 * Get bot state from database (multi-instrument)
 */
export async function getBotState(): Promise<{
  cash: number;
  sharesHeld: number;
  avgCost: number;
  tsllShares: number;
  tsllAvgCost: number;
  realizedPnl: number;
  todayTradesCount: number;
  currentDate: string;
  currentOrbZone?: string;
  currentOrbScore?: number;
  levelsHitToday?: string[];
} | null> {
  try {
    const { data, error } = await supabase
      .from('paper_bot_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) return null;

    return {
      cash: data.cash,
      sharesHeld: data.shares_held || 0,
      avgCost: data.avg_cost || 0,
      tsllShares: data.tsll_shares || 0,
      tsllAvgCost: data.tsll_avg_cost || 0,
      realizedPnl: data.realized_pnl || 0,
      todayTradesCount: data.today_trades_count || 0,
      currentDate: data.bot_date,
      currentOrbZone: data.current_orb_zone,
      currentOrbScore: data.current_orb_score,
      levelsHitToday: data.levels_hit_today || [],
    };
  } catch (error) {
    console.error('Error fetching bot state:', error);
    return null;
  }
}

/**
 * Persist levels hit today to DB (survives restarts)
 */
export async function saveLevelsHitToday(levels: string[]): Promise<void> {
  try {
    await supabase.from('paper_bot_state').update({ levels_hit_today: levels }).eq('id', 1);
  } catch (error) {
    console.error('Error saving levels hit today:', error);
  }
}

/**
 * Calculate current portfolio value
 */
export function calculatePortfolio(
  cash: number,
  shares: number,
  avgCost: number,
  currentPrice: number,
  realizedPnl: number
): Portfolio {
  const positionValue = shares * currentPrice;
  const positionCost = shares * avgCost;
  const unrealizedPnl = positionValue - positionCost;
  const totalValue = cash + positionValue;
  
  const position: Position | null = shares > 0 ? {
    shares,
    avgCost,
    entryTime: new Date(), // Would be stored in DB
    entryPrice: avgCost,
    unrealizedPnl,
    unrealizedPnlPercent: (currentPrice / avgCost - 1) * 100,
    currentValue: positionValue,
  } : null;

  return {
    cash,
    startingCapital: 100000,
    position,
    totalValue,
    totalReturn: totalValue - 100000,
    totalReturnPercent: ((totalValue / 100000) - 1) * 100,
    realizedPnl,
    unrealizedPnl,
  };
}

/**
 * Calculate multi-instrument portfolio (TSLA + TSLL)
 */
export function calculateMultiPortfolio(
  cash: number,
  tslaShares: number,
  tslaAvgCost: number,
  tslaPrice: number,
  tsllShares: number,
  tsllAvgCost: number,
  tsllPrice: number,
  realizedPnl: number
): MultiPortfolio {
  // TSLA position
  const tslaValue = tslaShares * tslaPrice;
  const tslaCost = tslaShares * tslaAvgCost;
  const tslaUnrealized = tslaValue - tslaCost;
  const tslaPosition = tslaShares > 0 ? {
    shares: tslaShares,
    avgCost: tslaAvgCost,
    currentPrice: tslaPrice,
    value: tslaValue,
    unrealizedPnl: tslaUnrealized,
    pnlPercent: (tslaPrice / tslaAvgCost - 1) * 100,
  } : null;
  
  // TSLL position
  const tsllValue = tsllShares * tsllPrice;
  const tsllCost = tsllShares * tsllAvgCost;
  const tsllUnrealized = tsllValue - tsllCost;
  const tsllPosition = tsllShares > 0 ? {
    shares: tsllShares,
    avgCost: tsllAvgCost,
    currentPrice: tsllPrice,
    value: tsllValue,
    unrealizedPnl: tsllUnrealized,
    pnlPercent: (tsllPrice / tsllAvgCost - 1) * 100,
  } : null;
  
  const totalPositionValue = tslaValue + tsllValue;
  const totalUnrealized = tslaUnrealized + tsllUnrealized;
  const totalValue = cash + totalPositionValue;
  
  return {
    cash,
    startingCapital: 100000,
    tsla: tslaPosition,
    tsll: tsllPosition,
    totalValue,
    totalReturn: totalValue - 100000,
    totalReturnPercent: ((totalValue / 100000) - 1) * 100,
    realizedPnl,
    unrealizedPnl: totalUnrealized,
  };
}

/**
 * Get today's trades (multi-instrument)
 */
export async function getTodayTrades(): Promise<Trade[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('paper_trades')
      .select('*')
      .gte('timestamp', today)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []).map(t => ({
      id: t.id,
      timestamp: new Date(t.timestamp),
      action: t.action,
      instrument: t.instrument || 'TSLA',
      shares: t.shares,
      price: t.price,
      totalValue: t.total_value,
      reasoning: t.reasoning?.split('\n') || [],
      mode: t.mode,
      tier: t.tier,
      hiroReading: t.hiro_reading,
      realized_pnl: t.realized_pnl,
      unrealized_pnl: t.unrealized_pnl,
      portfolioValue: t.portfolio_value,
      cashRemaining: t.cash_remaining,
    }));
  } catch (error) {
    console.error('Error fetching today trades:', error);
    return [];
  }
}

/**
 * Calculate today's P&L from completed trades
 */
export async function calculateTodayPnl(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('paper_trades')
      .select('realized_pnl')
      .eq('action', 'sell')
      .gte('timestamp', today);

    if (error) throw error;

    return (data || []).reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
  } catch (error) {
    console.error('Error calculating today P&L:', error);
    return 0;
  }
}

/**
 * Get performance metrics for a time period
 */
export async function getPerformanceMetrics(
  period: '1w' | '1m' | '3m'
): Promise<PerformanceMetrics> {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case '1w':
      startDate.setDate(now.getDate() - 7);
      break;
    case '1m':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(now.getMonth() - 3);
      break;
  }
  
  try {
    // Get trades in period
    const { data: trades, error } = await supabase
      .from('paper_trades')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .eq('action', 'sell')
      .order('timestamp', { ascending: true });

    if (error) throw error;

    const closedTrades = trades || [];
    
    // Get first and last portfolio values
    const { data: portfolios } = await supabase
      .from('paper_portfolio')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    const portfolioData = portfolios || [];
    const startValue = portfolioData[0]?.total_value || 100000;
    const endValue = portfolioData[portfolioData.length - 1]?.total_value || startValue;
    
    // Calculate metrics
    const totalReturn = endValue - startValue;
    const totalReturnPercent = (totalReturn / startValue) * 100;
    
    const winningTrades = closedTrades.filter(t => (t.realized_pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.realized_pnl || 0) < 0);
    
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;
    
    const avgWinner = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0) / winningTrades.length
      : 0;
    
    const avgLoser = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0) / losingTrades.length
      : 0;
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = startValue;
    portfolioData.forEach(p => {
      if (p.total_value > peak) peak = p.total_value;
      const drawdown = peak - p.total_value;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Best and worst trades
    const pnls = closedTrades.map(t => t.realized_pnl || 0);
    const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
    const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
    
    return {
      capital: endValue,
      totalReturn,
      totalReturnPercent,
      tradesCount: closedTrades.length,
      winRate,
      avgWinner,
      avgLoser,
      maxDrawdown,
      period,
    };
  } catch (error) {
    console.error(`Error calculating ${period} metrics:`, error);
    return {
      capital: 100000,
      totalReturn: 0,
      totalReturnPercent: 0,
      tradesCount: 0,
      winRate: 0,
      avgWinner: 0,
      avgLoser: 0,
      maxDrawdown: 0,
      period,
    };
  }
}

/**
 * Record daily portfolio snapshot (multi-instrument)
 */
export async function recordDailyPortfolio(
  portfolio: Portfolio | MultiPortfolio,
  tradesCount: number,
  winCount: number,
  lossCount: number,
  orbZone?: string,
  orbScore?: number
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const isMulti = 'tsla' in portfolio;
    
    const { error } = await supabase.from('paper_portfolio').upsert({
      date: today,
      starting_cash: 100000,
      ending_cash: portfolio.cash,
      shares_held: isMulti ? (portfolio as MultiPortfolio).tsla?.shares || 0 : (portfolio as Portfolio).position?.shares || 0,
      avg_cost: isMulti ? (portfolio as MultiPortfolio).tsla?.avgCost || null : (portfolio as Portfolio).position?.avgCost || null,
      tsla_shares: isMulti ? (portfolio as MultiPortfolio).tsla?.shares || 0 : (portfolio as Portfolio).position?.shares || 0,
      tsla_avg_cost: isMulti ? (portfolio as MultiPortfolio).tsla?.avgCost || null : (portfolio as Portfolio).position?.avgCost || null,
      tsll_shares: isMulti ? (portfolio as MultiPortfolio).tsll?.shares || 0 : 0,
      tsll_avg_cost: isMulti ? (portfolio as MultiPortfolio).tsll?.avgCost || null : null,
      unrealized_pnl: portfolio.unrealizedPnl,
      realized_pnl: portfolio.realizedPnl,
      total_value: portfolio.totalValue,
      total_return: portfolio.totalReturnPercent,
      trades_count: tradesCount,
      win_count: winCount,
      loss_count: lossCount,
      orb_zone: orbZone || null,
      orb_score: orbScore || null,
    }, { onConflict: 'date' });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording daily portfolio:', error);
  }
}

/**
 * Get weekly performance data for report
 */
export async function getWeeklyPerformance(): Promise<{
  startValue: number;
  endValue: number;
  totalReturn: number;
  tradesCount: number;
  winRate: number;
  avgWinner: number;
  avgLoser: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
} | null> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  
  try {
    const metrics = await getPerformanceMetrics('1w');
    
    // Get best/worst trades
    const { data: trades } = await supabase
      .from('paper_trades')
      .select('realized_pnl')
      .gte('timestamp', weekStart.toISOString())
      .eq('action', 'sell');
    
    const pnls = (trades || []).map(t => t.realized_pnl || 0);
    
    return {
      startValue: 100000,
      endValue: metrics.capital,
      totalReturn: metrics.totalReturnPercent,
      tradesCount: metrics.tradesCount,
      winRate: metrics.winRate,
      avgWinner: metrics.avgWinner,
      avgLoser: metrics.avgLoser,
      maxDrawdown: metrics.maxDrawdown,
      bestTrade: pnls.length > 0 ? Math.max(...pnls) : 0,
      worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
    };
  } catch (error) {
    console.error('Error getting weekly performance:', error);
    return null;
  }
}

/**
 * Get all-time stats
 */
export async function getAllTimeStats(): Promise<{
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercent: number;
}> {
  try {
    const { data: trades, error } = await supabase
      .from('paper_trades')
      .select('realized_pnl, action')
      .eq('action', 'sell');

    if (error) throw error;

    const closedTrades = trades || [];
    const winningTrades = closedTrades.filter(t => (t.realized_pnl || 0) > 0);
    
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
    
    return {
      totalTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0,
      totalReturn: totalPnl,
      totalReturnPercent: (totalPnl / 100000) * 100,
    };
  } catch (error) {
    console.error('Error getting all-time stats:', error);
    return { totalTrades: 0, winRate: 0, totalReturn: 0, totalReturnPercent: 0 };
  }
}

/**
 * Log bot operation
 */
export async function logBot(
  level: 'info' | 'warn' | 'error' | 'trade',
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('paper_bot_logs').insert({
      level,
      message,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging bot:', error);
  }
}
