/**
 * Paper Trader Bot Backtest Engine
 * Simulates bot performance on historical data
 */

import {
  DailyReportData,
  OHLCV,
  PriceLevel,
  loadDailyReports,
  getIntradayData,
  calculateHIROPercentile,
  calculateBuyAndHold,
} from './backtest-data';

// Backtest Configuration
const CONFIG = {
  STARTING_CAPITAL: 100000,
  START_DATE: '2026-01-27',
  END_DATE: '2026-02-06',
  TRANSACTION_COST_PCT: 0.001, // 0.1% per trade
  SLIPPAGE_PCT: 0.0005, // 0.05% slippage
  MAX_TRADES_PER_DAY: 2,
  NO_NEW_POSITIONS_AFTER_HOUR: 15, // 3 PM
  SUPPORT_THRESHOLD_PCT: 0.008, // 0.8% from support = "near"
  BAR_INTERVAL_MINUTES: 15,
};

// Position sizing by mode
const MODE_SIZING: Record<string, number> = {
  GREEN: 0.25,
  YELLOW: 0.15,
  ORANGE: 0.10,
  RED: 0.05,
};

interface Position {
  shares: number;
  avgCost: number;
  entryTime: Date;
  entryPrice: number;
  entryMode: string;
  entryReason: string;
}

interface Trade {
  id: number;
  timestamp: Date;
  date: string;
  time: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  grossValue: number;
  transactionCost: number;
  netValue: number;
  realizedPnl?: number;
  realizedPnlPct?: number;
  reasoning: string[];
  mode: string;
  hiroReading?: number;
  hiroPercentile?: number;
  portfolioValue: number;
  cashRemaining: number;
  slippageApplied: number;
}

interface DailyResult {
  date: string;
  mode: string;
  openPrice: number;
  closePrice: number;
  dailyChangePct: number;
  trades: Trade[];
  startingCash: number;
  endingCash: number;
  sharesHeld: number;
  avgCost: number;
  positionValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalValue: number;
  totalReturn: number;
  tradeCount: number;
  hiroReading?: number;
  masterEject: number;
  keyLevels: PriceLevel[];
}

interface BacktestResult {
  startDate: string;
  endDate: string;
  startingCapital: number;
  endingCapital: number;
  totalReturn: number;
  totalReturnPct: number;
  buyAndHoldReturn: number;
  buyAndHoldReturnPct: number;
  outperformance: number;
  outperformancePct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWinner: number;
  avgLoser: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  transactionCosts: number;
  dailyResults: DailyResult[];
  allTrades: Trade[];
}

class BacktestEngine {
  private cash: number;
  private position: Position | null;
  private trades: Trade[];
  private dailyResults: DailyResult[];
  private tradeId: number;
  private portfolioValueHistory: { date: Date; value: number }[];

  constructor() {
    this.cash = CONFIG.STARTING_CAPITAL;
    this.position = null;
    this.trades = [];
    this.dailyResults = [];
    this.tradeId = 0;
    this.portfolioValueHistory = [];
  }

  /**
   * Run the full backtest
   */
  run(reports: DailyReportData[]): BacktestResult {
    console.log('🚀 Starting Paper Trader Backtest');
    console.log(`📅 Period: ${CONFIG.START_DATE} to ${CONFIG.END_DATE}`);
    console.log(`💰 Starting Capital: $${CONFIG.STARTING_CAPITAL.toLocaleString()}`);
    console.log('');

    for (const report of reports) {
      this.processTradingDay(report);
    }

    return this.generateResults(reports);
  }

