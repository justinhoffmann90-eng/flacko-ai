import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import yahooFinance from "yahoo-finance2";

type Alignment = "confirmed" | "divergent" | "neutral";
type VolumeSignal = "climactic" | "above_avg" | "normal" | "below_avg" | "dry";

interface VolumeMetrics {
  volume: number;
  volume_20d_avg: number;
  relative_volume_pct: number;
  volume_price_alignment: Alignment;
  volume_signal: VolumeSignal;
}

interface YahooBar {
  date: Date;
  open: number | null;
  close: number | null;
  volume: number | null;
}

function getEnv() {
  const env = readFileSync(".env.local", "utf-8");
  const g = (k: string) => {
    const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
    return m?.[1]?.trim().replace(/^['\"]|['\"]$/g, "");
  };

  const url = g("NEXT_PUBLIC_SUPABASE_URL");
  const key = g("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  return { url, key };
}

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function computeVolumeMetrics(
  todayVolume: number,
  volumes: number[],
  todayClose: number,
  todayOpen: number,
  prevDayVolume: number
): VolumeMetrics {
  const prior20 = volumes.slice(-21, -1);
  const avgVolume = prior20.reduce((sum, v) => sum + v, 0) / prior20.length;
  const relativeVolumePct = (todayVolume / avgVolume) * 100;

  const priceChange = todayClose - todayOpen;
  const volumeChange = todayVolume - prevDayVolume;

  let alignment: Alignment;
  if (Math.abs(priceChange / todayOpen) < 0.002) {
    alignment = "neutral";
  } else if ((priceChange > 0 && volumeChange > 0) || (priceChange < 0 && volumeChange > 0)) {
    alignment = "confirmed";
  } else if ((priceChange > 0 && volumeChange < 0) || (priceChange < 0 && volumeChange < 0)) {
    alignment = "divergent";
  } else {
    alignment = "neutral";
  }

  let signal: VolumeSignal;
  if (relativeVolumePct >= 200) signal = "climactic";
  else if (relativeVolumePct >= 130) signal = "above_avg";
  else if (relativeVolumePct >= 70) signal = "normal";
  else if (relativeVolumePct >= 40) signal = "below_avg";
  else signal = "dry";

  return {
    volume: todayVolume,
    volume_20d_avg: Math.round(avgVolume),
    relative_volume_pct: Math.round(relativeVolumePct * 10) / 10,
    volume_price_alignment: alignment,
    volume_signal: signal,
  };
}

async function main() {
  const { url, key } = getEnv();
  const supabase = createClient(url, key);

  const { data: indicatorRows, error: indicatorErr } = await supabase
    .from("orb_daily_indicators")
    .select("date, close_price")
    .order("date", { ascending: true });

  if (indicatorErr) throw indicatorErr;
  if (!indicatorRows?.length) throw new Error("No rows found in orb_daily_indicators");

  const minDate = indicatorRows[0].date;
  const maxDate = indicatorRows[indicatorRows.length - 1].date;
  console.log(`Found ${indicatorRows.length} indicator rows (${minDate} → ${maxDate})`);

  const period1 = new Date(new Date(minDate).getTime() - 60 * 24 * 60 * 60 * 1000);
  const period2 = new Date(new Date(maxDate).getTime() + 24 * 60 * 60 * 1000);

  let barsRaw: YahooBar[] = [];
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const chart = await yahooFinance.chart("TSLA", {
        period1,
        period2,
        interval: "1d",
      });
      barsRaw = ((chart as any)?.quotes || []) as YahooBar[];
      if (!barsRaw.length) throw new Error("No quotes returned from Yahoo chart API");
      break;
    } catch (err) {
      lastError = err;
      const waitMs = attempt * 2000;
      console.warn(`Yahoo fetch attempt ${attempt}/4 failed. Retrying in ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  if (!barsRaw.length) {
    console.warn("yahoo-finance2 chart() failed after retries; falling back to direct Yahoo chart endpoint.");
    const p1 = Math.floor(period1.getTime() / 1000);
    const p2 = Math.floor(period2.getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${p1}&period2=${p2}&interval=1d`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    });
    if (!resp.ok) throw new Error(`Yahoo fallback HTTP ${resp.status}: ${await resp.text()}`);
    const json = await resp.json();
    const chart = json.chart?.result?.[0];
    const timestamps = chart?.timestamp || [];
    const q = chart?.indicators?.quote?.[0] || {};
    barsRaw = timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000),
      open: q.open?.[i] ?? null,
      close: q.close?.[i] ?? null,
      volume: q.volume?.[i] ?? null,
    }));
  }

  const bars = barsRaw
    .filter((b) => b.date && b.open != null && b.close != null && b.volume != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (bars.length < 30) throw new Error(`Not enough Yahoo bars returned (${bars.length})`);

  const indexByDate = new Map<string, number>();
  bars.forEach((b, i) => indexByDate.set(toDateKey(b.date), i));

  const updates: Array<{
    date: string;
    volume: number;
    volume_20d_avg: number;
    relative_volume_pct: number;
    volume_price_alignment: Alignment;
    volume_signal: VolumeSignal;
  }> = [];

  let skippedNoBar = 0;
  let skippedInsufficient = 0;

  for (const row of indicatorRows) {
    const idx = indexByDate.get(row.date);
    if (idx == null) {
      skippedNoBar++;
      continue;
    }
    if (idx < 20) {
      skippedInsufficient++;
      continue;
    }

    const today = bars[idx];
    const prev = bars[idx - 1];
    const volumes = bars.slice(idx - 20, idx + 1).map((b) => Number(b.volume));

    const metrics = computeVolumeMetrics(
      Number(today.volume),
      volumes,
      Number(today.close),
      Number(today.open),
      Number(prev.volume)
    );

    updates.push({
      date: row.date,
      volume: metrics.volume,
      volume_20d_avg: metrics.volume_20d_avg,
      relative_volume_pct: metrics.relative_volume_pct,
      volume_price_alignment: metrics.volume_price_alignment,
      volume_signal: metrics.volume_signal,
    });
  }

  console.log(`Prepared ${updates.length} rows for backfill (skipped: no_bar=${skippedNoBar}, insufficient_history=${skippedInsufficient})`);

  let written = 0;
  for (const c of chunk(updates, 500)) {
    const { error } = await supabase.from("orb_daily_indicators").upsert(c, { onConflict: "date" });
    if (error) throw error;
    written += c.length;
    process.stdout.write(`\rUpdated ${written}/${updates.length}`);
  }
  process.stdout.write("\n");

  const { data: sample, error: sampleErr } = await supabase
    .from("orb_daily_indicators")
    .select("date, volume, volume_20d_avg, relative_volume_pct, volume_price_alignment, volume_signal")
    .not("volume", "is", null)
    .order("date", { ascending: false })
    .limit(3);

  if (sampleErr) throw sampleErr;

  console.log(`Backfill complete. Rows backfilled: ${written}`);
  console.log("Recent sample rows:");
  for (const r of sample || []) {
    console.log(
      `${r.date} | vol=${r.volume} | avg20=${r.volume_20d_avg} | rvol=${r.relative_volume_pct}% | alignment=${r.volume_price_alignment} | signal=${r.volume_signal}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
