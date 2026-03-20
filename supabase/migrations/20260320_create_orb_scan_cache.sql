
CREATE TABLE IF NOT EXISTS orb_scan_cache (
  ticker TEXT PRIMARY KEY,
  seasonality_json JSONB,
  scan_summary_json JSONB,
  backtest_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow service role full access
ALTER TABLE orb_scan_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON orb_scan_cache FOR ALL USING (true) WITH CHECK (true);
