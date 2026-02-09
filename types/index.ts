// User Types
export interface User {
  id: string;
  email: string;
  x_handle: string;
  discord_username?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

// Subscription Types
export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'comped' | 'trial';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: SubscriptionStatus;
  price_tier: number;
  locked_price_cents: number;
  current_period_start?: string;
  current_period_end?: string;
  trial_ends_at?: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to check if subscription has access
export function hasSubscriptionAccess(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status === 'active' || subscription.status === 'comped') return true;
  if (subscription.status === 'trial' && subscription.trial_ends_at) {
    return new Date(subscription.trial_ends_at) > new Date();
  }
  return false;
}

// User Settings Types
export type PortfolioSize = '25k_50k' | '50k_100k' | '100k_250k' | '250k_500k' | '500k_plus';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type TradingVehicle = 'shares' | 'leaps' | 'weeklies';

export interface UserSettings {
  id: string;
  user_id: string;
  portfolio_size?: PortfolioSize;
  portfolio_size_exact?: number;
  per_trade_limit_pct: number;
  risk_tolerance: RiskTolerance;
  options_cap_pct: number;
  preferred_vehicles: TradingVehicle[];
  current_tsla_position: number;
  alerts_enabled: boolean;
  email_new_reports: boolean;
  created_at: string;
  updated_at: string;
}

// Report Types
export type TrafficLightMode = 'green' | 'yellow' | 'orange' | 'red';
export type AlertType = 'upside' | 'downside';
export type ForecastResult = 'correct' | 'incorrect' | 'partial';

export interface ReportMode {
  current: TrafficLightMode;
  label: string;
  summary: string;
}

export interface ReportPrice {
  close: number;
  change_pct: number;
  range: {
    low: number;
    high: number;
  };
}

export interface MasterEject {
  price: number;
  action: string;
}

export interface EntryQuality {
  score: number;
  factors: string[];
}

export interface ReportAlert {
  type: AlertType;
  level_name: string;
  price: number;
  action: string;
  reason: string;
}

export interface PositionGuidance {
  current_stance: string;
  daily_cap_pct: number;
  size_recommendation: string;
}

// v3.0/v3.5 Report Types
export type TierSignal = 'green' | 'yellow' | 'orange' | 'red';

// v3.5 tier naming: Long/Medium/Short/Hourly
// NOTE: Tier 1-2 colors = trend health (green = healthy). Tier 3-4 colors = entry quality (green = good setup).
export interface TierSignals {
  // v3.5 names (preferred)
  long?: TierSignal;      // Tier 1: Weekly trend — defines the game (green = healthy trend)
  medium?: TierSignal;    // Tier 2: Daily trend — confirming or diverging? (green = healthy trend)
  short?: TierSignal;     // Tier 3: 4H entry timing — good moment to buy? (green = good entry setup)
  hourly?: TierSignal;    // Tier 4: 1H pullback — at a buy zone? (green = at pullback zone)
  // Legacy v3.0 names (for backwards compatibility)
  regime?: TierSignal;
  trend?: TierSignal;
  timing?: TierSignal;
  flow?: TierSignal;
}

// v3.5 HIRO data
export interface HiroData {
  reading: number;
  low_30day: number;
  high_30day: number;
}

export interface Positioning {
  daily_cap: string;
  vehicle: string;
  posture: string;
}

export type LevelType = 'trim' | 'watch' | 'current' | 'nibble' | 'pause' | 'caution' | 'eject' | 'slow_zone';

export interface LevelMapEntry {
  level: string;
  price: number;
  source: string;
  depth: 'Shallow' | 'Normal' | 'Deep' | '—' | string;
  action: string;
  type?: LevelType; // v3.5: trim/watch/current/nibble/pause/caution/eject
}

export interface ForecastPerformance {
  prediction: string;
  result: ForecastResult;
}

export interface ReportPerformance {
  score: number;
  total: number;
  forecasts: ForecastPerformance[];
}

// Consolidated key levels for email templates and display
export interface KeyLevels {
  hedge_wall?: number;
  gamma_strike?: number;
  put_wall?: number;
  call_wall?: number;
  master_eject?: number;
  pause_zone?: number;
}

