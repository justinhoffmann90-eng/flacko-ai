-- Email send log for tracking password setup and other transactional emails
CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'password_setup', 'alert', etc.
  status TEXT NOT NULL, -- 'sent', 'send_failed', 'link_generation_failed', 'exception'
  resend_id TEXT, -- Resend email ID on success
  error_message TEXT, -- Error details on failure
  metadata JSONB, -- Additional context (session_id, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_send_log_user_id ON email_send_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_log_status ON email_send_log(status);
CREATE INDEX IF NOT EXISTS idx_email_send_log_created_at ON email_send_log(created_at);

-- RLS policies (service role only for writes, admins can read)
ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert email logs"
  ON email_send_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can view email logs"
  ON email_send_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );
