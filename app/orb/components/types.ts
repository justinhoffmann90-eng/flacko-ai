import type { ZoneDisplay } from "@/lib/orb/score";

export type OrbRow = {
  id: string;
  name: string;
  public_name: string | null;
  number: number;
  type: "buy" | "avoid";
  stance: "offensive" | "defensive" | null;
  framework: "fixed-horizon" | "gauge-to-target";
  grade: string | null;
  category_tags: string[] | null;
  one_liner: string | null;
  public_description: string | null;
  backtest_n: number | null;
  backtest_win_rate_5d: number | null;
  backtest_avg_return_5d: number | null;
  backtest_win_rate_10d: number | null;
  backtest_avg_return_10d: number | null;
  backtest_win_rate_20d: number | null;
  backtest_avg_return_20d: number | null;
  backtest_win_rate_60d: number | null;
  backtest_avg_return_60d: number | null;
  gauge_median_days: number | null;
  gauge_median_return: number | null;
  description: string | null;
  state: any;
  livePerformance: { wins: number; total: number; avgReturn: number } | null;
  conditions?: any;
  eval_logic?: any;
};

export type Trade = {
  id: number;
  setup_id: string;
  entry_date: string;
  entry_price: number;
  exit_date: string | null;
  exit_price: number | null;
  exit_reason: string | null;
  current_return_pct: number;
  max_return_pct: number;
  max_drawdown_pct: number;
  days_active: number;
  final_return_pct: number | null;
  is_win: boolean | null;
  status: "open" | "closed";
};

export type SetupHistory = {
  trades: Trade[];
  signals: any[];
  backtest: any[];
};

export type OrbScoreData = {
  value: number;
  zone: string;
  zone_display?: ZoneDisplay;
  prevZone: string | null;
  date: string;
  zoneChangedAt?: string | null;
};

export type IndicatorSnapshotData = {
  date: string | null;
  smiDaily: number | null;
  smiWeekly: number | null;
  smi4h: number | null;
  bxtDaily: number | null;
  bxtWeekly: number | null;
  rsi: number | null;
  ema9: number | null;
  ema13: number | null;
  ema21: number | null;
  vixClose: number | null;
  vixWeeklyChangePct: number | null;
};

export type PeerTickerData = {
  latestClose: number | null;
  change1dPct: number | null;
  change5dPct: number | null;
  rsi14: number | null;
  aboveSma200: boolean | null;
};

export type PeerComparisonData = {
  qqq: PeerTickerData;
  spy: PeerTickerData;
  correlation: {
    tsla_qqq_20d: number | null;
    tsla_spy_20d: number | null;
  };
};
