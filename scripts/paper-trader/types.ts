/**
 * Flacko Paper Trader Bot — Type Definitions
 */

export interface TSLAQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: Date;
}

export interface HIROData {
  reading: number; // in millions
  percentile30Day: number; // 0-100
  character: string;
  timestamp: Date;
}

export interface DailyReport {
  date: string;
  mode: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  tier: number;
  masterEject: number;
  gammaStrike: number;
  putWall: number;
  hedgeWall: number;
  callWall: number;
  levels: KeyLevel[];
  commentary?: string;
}

export interface KeyLevel {
  name: string;
  price: number;
  type: 'support' | 'resistance' | 'neutral';
}

export interface Position {
  shares: number;
  avgCost: number;
  entryTime: Date;
  entryPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  currentValue: number;
}

export interface Portfolio {
  cash: number;
  startingCapital: number;
  position: Position | null;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

export interface Trade {
  id?: string;
  timestamp: Date;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  totalValue: number;
  reasoning: string;
  mode: string;
  tier: number;
  hiroReading: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  portfolioValue: number;
  cashRemaining: number;
}

export interface DailyPerformance {
  date: string;
  startingCash: number;
  endingCash: number;
  sharesHeld: number;
  avgCost: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalValue: number;
  totalReturn: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
}

export interface PerformanceMetrics {
  capital: number;
  totalReturn: number;
  totalReturnPercent: number;
  tradesCount: number;
  winRate: number;
  avgWinner: number;
  avgLoser: number;
  maxDrawdown: number;
  sharpeRatio?: number;
  period: string;
}

export interface TradeSignal {
  action: 'buy' | 'sell' | 'hold';
  shares?: number;
  price: number;
  reasoning: string[];
  confidence: 'high' | 'medium' | 'low';
  targetPrice?: number;
  stopPrice?: number;
}

export interface BotConfig {
  startingCapital: number;
  maxPositionsPerDay: number;
  noNewPositionsAfter: string; // HH:MM
  updateIntervalMs: number;
  hiroIntervalMs: number;
  discordChannelId: string;
}

export interface ModeConfig {
  maxPositionPercent: number;
  description: string;
}

export const MODE_CONFIGS: Record<string, ModeConfig> = {
  GREEN: { maxPositionPercent: 0.25, description: 'favorable conditions' },
  YELLOW: { maxPositionPercent: 0.15, description: 'proceed with caution' },
  ORANGE: { maxPositionPercent: 0.10, description: 'elevated caution' },
  RED: { maxPositionPercent: 0.05, description: 'defensive, nibbles only' },
};

export const TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 0.75,
  3: 0.5,
  4: 0.5,
};
