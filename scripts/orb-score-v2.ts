/**
 * Orb Score v2 — Quality-weighted, tuned thresholds
 * 
 * Step 1: Compute each setup's "alpha" (how much being active predicts returns)
 * Step 2: Weight setups by alpha
 * Step 3: Re-calibrate zone thresholds based on distribution
 * Step 4: Re-run the money table
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const env = readFileSync(".env.local", "utf-8");
  const g = (k: string) => { const m = env.match(new RegExp(`^${k}=(.+)$`, "m")); return m?.[1]?.trim().replace(/^['\"]|['\"]$/g, ""); };
  return { url: g("NEXT_PUBLIC_SUPABASE_URL")!, key: g("SUPABASE_SERVICE_ROLE_KEY")! };
}

type Zone = "FULL_SEND" | "FAVORABLE" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";

function avg(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s.length % 2 ? s[Math.floor(s.length / 2)] : (s[Math.floor(s.length / 2) - 1] + s[Math.floor(s.length / 2)]) / 2;
}
function winRate(arr: number[]): number { return arr.length ? (arr.filter(v => v > 0).length / arr.length) * 100 : 0; }
function pctile(arr: number[], p: number): number {
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.floor(s.length * p);
  return s[Math.min(i, s.length - 1)];
}

async function fetchPrices(): Promise<Map<string, number>> {
  const endDate = new Date(); const startDate = new Date(); startDate.setFullYear(endDate.getFullYear() - 5);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${Math.floor(startDate.getTime() / 1000)}&period2=${Math.floor(endDate.getTime() / 1000)}&interval=1d`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const json = await resp.json();
  const chart = json.chart?.result?.[0];
  const prices = new Map<string, number>();
  for (let i = 0; i < (chart.timestamp || []).length; i++) {
    const c = chart.indicators?.quote?.[0]?.close?.[i];
    if (c != null) prices.set(new Date(chart.timestamp[i] * 1000).toISOString().slice(0, 10), c);
  }
  return prices;
}

async function main() {
  const { url, key } = getEnv();
  const supabase = createClient(url, key);

  // Fetch snapshots
  let allSnapshots: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from("orb_daily_snapshots").select("date, setup_id, status").order("date").range(from, from + 999);
    if (!data || !data.length) break;
    allSnapshots = allSnapshots.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`Loaded ${allSnapshots.length} snapshots`);

  const prices = await fetchPrices();
  const sortedDates = Array.from(prices.keys()).sort();
  console.log(`Loaded ${sortedDates.length} prices\n`);

  // Group by date
  const byDate = new Map<string, { setup_id: string; status: string }[]>();
  for (const s of allSnapshots) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }

  // ═══════════════════════════════════════
  // STEP 1: Compute each setup's alpha
  // Alpha = avg 20D return when active minus baseline 20D return
  // ═══════════════════════════════════════
  console.log("═══════════════════════════════════════════════");
  console.log("  STEP 1: Individual Setup Alpha (20D)");
  console.log("═══════════════════════════════════════════════\n");

  const setupAlpha: Record<string, { active20d: number[]; type: "buy" | "avoid"; alpha: number; n: number }> = {};

  const setupTypes: Record<string, "buy" | "avoid"> = {
    "smi-oversold-gauge": "buy", "oversold-extreme": "buy", "regime-shift": "buy",
    "deep-value": "buy", "green-shoots": "buy", "momentum-flip": "buy",
    "trend-confirm": "buy", "trend-ride": "buy", "trend-continuation": "buy",
    "goldilocks": "buy", "capitulation": "buy",
    "smi-overbought": "avoid", "dual-ll": "avoid", "overextended": "avoid",
    "momentum-crack": "avoid", "ema-shield-caution": "avoid", "ema-shield-break": "avoid",
  };

  // Collect 20D forward returns for each setup when active
  for (const [date, snaps] of byDate) {
    const dateIdx = sortedDates.indexOf(date);
    if (dateIdx === -1) continue;
    const futureDate = sortedDates[dateIdx + 20];
    if (!futureDate) continue;
    const futurePrice = prices.get(futureDate);
    const currentPrice = prices.get(date);
    if (!futurePrice || !currentPrice) continue;
    const ret = ((futurePrice - currentPrice) / currentPrice) * 100;

    for (const snap of snaps) {
      if (snap.status !== "active") continue;
      if (!setupAlpha[snap.setup_id]) {
        setupAlpha[snap.setup_id] = { active20d: [], type: setupTypes[snap.setup_id] || "buy", alpha: 0, n: 0 };
      }
      setupAlpha[snap.setup_id].active20d.push(ret);
    }
  }

  // Baseline 20D return
  const allReturns20d: number[] = [];
  for (const date of Array.from(byDate.keys()).sort()) {
    const dateIdx = sortedDates.indexOf(date);
    if (dateIdx === -1) continue;
    const fd = sortedDates[dateIdx + 20];
    if (!fd) continue;
    const fp = prices.get(fd), cp = prices.get(date);
    if (!fp || !cp) continue;
    allReturns20d.push(((fp - cp) / cp) * 100);
  }
  const baseline20d = avg(allReturns20d);
  console.log(`  Baseline 20D return: ${baseline20d >= 0 ? "+" : ""}${baseline20d.toFixed(2)}%\n`);

  // Compute alpha for each setup
  const alphaEntries: [string, { alpha: number; n: number; avg20d: number; type: string }][] = [];
  
  for (const [sid, data] of Object.entries(setupAlpha)) {
    const avgRet = avg(data.active20d);
    // For buy setups: alpha = how much better than baseline when active
    // For avoid setups: alpha = how much WORSE (more negative) than baseline when active
    const alpha = data.type === "buy" ? avgRet - baseline20d : baseline20d - avgRet;
    data.alpha = alpha;
    data.n = data.active20d.length;
    alphaEntries.push([sid, { alpha, n: data.n, avg20d: avgRet, type: data.type }]);
  }

  alphaEntries.sort((a, b) => b[1].alpha - a[1].alpha);
  console.log(`  ${"Setup".padEnd(22)} | ${"Type".padEnd(5)} | ${"N".padStart(5)} | ${"Avg 20D".padStart(9)} | ${"Alpha".padStart(8)}`);
  console.log("  " + "-".repeat(60));
  for (const [sid, d] of alphaEntries) {
    console.log(`  ${sid.padEnd(22)} | ${d.type.padEnd(5)} | ${String(d.n).padStart(5)} | ${(d.avg20d >= 0 ? "+" : "") + d.avg20d.toFixed(2) + "%"}`.padEnd(50) + ` | ${(d.alpha >= 0 ? "+" : "") + d.alpha.toFixed(2)}`);
  }

  // ═══════════════════════════════════════
  // STEP 2: Compute quality weights
  // Normalize alpha to [0.5, 2.0] range
  // Low-N setups get penalized
  // ═══════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 2: Quality Weights");
  console.log("═══════════════════════════════════════════════\n");

  const weights: Record<string, number> = {};
  const alphas = alphaEntries.map(e => e[1].alpha);
  const maxAlpha = Math.max(...alphas);
  const minAlpha = Math.min(...alphas.filter(a => a > 0)); // min positive alpha

  for (const [sid, data] of alphaEntries) {
    // Base weight from alpha (0 to 1 scaled)
    let w = data.alpha > 0 ? data.alpha / (maxAlpha || 1) : 0.1; // negative alpha setups get minimal weight
    
    // Scale to [0.3, 2.0]
    w = 0.3 + w * 1.7;

    // N penalty: if < 20 active days, reduce weight
    if (data.n < 20) w *= Math.max(0.3, data.n / 20);

    weights[sid] = Math.round(w * 100) / 100;
  }

  // Also add weights for setups that were never active (0.3 default)
  for (const sid of Object.keys(setupTypes)) {
    if (!weights[sid]) weights[sid] = 0.3;
  }

  console.log(`  ${"Setup".padEnd(22)} | ${"Weight".padStart(6)} | ${"Alpha".padStart(8)} | ${"N".padStart(5)}`);
  console.log("  " + "-".repeat(50));
  for (const [sid, d] of alphaEntries) {
    console.log(`  ${sid.padEnd(22)} | ${weights[sid].toFixed(2).padStart(6)} | ${(d.alpha >= 0 ? "+" : "") + d.alpha.toFixed(2)}`.padEnd(45) + ` | ${String(d.n).padStart(5)}`);
  }

  // ═══════════════════════════════════════
  // STEP 3: Recompute scores with quality weights
  // ═══════════════════════════════════════

  function computeScore(daySnaps: { setup_id: string; status: string }[]): number {
    let score = 0;
    for (const snap of daySnaps) {
      const type = setupTypes[snap.setup_id];
      if (!type) continue;
      const w = weights[snap.setup_id] || 0.3;
      const direction = type === "buy" ? 1 : -1;

      if (snap.status === "active") score += direction * w;
      else if (snap.status === "watching") score += direction * w * 0.3; // reduced watching contribution
    }
    return score;
  }

  const dailyScores: { date: string; score: number; price: number }[] = [];
  for (const date of Array.from(byDate.keys()).sort()) {
    const price = prices.get(date);
    if (!price) continue;
    dailyScores.push({ date, score: computeScore(byDate.get(date)!), price });
  }

  const scores = dailyScores.map(d => d.score);
  console.log(`\n  v2 Score range: ${Math.min(...scores).toFixed(2)} to ${Math.max(...scores).toFixed(2)}`);
  console.log(`  Median: ${median(scores).toFixed(2)}, Mean: ${avg(scores).toFixed(2)}`);

  // ═══════════════════════════════════════
  // STEP 4: Calibrate zones using percentiles
  // ═══════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════");
  console.log("  STEP 3: Percentile-Based Zone Thresholds");
  console.log("═══════════════════════════════════════════════\n");

  // Target distribution: FULL_SEND ~5%, FAVORABLE ~20%, NEUTRAL ~40%, CAUTION ~25%, DEFENSIVE ~10%
  const p90 = pctile(scores, 0.90);
  const p70 = pctile(scores, 0.70);
  const p30 = pctile(scores, 0.30);
  const p10 = pctile(scores, 0.10);

  console.log(`  P90 (FULL_SEND threshold): ${p90.toFixed(2)}`);
  console.log(`  P70 (FAVORABLE threshold): ${p70.toFixed(2)}`);
  console.log(`  P30 (CAUTION threshold):   ${p30.toFixed(2)}`);
  console.log(`  P10 (DEFENSIVE threshold): ${p10.toFixed(2)}`);

  function assignZone(score: number): Zone {
    if (score >= p90) return "FULL_SEND";
    if (score >= p70) return "FAVORABLE";
    if (score >= p30) return "NEUTRAL";
    if (score >= p10) return "CAUTION";
    return "DEFENSIVE";
  }

  // Zone distribution
  const zoneData = dailyScores.map(d => ({ ...d, zone: assignZone(d.score) }));
  const allZones: Zone[] = ["FULL_SEND", "FAVORABLE", "NEUTRAL", "CAUTION", "DEFENSIVE"];
  
  console.log("\n  Zone distribution:");
  for (const z of allZones) {
    const count = zoneData.filter(d => d.zone === z).length;
    console.log(`    ${z.padEnd(12)} ${String(count).padStart(4)} days (${((count / zoneData.length) * 100).toFixed(1)}%)`);
  }

  // ═══════════════════════════════════════
  // STEP 5: THE MONEY TABLE v2
  // ═══════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════════════════════════════");
  console.log("  THE MONEY TABLE v2 — Quality-Weighted, Percentile Zones");
  console.log("═══════════════════════════════════════════════════════════════════════════════\n");

  const horizons = [5, 10, 20, 60];
  const zoneReturns: Record<Zone, Record<number, number[]>> = {} as any;
  for (const z of allZones) { zoneReturns[z] = {}; for (const h of horizons) zoneReturns[z][h] = []; }

  for (const d of zoneData) {
    const dateIdx = sortedDates.indexOf(d.date);
    if (dateIdx === -1) continue;
    for (const h of horizons) {
      const fd = sortedDates[dateIdx + h];
      if (!fd) continue;
      const fp = prices.get(fd);
      if (!fp) continue;
      zoneReturns[d.zone][h].push(((fp - d.price) / d.price) * 100);
    }
  }

  console.log(`  ${"Zone".padEnd(12)} | ${"N".padStart(5)} | ${"5D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"10D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"20D Avg".padStart(8)} ${"Win%".padStart(6)} | ${"60D Avg".padStart(8)} ${"Win%".padStart(6)}`);
  console.log("  " + "-".repeat(95));

  for (const z of allZones) {
    const n = zoneReturns[z][5]?.length || 0;
    const cols = horizons.map(h => {
      const rets = zoneReturns[z][h];
      if (!rets.length) return `${"—".padStart(8)} ${"—".padStart(6)}`;
      return `${(avg(rets) >= 0 ? "+" : "") + avg(rets).toFixed(2) + "%"}`.padStart(8) + ` ${winRate(rets).toFixed(0) + "%"}`.padStart(6);
    }).join(" | ");
    console.log(`  ${z.padEnd(12)} | ${String(n).padStart(5)} | ${cols}`);
  }

  // Baseline
  console.log("  " + "-".repeat(95));
  const blCols = horizons.map(h => {
    const rets: number[] = [];
    for (const d of zoneData) {
      const di = sortedDates.indexOf(d.date);
      const fd = sortedDates[di + h];
      if (fd && prices.get(fd)) rets.push(((prices.get(fd)! - d.price) / d.price) * 100);
    }
    return `${(avg(rets) >= 0 ? "+" : "") + avg(rets).toFixed(2) + "%"}`.padStart(8) + ` ${winRate(rets).toFixed(0) + "%"}`.padStart(6);
  }).join(" | ");
  console.log(`  ${"BASELINE".padEnd(12)} | ${String(zoneData.length).padStart(5)} | ${blCols}`);

  // Spreads
  console.log("\n  KEY SPREADS:");
  for (const h of [10, 20, 60]) {
    const fs = zoneReturns["FULL_SEND"][h];
    const fav = zoneReturns["FAVORABLE"][h];
    const cau = zoneReturns["CAUTION"][h];
    const def = zoneReturns["DEFENSIVE"][h];
    const top = [...(fs || []), ...(fav || [])];
    const bot = [...(cau || []), ...(def || [])];
    if (top.length && bot.length) {
      console.log(`    ${h}D: Top zones (FS+FAV) ${avg(top) >= 0 ? "+" : ""}${avg(top).toFixed(2)}% vs Bottom zones (CAU+DEF) ${avg(bot) >= 0 ? "+" : ""}${avg(bot).toFixed(2)}% → Spread: ${(avg(top) - avg(bot)).toFixed(2)}pp`);
    }
  }

  // ═══════════════════════════════════════
  // ZONE TRANSITIONS v2
  // ═══════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log("  ZONE TRANSITIONS v2");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  const transitions: Record<string, Record<number, number[]>> = {};
  for (let i = 1; i < zoneData.length; i++) {
    const prev = zoneData[i - 1], curr = zoneData[i];
    if (prev.zone === curr.zone) continue;
    const key = `${prev.zone} → ${curr.zone}`;
    if (!transitions[key]) { transitions[key] = {}; for (const h of horizons) transitions[key][h] = []; }
    for (const h of horizons) {
      const di = sortedDates.indexOf(curr.date);
      const fd = sortedDates[di + h];
      if (fd && prices.get(fd)) transitions[key][h].push(((prices.get(fd)! - curr.price) / curr.price) * 100);
    }
  }

  const keyTrans = [
    "FAVORABLE → CAUTION", "FAVORABLE → NEUTRAL", "NEUTRAL → FAVORABLE",
    "NEUTRAL → CAUTION", "CAUTION → DEFENSIVE", "CAUTION → NEUTRAL",
    "DEFENSIVE → CAUTION", "DEFENSIVE → NEUTRAL",
    "FAVORABLE → FULL_SEND", "FULL_SEND → FAVORABLE",
  ];

  console.log(`  ${"Transition".padEnd(28)} | ${"N".padStart(4)} | ${"10D".padStart(8)} ${"W%".padStart(4)} | ${"20D".padStart(8)} ${"W%".padStart(4)}`);
  console.log("  " + "-".repeat(65));
  for (const t of keyTrans) {
    const d = transitions[t];
    if (!d || !d[10]?.length) continue;
    const c10 = `${avg(d[10]) >= 0 ? "+" : ""}${avg(d[10]).toFixed(2)}%`.padStart(8) + ` ${winRate(d[10]).toFixed(0)}%`.padStart(4);
    const c20 = d[20]?.length ? `${avg(d[20]) >= 0 ? "+" : ""}${avg(d[20]).toFixed(2)}%`.padStart(8) + ` ${winRate(d[20]).toFixed(0)}%`.padStart(4) : "       —    —";
    console.log(`  ${t.padEnd(28)} | ${String(d[10].length).padStart(4)} | ${c10} | ${c20}`);
  }

  // Also show ALL transitions sorted by N
  console.log("\n  ALL TRANSITIONS (N≥3):");
  const allTrans = Object.entries(transitions).filter(([_, d]) => (d[10]?.length || 0) >= 3).sort((a, b) => (b[1][10]?.length || 0) - (a[1][10]?.length || 0));
  for (const [t, d] of allTrans) {
    const c10 = `${avg(d[10]) >= 0 ? "+" : ""}${avg(d[10]).toFixed(2)}%`;
    const c20 = d[20]?.length ? `${avg(d[20]) >= 0 ? "+" : ""}${avg(d[20]).toFixed(2)}%` : "—";
    console.log(`    ${t.padEnd(28)} N=${String(d[10].length).padStart(3)}  10D: ${c10.padStart(8)}  20D: ${c20.padStart(8)}`);
  }

  // ═══════════════════════════════════════
  // VERDICT
  // ═══════════════════════════════════════
  console.log("\n═══════════════════════════════════════════════");
  console.log("  VERDICT v2");
  console.log("═══════════════════════════════════════════════\n");

  const topAvg20 = avg([...zoneReturns["FULL_SEND"][20], ...zoneReturns["FAVORABLE"][20]]);
  const botAvg20 = avg([...zoneReturns["CAUTION"][20], ...zoneReturns["DEFENSIVE"][20]]);
  const spread = topAvg20 - botAvg20;

  console.log(`  Top zones (FULL_SEND + FAVORABLE) 20D: ${topAvg20 >= 0 ? "+" : ""}${topAvg20.toFixed(2)}%`);
  console.log(`  Bottom zones (CAUTION + DEFENSIVE) 20D: ${botAvg20 >= 0 ? "+" : ""}${botAvg20.toFixed(2)}%`);
  console.log(`  Spread: ${spread.toFixed(2)} percentage points`);
  console.log(`  Baseline: +${baseline20d.toFixed(2)}%`);

  if (spread > 8) console.log("\n  ✅ STRONG — Quality weights significantly improve zone separation");
  else if (spread > 5) console.log("\n  ✅ SOLID — Zones predict returns meaningfully above baseline");
  else if (spread > 3) console.log("\n  ⚠️ MODERATE — Directional but room to improve");
  else console.log("\n  ❌ WEAK — Need fundamentally different approach");

  // Output weights for production use
  console.log("\n  PRODUCTION WEIGHTS:");
  console.log("  " + JSON.stringify(weights, null, 2));
  console.log(`\n  ZONE THRESHOLDS: FULL_SEND≥${p90.toFixed(2)}, FAVORABLE≥${p70.toFixed(2)}, NEUTRAL≥${p30.toFixed(2)}, CAUTION≥${p10.toFixed(2)}, DEFENSIVE<${p10.toFixed(2)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
