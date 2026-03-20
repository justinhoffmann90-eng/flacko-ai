import { computeAllIndicators, type IndicatorBar, type OHLCVBar } from "@/lib/indicators";

export type DerivedTimeframe = "daily" | "weekly" | "monthly";

function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoWeekKey(date: Date): string {
  const d = toUtcDateOnly(date);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function resampleBars(dailyBars: OHLCVBar[], timeframe: Exclude<DerivedTimeframe, "daily">): OHLCVBar[] {
  const buckets = new Map<string, OHLCVBar[]>();

  for (const bar of dailyBars) {
    const date = bar.date instanceof Date ? bar.date : new Date(bar.date);
    const key = timeframe === "weekly"
      ? isoWeekKey(date)
      : `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

    const list = buckets.get(key) ?? [];
    list.push({ ...bar, date });
    buckets.set(key, list);
  }

  return [...buckets.values()]
    .map((group) => {
      const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
      return {
        date: sorted[0].date,
        open: sorted[0].open,
        high: Math.max(...sorted.map((b) => b.high)),
        low: Math.min(...sorted.map((b) => b.low)),
        close: sorted[sorted.length - 1].close,
        volume: sorted.reduce((sum, b) => sum + (b.volume ?? 0), 0),
      } as OHLCVBar;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function computeDerivedTimeframeIndicators(
  dailyBars: OHLCVBar[],
  timeframe: DerivedTimeframe,
): IndicatorBar[] {
  const baseBars = timeframe === "daily" ? dailyBars : resampleBars(dailyBars, timeframe);
  return computeAllIndicators(baseBars);
}
