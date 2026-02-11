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
  fetchTSLLPrice,
  fetchOrbScore,
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
  postZoneChangeAlert,
  postMarketOpen,
  postMarketClose,
  postWeeklyReport,
  postError,
} from './discord-poster';
import { initAxelrod, postAxelrodCommentary } from './axelrod';
import {
  recordTrade,
  updateBotState,
  getBotState,
  calculatePortfolio,
  calculateMultiPortfolio,
  getTodayTrades,
  calculateTodayPnl,
  recordDailyPortfolio,
  getWeeklyPerformance,
  logBot,
} from './performance';
import type { Trade, Portfolio, MultiPortfolio, TradeSignal, OrbZone, Instrument } from './types';

// Bot configuration
const CONFIG = {
  STARTING_CAPITAL: 1000000,
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

// Current session state (multi-instrument)
// Starting with 40% baseline TSLA position (~$400k @ $350/share = 1,142 shares)
let sessionState = {
  cash: 600000,             // 60% cash ($600,000)
  sharesHeld: 1142,         // TSLA shares (~$400k baseline position)
  avgCost: 350.00,          // TSLA avg cost
  tsllShares: 0,            // TSLL shares
  tsllAvgCost: 0,           // TSLL avg cost
  realizedPnl: 0,
  todayTradesCount: 0,
  currentDate: new Date().toISOString().split('T')[0],
  previousOrbZone: undefined as OrbZone | undefined,
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
  ];
  
  const missing = required.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`❌ missing env vars: ${missing.join(', ')}`);
    return false;
  }
  
  // Initialize Discord
  if (!initDiscord() || !initAxelrod()) {
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
    sessionState.tsllShares = savedState.tsllShares;
    sessionState.tsllAvgCost = savedState.tsllAvgCost;
    sessionState.realizedPnl = savedState.realizedPnl;
    sessionState.previousOrbZone = savedState.currentOrbZone as OrbZone | undefined;
  }
  
  console.log('✅ paper flacko initialized');
  console.log(`   cash: $${sessionState.cash.toFixed(2)}`);
  console.log(`   TSLA shares: ${sessionState.sharesHeld}`);
  console.log(`   TSLL shares: ${sessionState.tsllShares}`);
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
      const [quote, tsllQuote, report, orb] = await Promise.all([
        fetchTSLAPrice(),
        fetchTSLLPrice(),
        fetchDailyReport(),
        fetchOrbScore(),
      ]);
      await postMarketOpen(quote, tsllQuote, report, orb, undefined);
      // Axe only reacts to trades, not market open
      marketOpenPosted = true;
      sessionState.previousOrbZone = orb.zone;
      await logBot('info', 'market open posted', { orbZone: orb.zone, orbScore: orb.score });
    }
    
    // Post market close
    if (!marketStatus.isOpen && marketOpenPosted && !marketClosePosted) {
      const [quote, tsllQuote, orb] = await Promise.all([
        fetchTSLAPrice(),
        fetchTSLLPrice(),
        fetchOrbScore(),
      ]);
      
      const multiPortfolio = calculateMultiPortfolio(
        sessionState.cash,
        sessionState.sharesHeld,
        sessionState.avgCost,
        quote.price,
        sessionState.tsllShares,
        sessionState.tsllAvgCost,
        tsllQuote.price,
        sessionState.realizedPnl
      );
      
      const todayPnl = await calculateTodayPnl();
      
      // Calculate P&L by instrument
      const todayTrades = await getTodayTrades();
      const dayPnlByInstrument = {
        tsla: todayTrades.filter(t => t.instrument === 'TSLA').reduce((sum, t) => sum + (t.realizedPnl || 0), 0),
        tsll: todayTrades.filter(t => t.instrument === 'TSLL').reduce((sum, t) => sum + (t.realizedPnl || 0), 0),
      };
      
      await postMarketClose(multiPortfolio, sessionState.todayTradesCount, todayPnl, dayPnlByInstrument);
      
      // Record daily snapshot
      const winCount = todayTrades.filter(t => (t.realizedPnl || 0) > 0).length;
      const lossCount = todayTrades.filter(t => (t.realizedPnl || 0) < 0).length;
      await recordDailyPortfolio(multiPortfolio, todayTrades.length, winCount, lossCount, orb.zone, orb.score);
      
      marketClosePosted = true;
      await logBot('info', 'market close posted', { todayPnl, orbZone: orb.zone });
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
    
    // Fetch all data (multi-instrument + Orb)
    const [quote, tsllQuote, hiro, report, orb] = await Promise.all([
      fetchTSLAPrice(),
      fetchTSLLPrice(),
      fetchHIRO(),
      fetchDailyReport(),
      fetchOrbScore(),
    ]);
    
    // Check for Orb zone transition
    if (sessionState.previousOrbZone && sessionState.previousOrbZone !== orb.zone) {
      console.log(`🔄 Orb zone transition: ${sessionState.previousOrbZone} → ${orb.zone}`);
      await postZoneChangeAlert(sessionState.previousOrbZone, orb.zone, orb);
      // Axe only reacts to trades, not zone changes
      sessionState.previousOrbZone = orb.zone;
    } else if (!sessionState.previousOrbZone) {
      sessionState.previousOrbZone = orb.zone;
    }
    
    // Calculate current portfolio (multi-instrument)
    const multiPortfolio = calculateMultiPortfolio(
      sessionState.cash,
      sessionState.sharesHeld,
      sessionState.avgCost,
      quote.price,
      sessionState.tsllShares,
      sessionState.tsllAvgCost,
      tsllQuote.price,
      sessionState.realizedPnl
    );
    
    // Legacy single-instrument portfolio for compatibility
    const portfolio = calculatePortfolio(
      sessionState.cash,
      sessionState.sharesHeld,
      sessionState.avgCost,
      quote.price,
      sessionState.realizedPnl
    );
    
    // Generate Flacko's take
    const flackoTake = generateFlackoTake(quote, report, hiro, multiPortfolio.tsla ? { 
      shares: multiPortfolio.tsla.shares,
      avgCost: multiPortfolio.tsla.avgCost,
      entryTime: new Date(),
      entryPrice: multiPortfolio.tsla.avgCost,
      unrealizedPnl: multiPortfolio.tsla.unrealizedPnl,
      unrealizedPnlPercent: multiPortfolio.tsla.pnlPercent,
      currentValue: multiPortfolio.tsla.value,
    } : null);
    
    // Key moments only — no routine 15-min status posts.
    // Taylor speaks when there's something to say: trades, zone changes, market open/close.
    
    // Make trading decision (multi-instrument + Orb)
    const signal = makeTradeDecision({
      quote,
      tsllQuote,
      hiro,
      report,
      orb,
      portfolio,
      multiPortfolio,
      todayTradesCount: sessionState.todayTradesCount,
      previousOrbZone: sessionState.previousOrbZone,
    });
    
    // Execute trade if signaled
    if (signal.action === 'buy' && signal.shares && signal.instrument) {
      await executeBuy(signal, quote, tsllQuote, report, hiro, orb, multiPortfolio);
    } else if (signal.action === 'sell' && signal.shares && signal.instrument) {
      await executeSell(signal, quote, tsllQuote, report, hiro, orb, multiPortfolio);
    }
    
    // Update state in database
    await updateBotState(multiPortfolio, sessionState.todayTradesCount, orb.zone, orb.score);
    
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
    
    // HIRO data fetched for trade decisions — no standalone HIRO posts.
    // Key moments only: Taylor posts on trades, zone changes, market open/close.
    console.log(`📊 hiro cached: ${(hiro.reading / 1000000).toFixed(0)}M (${hiro.percentile30Day.toFixed(0)}%)`);
    
  } catch (error) {
    console.error('❌ error in hiro loop:', error);
  }
}

