-- Discord Alert Log - tracks all Discord alert attempts
CREATE TABLE IF NOT EXISTS discord_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  channel_id text,
  channel_name text,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  message_preview text,
  error_message text,
  response_code integer,
  created_at timestamptz DEFAULT now()
);

-- Index for recent lookups
CREATE INDEX IF NOT EXISTS idx_discord_alert_log_created_at ON discord_alert_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discord_alert_log_status ON discord_alert_log(status);
CREATE INDEX IF NOT EXISTS idx_discord_alert_log_job_name ON discord_alert_log(job_name);

-- Enable RLS
ALTER TABLE discord_alert_log ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role full access" ON discord_alert_log
  FOR ALL USING (true) WITH CHECK (true);
