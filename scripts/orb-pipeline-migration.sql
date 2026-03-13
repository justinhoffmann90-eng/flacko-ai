CREATE TABLE IF NOT EXISTS orb_setup_pipeline (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hypothesis TEXT,
  type TEXT NOT NULL CHECK (type IN ('buy', 'avoid')),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'testing', 'backtested', 'active', 'archived')),
  tickers TEXT[] DEFAULT ARRAY['TSLA'],
  conditions JSONB,
  backtest_stats JSONB,
  grade TEXT,
  source TEXT DEFAULT 'manual',
  one_liner TEXT,
  category_tags TEXT[],
  forward_returns JSONB,
  sample_size INTEGER,
  win_rate_20d NUMERIC(5,4),
  last_triggered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  promoted_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

ALTER TABLE orb_setup_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"
ON orb_setup_pipeline
FOR SELECT
USING (true);
