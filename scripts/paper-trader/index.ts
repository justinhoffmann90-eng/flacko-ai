/**
 * Flacko Paper Trader Bot — Main Controller
 * 
 * An automated paper trading bot that simulates TSLA trades using 
 * Flacko AI's daily report methodology.
 * 
 * Usage:
 *   npm run paper-trader:start     # Start the bot
 *   npm run paper-trader:stop      # Stop the bot
 * 
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_KEY
 *   - PAPER_TRADER_DISCORD_TOKEN
 *   - PAPER_TRADER_CHANNEL_ID
 *   - SPOT_GAMMA_API_KEY (optional, for HIRO)
 */

import {
  fetchTSLAPrice,
  fetchHIRO,
  fetchDailyReport,
  isMarketOpen,
  getMarketStatus,
} from './data-feed';
import {
  makeTradeDecision,
  generateFlackoTake,
} from './decision-engine';
import {
  initDiscord,
  postStatusUpdate,
  postHIROUpdate,
  postEntryAlert,
  postExitAlert,
  postMarketOpen,
  postMarketClose,
  postWeeklyReport,
  postError,
} from './discord-poster';
import {
  recordTrade,
  updateBotState,
  getBotState,
  calculatePortfolio,
  getTodayTrades,
  calculateTodayPnl,
  recordDailyPortfolio,
  getWeeklyPerformance,
  logBot,
} from './performance';
import type { Trade, Portfolio, TradeSignal } from './types';

// Bot configuration
const CONFIG = {
  STARTING_CAPITAL: 100000,
  UPDATE_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes
  HIRO_INTERVAL_MS: 60 * 60 * 1000,   // 1 hour
  MAX_POSITIONS_PER_DAY: 2,
  NO_NEW_POSITIONS_AFTER: 15, // 3 PM CT
};

// Bot state
let isRunning = false;
let updateTimer: NodeJS.Timeout | null = null;
let hiroTimer: NodeJS.Timeout | null = null;
let marketOpenPosted = false;
let marketClosePosted = false;
let weeklyReportPosted = false;

// Current session state
let sessionState = {
  cash: CONFIG.STARTING_CAPITAL,
  sharesHeld: 0,
  avgCost: 0,
  realizedPnl: 0,
  todayTradesCount: 0,
  currentDate: new Date().toISOString().split('T')[0],
};

/**
 * Initialize the bot
 */
async function init(): Promise<boolean> {
  console.log('⚔️ initializing paper flacko...');
  
  // Check environment
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'PAPER_TRADER_DISCORD_TOKEN',
    'PAPER_TRADER_CHANNEL_ID',
  ];
  
  const missing = required.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`❌ missing env vars: ${missing.join(', ')}`);
    return false;
  }
  
  // Initialize Discord
  if (!initDiscord()) {
    console.error('❌ failed to initialize discord');
    return false;
  }
  
  // Load state from database
  const savedState = await getBotState();
  if (savedState) {
    // Check if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (savedState.currentDate !== today) {
      console.log('🌅 new day detected. resetting trade count.');
      sessionState.todayTradesCount = 0;
      sessionState.currentDate = today;
    } else {
      sessionState.todayTradesCount = savedState.todayTradesCount;
    }
    
    sessionState.cash = savedState.cash;
    sessionState.sharesHeld = savedState.sharesHeld;
    sessionState.avgCost = savedState.avgCost;
    sessionState.realizedPnl = savedState.realizedPnl;
  }
  
  console.log('✅ paper flacko initialized');
  console.log(`   cash: $${sessionState.cash.toFixed(2)}`);
  console.log(`   shares: ${sessionState.sharesHeld}`);
  console.log(`   realized pnl: $${sessionState.realizedPnl.toFixed(2)}`);
  
  await logBot('info', 'bot initialized', { cash: sessionState.cash });
  return true;
}

/**
 * Main trading loop - runs every 15 minutes
 */
