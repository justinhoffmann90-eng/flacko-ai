/**
 * Multi-Ticker Configuration
 * 
 * Central source of truth for all supported tickers.
 * Controls data sources, pricing, features, and report behavior per ticker.
 */

export interface TickerConfig {
  /** Ticker symbol (e.g., 'TSLA') */
  symbol: string;
  /** Full company/fund name */
  name: string;
  /** Display name for UI */
  displayName: string;
  /** Asset type */
  assetType: 'stock' | 'etf';

  // Data source availability
  /** Whether SpotGamma data is available */
  hasSpotGamma: boolean;
  /** Whether HIRO data is available */
  hasHiro: boolean;
  /** SpotGamma HIRO URL (if available) */
  spotGammaHiroUrl?: string;
  /** SpotGamma Equity Hub URL (if available) */
  spotGammaEquityHubUrl?: string;
  /** Whether BX Trender engine supports this ticker */
  bxEngineSupported: boolean;

  // Report configuration
  /** Timeframes to compute (always includes daily + weekly) */
  defaultTimeframes: string[];
  /** Whether this ticker has a dedicated TradingView chart layout */
  hasTradingViewLayout: boolean;
  /** TradingView chart URLs (if dedicated layouts exist) */
  tradingViewUrls?: {
    weekly?: string;
    daily?: string;
    fourHour?: string;
    oneHour?: string;
  };

  // Pricing
  /** Stripe price ID for monthly subscription */
  stripePriceId: string | null;
  /** Price in cents */
  priceCents: number;

  // Feature flags
  /** Whether this ticker is live for subscribers */
  enabled: boolean;
  /** Whether this is the flagship product (special treatment) */
  isFlagship: boolean;
  /** Sort order in UI */
  sortOrder: number;
}

/**
 * All supported ticker configurations.
 * TSLA is the flagship — full data sources.
 * Other tickers get BX engine + TV screener technicals.
 */
export const TICKER_CONFIGS: Record<string, TickerConfig> = {
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    displayName: 'TSLA',
    assetType: 'stock',
    hasSpotGamma: true,
    hasHiro: true,
    spotGammaHiroUrl: 'https://dashboard.spotgamma.com/hiro?sym=TSLA',
    spotGammaEquityHubUrl: 'https://dashboard.spotgamma.com/equityhub?sym=TSLA',
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk', '4h'],
    hasTradingViewLayout: true,
    tradingViewUrls: {
      weekly: 'https://www.tradingview.com/chart/tNbIrfO6/',
      daily: 'https://www.tradingview.com/chart/WnaUUzOg/',
      fourHour: 'https://www.tradingview.com/chart/nZrr0NjL/',
      oneHour: 'https://www.tradingview.com/chart/a2s4ajN3/',
    },
    stripePriceId: null, // Uses legacy subscription system
    priceCents: 2999,
    enabled: true,
    isFlagship: true,
    sortOrder: 1,
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    displayName: 'NVDA',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null, // Created during Stripe setup
    priceCents: 999,
    enabled: true,
    isFlagship: false,
    sortOrder: 2,
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    displayName: 'QQQ',
    assetType: 'etf',
    hasSpotGamma: true,
    hasHiro: false,
    spotGammaEquityHubUrl: 'https://dashboard.spotgamma.com/equityhub?sym=QQQ',
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: true,
    tradingViewUrls: {
      weekly: 'https://www.tradingview.com/chart/aa4fqoaY/',
      daily: 'https://www.tradingview.com/chart/PiCNUPvL/',
    },
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 3,
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    displayName: 'AAPL',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 4,
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    displayName: 'AMZN',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 5,
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    displayName: 'META',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 6,
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    displayName: 'MSFT',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 7,
  },
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    displayName: 'SPY',
    assetType: 'etf',
    hasSpotGamma: true,
    hasHiro: false,
    spotGammaEquityHubUrl: 'https://dashboard.spotgamma.com/equityhub?sym=SPY',
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 8,
  },
  AMD: {
    symbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    displayName: 'AMD',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 9,
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    displayName: 'GOOGL',
    assetType: 'stock',
    hasSpotGamma: false,
    hasHiro: false,
    bxEngineSupported: true,
    defaultTimeframes: ['1d', '1wk'],
    hasTradingViewLayout: false,
    stripePriceId: null,
    priceCents: 999,
    enabled: false,
    isFlagship: false,
    sortOrder: 10,
  },
};

/** Get config for a ticker, throws if not found */
export function getTickerConfig(ticker: string): TickerConfig {
  const config = TICKER_CONFIGS[ticker.toUpperCase()];
  if (!config) {
    throw new Error(`Unsupported ticker: ${ticker}`);
  }
  return config;
}

/** Get all enabled tickers */
export function getEnabledTickers(): TickerConfig[] {
  return Object.values(TICKER_CONFIGS)
    .filter(t => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get all tickers (for admin) */
export function getAllTickers(): TickerConfig[] {
  return Object.values(TICKER_CONFIGS)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Check if a ticker is supported (even if not enabled) */
export function isTickerSupported(ticker: string): boolean {
  return ticker.toUpperCase() in TICKER_CONFIGS;
}

/** Validate ticker and return uppercase, or null if invalid */
export function validateTicker(ticker: string | null | undefined): string | null {
  if (!ticker) return null;
  const upper = ticker.toUpperCase();
  return isTickerSupported(upper) ? upper : null;
}

/** Default ticker for backwards compatibility */
export const DEFAULT_TICKER = 'TSLA';
