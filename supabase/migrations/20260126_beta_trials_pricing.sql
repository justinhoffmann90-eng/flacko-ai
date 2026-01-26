-- Beta Testing & Dynamic Pricing Schema
-- Adds support for:
-- 1. 30-day trials
-- 2. Beta founder status (locked $19.99 pricing)
-- 3. Price tier tracking
-- 4. Invite codes for beta access

-- Add trial and pricing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_beta_founder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS price_tier TEXT,
ADD COLUMN IF NOT EXISTS locked_price_id TEXT,
ADD COLUMN IF NOT EXISTS invited_by TEXT,
ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Create invite_codes table for beta invites
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_beta_founder_code BOOLEAN DEFAULT FALSE,
  discount_percent INTEGER, -- Optional discount (e.g., 50 for 50% off)
  fixed_price_cents INTEGER, -- Optional fixed price override
  notes TEXT
);

-- Create subscriber_stats table for tracking counts
CREATE TABLE IF NOT EXISTS public.subscriber_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key TEXT UNIQUE NOT NULL,
  stat_value INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize paid subscriber count
INSERT INTO public.subscriber_stats (stat_key, stat_value) 
VALUES ('paid_subscriber_count', 0)
ON CONFLICT (stat_key) DO NOTHING;

-- Function to get current paid subscriber count
CREATE OR REPLACE FUNCTION get_paid_subscriber_count()
RETURNS INTEGER AS $$
  SELECT COALESCE(stat_value, 0)
  FROM public.subscriber_stats
  WHERE stat_key = 'paid_subscriber_count';
$$ LANGUAGE SQL STABLE;

-- Function to increment subscriber count (called on new subscription)
CREATE OR REPLACE FUNCTION increment_subscriber_count()
RETURNS INTEGER AS $$
  UPDATE public.subscriber_stats
  SET stat_value = stat_value + 1, updated_at = NOW()
  WHERE stat_key = 'paid_subscriber_count'
  RETURNING stat_value;
$$ LANGUAGE SQL;

-- Function to check if user has active access (trial or subscription)
CREATE OR REPLACE FUNCTION user_has_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    trial_ends_at,
    subscription_status
  INTO user_record
  FROM public.users
  WHERE id = user_id;
  
  IF user_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if subscribed
  IF user_record.subscription_status = 'active' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if in trial period
  IF user_record.trial_ends_at IS NOT NULL AND user_record.trial_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS policies for invite_codes
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage invite codes
CREATE POLICY "Admins can manage invite codes" ON public.invite_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Anyone can read valid invite codes (for redemption)
CREATE POLICY "Anyone can read invite codes" ON public.invite_codes
  FOR SELECT USING (true);

-- RLS for subscriber_stats
ALTER TABLE public.subscriber_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscriber stats" ON public.subscriber_stats
  FOR SELECT USING (true);

CREATE POLICY "Admins can update subscriber stats" ON public.subscriber_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Index for faster invite code lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON public.users(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_users_is_beta_founder ON public.users(is_beta_founder);

COMMENT ON COLUMN public.users.trial_starts_at IS 'When the 30-day trial started';
COMMENT ON COLUMN public.users.trial_ends_at IS 'When the trial expires';
COMMENT ON COLUMN public.users.is_beta_founder IS 'Beta founders get $19.99/mo locked forever';
COMMENT ON COLUMN public.users.price_tier IS 'The price tier locked at subscription time';
COMMENT ON COLUMN public.users.locked_price_id IS 'Stripe price ID locked for this user';
COMMENT ON COLUMN public.users.invite_code IS 'The invite code used to sign up';
