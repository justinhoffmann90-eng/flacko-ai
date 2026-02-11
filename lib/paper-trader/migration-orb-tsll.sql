-- Paper Trader Bot: Orb + TSLL Migration
-- Run this in Supabase SQL Editor to add multi-instrument and Orb support

-- 1. Add instrument column and Orb snapshot columns to paper_trades
ALTER TABLE paper_trades 
ADD COLUMN IF NOT EXISTS instrument TEXT DEFAULT 'TSLA',
ADD COLUMN IF NOT EXISTS orb_score DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS orb_zone TEXT,
ADD COLUMN IF NOT EXISTS orb_active_setups JSONB;

-- Add index for instrument queries
CREATE INDEX IF NOT EXISTS idx_paper_trades_instrument ON paper_trades(instrument);

-- 2. Add TSLL and Orb columns to paper_portfolio
ALTER TABLE paper_portfolio 
ADD COLUMN IF NOT EXISTS tsla_shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tsla_avg_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tsll_shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tsll_avg_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS orb_zone TEXT,
ADD COLUMN IF NOT EXISTS orb_score DECIMAL(8,3);

-- 3. Add TSLL and Orb columns to paper_bot_state
ALTER TABLE paper_bot_state 
ADD COLUMN IF NOT EXISTS tsll_shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tsll_avg_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS current_orb_zone TEXT,
ADD COLUMN IF NOT EXISTS current_orb_score DECIMAL(8,3);

-- 4. Backfill existing trades with instrument = 'TSLA' (already have default, but ensure)
UPDATE paper_trades 
SET instrument = 'TSLA' 
WHERE instrument IS NULL;

-- 5. Update paper_portfolio to populate tsla_shares from shares_held (backfill)
UPDATE paper_portfolio 
SET tsla_shares = shares_held,
    tsla_avg_cost = avg_cost
WHERE tsla_shares = 0 AND shares_held > 0;

-- 6. Create view for instrument-specific performance
CREATE OR REPLACE VIEW paper_instrument_performance AS
SELECT
  instrument,
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
WHERE action = 'sell'
GROUP BY instrument;

-- 7. Create view for Orb zone performance
CREATE OR REPLACE VIEW paper_orb_zone_performance AS
SELECT
  p.orb_zone,
  p.date,
  p.total_value,
  p.total_return,
  p.trades_count,
  p.win_count,
  p.loss_count,
  p.tsla_shares,
  p.tsll_shares,
  p.orb_score
FROM paper_portfolio p
WHERE p.orb_zone IS NOT NULL
ORDER BY p.date DESC;

-- Migration complete!
-- Next steps:
-- 1. Restart the paper trader bot
-- 2. Verify Orb score is being fetched
-- 3. Watch for zone transitions
