-- Migration: Create price_cache table for TSLA/TSLL shared cache
-- Purpose: Prevent Yahoo Finance rate limiting by centralizing price fetches

CREATE TABLE IF NOT EXISTS price_cache (
  symbol TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  change NUMERIC,
  change_percent NUMERIC,
  volume BIGINT,
  high NUMERIC,
  low NUMERIC,
  previous_close NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on updated_at for cache staleness checks
CREATE INDEX IF NOT EXISTS idx_price_cache_updated_at ON price_cache(updated_at);

-- Add comment for documentation
COMMENT ON TABLE price_cache IS 'Shared cache for TSLA/TSLL prices fetched from Yahoo Finance. Updated every 5 minutes during market hours via cron.';