  /**
   * Process a single trading day
   */
  private processTradingDay(report: DailyReportData): void {
    const date = report.date;
    const intradayBars = getIntradayData(date);

    if (intradayBars.length === 0) {
      console.warn(`⚠️ No intraday data for ${date}`);
      return;
    }

    const startOfDayCash = this.cash;
    const dailyTrades: Trade[] = [];
    let tradesToday = 0;

    // Process each 15-minute bar
    for (const bar of intradayBars) {
      const hour = bar.timestamp.getHours();
      const canEnterNew = hour < CONFIG.NO_NEW_POSITIONS_AFTER_HOUR && tradesToday < CONFIG.MAX_TRADES_PER_DAY;

      // Make trading decision
      const decision = this.makeDecision(bar, report, canEnterNew, tradesToday);

      if (decision.action === 'buy' && decision.shares && decision.shares > 0) {
        const trade = this.executeBuy(bar, decision, report);
        if (trade) {
          dailyTrades.push(trade);
          tradesToday++;
        }
      } else if (decision.action === 'sell' && this.position) {
        const trade = this.executeSell(bar, decision, report);
        if (trade) {
          dailyTrades.push(trade);
          tradesToday++;
        }
      }

      // Record portfolio value throughout the day
      const currentValue = this.calculatePortfolioValue(bar.close);
      this.portfolioValueHistory.push({ date: bar.timestamp, value: currentValue });
    }

    // Calculate end-of-day metrics
    const lastBar = intradayBars[intradayBars.length - 1];
    const endOfDayValue = this.calculatePortfolioValue(lastBar.close);

    const dailyResult: DailyResult = {
      date,
      mode: report.mode,
      openPrice: intradayBars[0].open,
      closePrice: lastBar.close,
      dailyChangePct: ((lastBar.close - intradayBars[0].open) / intradayBars[0].open) * 100,
      trades: dailyTrades,
      startingCash: startOfDayCash,
      endingCash: this.cash,
      sharesHeld: this.position?.shares || 0,
      avgCost: this.position?.avgCost || 0,
      positionValue: this.position ? this.position.shares * lastBar.close : 0,
      realizedPnl: dailyTrades.filter(t => t.action === 'sell').reduce((sum, t) => sum + (t.realizedPnl || 0), 0),
      unrealizedPnl: this.calculateUnrealizedPnl(lastBar.close),
      totalValue: endOfDayValue,
      totalReturn: endOfDayValue - CONFIG.STARTING_CAPITAL,
      tradeCount: dailyTrades.length,
      hiroReading: report.hiroReading,
      masterEject: report.masterEject,
      keyLevels: report.levels,
    };

    this.dailyResults.push(dailyResult);
    this.printDailySummary(dailyResult);
  }

  /**
   * Make trading decision based on current bar and report
   */
  private makeDecision(
    bar: OHLCV,
    report: DailyReportData,
    canEnterNew: boolean,
    tradesToday: number
  ): { action: 'buy' | 'sell' | 'hold'; shares?: number; reasoning: string[] } {
    const price = bar.close;
    const reasoning: string[] = [];

    // Evaluate exit first if we have a position
    if (this.position) {
      return this.evaluateExit(bar, report);
    }

    // Evaluate entry
    if (!canEnterNew) {
      if (tradesToday >= CONFIG.MAX_TRADES_PER_DAY) {
        reasoning.push('Max 2 trades/day reached');
      } else {
        reasoning.push('After 3pm - no new positions');
      }
      return { action: 'hold', reasoning };
    }

    // Check Master Eject - NEVER buy below
    if (price < report.masterEject) {
      reasoning.push(`Price ($${price.toFixed(2)}) below Master Eject ($${report.masterEject.toFixed(2)})`);
      return { action: 'hold', reasoning };
    }

    // RED mode - no new positions (only 5% nibbles at extreme support)
    if (report.mode === 'RED') {
      // In RED mode, only nibble at Put Wall or major support
      const nearPutWall = report.putWall && Math.abs(price - report.putWall) / price < 0.02;
      if (!nearPutWall) {
        reasoning.push(`RED mode - only nibbles at Put Wall ($${report.putWall})`);
        return { action: 'hold', reasoning };
      }
      reasoning.push('RED mode but near Put Wall support');
    }

    // Check if price is near support (entry condition)
    const nearSupport = this.checkNearSupport(price, report);
    if (!nearSupport.isNear) {
      reasoning.push(`Price not near support levels`);
      return { action: 'hold', reasoning };
    }

    // Check HIRO for supportive flow
    const hiroSupportive = this.isHIROSupportive(report);
    if (!hiroSupportive.isSupportive) {
      reasoning.push(`HIRO not supportive: ${hiroSupportive.reason}`);
      // Continue anyway if near strong support in ORANGE/YELLOW mode
      if (report.mode === 'ORANGE' || report.mode === 'YELLOW') {
        reasoning.push('But near support in favorable mode - proceeding with caution');
      } else {
        return { action: 'hold', reasoning };
      }
    }

    // Calculate position size
    const positionPercent = MODE_SIZING[report.mode] || 0.15;
    const positionValue = this.cash * positionPercent;
    const shares = Math.floor(positionValue / price);

    if (shares < 1) {
      reasoning.push('Position size too small');
      return { action: 'hold', reasoning };
    }

    // Check risk/reward
    const target = this.determineTarget(price, report);
    const stop = report.masterEject;
    const risk = price - stop;
    const reward = target - price;
    const rr = risk > 0 ? reward / risk : 0;

    if (rr < 1.0) {
      reasoning.push(`Risk/Reward ratio ${rr.toFixed(2)} < 1.0`);
      return { action: 'hold', reasoning };
    }

    reasoning.push(`${report.mode} mode - ${(positionPercent * 100).toFixed(0)}% position size`);
    reasoning.push(`Near support: ${nearSupport.level} at $${nearSupport.price.toFixed(2)}`);
    reasoning.push(`HIRO: ${report.hiroReading}M (${hiroSupportive.percentile?.toFixed(0)}th percentile)`);
    reasoning.push(`Target: $${target.toFixed(2)} | Stop: $${stop.toFixed(2)} | R/R: ${rr.toFixed(1)}`);

    return { action: 'buy', shares, reasoning };
  }

