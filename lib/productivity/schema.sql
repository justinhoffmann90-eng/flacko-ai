// Supabase SQL to run in dashboard:

/*
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS productivity_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  tasks JSONB DEFAULT '{"backlog":[],"today":[],"progress":[],"complete":[]}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  game JSONB DEFAULT '{"xp":0,"level":1,"streak":0,"bestStreak":0,"lastActiveDate":null}'::jsonb,
  ideas JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE productivity_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own productivity data" ON productivity_data;

CREATE POLICY "Users can only access own productivity data"
  ON productivity_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant access
GRANT ALL ON TABLE productivity_data TO authenticated;
*/
