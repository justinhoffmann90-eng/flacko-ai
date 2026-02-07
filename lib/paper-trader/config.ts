/**
 * Flacko Paper Trader Bot — Configuration
 */

export const CONFIG = {
  // Starting capital
  STARTING_CAPITAL: 100000,
  
  // Timing
  UPDATE_INTERVAL_MS: 15 * 60 * 1000,  // 15 minutes
  HIRO_INTERVAL_MS: 60 * 60 * 1000,     // 1 hour
  MARKET_OPEN_HOUR_CT: 8,               // 8:30 AM CT
  MARKET_OPEN_MINUTE: 30,
  MARKET_CLOSE_HOUR_CT: 15,             // 3:00 PM CT
  NO_NEW_POSITIONS_AFTER_HOUR: 15,      // 3 PM CT
  
  // Risk management
  MAX_POSITIONS_PER_DAY: 2,
  MAX_POSITION_PCT: {
    GREEN: 0.25,
    YELLOW: 0.15,
    ORANGE: 0.10,
    RED: 0.05,
  },
  
  // Tier multipliers
  TIER_MULTIPLIERS: {
    1: 1.0,
    2: 0.75,
    3: 0.5,
    4: 0.5,
  },
  
  // Entry/exit thresholds
  SUPPORT_THRESHOLD_PERCENT: 0.005,  // 0.5%
  TARGET_THRESHOLD_PERCENT: 0.003,   // 0.3%
  MIN_RISK_REWARD_RATIO: 1.5,
  
  // HIRO thresholds
  HIRO_BULLISH_PERCENTILE: 70,
  HIRO_BEARISH_PERCENTILE: 30,
  
  // Symbol
  SYMBOL: 'TSLA',
};

// Environment validation
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'PAPER_TRADER_DISCORD_TOKEN',
    'PAPER_TRADER_CHANNEL_ID',
  ];
  
  const missing = required.filter(v => !process.env[v]);
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