  /**
   * Evaluate whether to exit current position
   */
  private evaluateExit(bar: OHLCV, report: DailyReportData): { action: 'buy' | 'sell' | 'hold'; shares?: number; reasoning: string[] } {
    const price = bar.close;
    const reasoning: string[] = [];

    if (!this.position) return { action: 'hold', reasoning: ['No position'] };

    const entryPrice = this.position.entryPrice;
    const unrealizedPnl = (price - entryPrice) * this.position.shares;
    const unrealizedPnlPct = ((price / entryPrice) - 1) * 100;

    // Exit if price hits Master Eject
    if (price < report.masterEject) {
      reasoning.push(`🚨 STOP HIT: Price ($${price.toFixed(2)}) below Master Eject ($${report.masterEject.toFixed(2)})`);
      reasoning.push(`Realized loss: $${unrealizedPnl.toFixed(2)} (${unrealizedPnlPct.toFixed(1)}%)`);
      return { action: 'sell', shares: this.position.shares, reasoning };
    }

    // Exit if mode flipped to RED from entry (unless we just entered)
    if (report.mode === 'RED' && this.position.entryMode !== 'RED') {
      if (unrealizedPnl > 0) {
        reasoning.push(`Mode flipped to RED - taking profits`);
        reasoning.push(`Realized gain: $${unrealizedPnl.toFixed(2)} (${unrealizedPnlPct.toFixed(1)}%)`);
      } else {
        reasoning.push(`Mode flipped to RED - cutting loss`);
        reasoning.push(`Realized loss: $${unrealizedPnl.toFixed(2)} (${unrealizedPnlPct.toFixed(1)}%)`);
      }
      return { action: 'sell', shares: this.position.shares, reasoning };
    }

    // Exit if target hit (next resistance level)
    const nearTarget = this.checkNearTarget(price, report);
    if (nearTarget.isNear && unrealizedPnl > 0) {
      reasoning.push(`🎯 TARGET HIT: Price near ${nearTarget.level} ($${nearTarget.price.toFixed(2)})`);
      reasoning.push(`Realized gain: $${unrealizedPnl.toFixed(2)} (${unrealizedPnlPct.toFixed(1)}%)`);
      return { action: 'sell', shares: this.position.shares, reasoning };
    }

    // Exit if 2%+ profit and end of day approaching
    const hour = bar.timestamp.getHours();
    if (hour >= 15 && unrealizedPnlPct >= 2) {
      reasoning.push(`Approaching close with ${unrealizedPnlPct.toFixed(1)}% gain - taking profits`);
      return { action: 'sell', shares: this.position.shares, reasoning };
    }

    // Hold position
    reasoning.push('Holding position');
    reasoning.push(`Unrealized: ${unrealizedPnl >= 0 ? '+' : ''}$${unrealizedPnl.toFixed(2)} (${unrealizedPnlPct >= 0 ? '+' : ''}${unrealizedPnlPct.toFixed(1)}%)`);
    return { action: 'hold', reasoning };
  }

