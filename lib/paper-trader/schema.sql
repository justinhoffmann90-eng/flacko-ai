-- Flacko Paper Trader Bot — Database Schema
-- Run this in Supabase SQL Editor

-- Table: paper_trades
-- Stores all buy/sell transactions
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

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_paper_trades_timestamp ON paper_trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_paper_trades_action ON paper_trades(action);

-- Table: paper_portfolio
-- Daily snapshot of portfolio state
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

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_paper_portfolio_date ON paper_portfolio(date DESC);

-- Table: paper_bot_state
-- Current bot state (position, cash, etc.)
CREATE TABLE IF NOT EXISTS paper_bot_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Singleton table
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

-- Initialize bot state if empty
INSERT INTO paper_bot_state (cash, shares_held, realized_pnl, total_trades, win_count, loss_count, current_mode, current_tier)
SELECT 100000.00, 0, 0, 0, 0, 0, 'YELLOW', 2
WHERE NOT EXISTS (SELECT 1 FROM paper_bot_state);

-- Table: paper_bot_logs
-- Operational logs for debugging
CREATE TABLE IF NOT EXISTS paper_bot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'trade')),
  message TEXT NOT NULL,
  metadata JSONB
);

-- Index for log queries
CREATE INDEX IF NOT EXISTS idx_paper_bot_logs_timestamp ON paper_bot_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_paper_bot_logs_level ON paper_bot_logs(level);

-- Table: paper_hiro_cache
-- Cached HIRO readings
CREATE TABLE IF NOT EXISTS paper_hiro_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  reading DECIMAL(12,2) NOT NULL,
  percentile_30day DECIMAL(5,2),
  character TEXT,
  raw_data JSONB
);

-- Index for recent HIRO
CREATE INDEX IF NOT EXISTS idx_paper_hiro_cache_timestamp ON paper_hiro_cache(timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for paper_portfolio
DROP TRIGGER IF EXISTS update_paper_portfolio_updated_at ON paper_portfolio;
CREATE TRIGGER update_paper_portfolio_updated_at
  BEFORE UPDATE ON paper_portfolio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_bot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_hiro_cache ENABLE ROW LEVEL SECURITY;

-- Allow all access for service role (bot)
CREATE POLICY IF NOT EXISTS paper_trades_service_all ON paper_trades
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS paper_portfolio_service_all ON paper_portfolio
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS paper_bot_state_service_all ON paper_bot_state
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS paper_bot_logs_service_all ON paper_bot_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS paper_hiro_cache_service_all ON paper_hiro_cache
  FOR ALL USING (true) WITH CHECK (true);

-- View: paper_performance_summary
-- Quick performance metrics
CREATE OR REPLACE VIEW paper_performance_summary AS
SELECT
  COUNT(*) as total_trades,
  SUM(CASE WHEN realized_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
  SUM(CASE WHEN realized_pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
  SUM(CASE WHEN realized_pnl > 0 THEN realized_pnl ELSE 0 END) as total_gains,
  SUM(CASE WHEN realized_pnl < 0 THEN realized_pnl ELSE 0 END) as total_losses,
  SUM(realized_pnl) as net_pnl,
  AVG(CASE WHEN realized_pnl > 0 THEN realized_pnl END) as avg_winner,
  AVG(CASE WHEN realized_pnl < 0 THEN realized_pnl END) as avg_loser,
  MAX(realized_pnl) as best_trade,
  MIN(realized_pnl) as worst_trade
FROM paper_trades
WHERE action = 'sell';

-- View: paper_daily_summary
-- Daily aggregated stats
CREATE OR REPLACE VIEW paper_daily_summary AS
SELECT
  DATE(timestamp) as date,
  COUNT(*) as trades_count,
  SUM(CASE WHEN action = 'buy' THEN total_value ELSE 0 END) as buys,
  SUM(CASE WHEN action = 'sell' THEN total_value ELSE 0 END) as sells,
  SUM(realized_pnl) as realized_pnl
FROM paper_trades
GROUP BY DATE(timestamp)
ORDER BY date DESC;
