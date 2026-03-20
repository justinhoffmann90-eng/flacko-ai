-- ============================================================
-- Migration: Add ticker column to all 5 ORB tables
-- ============================================================

-- 1. orb_setup_states — add ticker, rekey PK to (ticker, setup_id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_setup_states' AND column_name = 'ticker') THEN
    ALTER TABLE orb_setup_states ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    ALTER TABLE orb_setup_states DROP CONSTRAINT IF EXISTS orb_setup_states_pkey;
    ALTER TABLE orb_setup_states ADD PRIMARY KEY (ticker, setup_id);
  END IF;
END $$;

-- 2. orb_backtest_instances — add ticker, rekey UNIQUE to (ticker, setup_id, signal_date)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_backtest_instances' AND column_name = 'ticker') THEN
    ALTER TABLE orb_backtest_instances ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    ALTER TABLE orb_backtest_instances DROP CONSTRAINT IF EXISTS orb_backtest_instances_setup_id_signal_date_key;
    ALTER TABLE orb_backtest_instances ADD CONSTRAINT orb_backtest_instances_ticker_setup_signal UNIQUE (ticker, setup_id, signal_date);
  END IF;
END $$;

-- 3. orb_daily_indicators — add ticker, rekey PK to (ticker, date)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_daily_indicators' AND column_name = 'ticker') THEN
    ALTER TABLE orb_daily_indicators ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    ALTER TABLE orb_daily_indicators DROP CONSTRAINT IF EXISTS orb_daily_indicators_pkey;
    ALTER TABLE orb_daily_indicators ADD PRIMARY KEY (ticker, date);
  END IF;
END $$;

-- 4. orb_signal_log — add ticker column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_signal_log' AND column_name = 'ticker') THEN
    ALTER TABLE orb_signal_log ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    -- Update index to include ticker
    DROP INDEX IF EXISTS idx_orb_signal_log_setup;
    CREATE INDEX idx_orb_signal_log_setup ON orb_signal_log(ticker, setup_id, event_date);
  END IF;
END $$;

-- 5. orb_tracker — add ticker column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orb_tracker' AND column_name = 'ticker') THEN
    ALTER TABLE orb_tracker ADD COLUMN ticker TEXT NOT NULL DEFAULT 'TSLA';
    -- Update index to include ticker
    DROP INDEX IF EXISTS idx_orb_tracker_setup;
    CREATE INDEX idx_orb_tracker_setup ON orb_tracker(ticker, setup_id, status);
  END IF;
END $$;
