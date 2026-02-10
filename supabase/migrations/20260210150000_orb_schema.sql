-- Orb feature schema

CREATE TABLE IF NOT EXISTS orb_setup_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'avoid')),
  framework TEXT NOT NULL CHECK (framework IN ('fixed-horizon', 'gauge-to-target')),
  grade TEXT,
  conditions JSONB NOT NULL,
  eval_logic TEXT NOT NULL,
  backtest_n INTEGER,
  backtest_win_rate_5d NUMERIC(5,1),
  backtest_avg_return_5d NUMERIC(7,2),
  backtest_win_rate_10d NUMERIC(5,1),
  backtest_avg_return_10d NUMERIC(7,2),
  backtest_win_rate_20d NUMERIC(5,1),
  backtest_avg_return_20d NUMERIC(7,2),
  backtest_win_rate_60d NUMERIC(5,1),
  backtest_avg_return_60d NUMERIC(7,2),
  gauge_median_days INTEGER,
  gauge_median_return NUMERIC(7,2),
  gauge_avg_max_dd NUMERIC(7,2),
  gauge_target_description TEXT,
  description TEXT,
  risk_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orb_setup_states (
  setup_id TEXT PRIMARY KEY REFERENCES orb_setup_definitions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'watching', 'inactive')),
  active_since DATE,
  active_day INTEGER,
  entry_price NUMERIC(10,2),
  entry_indicator_values JSONB,
  gauge_entry_value NUMERIC(7,2),
  gauge_current_value NUMERIC(7,2),
  gauge_target_value NUMERIC(7,2),
  gauge_progress_pct NUMERIC(5,1),
  watching_reason TEXT,
  conditions_met JSONB,
  inactive_reason TEXT,
  current_indicators JSONB,
  current_price NUMERIC(10,2),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orb_signal_log (
  id BIGSERIAL PRIMARY KEY,
  setup_id TEXT REFERENCES orb_setup_definitions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('activated', 'deactivated', 'watching_started', 'watching_ended')),
  event_date DATE NOT NULL,
  event_price NUMERIC(10,2),
  indicator_snapshot JSONB,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orb_signal_log_setup ON orb_signal_log(setup_id, event_date);
CREATE INDEX IF NOT EXISTS idx_orb_signal_log_date ON orb_signal_log(event_date);

CREATE TABLE IF NOT EXISTS orb_tracker (
  id BIGSERIAL PRIMARY KEY,
  setup_id TEXT REFERENCES orb_setup_definitions(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_price NUMERIC(10,2) NOT NULL,
  entry_indicators JSONB,
  exit_date DATE,
  exit_price NUMERIC(10,2),
  exit_reason TEXT,
  exit_indicators JSONB,
  current_return_pct NUMERIC(7,2),
  max_return_pct NUMERIC(7,2),
  max_drawdown_pct NUMERIC(7,2),
  days_active INTEGER,
  final_return_pct NUMERIC(7,2),
  is_win BOOLEAN,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orb_tracker_setup ON orb_tracker(setup_id, status);

CREATE TABLE IF NOT EXISTS orb_daily_indicators (
  date DATE PRIMARY KEY,
  close_price NUMERIC(10,2),
  bx_daily NUMERIC(7,2),
  bx_daily_prev NUMERIC(7,2),
  bx_daily_state TEXT,
  bx_weekly NUMERIC(7,2),
  bx_weekly_state TEXT,
  rsi NUMERIC(5,1),
  rsi_prev NUMERIC(5,1),
  rsi_change_3d NUMERIC(5,1),
  smi NUMERIC(7,2),
  smi_signal NUMERIC(7,2),
  smi_prev NUMERIC(7,2),
  smi_change_3d NUMERIC(7,2),
  smi_bull_cross BOOLEAN,
  smi_bear_cross BOOLEAN,
  ema9 NUMERIC(10,2),
  ema21 NUMERIC(10,2),
  sma200 NUMERIC(10,2),
  sma200_dist_pct NUMERIC(7,2),
  price_vs_ema9_pct NUMERIC(7,2),
  price_vs_ema21_pct NUMERIC(7,2),
  consecutive_down INTEGER DEFAULT 0,
  consecutive_up INTEGER DEFAULT 0,
  weekly_ema9 NUMERIC(10,2),
  weekly_ema13 NUMERIC(10,2),
  weekly_ema21 NUMERIC(10,2),
  weekly_emas_stacked BOOLEAN,
  price_above_weekly_13 BOOLEAN,
  price_above_weekly_21 BOOLEAN,
  suggested_mode TEXT,
  mode_confidence TEXT CHECK (mode_confidence IN ('high', 'medium', 'low')),
  mode_reasoning JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orb_setup_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orb_setup_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE orb_signal_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE orb_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE orb_daily_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orb_setup_definitions_read ON orb_setup_definitions;
CREATE POLICY orb_setup_definitions_read ON orb_setup_definitions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS orb_setup_states_read ON orb_setup_states;
CREATE POLICY orb_setup_states_read ON orb_setup_states FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS orb_signal_log_read ON orb_signal_log;
CREATE POLICY orb_signal_log_read ON orb_signal_log FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS orb_tracker_read ON orb_tracker;
CREATE POLICY orb_tracker_read ON orb_tracker FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS orb_daily_indicators_read ON orb_daily_indicators;
CREATE POLICY orb_daily_indicators_read ON orb_daily_indicators FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS orb_setup_definitions_write_service ON orb_setup_definitions;
CREATE POLICY orb_setup_definitions_write_service ON orb_setup_definitions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS orb_setup_states_write_service ON orb_setup_states;
CREATE POLICY orb_setup_states_write_service ON orb_setup_states FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS orb_signal_log_write_service ON orb_signal_log;
CREATE POLICY orb_signal_log_write_service ON orb_signal_log FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS orb_tracker_write_service ON orb_tracker;
CREATE POLICY orb_tracker_write_service ON orb_tracker FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS orb_daily_indicators_write_service ON orb_daily_indicators;
CREATE POLICY orb_daily_indicators_write_service ON orb_daily_indicators FOR ALL TO service_role USING (true) WITH CHECK (true);
