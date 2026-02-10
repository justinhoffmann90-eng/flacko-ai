-- Orb Backtest Instances: individual historical signal fires with forward returns
CREATE TABLE IF NOT EXISTS orb_backtest_instances (
  id SERIAL PRIMARY KEY,
  setup_id TEXT NOT NULL REFERENCES orb_setup_definitions(id),
  signal_date DATE NOT NULL,
  signal_price NUMERIC(10,2) NOT NULL,
  ret_5d NUMERIC(8,4),
  ret_10d NUMERIC(8,4),
  ret_20d NUMERIC(8,4),
  ret_60d NUMERIC(8,4),
  is_win_5d BOOLEAN,
  is_win_10d BOOLEAN,
  is_win_20d BOOLEAN,
  is_win_60d BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(setup_id, signal_date)
);

CREATE INDEX IF NOT EXISTS idx_backtest_setup ON orb_backtest_instances(setup_id);
CREATE INDEX IF NOT EXISTS idx_backtest_date ON orb_backtest_instances(signal_date DESC);

ALTER TABLE orb_backtest_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON orb_backtest_instances FOR SELECT USING (true);
