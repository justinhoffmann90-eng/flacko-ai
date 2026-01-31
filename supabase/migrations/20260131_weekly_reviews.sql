-- Weekly Reviews table
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  raw_markdown TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  parser_version TEXT NOT NULL DEFAULT '1.0.0',
  parser_warnings TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(week_start, week_end)
);

-- Enable RLS
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: anyone with active subscription can read
CREATE POLICY "Weekly reviews viewable by subscribers"
  ON weekly_reviews FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM subscriptions 
      WHERE status IN ('active', 'comped', 'trial')
    )
  );

-- Policy: admins can insert/update
CREATE POLICY "Admins can manage weekly reviews"
  ON weekly_reviews FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_admin = true
    )
  );

-- Index for querying
CREATE INDEX idx_weekly_reviews_week_end ON weekly_reviews(week_end DESC);