  /**
   * Execute a buy order
   */
  private executeBuy(
    bar: OHLCV,
    decision: { shares?: number; reasoning: string[] },
    report: DailyReportData
  ): Trade | null {
    if (!decision.shares) return null;

    const price = bar.close * (1 + CONFIG.SLIPPAGE_PCT); // Slippage on entry
    const grossValue = decision.shares * price;
    const transactionCost = grossValue * CONFIG.TRANSACTION_COST_PCT;
    const netValue = grossValue + transactionCost;

    if (netValue > this.cash) {
      return null;
    }

    this.tradeId++;
    this.cash -= netValue;

    // Update or create position
    if (this.position) {
      const totalShares = this.position.shares + decision.shares;
      const totalCost = this.position.avgCost * this.position.shares + price * decision.shares;
      this.position = {
        shares: totalShares,
        avgCost: totalCost / totalShares,
        entryTime: this.position.entryTime,
        entryPrice: this.position.entryPrice,
        entryMode: this.position.entryMode,
        entryReason: this.position.entryReason,
      };
    } else {
      this.position = {
        shares: decision.shares,
        avgCost: price,
        entryTime: bar.timestamp,
        entryPrice: price,
        entryMode: report.mode,
        entryReason: decision.reasoning.join('; '),
      };
    }

    const portfolioValue = this.calculatePortfolioValue(price);

    return {
      id: this.tradeId,
      timestamp: bar.timestamp,
      date: report.date,
      time: bar.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      action: 'buy',
      shares: decision.shares,
      price,
      grossValue,
      transactionCost,
      netValue,
      reasoning: decision.reasoning,
      mode: report.mode,
      hiroReading: report.hiroReading,
      hiroPercentile: report.hiroReading && report.hiro30DayLow && report.hiro30DayHigh
        ? calculateHIROPercentile(report.hiroReading, report.hiro30DayLow, report.hiro30DayHigh)
        : undefined,
      portfolioValue,
      cashRemaining: this.cash,
      slippageApplied: bar.close * CONFIG.SLIPPAGE_PCT,
    };
  }

  /**
   * Execute a sell order
   */
  private executeSell(
    bar: OHLCV,
    decision: { shares?: number; reasoning: string[] },
    report: DailyReportData
  ): Trade | null {
    if (!decision.shares || !this.position) return null;

    const price = bar.close * (1 - CONFIG.SLIPPAGE_PCT); // Slippage on exit
    const shares = Math.min(decision.shares, this.position.shares);
    const grossValue = shares * price;
    const transactionCost = grossValue * CONFIG.TRANSACTION_COST_PCT;
    const netValue = grossValue - transactionCost;

    const realizedPnl = (price - this.position.avgCost) * shares;
    const realizedPnlPct = ((price / this.position.avgCost) - 1) * 100;

    this.tradeId++;
    this.cash += netValue;

    // Update position
    if (shares >= this.position.shares) {
      this.position = null;
    } else {
      this.position.shares -= shares;
    }

    const portfolioValue = this.calculatePortfolioValue(price);

    return {
      id: this.tradeId,
      timestamp: bar.timestamp,
      date: report.date,
      time: bar.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      action: 'sell',
      shares,
      price,
      grossValue,
      transactionCost,
      netValue,
      realizedPnl,
      realizedPnlPct,
      reasoning: decision.reasoning,
      mode: report.mode,
      hiroReading: report.hiroReading,
      portfolioValue,
      cashRemaining: this.cash,
      slippageApplied: bar.close * CONFIG.SLIPPAGE_PCT,
    };
  }

  /**
   * Check if price is near a support level
   */
  private checkNearSupport(price: number, report: DailyReportData): { isNear: boolean; level: string; price: number } {
    const supportLevels: { name: string; price: number }[] = [
      { name: 'Put Wall', price: report.putWall || report.masterEject },
      { name: 'Hedge Wall', price: report.hedgeWall },
      { name: 'Key Gamma Strike', price: report.keyGammaStrike },
      { name: 'Weekly 21 EMA', price: report.weekly21EMA },
      { name: 'Daily 21 EMA', price: report.daily21EMA },
    ].filter((l): l is { name: string; price: number } => !!l.price && l.price > 0);

    for (const level of supportLevels) {
      const threshold = level.price * CONFIG.SUPPORT_THRESHOLD_PCT;
      if (price >= level.price - threshold && price <= level.price + threshold * 0.5) {
        return { isNear: true, level: level.name, price: level.price };
      }
    }

    return { isNear: false, level: '', price: 0 };
  }

  /**
   * Check if price is near a target/resistance level
   */
  private checkNearTarget(price: number, report: DailyReportData): { isNear: boolean; level: string; price: number } {
    const targetLevels: { name: string; price: number }[] = [
      { name: 'Call Wall', price: report.callWall },
      { name: 'Key Gamma Strike', price: report.keyGammaStrike },
      { name: 'Daily 9 EMA', price: report.daily9EMA },
      { name: 'Weekly 13 EMA', price: report.weekly13EMA },
    ].filter((l): l is { name: string; price: number } => !!l.price && l.price > price);

    for (const level of targetLevels) {
      const threshold = level.price * 0.005;
      if (level.price - price <= threshold) {
        return { isNear: true, level: level.name, price: level.price };
      }
    }

    return { isNear: false, level: '', price: 0 };
  }