/**
 * Execute a buy order (multi-instrument)
 */
async function executeBuy(
  signal: TradeSignal,
  quote: any,
  tsllQuote: any,
  report: any,
  hiro: any,
  orb: any,
  portfolio: MultiPortfolio
): Promise<void> {
  const shares = signal.shares!;
  const instrument = signal.instrument!;
  const price = signal.price;
  const totalValue = shares * price;
  
  // Update session state based on instrument
  if (instrument === 'TSLA') {
    const newShares = sessionState.sharesHeld + shares;
    const newAvgCost = sessionState.sharesHeld > 0
      ? ((sessionState.avgCost * sessionState.sharesHeld) + totalValue) / newShares
      : price;
    
    sessionState.sharesHeld = newShares;
    sessionState.avgCost = newAvgCost;
  } else if (instrument === 'TSLL') {
    const newShares = sessionState.tsllShares + shares;
    const newAvgCost = sessionState.tsllShares > 0
      ? ((sessionState.tsllAvgCost * sessionState.tsllShares) + totalValue) / newShares
      : price;
    
    sessionState.tsllShares = newShares;
    sessionState.tsllAvgCost = newAvgCost;
  }
  
  sessionState.cash -= totalValue;
  sessionState.todayTradesCount++;
  
  // Record trade
  const trade: Trade = {
    timestamp: new Date(),
    action: 'buy',
    instrument,
    shares,
    price,
    totalValue,
    reasoning: signal.reasoning.join('\n'),
    mode: report?.mode || 'YELLOW',
    tier: report?.tier || 2,
    hiroReading: hiro.reading,
    portfolioValue: portfolio.totalValue,
    cashRemaining: sessionState.cash,
    orbScore: orb.score,
    orbZone: orb.zone,
    orbActiveSetups: orb.activeSetups,
    isOverride: signal.isOverride,
    overrideSetups: signal.overrideSetups,
  };
  
  await recordTrade(trade);
  
  // Post alert
  const updatedPortfolio = calculateMultiPortfolio(
    sessionState.cash,
    sessionState.sharesHeld,
    sessionState.avgCost,
    quote.price,
    sessionState.tsllShares,
    sessionState.tsllAvgCost,
    tsllQuote.price,
    sessionState.realizedPnl
  );
  await postEntryAlert(trade, report, updatedPortfolio, orb, hiro);
  // Axelrod reacts to the entry
  postAxelrodCommentary({
    taylorPost: `ENTRY: Bought ${shares} ${instrument} @ $${price.toFixed(2)}. ${signal.reasoning.join('. ')}`,
    quote, report, hiro, orb, portfolio: updatedPortfolio, trade,
  }).catch(() => {});
  
  await logBot('trade', `bought ${shares} shares ${instrument} @ $${price}`, {
    instrument,
    shares,
    price,
    totalValue,
    orbZone: orb.zone,
  });
  
  console.log(`🟢 bought ${shares} shares ${instrument} @ $${price.toFixed(2)}`);
}