async function tradingLoop(): Promise<void> {
  if (!isRunning) return;
  
  try {
    // Check if new day
    const today = new Date().toISOString().split('T')[0];
    if (sessionState.currentDate !== today) {
      sessionState.currentDate = today;
      sessionState.todayTradesCount = 0;
      marketOpenPosted = false;
      marketClosePosted = false;
      weeklyReportPosted = false;
    }
    
    // Check market hours
    const marketStatus = getMarketStatus();
    
    // Post market open
    if (marketStatus.isOpen && !marketOpenPosted) {
      const quote = await fetchTSLAPrice();
      const report = await fetchDailyReport();
      await postMarketOpen(quote, report);
      marketOpenPosted = true;
      await logBot('info', 'market open posted');
    }
    
    // Post market close
    if (!marketStatus.isOpen && marketOpenPosted && !marketClosePosted) {
      const quote = await fetchTSLAPrice();
      const portfolio = calculatePortfolio(
        sessionState.cash,
        sessionState.sharesHeld,
        sessionState.avgCost,
        quote.price,
        sessionState.realizedPnl
      );
      const todayPnl = await calculateTodayPnl();
      await postMarketClose(portfolio, sessionState.todayTradesCount, todayPnl);
      
      // Record daily snapshot
      const todayTrades = await getTodayTrades();
      const winCount = todayTrades.filter(t => (t.realized_pnl || 0) > 0).length;
      const lossCount = todayTrades.filter(t => (t.realized_pnl || 0) < 0).length;
      await recordDailyPortfolio(portfolio, todayTrades.length, winCount, lossCount);
      
      marketClosePosted = true;
      await logBot('info', 'market close posted', { todayPnl });
    }
    
    // Post weekly report on Sunday evening
    const dayOfWeek = new Date().getDay();
    const hour = new Date().getHours();
    if (dayOfWeek === 0 && hour >= 18 && !weeklyReportPosted) {
      const weekly = await getWeeklyPerformance();
      if (weekly) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekRange = `${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}`;
        await postWeeklyReport(weekly, weekRange);
        weeklyReportPosted = true;
      }
    }
    
    // Only trade during market hours
    if (!marketStatus.isOpen) {
      console.log(`⏸️ market closed. ${marketStatus.message}`);
      return;
    }
    
    // Fetch all data
    const [quote, hiro, report] = await Promise.all([
      fetchTSLAPrice(),
      fetchHIRO(),
      fetchDailyReport(),
    ]);
    
    // Calculate current portfolio
    const portfolio = calculatePortfolio(
      sessionState.cash,
      sessionState.sharesHeld,
      sessionState.avgCost,
      quote.price,
      sessionState.realizedPnl
    );
    
    // Generate Flacko's take
    const flackoTake = generateFlackoTake(quote, report, hiro, portfolio.position);
    
    // Post status update
    await postStatusUpdate(quote, portfolio, report, hiro, flackoTake);
    
    // Make trading decision
    const signal = makeTradeDecision({
      quote,
      hiro,
      report,
      portfolio,
      todayTradesCount: sessionState.todayTradesCount,
    });
    
    // Execute trade if signaled
    if (signal.action === 'buy' && signal.shares) {
      await executeBuy(signal, quote, report, hiro, portfolio);
    } else if (signal.action === 'sell' && signal.shares) {
      await executeSell(signal, quote, report, hiro, portfolio);
    }
    
    // Update state in database
    await updateBotState(portfolio, sessionState.todayTradesCount);
    
    console.log(`✅ cycle complete at ${new Date().toLocaleTimeString()}`);
    
  } catch (error) {
    console.error('❌ error in trading loop:', error);
    await logBot('error', 'trading loop error', { error: String(error) });
    await postError(String(error));
  }
}

/**
 * HIRO update loop - runs every hour
 */
async function hiroLoop(): Promise<void> {
  if (!isRunning) return;
  
  try {
    if (!isMarketOpen()) {
      return;
    }
    
    const hiro = await fetchHIRO();
    const quote = await fetchTSLAPrice();
    
    const portfolio = calculatePortfolio(
      sessionState.cash,
      sessionState.sharesHeld,
      sessionState.avgCost,
      quote.price,
      sessionState.realizedPnl
    );
    
    await postHIROUpdate(hiro, portfolio.position);
    console.log('📊 hiro update posted');
    
  } catch (error) {
    console.error('❌ error in hiro loop:', error);
  }
}

/**
 * Execute a buy order
 */