  /**
   * Determine price target for a trade
   */
  private determineTarget(currentPrice: number, report: DailyReportData): number {
    if (report.callWall && report.callWall > currentPrice) return report.callWall;
    if (report.keyGammaStrike && report.keyGammaStrike > currentPrice) return report.keyGammaStrike;
    if (report.daily9EMA && report.daily9EMA > currentPrice) return report.daily9EMA;
    return currentPrice * 1.03; // 3% default target
  }

  /**
   * Check if HIRO is supportive for entry
   */
  private isHIROSupportive(report: DailyReportData): { isSupportive: boolean; reason: string; percentile?: number } {
    if (!report.hiroReading || !report.hiro30DayLow || !report.hiro30DayHigh) {
      return { isSupportive: true, reason: 'No HIRO data available' };
    }

    const percentile = calculateHIROPercentile(
      report.hiroReading,
      report.hiro30DayLow,
      report.hiro30DayHigh
    );

    if (percentile < 20) {
      return { isSupportive: false, reason: `HIRO at ${percentile.toFixed(0)}th percentile (heavy selling)`, percentile };
    }
    if (percentile > 60) {
      return { isSupportive: true, reason: `HIRO at ${percentile.toFixed(0)}th percentile (bullish flow)`, percentile };
    }
    return { isSupportive: true, reason: `HIRO neutral at ${percentile.toFixed(0)}th percentile`, percentile };
  }

  /**
   * Calculate current portfolio value
   */
  private calculatePortfolioValue(price: number): number {
    const positionValue = this.position ? this.position.shares * price : 0;
    return this.cash + positionValue;
  }

  /**
   * Calculate unrealized P&L
   */
  private calculateUnrealizedPnl(currentPrice: number): number {
    if (!this.position) return 0;
    return (currentPrice - this.position.avgCost) * this.position.shares;
  }

  /**
   * Print daily summary to console
   */
  private printDailySummary(result: DailyResult): void {
    console.log(`\n📊 ${result.date} (${result.mode} Mode)`);
    console.log(`   Open: $${result.openPrice.toFixed(2)} | Close: $${result.closePrice.toFixed(2)} (${result.dailyChangePct >= 0 ? '+' : ''}${result.dailyChangePct.toFixed(2)}%)`);
    console.log(`   Cash: $${result.endingCash.toFixed(2)} | Position: ${result.sharesHeld} shares @ $${result.avgCost.toFixed(2)}`);
    console.log(`   Total Value: $${result.totalValue.toFixed(2)} | Return: ${result.totalReturn >= 0 ? '+' : ''}$${result.totalReturn.toFixed(2)}`);

    for (const trade of result.trades) {
      const emoji = trade.action === 'buy' ? '🟢' : '🔴';
      const pnl = trade.realizedPnl ? ` | P&L: ${trade.realizedPnl >= 0 ? '+' : ''}$${trade.realizedPnl.toFixed(2)}` : '';
      console.log(`   ${emoji} ${trade.time} ${trade.action.toUpperCase()} ${trade.shares} shares @ $${trade.price.toFixed(2)}${pnl}`);
    }
  }

  /**
   * Generate final backtest results
   */
  private generateResults(reports: DailyReportData[]): BacktestResult {
    const allTrades = this.dailyResults.flatMap(d => d.trades);
    const winningTrades = allTrades.filter(t => t.realizedPnl && t.realizedPnl > 0);
    const losingTrades = allTrades.filter(t => t.realizedPnl && t.realizedPnl < 0);

    const totalTransactionCosts = allTrades.reduce((sum, t) => sum + t.transactionCost, 0);

    // Calculate max drawdown
    let maxDrawdown = 0;
    let maxDrawdownPct = 0;
    let peakValue = CONFIG.STARTING_CAPITAL;

    for (const point of this.portfolioValueHistory) {
      if (point.value > peakValue) {
        peakValue = point.value;
      }
      const drawdown = peakValue - point.value;
      const drawdownPct = (drawdown / peakValue) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPct = drawdownPct;
      }
    }

    // Calculate buy-and-hold benchmark
    const startPrice = this.dailyResults[0]?.openPrice || 0;
    const endPrice = this.dailyResults[this.dailyResults.length - 1]?.closePrice || 0;
    const buyAndHold = calculateBuyAndHold(startPrice, endPrice);