/**
 * Execute a sell order (multi-instrument)
 */
async function executeSell(
  signal: TradeSignal,
  quote: any,
  tsllQuote: any,
  report: any,
  hiro: any,
  orb: any,
  portfolio: MultiPortfolio
): Promise<void> {
  const shares = signal.shares!;
  const instrument = signal.instrument!;
  const price = signal.price;
  const totalValue = shares * price;
  
  // Calculate realized P&L based on instrument
  let costBasis: number;
  if (instrument === 'TSLA') {
    costBasis = shares * sessionState.avgCost;
  } else {
    costBasis = shares * sessionState.tsllAvgCost;
  }
  const realizedPnl = totalValue - costBasis;
  
  // Update session state based on instrument
  sessionState.cash += totalValue;
  sessionState.realizedPnl += realizedPnl;
  
  if (instrument === 'TSLA') {
    sessionState.sharesHeld = 0;
    sessionState.avgCost = 0;
  } else if (instrument === 'TSLL') {
    sessionState.tsllShares = 0;
    sessionState.tsllAvgCost = 0;
  }
  
  // Record trade
  const trade: Trade = {
    timestamp: new Date(),
    action: 'sell',
    instrument,
    shares,
    price,
    totalValue,
    reasoning: signal.reasoning.join('\n'),
    mode: report?.mode || 'YELLOW',
    tier: report?.tier || 2,
    hiroReading: hiro.reading,
    realizedPnl: realizedPnl,
    portfolioValue: sessionState.cash,
    cashRemaining: sessionState.cash,
    orbScore: orb.score,
    orbZone: orb.zone,
    orbActiveSetups: orb.activeSetups,
  };
  
  await recordTrade(trade);
  
  // Post alert
  const updatedPortfolio = calculateMultiPortfolio(
    sessionState.cash,
    sessionState.sharesHeld,
    sessionState.avgCost,
    quote.price,
    sessionState.tsllShares,
    sessionState.tsllAvgCost,
    tsllQuote.price,
    sessionState.realizedPnl
  );
  const todayPnl = await calculateTodayPnl();
  await postExitAlert(trade, updatedPortfolio, todayPnl, orb);
  // Axelrod reacts to the exit
  postAxelrodCommentary({
    taylorPost: `EXIT: Sold ${shares} ${instrument} @ $${price.toFixed(2)}. P&L: $${realizedPnl.toFixed(2)}. ${signal.reasoning.join('. ')}`,
    quote, report, hiro, orb, portfolio: updatedPortfolio, trade,
  }).catch(() => {});
  
  await logBot('trade', `sold ${shares} shares ${instrument} @ $${price} (pnl: $${realizedPnl.toFixed(2)})`, {
    instrument,
    shares,
    price,
    realizedPnl,
    orbZone: orb.zone,
  });
  
  console.log(`🔴 sold ${shares} shares ${instrument} @ $${price.toFixed(2)} (pnl: $${realizedPnl.toFixed(2)})`);
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
