-- ohlcv_bars: pre-computed OHLCV + indicators for scalable backtesting
-- Run via: psql "$SUPABASE_DB_URL" -f scripts/create-ohlcv-table.sql

CREATE TABLE IF NOT EXISTS ohlcv_bars (
  id BIGSERIAL PRIMARY KEY,
  ticker TEXT NOT NULL,
  timeframe TEXT NOT NULL,  -- 'weekly', 'daily', 'monthly'
  bar_date DATE NOT NULL,
  open DOUBLE PRECISION NOT NULL,
  high DOUBLE PRECISION NOT NULL,
  low DOUBLE PRECISION NOT NULL,
  close DOUBLE PRECISION NOT NULL,
  volume BIGINT NOT NULL DEFAULT 0,
  -- Pre-computed indicators
  rsi DOUBLE PRECISION,
  bxt DOUBLE PRECISION,
  bxt_state TEXT,  -- 'HH', 'LH', 'HL', 'LL'
  bxt_consecutive_ll INTEGER DEFAULT 0,
  ema_9 DOUBLE PRECISION,
  ema_13 DOUBLE PRECISION,
  ema_21 DOUBLE PRECISION,
  sma_200 DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticker, timeframe, bar_date)
);

-- Indexes for fast backtest queries
CREATE INDEX IF NOT EXISTS idx_ohlcv_bars_ticker_tf_date ON ohlcv_bars(ticker, timeframe, bar_date);
CREATE INDEX IF NOT EXISTS idx_ohlcv_bars_rsi ON ohlcv_bars(ticker, timeframe, rsi) WHERE rsi IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ohlcv_bars_bxt ON ohlcv_bars(ticker, timeframe, bxt) WHERE bxt IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ohlcv_bars_bxt_ll ON ohlcv_bars(ticker, timeframe, bxt_consecutive_ll) WHERE bxt_consecutive_ll > 0;