    const endingValue = this.dailyResults[this.dailyResults.length - 1]?.totalValue || CONFIG.STARTING_CAPITAL;
    const totalReturn = endingValue - CONFIG.STARTING_CAPITAL;
    const totalReturnPct = (totalReturn / CONFIG.STARTING_CAPITAL) * 100;

    return {
      startDate: CONFIG.START_DATE,
      endDate: CONFIG.END_DATE,
      startingCapital: CONFIG.STARTING_CAPITAL,
      endingCapital: endingValue,
      totalReturn,
      totalReturnPct,
      buyAndHoldReturn: buyAndHold.returnDollars,
      buyAndHoldReturnPct: buyAndHold.returnPercent,
      outperformance: totalReturn - buyAndHold.returnDollars,
      outperformancePct: totalReturnPct - buyAndHold.returnPercent,
      totalTrades: allTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: allTrades.length > 0 ? (winningTrades.length / allTrades.filter(t => t.realizedPnl !== undefined).length) * 100 : 0,
      avgWinner: winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0) / winningTrades.length : 0,
      avgLoser: losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0) / losingTrades.length : 0,
      profitFactor: losingTrades.length > 0 && winningTrades.length > 0
        ? Math.abs(winningTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0) / losingTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0))
        : 0,
      maxDrawdown,
      maxDrawdownPct,
      sharpeRatio: 0, // Would need risk-free rate and more calculation
      transactionCosts: totalTransactionCosts,
      dailyResults: this.dailyResults,
      allTrades,
    };
  }
}

// Run backtest if called directly
if (require.main === module) {
  const reportsDir = process.env.REPORTS_DIR || '~/trading_inputs/daily-reports';
  const reports = loadDailyReports(reportsDir, CONFIG.START_DATE, CONFIG.END_DATE);

  if (reports.length === 0) {
    console.error('❌ No reports found for backtest period');
    process.exit(1);
  }

  console.log(`📚 Loaded ${reports.length} daily reports`);

  const engine = new BacktestEngine();
  const results = engine.run(reports);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 BACKTEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Period: ${results.startDate} to ${results.endDate}`);
  console.log(`Starting Capital: $${results.startingCapital.toLocaleString()}`);
  console.log(`Ending Capital: $${results.endingCapital.toLocaleString()}`);
  console.log(`Total Return: ${results.totalReturn >= 0 ? '+' : ''}$${results.totalReturn.toFixed(2)} (${results.totalReturnPct >= 0 ? '+' : ''}${results.totalReturnPct.toFixed(2)}%)`);
  console.log(`Buy & Hold Return: ${results.buyAndHoldReturn >= 0 ? '+' : ''}$${results.buyAndHoldReturn.toFixed(2)} (${results.buyAndHoldReturnPct >= 0 ? '+' : ''}${results.buyAndHoldReturnPct.toFixed(2)}%)`);
  console.log(`Outperformance: ${results.outperformance >= 0 ? '+' : ''}$${results.outperformance.toFixed(2)} (${results.outperformancePct >= 0 ? '+' : ''}${results.outperformancePct.toFixed(2)}%)`);
  console.log('');
  console.log(`Total Trades: ${results.totalTrades}`);
  console.log(`Win Rate: ${results.winRate.toFixed(1)}% (${results.winningTrades}/${results.winningTrades + results.losingTrades})`);
  console.log(`Avg Winner: $${results.avgWinner.toFixed(2)}`);
  console.log(`Avg Loser: $${results.avgLoser.toFixed(2)}`);
  console.log(`Profit Factor: ${results.profitFactor.toFixed(2)}`);
  console.log(`Max Drawdown: $${results.maxDrawdown.toFixed(2)} (${results.maxDrawdownPct.toFixed(2)}%)`);
  console.log(`Transaction Costs: $${results.transactionCosts.toFixed(2)}`);

  // Export results for report generation
  if (process.env.EXPORT_RESULTS) {
    const fs = require('fs');
    const outputPath = process.env.OUTPUT_PATH || '~/clawd/backtest-results/backtest-data.json';
    fs.writeFileSync(outputPath.replace('~', require('os').homedir()), JSON.stringify(results, null, 2));
    console.log(`\n💾 Results exported to ${outputPath}`);
  }
}

export { BacktestEngine, CONFIG };
export type { BacktestResult, DailyResult, Trade, Position };