async function executeBuy(
  signal: TradeSignal,
  quote: any,
  report: any,
  hiro: any,
  portfolio: Portfolio
): Promise<void> {
  const shares = signal.shares!;
  const price = signal.price;
  const totalValue = shares * price;
  
  // Update session state
  const newShares = sessionState.sharesHeld + shares;
  const newAvgCost = sessionState.sharesHeld > 0
    ? ((sessionState.avgCost * sessionState.sharesHeld) + totalValue) / newShares
    : price;
  
  sessionState.cash -= totalValue;
  sessionState.sharesHeld = newShares;
  sessionState.avgCost = newAvgCost;
  sessionState.todayTradesCount++;
  
  // Record trade
  const trade: Trade = {
    timestamp: new Date(),
    action: 'buy',
    shares,
    price,
    totalValue,
    reasoning: signal.reasoning,
    mode: report?.mode || 'YELLOW',
    tier: report?.tier || 2,
    hiroReading: hiro.reading,
    portfolioValue: portfolio.totalValue,
    cashRemaining: sessionState.cash,
  };
  
  await recordTrade(trade);
  
  // Post alert
  const updatedPortfolio = calculatePortfolio(
    sessionState.cash,
    sessionState.sharesHeld,
    sessionState.avgCost,
    quote.price,
    sessionState.realizedPnl
  );
  await postEntryAlert(trade, report, updatedPortfolio);
  
  await logBot('trade', `bought ${shares} shares @ $${price}`, {
    shares,
    price,
    totalValue,
  });
  
  console.log(`🟢 bought ${shares} shares @ $${price.toFixed(2)}`);
}

/**
 * Execute a sell order
 */
async function executeSell(
  signal: TradeSignal,
  quote: any,
  report: any,
  hiro: any,
  portfolio: Portfolio
): Promise<void> {
  const shares = signal.shares!;
  const price = signal.price;
  const totalValue = shares * price;
  const costBasis = shares * sessionState.avgCost;
  const realizedPnl = totalValue - costBasis;
  
  // Update session state
  sessionState.cash += totalValue;
  sessionState.sharesHeld = 0;
  sessionState.avgCost = 0;
  sessionState.realizedPnl += realizedPnl;
  
  // Record trade
  const trade: Trade = {
    timestamp: new Date(),
    action: 'sell',
    shares,
    price,
    totalValue,
    reasoning: signal.reasoning,
    mode: report?.mode || 'YELLOW',
    tier: report?.tier || 2,
    hiroReading: hiro.reading,
    realized_pnl: realizedPnl,
    portfolioValue: sessionState.cash,
    cashRemaining: sessionState.cash,
  };
  
  await recordTrade(trade);
  
  // Post alert
  const updatedPortfolio = calculatePortfolio(
    sessionState.cash,
    0,
    0,
    quote.price,
    sessionState.realizedPnl
  );
  const todayPnl = await calculateTodayPnl();
  await postExitAlert(trade, updatedPortfolio, todayPnl);
  
  await logBot('trade', `sold ${shares} shares @ $${price} (pnl: $${realizedPnl.toFixed(2)})`, {
    shares,
    price,
    realizedPnl,
  });
  
  console.log(`🔴 sold ${shares} shares @ $${price.toFixed(2)} (pnl: $${realizedPnl.toFixed(2)})`);
}

/**
 * Start the bot
 */
export async function start(): Promise<void> {
  if (isRunning) {
    console.log('⚠️ bot already running');
    return;
  }
  
  const initialized = await init();
  if (!initialized) {
    console.error('❌ bot initialization failed');
    process.exit(1);
  }
  
  isRunning = true;
  
  // Run immediately
  await tradingLoop();
  await hiroLoop();
  
  // Set up intervals
  updateTimer = setInterval(tradingLoop, CONFIG.UPDATE_INTERVAL_MS);
  hiroTimer = setInterval(hiroLoop, CONFIG.HIRO_INTERVAL_MS);
  
  console.log('⚔️ paper flacko is running');
  console.log(`   updates every ${CONFIG.UPDATE_INTERVAL_MS / 60000} minutes`);
  console.log(`   hiro updates every ${CONFIG.HIRO_INTERVAL_MS / 60000} minutes`);
}

/**
 * Stop the bot
 */
export function stop(): void {
  isRunning = false;
  
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
  
  if (hiroTimer) {
    clearInterval(hiroTimer);
    hiroTimer = null;
  }
  
  console.log('🛑 paper flacko stopped');
  logBot('info', 'bot stopped');
}

/**
 * Get bot status
 */
export function getStatus(): {
  isRunning: boolean;
  cash: number;
  sharesHeld: number;
  avgCost: number;
  realizedPnl: number;
  todayTradesCount: number;
} {
  return {
    isRunning,
    cash: sessionState.cash,
    sharesHeld: sessionState.sharesHeld,
    avgCost: sessionState.avgCost,
    realizedPnl: sessionState.realizedPnl,
    todayTradesCount: sessionState.todayTradesCount,
  };
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 shutting down gracefully...');
  stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  start().catch(error => {
    console.error('❌ fatal error:', error);
    process.exit(1);
  });
}
