-- HIRO Readings Table
-- Stores HIRO (dealer gamma exposure) readings throughout the trading day
-- Used for EOD recap generation and correlation analysis

CREATE TABLE IF NOT EXISTS hiro_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  value BIGINT NOT NULL, -- HIRO value in millions (e.g., 800000000 for +800M)
  signal TEXT NOT NULL CHECK (signal IN ('bullish', 'bearish', 'neutral')),
  price_at_reading DECIMAL(10, 2), -- TSLA price at time of reading
  source TEXT DEFAULT 'manual', -- 'manual', 'screenshot_ocr', 'api'
  notes TEXT, -- Optional context or observations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date-based queries
CREATE INDEX idx_hiro_readings_timestamp ON hiro_readings(timestamp);

-- Index for finding readings by date
CREATE INDEX idx_hiro_readings_date ON hiro_readings(DATE(timestamp));

-- Row Level Security (RLS)
ALTER TABLE hiro_readings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage HIRO readings"
  ON hiro_readings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Subscribers can read
CREATE POLICY "Subscribers can read HIRO readings"
  ON hiro_readings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.status IN ('active', 'comped')
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hiro_readings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hiro_readings_updated_at
  BEFORE UPDATE ON hiro_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_hiro_readings_updated_at();

-- Sample data (optional - for testing)
-- COMMENT: Run this in Supabase SQL Editor to populate test data
/*
INSERT INTO hiro_readings (timestamp, value, signal, price_at_reading, notes)
VALUES
  ('2026-02-03 09:00:00-06', 800000000, 'bullish', 424.50, 'Morning reading - positive gamma'),
  ('2026-02-03 11:00:00-06', 1200000000, 'bullish', 432.00, 'Midday - dealers unwinding hedges'),
  ('2026-02-03 13:00:00-06', 650000000, 'bullish', 430.00, 'Afternoon - still positive'),
  ('2026-02-03 15:30:00-06', 500000000, 'neutral', 428.75, 'Close - moderating');
*/
