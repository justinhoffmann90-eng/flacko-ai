-- Platform Improvements Migration
-- Date: 2026-02-05
-- Covers: DB indexes, subscription history, admin audit log, chat usage RPC, trial cleanup

-- ============================================
-- 1. MISSING INDEXES for performance
-- ============================================

-- Faster subscription lookups by user + status
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

-- Faster untriggered alert queries
CREATE INDEX IF NOT EXISTS idx_report_alerts_untriggered_user
  ON public.report_alerts(user_id, triggered_at DESC)
  WHERE triggered_at IS NULL;

-- Faster chat usage lookups
CREATE INDEX IF NOT EXISTS idx_chat_usage_user_date
  ON public.chat_usage(user_id, usage_date DESC);

-- Faster canceled subscription grace period queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_canceled_period
  ON public.subscriptions(status, current_period_end)
  WHERE status = 'canceled';

-- ============================================
-- 2. SUBSCRIPTION HISTORY (audit trail)
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  change_reason TEXT, -- 'checkout', 'webhook', 'admin', 'cron'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user
  ON public.subscription_history(user_id, created_at DESC);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 3. ADMIN AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL, -- 'delete_user', 'comp_subscription', 'create_invite', etc.
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin
  ON public.admin_audit_log(admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action
  ON public.admin_audit_log(action, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 4. ATOMIC CHAT USAGE INCREMENT (fixes race condition)
-- ============================================

CREATE OR REPLACE FUNCTION public.increment_chat_usage(
  p_user_id UUID,
  p_usage_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.chat_usage (user_id, usage_date, message_count)
  VALUES (p_user_id, p_usage_date, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET message_count = chat_usage.message_count + 1
  RETURNING message_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FIX TRIAL CREATION: Remove auto-trial from trigger
--    Trials should only be created via Stripe checkout flow
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table (no auto-trial)
    INSERT INTO public.users (id, email, x_handle)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'x_handle', '@unknown')
    );

    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ENGAGEMENT TRACKING VIEW (for admin analytics)
-- ============================================

-- View: Daily active users
CREATE OR REPLACE VIEW public.daily_engagement AS
SELECT
  DATE(last_dashboard_visit) AS visit_date,
  COUNT(DISTINCT id) AS unique_visitors
FROM public.users
WHERE last_dashboard_visit IS NOT NULL
GROUP BY DATE(last_dashboard_visit)
ORDER BY visit_date DESC;

-- View: Chat usage stats
CREATE OR REPLACE VIEW public.chat_engagement AS
SELECT
  usage_date,
  COUNT(DISTINCT user_id) AS unique_chatters,
  SUM(message_count) AS total_messages,
  AVG(message_count)::NUMERIC(5,1) AS avg_messages_per_user
FROM public.chat_usage
GROUP BY usage_date
ORDER BY usage_date DESC;
