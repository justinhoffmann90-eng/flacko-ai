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
