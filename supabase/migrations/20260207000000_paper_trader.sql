-- Flacko Paper Trader Bot — Database Schema

CREATE TABLE IF NOT EXISTS paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT CHECK (action IN ('buy', 'sell')),
  shares INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_value DECIMAL(12,2) NOT NULL,
  reasoning TEXT,
  mode TEXT,
  tier INTEGER,
  hiro_reading DECIMAL(12,2),
  realized_pnl DECIMAL(12,2),
  unrealized_pnl DECIMAL(12,2),
  portfolio_value DECIMAL(12,2),
  cash_remaining DECIMAL(12,2)
);

CREATE INDEX IF NOT EXISTS idx_paper_trades_timestamp ON paper_trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_paper_trades_action ON paper_trades(action);

CREATE TABLE IF NOT EXISTS paper_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  starting_cash DECIMAL(12,2) NOT NULL,
  ending_cash DECIMAL(12,2) NOT NULL,
  shares_held INTEGER DEFAULT 0,
  avg_cost DECIMAL(10,2),
  unrealized_pnl DECIMAL(12,2) DEFAULT 0,
  realized_pnl DECIMAL(12,2) DEFAULT 0,
  total_value DECIMAL(12,2) NOT NULL,
  total_return DECIMAL(5,2) DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paper_portfolio_date ON paper_portfolio(date DESC);

CREATE TABLE IF NOT EXISTS paper_bot_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cash DECIMAL(12,2) NOT NULL DEFAULT 100000.00,
  shares_held INTEGER DEFAULT 0,
  avg_cost DECIMAL(10,2),
  realized_pnl DECIMAL(12,2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  last_update_at TIMESTAMPTZ DEFAULT NOW(),
  current_mode TEXT DEFAULT 'YELLOW',
  current_tier INTEGER DEFAULT 2,
  today_trades_count INTEGER DEFAULT 0,
  current_date DATE DEFAULT CURRENT_DATE
);

INSERT INTO paper_bot_state (cash, shares_held, realized_pnl, total_trades, win_count, loss_count, current_mode, current_tier)
SELECT 100000.00, 0, 0, 0, 0, 0, 'YELLOW', 2
WHERE NOT EXISTS (SELECT 1 FROM paper_bot_state);

CREATE TABLE IF NOT EXISTS paper_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'trade')),
  message TEXT NOT NULL,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_paper_bot_logs_timestamp ON paper_bot_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_paper_bot_logs_level ON paper_bot_logs(level);

CREATE TABLE IF NOT EXISTS paper_hiro_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  reading DECIMAL(12,2) NOT NULL,
  percentile_30day DECIMAL(5,2),
  character TEXT,
  raw_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_paper_hiro_cache_timestamp ON paper_hiro_cache(timestamp DESC);
