ALTER TABLE orb_backtest_instances 
ADD COLUMN IF NOT EXISTS gauge_target_bar integer,
ADD COLUMN IF NOT EXISTS gauge_days integer,
ADD COLUMN IF NOT EXISTS gauge_return numeric,
ADD COLUMN IF NOT EXISTS gauge_completed boolean DEFAULT false;
