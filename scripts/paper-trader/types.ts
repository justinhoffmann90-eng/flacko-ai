/**
 * Flacko Paper Trader Bot — Type Definitions
 */

export type OrbZone = "FULL_SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";
export type Instrument = "TSLA" | "TSLL";

export interface OrbData {
  score: number;
  zone: OrbZone;
  activeSetups: { setup_id: string; status: string }[];
  timestamp: Date;
}

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
  reading: number;
  percentile30Day: number;
  character: string;
  timestamp: Date;
}

export type TradeMode = 'GREEN' | 'YELLOW' | 'YELLOW_IMPROVING' | 'ORANGE' | 'RED' | 'EJECTED';
export type TrimRegime = 'A' | 'B' | 'MIXED';
export type BxState = 'HH' | 'HL' | 'LH' | 'LL' | null;

export interface AlertInstruction {
  type: 'buy' | 'trim' | 'reduce' | 'eject' | 'hold' | 'unknown';
  useDailyCap?: boolean;
  stopPrice?: number;
  trimPercent?: number;
}

export interface ActiveStop {
  id: string;
  sourceLevel: string;
  stopPrice: number;
  sharesAtRisk: number;
  createdAt: string;
}

export interface DailyReport {
  date: string;
  mode: TradeMode;
  tier: number;
  masterEject: number;
  gammaStrike: number;
  putWall: number;
  hedgeWall: number;
  callWall: number;
  levels: KeyLevel[];
  commentary?: string;
  daily_21ema?: number;
  daily_9ema?: number;
  weekly_9ema?: number;
  weekly_13ema?: number;
  weekly_21ema?: number;
  sma_200?: number;
  bx_daily_state?: BxState;
}

export interface KeyLevel {
  name: string;
  price: number;
  type: 'support' | 'resistance' | 'neutral' | 'trim' | 'target' | 'eject' | 'nibble' | 'current' | 'slow_zone';
  action?: string;
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
  instrument: Instrument;
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
  orbScore?: number;
  orbZone?: string;
  orbActiveSetups?: { setup_id: string; status: string }[];
  isOverride?: boolean;
  overrideSetups?: string[];
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

export interface WeeklyDayBreakdown {
  date: string;
  dayLabel: string;
  trades: { action: string; instrument: string; shares: number; price: number; pnl?: number }[];
  portfolioValue: number | null;
  dailyChange: number | null;
}

export interface WeeklyPerformanceData {
  weekRange: string;
  startValue: number;
  endValue: number;
  weeklyReturn: number;
  weeklyReturnPct: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  avgWinner: number;
  avgLoser: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  dailyBreakdown: WeeklyDayBreakdown[];
  currentPosition: {
    tslaShares: number;
    tslaAvgCost: number;
    tsllShares: number;
    tsllAvgCost: number;
    unrealizedPnl: number;
  } | null;
  allTime: {
    totalTrades: number;
    winRate: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
}

export interface TradeSignal {
  action: 'buy' | 'sell' | 'hold';
  instrument?: Instrument;
  shares?: number;
  price: number;
  reasoning: string[];
  confidence: 'high' | 'medium' | 'low';
  targetPrice?: number;
  stopPrice?: number;
  isOverride?: boolean;
  overrideSetups?: string[];
}

export interface MultiPortfolio {
  cash: number;
  startingCapital: number;
  tsla: {
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    unrealizedPnl: number;
    pnlPercent: number;
  } | null;
  tsll: {
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    unrealizedPnl: number;
    pnlPercent: number;
  } | null;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

export interface OptionPosition {
  instrument: "TSLA";
  type: "call" | "put";
  direction: "long" | "short";
  strike: number;
  expiry: string;
  contracts: number;
  premium: number;
  delta: number;
  theta: number;
  gamma: number;
  currentPremium?: number;
}

export interface BotConfig {
  startingCapital: number;
  maxPositionsPerDay: number;
  noNewPositionsAfter: string;
  updateIntervalMs: number;
  hiroIntervalMs: number;
  discordChannelId: string;
}

export interface ModeConfig {
  maxPositionPercent: number;
  description: string;
}

export const MODE_CONFIGS: Record<string, ModeConfig> = {
  GREEN: { maxPositionPercent: 0.30, description: 'favorable conditions — full deployment permitted' },
  YELLOW_IMPROVING: { maxPositionPercent: 0.20, description: 'recovery building — meaningful accumulation' },
  YELLOW: { maxPositionPercent: 0.175, description: 'warning signs — spread entries over 5-6 days' },
  ORANGE: { maxPositionPercent: 0.10, description: 'elevated caution — small nibbles only' },
  RED: { maxPositionPercent: 0.05, description: 'defensive — nibbles at extreme support only' },
  EJECTED: { maxPositionPercent: 0.00, description: 'below W21 for 2 closes — hold 50% core, buys blocked except 200 SMA override' },
};

export const TIER_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 0.75,
  3: 0.5,
  4: 0.5,
};

export const TRIM_CAPS: Record<string, number> = {
  GREEN: 0.10,
  YELLOW_IMPROVING: 0.15,
  YELLOW: 0.20,
  ORANGE: 0.25,
  RED: 0.30,
  EJECTED: 0.30,
};

export const MAX_INVESTED: Record<string, number> = {
  GREEN: 0.85,
  YELLOW_IMPROVING: 0.70,
  YELLOW: 0.60,
  ORANGE: 0.40,
  RED: 0.20,
  EJECTED: 0.50,
};

export const DAILY_TRIM_CAPS: Record<string, number> = {
  GREEN: 0.10,
  YELLOW_IMPROVING: 0.15,
  YELLOW: 0.15,
  ORANGE: 0.25,
  RED: 0.30,
  EJECTED: 0.30,
};

export const CORE_HOLD_FLOOR_PCT = 0.20;
export const RECOVERY_ACCEL_DAYS = 5;
export const DEEP_DIP_BRIDGE = {
  MIN_PCT: -15,
  MAX_PCT: -10,
  CAP: 0.10,
};

export interface V3State {
  peakPositionValue: number;
  dailyTrimPercent: number;
  dailyTrimDate: string;
  lastBxFlipDate: string | null;
  previousBxState: BxState;
  recoveryAccelRemaining: number;
  consecutive_below_w21: number;
  activeStops: ActiveStop[];
  firedLevelsToday?: string[];
}
