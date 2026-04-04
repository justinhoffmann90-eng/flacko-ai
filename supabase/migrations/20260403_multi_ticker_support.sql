-- Multi-Ticker Support Migration
-- Adds ticker column to reports + report_alerts, creates ticker_subscriptions table
-- SAFE: All existing data defaults to 'TSLA' — zero breaking changes

-- ============================================
-- 1. ADD TICKER TO REPORTS
-- ============================================

-- Add ticker column with TSLA default (all existing rows become TSLA)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';

-- Drop the old unique constraint (report_date alone)
-- This allows multiple tickers on the same date
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_report_date_key;

-- New unique: one report per ticker per date
ALTER TABLE reports ADD CONSTRAINT reports_ticker_date_unique 
  UNIQUE(ticker, report_date);

-- Index for fast lookups by ticker + date
CREATE INDEX IF NOT EXISTS idx_reports_ticker_date 
  ON reports(ticker, report_date DESC);

-- ============================================
-- 2. ADD TICKER TO REPORT_ALERTS
-- ============================================

ALTER TABLE report_alerts ADD COLUMN IF NOT EXISTS ticker TEXT NOT NULL DEFAULT 'TSLA';

-- Update unique constraint to include ticker
ALTER TABLE report_alerts DROP CONSTRAINT IF EXISTS report_alerts_report_id_user_id_price_type_key;
ALTER TABLE report_alerts ADD CONSTRAINT report_alerts_ticker_unique
  UNIQUE(report_id, user_id, price, type, ticker);

-- Index for per-ticker alert queries
CREATE INDEX IF NOT EXISTS idx_report_alerts_ticker 
  ON report_alerts(ticker, triggered_at);

-- ============================================
-- 3. TICKER SUBSCRIPTIONS TABLE (à la carte)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ticker_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  price_cents INTEGER NOT NULL DEFAULT 999,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ticker)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ticker_subs_user ON ticker_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ticker_subs_status ON ticker_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_ticker_subs_ticker ON ticker_subscriptions(ticker, status);
CREATE INDEX IF NOT EXISTS idx_ticker_subs_stripe ON ticker_subscriptions(stripe_subscription_id);

-- RLS
ALTER TABLE ticker_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own ticker subscriptions
CREATE POLICY "Users view own ticker subs" 
  ON ticker_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can do everything (for webhooks/admin)
CREATE POLICY "Service role full access ticker subs"
  ON ticker_subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated timestamp trigger
CREATE TRIGGER update_ticker_subs_updated_at
  BEFORE UPDATE ON ticker_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. HELPER: Check if user has access to a ticker
-- ============================================

CREATE OR REPLACE FUNCTION user_has_ticker_access(p_user_id UUID, p_ticker TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- TSLA access: legacy subscription OR ticker subscription
  IF p_ticker = 'TSLA' THEN
    RETURN EXISTS (
      SELECT 1 FROM subscriptions 
      WHERE user_id = p_user_id 
      AND status IN ('active', 'comped', 'trial')
    ) OR EXISTS (
      SELECT 1 FROM ticker_subscriptions
      WHERE user_id = p_user_id
      AND ticker = p_ticker
      AND status IN ('active', 'comped')
    );
  END IF;
  
  -- Other tickers: ticker_subscriptions only
  RETURN EXISTS (
    SELECT 1 FROM ticker_subscriptions
    WHERE user_id = p_user_id
    AND ticker = p_ticker
    AND status IN ('active', 'comped')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. UPDATE REPORTS RLS TO CHECK TICKER ACCESS
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Subscribers can view reports" ON public.reports;

-- New policy: user can view report if they have access to that ticker
CREATE POLICY "Users can view reports for subscribed tickers" ON public.reports
  FOR SELECT USING (
    user_has_ticker_access(auth.uid(), ticker)
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 6. SUPPORTED TICKERS REFERENCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.supported_tickers (
  ticker TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  stripe_price_id TEXT,
  price_cents INTEGER NOT NULL DEFAULT 999,
  has_spotgamma BOOLEAN NOT NULL DEFAULT false,
  has_hiro BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with TSLA (enabled) and NVDA (enabled for testing)
INSERT INTO supported_tickers (ticker, name, display_name, stripe_price_id, price_cents, has_spotgamma, has_hiro, enabled, sort_order)
VALUES 
  ('TSLA', 'Tesla, Inc.', 'TSLA', NULL, 2999, true, true, true, 1),
  ('NVDA', 'NVIDIA Corporation', 'NVDA', 'price_1TIJN0RNdSDJbZblrx3q8Uro', 999, false, false, true, 2),
  ('QQQ', 'Invesco QQQ Trust', 'QQQ', NULL, 999, true, false, false, 3),
  ('AAPL', 'Apple Inc.', 'AAPL', 'price_1TIJN1RNdSDJbZblBJuVhpR5', 999, false, false, true, 4),
  ('AMZN', 'Amazon.com, Inc.', 'AMZN', 'price_1TIJN2RNdSDJbZbll7N1oQfK', 999, false, false, true, 5),
  ('META', 'Meta Platforms, Inc.', 'META', 'price_1TIJN4RNdSDJbZblWtPGlB21', 999, false, false, true, 6),
  ('MSFT', 'Microsoft Corporation', 'MSFT', 'price_1TIJN6RNdSDJbZblrdWxujzD', 999, false, false, true, 7),
  ('SPY', 'SPDR S&P 500 ETF', 'SPY', NULL, 999, true, false, false, 8),
  ('AMD', 'Advanced Micro Devices', 'AMD', 'price_1TIJN7RNdSDJbZblg5cBQiF2', 999, false, false, true, 9),
  ('GOOGL', 'Alphabet Inc.', 'GOOGL', 'price_1TIJN3RNdSDJbZbl5di31LUP', 999, false, false, true, 10),
  ('PLTR', 'Palantir Technologies Inc.', 'PLTR', 'price_1TIJN8RNdSDJbZblGIO6M1jm', 999, false, false, true, 11),
  ('COIN', 'Coinbase Global, Inc.', 'COIN', 'price_1TIJN9RNdSDJbZblj0UaOf1K', 999, false, false, true, 12)
ON CONFLICT (ticker) DO NOTHING;
