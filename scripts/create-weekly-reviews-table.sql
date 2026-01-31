-- Create weekly_reviews table for Flacko AI
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  raw_markdown TEXT,
  extracted_data JSONB NOT NULL,
  parser_version TEXT,
  parser_warnings JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Anyone can read weekly reviews"
  ON weekly_reviews FOR SELECT
  USING (true);

-- Grant access via API
GRANT SELECT ON weekly_reviews TO authenticated;
GRANT SELECT ON weekly_reviews TO anon;
