import type { OrbRow } from "./types";

export const modeColor = (mode: string | null | undefined) => {
  const m = String(mode || "").toUpperCase();
  if (m === "GREEN") return "#22c55e";
  if (m === "YELLOW") return "#eab308";
  if (m === "YELLOW_IMP") return "#a3e635";
  if (m === "ORANGE") return "#f97316";
  if (m === "RED") return "#ef4444";
  return "#6b7280";
};

export const formatSignalDate = (value: any) => {
  if (!value) return "—";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

export const formatPct = (value: any) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
};

const formatActivationDate = (value: any, withYear = false) => {
  if (!value) return "—";
  const s = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [year, month, day] = s.split("-").map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
      ...(withYear ? { year: "numeric" } : {}),
    });
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return s.length >= 10 ? s.slice(0, 10) : s;
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
};

export const formatActivationLine = ({
  date,
  price,
  prefix = "Triggered",
  withYear = false,
}: {
  date: any;
  price: any;
  prefix?: string;
  withYear?: boolean;
}) => {
  const hasPrice = Number.isFinite(Number(price));
  const dateText = formatActivationDate(date, withYear);
  if (!hasPrice) return `${prefix} ${dateText}`;
  return `${prefix} ${dateText} @ $${Number(price).toFixed(2)}`;
};

export function bestTimeframe(row: OrbRow): { label: string; win: number; avg: number } {
  const periods: { label: string; win: number | null; avg: number | null }[] = [
    { label: "5D", win: row.backtest_win_rate_5d, avg: row.backtest_avg_return_5d },
    { label: "10D", win: row.backtest_win_rate_10d, avg: row.backtest_avg_return_10d },
    { label: "20D", win: row.backtest_win_rate_20d, avg: row.backtest_avg_return_20d },
    { label: "60D", win: row.backtest_win_rate_60d, avg: row.backtest_avg_return_60d },
  ];
  const valid = periods.filter((period) => period.avg != null && period.win != null);
  if (!valid.length) return { label: "20D", win: 0, avg: 0 };

  const isDefensive = row.stance === "defensive";
  const best = valid.reduce((left, right) => {
    const leftVal = left.avg!;
    const rightVal = right.avg!;
    return isDefensive ? (rightVal < leftVal ? right : left) : (rightVal > leftVal ? right : left);
  });

  return { label: best.label, win: best.win ?? 0, avg: best.avg ?? 0 };
}