export interface ExtractedReportData {
  mode: ReportMode;
  price: ReportPrice;
  master_eject: MasterEject;
  entry_quality: EntryQuality;
  alerts: ReportAlert[];
  position: PositionGuidance;
  qqq_status: string;
  performance?: ReportPerformance;
  // v3.0 fields
  tiers?: TierSignals;
  positioning?: Positioning;
  levels_map?: LevelMapEntry[];
  // Consolidated key levels (for email templates)
  key_levels?: KeyLevels;
  // v3.5 fields
  pause_zone?: number;  // Also known as "Slow Zone" (Daily 21 EMA)
  daily_9ema?: number;
  daily_21ema?: number;
  weekly_9ema?: number;
  weekly_13ema?: number;
  weekly_21ema?: number;
  key_gamma_strike?: number;
  gamma_regime?: 'Positive' | 'Negative';
  hiro?: HiroData;
  correction_risk?: 'LOW' | 'LOW-MODERATE' | 'MODERATE' | 'HIGH';
  // v3.7 fields
  trim_cap_pct?: number;  // Mode-based: GREEN=10, YELLOW=20, ORANGE=25, RED=30
  ema_extension_pct?: number;  // % above Weekly 9 EMA (0 if below)
  acceleration_zone?: number;  // Key Gamma Strike (triggers trim sequence when reclaimed)
  master_eject_rationale?: string;  // Explanation of why this level
  fib_levels?: { price: number; label: string }[] | null;  // Optional fib extension targets
  prev_day_score?: number | null;  // Previous day's 100-point assessment score
  prev_day_grade?: string | null;  // A/B/C/D/F
  prev_day_system_value?: string | null;  // ADDED_VALUE/PROTECTED_CAPITAL/NEUTRAL/MINOR_COST/COST_MONEY

  // v4.1 fields
  slow_zone?: number;
  slow_zone_active?: boolean;
  max_invested_pct?: number;
  master_eject_step?: number;
  daily_13ema?: number;
  call_alert?: {
    status: string;
    setup: string | null;
    priority: string | null;
    conditions: string[];
    spec: { delta?: string; expiry?: string; strike?: string; budget?: string } | null;
    backtest?: { avg_return?: string; win_rate?: string; n?: number; period?: string };
    trigger_next?: string;
    also_watching?: string;
    stop_logic?: string;
    mode_context?: string;
    trim_guidance?: string;
    clears_when?: string;
  };
  bx_states?: {
    daily: string;
    daily_histogram: number;
    weekly: string;
    weekly_histogram: number;
    four_hour: string;
    one_hour: string;
  };
}

export interface ParsedReportData {
  header: string;
  key_metrics: string;
  regime_assessment: string;
  qqq_context: string;
  technical_analysis: string;
  spotgamma_analysis: string;
  entry_quality: string;
  key_levels: string;
  position_guidance: string;
  game_plan: string;
  claude_take: string;
  risk_alerts: string;
  previous_review: string;
  disclaimer: string;
  // v4.1 sections
  indicator_dashboard: string;
  pattern_statistics: string;
  call_options_alert: string;
  mode_change_triggers: string;
  market_flow_context: string;
  framework_reminder: string;
}

export interface Report {
  id: string;
  report_date: string;
  raw_markdown: string;
  parsed_data: ParsedReportData;
  extracted_data: ExtractedReportData;
  parser_version: string;
  parser_warnings: string[];
  created_at: string;
  updated_at: string;
}

// Report Alert (User-specific)
export interface UserReportAlert {
  id: string;
  report_id: string;
  user_id: string;
  price: number;
  type: AlertType;
  level_name: string;
  action: string;
  reason?: string;
  triggered_at?: string;
  email_sent_at?: string;
  created_at: string;
}

// Chat Types
export interface ChatSession {
  id: string;
  user_id: string;
  report_id?: string;
  created_at: string;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ChatUsage {
  id: string;
  user_id: string;
  usage_date: string;
  message_count: number;
}

// Notification Types
export type NotificationType = 'alert_triggered' | 'new_report' | 'payment_failed' | 'subscription_updated';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// Catalyst Types
export type CatalystStatus = 'confirmed' | 'projected' | 'speculative';

export interface Catalyst {
  id: string;
  event_date: string;
  name: string;
  status: CatalystStatus;
  notes?: string;
  valuation_impact?: string;
  source_url?: string;
  notion_page_id?: string;
  created_at: string;
  updated_at: string;
}

// System Config Types
export interface PriceTiersConfig {
  tiers: number[];
  subscribers_per_tier: number;
}

export interface AlertSystemConfig {
  enabled: boolean;
  last_run?: string;
  last_price?: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Pricing Types
export interface PriceTier {
  tier: number;
  price_cents: number;
  subscribers_range: string;
}

// Re-export weekly review types
export * from "./weekly-review";
