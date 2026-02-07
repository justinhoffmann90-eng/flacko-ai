-- Activity Logs Schema for Supabase
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created 
  ON activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type 
  ON activity_logs(action_type);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activities (or all if admin)
CREATE POLICY "Users can view own activities"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow inserts from API
CREATE POLICY "Allow inserts from API"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT ALL ON TABLE activity_logs TO authenticated;
