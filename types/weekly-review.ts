// Weekly Review Types

export type TrafficLightMode = 'green' | 'yellow' | 'orange' | 'red';
export type TierSignal = 'green' | 'yellow' | 'orange' | 'red';
export type ThesisStatus = 'intact' | 'strengthening' | 'weakening' | 'under_review';
export type ScenarioType = 'bull' | 'base' | 'bear';

// Timeframe data (Monthly/Weekly/Daily)
export interface TimeframeData {
  signal: TierSignal;
  bx_trender: {
    color: 'green' | 'red';
    pattern: string; // "HH", "HL", "LL", "LH"
  };
  structure: string;
  ema_9_status: 'above' | 'below';
  ema_21_status: 'above' | 'below';
  ema_13_status?: 'above' | 'below'; // Weekly only
  interpretation: string;
}

// Weekly candle data
export interface WeeklyCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  change_dollars: number;
  change_pct: number;
}

// Thesis check data
export interface ThesisCheck {
  status: ThesisStatus;
  supporting_points: string[];
  concerning_points: string[];
  narrative: string;
}

// Scenario data
export interface Scenario {
  type: ScenarioType;
  probability: number;
  trigger: string;
  response: string;
}

// What worked / What didn't / Lessons
export interface WeeklyLessons {
  what_worked: string[];
  what_didnt: string[];
  lessons_forward: string[];
}

// Key level for weekly view
export interface WeeklyKeyLevel {
  price: number;
  name: string;
  emoji: string;
  description: string;
}

// Gamma shifts (week over week)
export interface GammaShifts {
  call_wall: { start: number; end: number };
  gamma_strike: { start: number; end: number };
  hedge_wall: { start: number; end: number };
  put_wall: { start: number; end: number };
  interpretation: string;
}

// Catalyst event
export interface Catalyst {
  date: string;
  event: string;
  impact?: string;
}

// v2.0 Key Level for next week
export interface WeeklyKeyLevelV2 {
  price: number;
  name: string;
  type: 'trim' | 'support' | 'current' | 'eject';
}

// v2.0 Catalyst with days_away
export interface CatalystV2 {
  event: string;
  date: string;
  days_away: number;
}

// Full Weekly Review Data
export interface WeeklyReviewData {
  // Header
  week_start: string; // ISO date
  week_end: string;
  mode: TrafficLightMode;
  mode_trend?: string; // e.g., "Stabilizing", "Bounce Encouraging"
  mode_guidance: string;
  daily_cap_pct: number;

  // Candle
  candle: WeeklyCandle;

  // Multi-timeframe
  monthly: TimeframeData;
  weekly: TimeframeData;
  daily: TimeframeData;
  confluence: {
    reading: string; // "Monthly ✓ → Weekly ⚠️ → Daily ↑"
    explanation: string;
  };

  // Narrative sections
  what_happened: string;
  lessons: WeeklyLessons;
  thesis: ThesisCheck;
  looking_ahead: string;

  // Levels and scenarios
  key_levels: WeeklyKeyLevel[];
  scenarios: Scenario[];
  
  // Catalyst calendar
  catalysts?: Catalyst[];
  
  // Flacko AI's conclusion / "So What"
  flacko_take?: string;
  
  // Current price for level context
  current_price?: number;

  // Optional gamma context
  gamma_shifts?: GammaShifts;

  // ===== v2.0 FIELDS =====
  // OHLC (alternative to candle object)
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  change_pct?: number;
  weekly_candle?: string;  // "Bullish engulfing", "Doji", etc.

  // Mode tracking
  mode_start?: TrafficLightMode;
  mode_end?: TrafficLightMode;
  mode_trajectory?: string;  // "Improving", "Stable", "Deteriorating"

  // EMA levels (numeric values)
  weekly_9ema?: number;
  weekly_13ema?: number;
  weekly_21ema?: number;
  ema_extension_pct?: number;  // % above Weekly 9 EMA

  // Weekly BX-Trender
  weekly_bx_color?: string;  // "Light Green", "Dark Green", "Light Red", "Dark Red"
  weekly_bx_pattern?: string;  // "HH", "HL", "LH", "LL"

  // v3.0+ BX-Trender fields
  weekly_bx_state?: string;  // HH/HL/LH/LL
  weekly_bx_histogram?: number;

  // Correction tracking
  correction_stage?: string;  // "None", "Stage 1", "Stage 2", "Stage 3"

  // Daily assessment scores
  daily_scores?: number[];  // [82, 75, 88, 71, 79]
  daily_system_values?: string[];  // ["PROTECTED_CAPITAL", "NEUTRAL", ...]
  system_value_days?: number;  // Count of positive system value days
  weekly_avg_score?: number;
  weekly_grade?: string;  // "A", "B+", "C", etc.

  // Level testing accountability
  buy_levels_tested?: number;
  buy_levels_held?: number;
  trim_levels_tested?: number;
  trim_levels_effective?: number;
  slow_zone_triggered?: boolean;

  // Master Eject
  master_eject?: number;
  master_eject_step?: number;  // 1-4
  master_eject_distance_pct?: number;

  // Thesis
  thesis_status?: ThesisStatus | string;  // Allow string for "Intact" from JSON

  // Week ahead
  next_week_mode?: TrafficLightMode | string;
  next_week_bias?: string;  // "Neutral-to-Bullish", "Bearish", etc.
  key_levels_next_week?: WeeklyKeyLevelV2[];

  // QQQ and HIRO
  qqq_verdict?: string;  // "Supportive", "Neutral", "Headwind"
  hiro_eow?: number;  // End of week HIRO reading

  // Call Options grading (v3.0+)
  call_alert_score?: number;  // out of 25
  call_alert_setups?: Array<{name: string; status: string; result: string; pnl_pct: number}>;
  call_alert_running_win_rate?: number | null;

  // Catalysts v2
  catalysts_v2?: CatalystV2[];

  // ===== v3.4 ORB FIELDS =====
  orb_avg_score?: number;  // Weekly average Orb score
  orb_zone_distribution?: {
    full_send: number;   // Days in FULL SEND zone
    neutral: number;     // Days in NEUTRAL zone
    caution: number;     // Days in CAUTION zone
    defensive: number;   // Days in DEFENSIVE zone
  };
  orb_setups_activated?: Array<{name: string; grade: string; outcome: string}>;
  orb_setups_profitable?: number;
  orb_mode_agreement_rate?: number;  // X out of 5 days analyst followed Orb
  next_week_orb_score?: number;
  next_week_orb_zone?: string;  // "FULL SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE"
  data_source?: string;  // e.g., "orb_v1 + bx_trender_engine_v1"
}

// Parsed from markdown
export interface ParsedWeeklyReview {
  raw_markdown: string;
  extracted_data: WeeklyReviewData;
  parser_warnings: string[];
}

// Database row
export interface WeeklyReview {
  id: string;
  week_start: string;
  week_end: string;
  raw_markdown: string;
  extracted_data: WeeklyReviewData;
  parser_version: string;
  parser_warnings: string[];
  published_at?: string;
  created_at: string;
  updated_at: string;
}
