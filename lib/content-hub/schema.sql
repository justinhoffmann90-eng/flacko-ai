-- Content Hub Database Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS content_hub_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  weekly_schedule JSONB DEFAULT '{}'::jsonb,
  custom_types JSONB DEFAULT '[]'::jsonb,
  renamed_titles JSONB DEFAULT '{}'::jsonb,
  custom_subtitles JSONB DEFAULT '{}'::jsonb,
  custom_prompts JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_hub_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access own content hub data" ON content_hub_data;

CREATE POLICY "Users can only access own content hub data"
  ON content_hub_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON TABLE content_hub_data TO authenticated;
