/**
 * Orb Score Backtest
 * 
 * Computes a composite score from daily setup snapshots,
 * assigns zones, and measures forward returns per zone.
 * 
 * The score formula: sum of weighted setup contributions.
 * Active buy = +weight, Active avoid = -weight, Watching = ±half weight.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const env = readFileSync(".env.local", "utf-8");
  const g = (k: string) => { const m = env.match(new RegExp(`^${k}=(.+)$`, "m")); return m?.[1]?.trim().replace(/^['\"]|['\"]$/g, ""); };
  const url = g("NEXT_PUBLIC_SUPABASE_URL");
  const key = g("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing env vars");
  return { url, key };
}

// --- SETUP WEIGHTS ---
// v1: equal weight for all setups. We'll tune these based on results.
// Higher weight = more influence on the composite score.
// Buy setups contribute positively, Avoid setups contribute negatively.

type SetupConfig = {
  type: "buy" | "avoid";
  weight: number;
  framework: "fixed-horizon" | "gauge-to-target";
};

const SETUP_CONFIGS: Record<string, SetupConfig> = {
  // Buy setups (11 original)
  "smi-oversold-gauge":  { type: "buy",   weight: 1.0, framework: "gauge-to-target" },
  "oversold-extreme":    { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "regime-shift":        { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "deep-value":          { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "green-shoots":        { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "momentum-flip":       { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "trend-confirm":       { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "trend-ride":          { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "trend-continuation":  { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "goldilocks":          { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  "capitulation":        { type: "buy",   weight: 1.0, framework: "fixed-horizon" },
  // Avoid setups (6)
  "smi-overbought":      { type: "avoid", weight: 1.0, framework: "gauge-to-target" },
  "dual-ll":             { type: "avoid", weight: 1.0, framework: "fixed-horizon" },
  "overextended":        { type: "avoid", weight: 1.0, framework: "fixed-horizon" },
  "momentum-crack":      { type: "avoid", weight: 1.0, framework: "fixed-horizon" },
  "ema-shield-caution":  { type: "avoid", weight: 1.0, framework: "fixed-horizon" },
  "ema-shield-break":    { type: "avoid", weight: 1.0, framework: "fixed-horizon" },
};

// --- SCORE COMPUTATION ---
function computeScore(daySnapshots: { setup_id: string; status: string }[]): number {
  let score = 0;
  for (const snap of daySnapshots) {
    const config = SETUP_CONFIGS[snap.setup_id];
    if (!config) continue;

    const direction = config.type === "buy" ? 1 : -1;
    const w = config.weight;

    if (snap.status === "active") {
      score += direction * w;
    } else if (snap.status === "watching") {
      score += direction * w * 0.5;
    }
    // inactive = 0 contribution
  }
  return score;
}

// --- ZONE DEFINITIONS ---
// Score range: theoretical -6 (all avoid active) to +11 (all buy active)
// Zones calibrated after seeing distribution
type Zone = "FULL_SEND" | "FAVORABLE" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";

function assignZone(score: number): Zone {
  if (score >= 4)   return "FULL_SEND";
  if (score >= 2)   return "FAVORABLE";
  if (score >= 0)   return "NEUTRAL";
  if (score >= -2)  return "CAUTION";
  return "DEFENSIVE";
}

// --- FETCH PRICE DATA ---
async function fetchPrices(): Promise<Map<string, number>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 5);
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${period1}&period2=${period2}&interval=1d`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } });
  if (!resp.ok) throw new Error(`Yahoo Finance HTTP ${resp.status}`);
  const json = await resp.json();
  const chart = json.chart?.result?.[0];
  const timestamps = chart.timestamp || [];
  const closes = chart.indicators?.quote?.[0]?.close || [];
  const prices = new Map<string, number>();
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] != null) {
      const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
      prices.set(date, closes[i]);
    }
  }
  return prices;
}

// --- STATS HELPERS ---
function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function winRate(arr: number[]): number {
  if (!arr.length) return 0;
  return (arr.filter(v => v > 0).length / arr.length) * 100;
}

// --- MAIN ---
async function main() {
  const { url, key } = getEnv();
  const supabase = createClient(url, key);

  // Fetch all snapshots
  console.log("Fetching daily snapshots...");
  let allSnapshots: any[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("orb_daily_snapshots")
      .select("date, setup_id, status")
      .order("date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allSnapshots = allSnapshots.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  console.log(`Loaded ${allSnapshots.length} snapshot rows`);

  // Fetch prices
  console.log("Fetching TSLA prices...");
  const prices = await fetchPrices();
  const sortedDates = Array.from(prices.keys()).sort();
  console.log(`Loaded ${sortedDates.length} price bars`);

  // Group snapshots by date
  const byDate = new Map<string, { setup_id: string; status: string }[]>();
  for (const snap of allSnapshots) {
    if (!byDate.has(snap.date)) byDate.set(snap.date, []);
    byDate.get(snap.date)!.push(snap);
  }

  // Compute daily scores
  const dailyScores: { date: string; score: number; zone: Zone; price: number; activeCount: number; avoidCount: number }[] = [];
  
  for (const date of Array.from(byDate.keys()).sort()) {
    const daySnaps = byDate.get(date)!;
    const score = computeScore(daySnaps);
    const zone = assignZone(score);
    const price = prices.get(date);
    if (!price) continue;

    const activeCount = daySnaps.filter(s => s.status === "active" && SETUP_CONFIGS[s.setup_id]?.type === "buy").length;
    const avoidCount = daySnaps.filter(s => s.status === "active" && SETUP_CONFIGS[s.setup_id]?.type === "avoid").length;

    dailyScores.push({ date, score, zone, price, activeCount, avoidCount });
  }

  console.log(`\nComputed scores for ${dailyScores.length} trading days`);

  // --- SCORE DISTRIBUTION ---
  console.log("\n═══════════════════════════════════════");
  console.log("  SCORE DISTRIBUTION");
  console.log("═══════════════════════════════════════");
  
  const scores = dailyScores.map(d => d.score);
  console.log(`  Min: ${Math.min(...scores).toFixed(1)}`);
  console.log(`  Max: ${Math.max(...scores).toFixed(1)}`);
  console.log(`  Median: ${median(scores).toFixed(1)}`);
  console.log(`  Mean: ${avg(scores).toFixed(1)}`);

  // Histogram
  const buckets = new Map<number, number>();
  for (const s of scores) {
    const b = Math.round(s * 2) / 2; // round to nearest 0.5
    buckets.set(b, (buckets.get(b) || 0) + 1);
  }
  console.log("\n  Score | Count | Bar");
  console.log("  ------+-------+----");
  for (const b of Array.from(buckets.keys()).sort((a, c) => a - c)) {
    const count = buckets.get(b)!;
    const bar = "█".repeat(Math.round(count / 5));
    console.log(`  ${b >= 0 ? " " : ""}${b.toFixed(1).padStart(5)} | ${String(count).padStart(5)} | ${bar}`);
  }

  // --- ZONE DISTRIBUTION ---
  console.log("\n═══════════════════════════════════════");
  console.log("  ZONE DISTRIBUTION");
  console.log("═══════════════════════════════════════");

  const zones: Zone[] = ["FULL_SEND", "FAVORABLE", "NEUTRAL", "CAUTION", "DEFENSIVE"];
  const zoneCounts = new Map<Zone, number>();
  for (const z of zones) zoneCounts.set(z, 0);
  for (const d of dailyScores) zoneCounts.set(d.zone, (zoneCounts.get(d.zone) || 0) + 1);

  for (const z of zones) {
    const count = zoneCounts.get(z) || 0;
    const pct = ((count / dailyScores.length) * 100).toFixed(1);
    console.log(`  ${z.padEnd(12)} ${String(count).padStart(4)} days (${pct}%)`);
  }

  // --- THE MONEY TABLE: Forward Returns by Zone ---
  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log("  FORWARD RETURNS BY ZONE (THE MONEY TABLE)");
  console.log("═══════════════════════════════════════════════════════════════════════");

  const horizons = [5, 10, 20, 60];
  
  // Build forward returns
  const zoneReturns: Record<Zone, Record<number, number[]>> = {} as any;
  for (const z of zones) {
    zoneReturns[z] = {};
    for (const h of horizons) zoneReturns[z][h] = [];
  }

  for (let i = 0; i < dailyScores.length; i++) {
    const d = dailyScores[i];
    for (const h of horizons) {
      // Find the price h trading days later
      const dateIdx = sortedDates.indexOf(d.date);
      if (dateIdx === -1) continue;
      const futureDate = sortedDates[dateIdx + h];
      if (!futureDate) continue;
      const futurePrice = prices.get(futureDate);
      if (!futurePrice) continue;
      const ret = ((futurePrice - d.price) / d.price) * 100;
      zoneReturns[d.zone][h].push(ret);
    }
  }

  // Print the table
  console.log(`\n  ${"Zone".padEnd(12)} | ${"N".padStart(5)} | ${"5D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"10D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"20D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"60D Avg".padStart(8)} ${"Win%".padStart(6)}`);
  console.log("  " + "-".repeat(95));

  for (const z of zones) {
    const n = zoneReturns[z][5]?.length || zoneReturns[z][10]?.length || 0;
    const cols = horizons.map(h => {
      const rets = zoneReturns[z][h];
      if (!rets.length) return `${"—".padStart(8)} ${"—".padStart(6)}`;
      return `${(avg(rets) >= 0 ? "+" : "") + avg(rets).toFixed(2) + "%"}`.padStart(8) + ` ${winRate(rets).toFixed(0) + "%"}`.padStart(6);
    }).join(" | ");
    console.log(`  ${z.padEnd(12)} | ${String(n).padStart(5)} | ${cols}`);
  }

  // --- ZONE TRANSITIONS ---
  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log("  ZONE TRANSITIONS — Do transitions predict returns?");
  console.log("═══════════════════════════════════════════════════════════════════════");

  const transitions: Record<string, Record<number, number[]>> = {};
  
  for (let i = 1; i < dailyScores.length; i++) {
    const prev = dailyScores[i - 1];
    const curr = dailyScores[i];
    if (prev.zone === curr.zone) continue;

    const key = `${prev.zone} → ${curr.zone}`;
    if (!transitions[key]) {
      transitions[key] = {};
      for (const h of horizons) transitions[key][h] = [];
    }

    for (const h of horizons) {
      const dateIdx = sortedDates.indexOf(curr.date);
      if (dateIdx === -1) continue;
      const futureDate = sortedDates[dateIdx + h];
      if (!futureDate) continue;
      const futurePrice = prices.get(futureDate);
      if (!futurePrice) continue;
      transitions[key][h].push(((futurePrice - curr.price) / curr.price) * 100);
    }
  }

  // Show key transitions
  const keyTransitions = [
    "FAVORABLE → CAUTION",
    "FAVORABLE → NEUTRAL",
    "NEUTRAL → CAUTION",
    "NEUTRAL → FAVORABLE",
    "CAUTION → DEFENSIVE",
    "CAUTION → NEUTRAL",
    "DEFENSIVE → CAUTION",
    "DEFENSIVE → NEUTRAL",
    "NEUTRAL → FULL_SEND",
    "FAVORABLE → FULL_SEND",
    "FULL_SEND → FAVORABLE",
    "FULL_SEND → NEUTRAL",
  ];

  console.log(`\n  ${"Transition".padEnd(30)} | ${"N".padStart(4)} | ${"10D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"20D Avg".padStart(8)} ${"Win%".padStart(6)}`);
  console.log("  " + "-".repeat(75));

  for (const t of keyTransitions) {
    const data = transitions[t];
    if (!data) continue;
    const n10 = data[10]?.length || 0;
    if (n10 === 0) continue;
    const col10 = `${(avg(data[10]) >= 0 ? "+" : "") + avg(data[10]).toFixed(2) + "%"}`.padStart(8) + ` ${winRate(data[10]).toFixed(0) + "%"}`.padStart(6);
    const col20 = data[20]?.length ? `${(avg(data[20]) >= 0 ? "+" : "") + avg(data[20]).toFixed(2) + "%"}`.padStart(8) + ` ${winRate(data[20]).toFixed(0) + "%"}`.padStart(6) : `${"—".padStart(8)} ${"—".padStart(6)}`;
    console.log(`  ${t.padEnd(30)} | ${String(n10).padStart(4)} | ${col10} | ${col20}`);
  }

  // --- ALL TRANSITIONS (sorted by count) ---
  console.log(`\n  ALL TRANSITIONS:`);
  console.log(`  ${"Transition".padEnd(30)} | ${"N".padStart(4)} | ${"10D Avg".padStart(8)} | ${"20D Avg".padStart(8)}`);
  console.log("  " + "-".repeat(60));

  const allTransKeys = Object.keys(transitions).sort((a, b) => (transitions[b][10]?.length || 0) - (transitions[a][10]?.length || 0));
  for (const t of allTransKeys) {
    const data = transitions[t];
    const n = data[10]?.length || 0;
    if (n < 2) continue;
    const a10 = data[10]?.length ? `${(avg(data[10]) >= 0 ? "+" : "")}${avg(data[10]).toFixed(2)}%` : "—";
    const a20 = data[20]?.length ? `${(avg(data[20]) >= 0 ? "+" : "")}${avg(data[20]).toFixed(2)}%` : "—";
    console.log(`  ${t.padEnd(30)} | ${String(n).padStart(4)} | ${a10.padStart(8)} | ${a20.padStart(8)}`);
  }

  // --- BASELINE COMPARISON ---
  console.log("\n═══════════════════════════════════════");
  console.log("  BASELINE: Buy-and-hold TSLA");
  console.log("═══════════════════════════════════════");
  
  const allReturns: Record<number, number[]> = {};
  for (const h of horizons) allReturns[h] = [];
  
  for (let i = 0; i < dailyScores.length; i++) {
    const d = dailyScores[i];
    for (const h of horizons) {
      const dateIdx = sortedDates.indexOf(d.date);
      const futureDate = sortedDates[dateIdx + h];
      if (!futureDate) continue;
      const fp = prices.get(futureDate);
      if (!fp) continue;
      allReturns[h].push(((fp - d.price) / d.price) * 100);
    }
  }

  for (const h of horizons) {
    const rets = allReturns[h];
    console.log(`  ${h}D: avg ${avg(rets) >= 0 ? "+" : ""}${avg(rets).toFixed(2)}%, median ${median(rets) >= 0 ? "+" : ""}${median(rets).toFixed(2)}%, win ${winRate(rets).toFixed(0)}%, N=${rets.length}`);
  }

  // --- SUMMARY ---
  console.log("\n═══════════════════════════════════════");
  console.log("  VERDICT");
  console.log("═══════════════════════════════════════");
  
  const fullSend20 = zoneReturns["FULL_SEND"][20];
  const defensive20 = zoneReturns["DEFENSIVE"][20];
  const baseline20 = allReturns[20];
  
  const spread = fullSend20.length && defensive20.length
    ? avg(fullSend20) - avg(defensive20)
    : null;

  if (spread !== null) {
    console.log(`\n  FULL_SEND 20D avg: ${avg(fullSend20) >= 0 ? "+" : ""}${avg(fullSend20).toFixed(2)}%`);
    console.log(`  DEFENSIVE 20D avg: ${avg(defensive20) >= 0 ? "+" : ""}${avg(defensive20).toFixed(2)}%`);
    console.log(`  Spread: ${spread.toFixed(2)} percentage points`);
    console.log(`  Baseline 20D avg: ${avg(baseline20) >= 0 ? "+" : ""}${avg(baseline20).toFixed(2)}%`);
    
    if (spread > 5) {
      console.log(`\n  ✅ STRONG SEPARATION — Zones meaningfully predict forward returns`);
    } else if (spread > 2) {
      console.log(`\n  ⚠️ MODERATE SEPARATION — Directionally correct but may need weight tuning`);
    } else {
      console.log(`\n  ❌ WEAK SEPARATION — Equal weights don't separate zones. Need to tune weights.`);
    }
  }

  console.log("\n  v1 uses equal weights. If separation is weak, next step: tune weights");
  console.log("  based on individual setup forward return performance.\n");
}

main().catch(e => { console.error(e); process.exit(1); });
