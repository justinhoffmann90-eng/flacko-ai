/**
 * Orb Score v3 — 4 Zones (FULL SEND / NEUTRAL / CAUTION / DEFENSIVE)
 * Merges FAVORABLE into NEUTRAL. Mirrors existing 4-mode system.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const env = readFileSync(".env.local", "utf-8");
  const g = (k: string) => { const m = env.match(new RegExp(`^${k}=(.+)$`, "m")); return m?.[1]?.trim().replace(/^['\"]|['\"]$/g, ""); };
  return { url: g("NEXT_PUBLIC_SUPABASE_URL")!, key: g("SUPABASE_SERVICE_ROLE_KEY")! };
}

type Zone = "FULL_SEND" | "NEUTRAL" | "CAUTION" | "DEFENSIVE";
const ZONES: Zone[] = ["FULL_SEND", "NEUTRAL", "CAUTION", "DEFENSIVE"];
const ZONE_EMOJI: Record<Zone, string> = { FULL_SEND: "🟢", NEUTRAL: "⚪", CAUTION: "🟡", DEFENSIVE: "🔴" };

function avg(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function median(arr: number[]): number { const s = [...arr].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[Math.floor(s.length / 2)] : (s[Math.floor(s.length / 2) - 1] + s[Math.floor(s.length / 2)]) / 2) : 0; }
function winRate(arr: number[]): number { return arr.length ? (arr.filter(v => v > 0).length / arr.length) * 100 : 0; }
function pctile(arr: number[], p: number): number { const s = [...arr].sort((a, b) => a - b); return s[Math.min(Math.floor(s.length * p), s.length - 1)]; }

const SETUP_TYPES: Record<string, "buy" | "avoid"> = {
  "smi-oversold-gauge": "buy", "oversold-extreme": "buy", "regime-shift": "buy",
  "deep-value": "buy", "green-shoots": "buy", "momentum-flip": "buy",
  "trend-confirm": "buy", "trend-ride": "buy", "trend-continuation": "buy",
  "goldilocks": "buy", "capitulation": "buy",
  "smi-overbought": "avoid", "dual-ll": "avoid", "overextended": "avoid",
  "momentum-crack": "avoid", "ema-shield-caution": "avoid", "ema-shield-break": "avoid",
};

// v2 quality weights (from alpha analysis)
const WEIGHTS: Record<string, number> = {
  "oversold-extreme": 0.60, "capitulation": 0.51, "momentum-crack": 0.22,
  "overextended": 0.49, "deep-value": 0.47, "goldilocks": 0.44,
  "smi-overbought": 0.44, "trend-confirm": 0.43, "regime-shift": 0.28,
  "ema-shield-caution": 0.39, "dual-ll": 0.39, "trend-ride": 0.35,
  "momentum-flip": 0.33, "green-shoots": 0.32, "smi-oversold-gauge": 0.47,
  "trend-continuation": 0.47, "ema-shield-break": 0.30,
};

function computeScore(daySnaps: { setup_id: string; status: string }[]): number {
  let score = 0;
  for (const snap of daySnaps) {
    const type = SETUP_TYPES[snap.setup_id];
    if (!type) continue;
    const w = WEIGHTS[snap.setup_id] || 0.3;
    const dir = type === "buy" ? 1 : -1;
    if (snap.status === "active") score += dir * w;
    else if (snap.status === "watching") score += dir * w * 0.3;
  }
  return score;
}

async function fetchPrices(): Promise<Map<string, number>> {
  const start = new Date(); start.setFullYear(start.getFullYear() - 5);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/TSLA?period1=${Math.floor(start.getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}&interval=1d`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const chart = (await resp.json()).chart?.result?.[0];
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

  let allSnapshots: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from("orb_daily_snapshots").select("date, setup_id, status").order("date").range(from, from + 999);
    if (!data?.length) break;
    allSnapshots = allSnapshots.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }

  const prices = await fetchPrices();
  const sortedDates = Array.from(prices.keys()).sort();

  const byDate = new Map<string, { setup_id: string; status: string }[]>();
  for (const s of allSnapshots) { if (!byDate.has(s.date)) byDate.set(s.date, []); byDate.get(s.date)!.push(s); }

  // Compute daily scores
  const dailyScores: { date: string; score: number; price: number }[] = [];
  for (const date of Array.from(byDate.keys()).sort()) {
    const price = prices.get(date);
    if (!price) continue;
    dailyScores.push({ date, score: computeScore(byDate.get(date)!), price });
  }

  const scores = dailyScores.map(d => d.score);

  // 4-zone thresholds: FULL_SEND top ~15%, NEUTRAL middle ~50%, CAUTION ~25%, DEFENSIVE bottom ~10%
  const p85 = pctile(scores, 0.85);
  const p35 = pctile(scores, 0.35);
  const p10 = pctile(scores, 0.10);

  function assignZone(score: number): Zone {
    if (score >= p85) return "FULL_SEND";
    if (score >= p35) return "NEUTRAL";
    if (score >= p10) return "CAUTION";
    return "DEFENSIVE";
  }

  const zoneData = dailyScores.map(d => ({ ...d, zone: assignZone(d.score) }));

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  ORB SCORE v3 — 4 ZONES");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`  Score range: ${Math.min(...scores).toFixed(2)} to ${Math.max(...scores).toFixed(2)}`);
  console.log(`  Thresholds: FULL_SEND≥${p85.toFixed(2)}, NEUTRAL≥${p35.toFixed(2)}, CAUTION≥${p10.toFixed(2)}\n`);

  console.log("  ZONE DISTRIBUTION:");
  for (const z of ZONES) {
    const count = zoneData.filter(d => d.zone === z).length;
    console.log(`    ${ZONE_EMOJI[z]} ${z.padEnd(12)} ${String(count).padStart(4)} days (${((count / zoneData.length) * 100).toFixed(1)}%)`);
  }

  // Money table
  const horizons = [5, 10, 20, 60];
  const zoneReturns: Record<Zone, Record<number, number[]>> = {} as any;
  for (const z of ZONES) { zoneReturns[z] = {}; for (const h of horizons) zoneReturns[z][h] = []; }

  for (const d of zoneData) {
    const di = sortedDates.indexOf(d.date);
    for (const h of horizons) {
      const fd = sortedDates[di + h];
      if (fd && prices.get(fd)) zoneReturns[d.zone][h].push(((prices.get(fd)! - d.price) / d.price) * 100);
    }
  }

  console.log(`\n  THE MONEY TABLE:\n`);
  console.log(`  ${"Zone".padEnd(14)} | ${"N".padStart(5)} | ${"5D Avg".padStart(8)} ${"Win%".padStart(5)} | ${"10D Avg".padStart(8)} ${"Win%".padStart(5)} | ${"20D Avg".padStart(8)} ${"Win%".padStart(5)} | ${"60D Avg".padStart(8)} ${"Win%".padStart(5)}`);
  console.log("  " + "-".repeat(92));

  for (const z of ZONES) {
    const n = zoneReturns[z][5]?.length || 0;
    const cols = horizons.map(h => {
      const r = zoneReturns[z][h];
      if (!r.length) return "       —    —";
      return `${(avg(r) >= 0 ? "+" : "") + avg(r).toFixed(2) + "%"}`.padStart(8) + ` ${winRate(r).toFixed(0) + "%"}`.padStart(5);
    }).join(" | ");
    console.log(`  ${ZONE_EMOJI[z]} ${z.padEnd(12)} | ${String(n).padStart(5)} | ${cols}`);
  }

  // Baseline
  const blRets: Record<number, number[]> = {};
  for (const h of horizons) blRets[h] = [];
  for (const d of zoneData) {
    const di = sortedDates.indexOf(d.date);
    for (const h of horizons) {
      const fd = sortedDates[di + h];
      if (fd && prices.get(fd)) blRets[h].push(((prices.get(fd)! - d.price) / d.price) * 100);
    }
  }
  console.log("  " + "-".repeat(92));
  const blCols = horizons.map(h => `${avg(blRets[h]) >= 0 ? "+" : ""}${avg(blRets[h]).toFixed(2)}%`.padStart(8) + ` ${winRate(blRets[h]).toFixed(0)}%`.padStart(5)).join(" | ");
  console.log(`  📊 ${"BASELINE".padEnd(12)} | ${String(zoneData.length).padStart(5)} | ${blCols}`);

  // Spreads
  console.log("\n  KEY SPREADS:");
  for (const h of [10, 20, 60]) {
    const topRets = zoneReturns["FULL_SEND"][h];
    const botRets = [...zoneReturns["CAUTION"][h], ...zoneReturns["DEFENSIVE"][h]];
    if (topRets.length && botRets.length) {
      const spread = avg(topRets) - avg(botRets);
      console.log(`    ${h}D: 🟢 FULL SEND ${avg(topRets) >= 0 ? "+" : ""}${avg(topRets).toFixed(2)}% vs 🟡🔴 CAU+DEF ${avg(botRets) >= 0 ? "+" : ""}${avg(botRets).toFixed(2)}% → Spread: ${spread.toFixed(2)}pp`);
    }
  }

  // Transitions
  console.log("\n  ZONE TRANSITIONS:\n");
  const transitions: Record<string, Record<number, number[]>> = {};
  for (let i = 1; i < zoneData.length; i++) {
    const prev = zoneData[i - 1], curr = zoneData[i];
    if (prev.zone === curr.zone) continue;
    const key = `${ZONE_EMOJI[prev.zone]} ${prev.zone} → ${ZONE_EMOJI[curr.zone]} ${curr.zone}`;
    if (!transitions[key]) { transitions[key] = {}; for (const h of horizons) transitions[key][h] = []; }
    for (const h of horizons) {
      const di = sortedDates.indexOf(curr.date);
      const fd = sortedDates[di + h];
      if (fd && prices.get(fd)) transitions[key][h].push(((prices.get(fd)! - curr.price) / curr.price) * 100);
    }
  }

  console.log(`  ${"Transition".padEnd(40)} | ${"N".padStart(4)} | ${"10D".padStart(8)} ${"W%".padStart(4)} | ${"20D".padStart(8)} ${"W%".padStart(4)}`);
  console.log("  " + "-".repeat(72));
  const transSorted = Object.entries(transitions).filter(([_, d]) => (d[10]?.length || 0) >= 3).sort((a, b) => (b[1][10]?.length || 0) - (a[1][10]?.length || 0));
  for (const [t, d] of transSorted) {
    const n = d[10]?.length || 0;
    const c10 = `${avg(d[10]) >= 0 ? "+" : ""}${avg(d[10]).toFixed(2)}%`.padStart(8) + ` ${winRate(d[10]).toFixed(0)}%`.padStart(4);
    const c20 = d[20]?.length ? `${avg(d[20]) >= 0 ? "+" : ""}${avg(d[20]).toFixed(2)}%`.padStart(8) + ` ${winRate(d[20]).toFixed(0)}%`.padStart(4) : "       —    —";
    console.log(`  ${t.padEnd(40)} | ${String(n).padStart(4)} | ${c10} | ${c20}`);
  }

  // Justin's key questions
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  JUSTIN'S KEY QUESTIONS");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. When score drops to CAUTION, does TSLA underperform 10-20d?
  const neuToCau = transitions[`⚪ NEUTRAL → 🟡 CAUTION`];
  if (neuToCau) {
    console.log(`  Q: Does NEUTRAL → CAUTION predict underperformance?`);
    console.log(`  A: 10D: ${avg(neuToCau[10]).toFixed(2)}% (${winRate(neuToCau[10]).toFixed(0)}% win), 20D: ${avg(neuToCau[20]).toFixed(2)}% (${winRate(neuToCau[20]).toFixed(0)}% win) — N=${neuToCau[10].length}`);
    console.log(`     vs Baseline 10D: ${avg(blRets[10]).toFixed(2)}%, 20D: ${avg(blRets[20]).toFixed(2)}%`);
    console.log(avg(neuToCau[20]) < avg(blRets[20]) ? "     ✅ YES — underperforms baseline\n" : "     ❌ NO\n");
  }

  // 2. When score rises from DEFENSIVE to NEUTRAL, is that "worst is over"?
  const defToNeu = transitions[`🔴 DEFENSIVE → ⚪ NEUTRAL`];
  const defToCau = transitions[`🔴 DEFENSIVE → 🟡 CAUTION`];
  if (defToCau) {
    console.log(`  Q: Does DEFENSIVE → CAUTION signal "worst is over"?`);
    console.log(`  A: 10D: ${avg(defToCau[10]).toFixed(2)}% (${winRate(defToCau[10]).toFixed(0)}% win), 20D: ${avg(defToCau[20]).toFixed(2)}% (${winRate(defToCau[20]).toFixed(0)}% win) — N=${defToCau[10].length}`);
    const defAvg20 = avg(zoneReturns["DEFENSIVE"][20]);
    console.log(`     vs staying DEFENSIVE 20D: ${defAvg20.toFixed(2)}%`);
    console.log(avg(defToCau[20]) > defAvg20 ? "     ✅ YES — improves on staying defensive\n" : "     ❌ NO — still negative\n");
  }

  // 3. Do FULL SEND periods capture big rallies?
  const fs20 = zoneReturns["FULL_SEND"][20];
  const fs60 = zoneReturns["FULL_SEND"][60];
  console.log(`  Q: Does FULL SEND capture big leveraged-friendly rallies?`);
  console.log(`  A: 20D: ${avg(fs20).toFixed(2)}% avg (${winRate(fs20).toFixed(0)}% win), 60D: ${avg(fs60).toFixed(2)}% avg (${winRate(fs60).toFixed(0)}% win) — N=${fs20.length}`);
  console.log(`     Median 20D: ${median(fs20).toFixed(2)}%, P75: ${pctile(fs20, 0.75).toFixed(2)}%, P90: ${pctile(fs20, 0.90).toFixed(2)}%`);
  console.log(avg(fs20) > avg(blRets[20]) * 2 ? "     ✅ YES — 2x+ baseline returns\n" : "     ⚠️ Better than baseline but not 2x\n");

  // Verdict
  const fsAvg = avg(zoneReturns["FULL_SEND"][20]);
  const cauDefAvg = avg([...zoneReturns["CAUTION"][20], ...zoneReturns["DEFENSIVE"][20]]);
  const spread = fsAvg - cauDefAvg;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  FINAL VERDICT");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`  🟢 FULL SEND 20D: ${fsAvg >= 0 ? "+" : ""}${fsAvg.toFixed(2)}% (${winRate(fs20).toFixed(0)}% win)`);
  console.log(`  ⚪ NEUTRAL   20D: ${avg(zoneReturns["NEUTRAL"][20]) >= 0 ? "+" : ""}${avg(zoneReturns["NEUTRAL"][20]).toFixed(2)}% (${winRate(zoneReturns["NEUTRAL"][20]).toFixed(0)}% win)`);
  console.log(`  🟡 CAUTION   20D: ${avg(zoneReturns["CAUTION"][20]) >= 0 ? "+" : ""}${avg(zoneReturns["CAUTION"][20]).toFixed(2)}% (${winRate(zoneReturns["CAUTION"][20]).toFixed(0)}% win)`);
  console.log(`  🔴 DEFENSIVE 20D: ${avg(zoneReturns["DEFENSIVE"][20]) >= 0 ? "+" : ""}${avg(zoneReturns["DEFENSIVE"][20]).toFixed(2)}% (${winRate(zoneReturns["DEFENSIVE"][20]).toFixed(0)}% win)`);
  console.log(`\n  Spread (FULL SEND vs CAU+DEF): ${spread.toFixed(2)}pp`);
  console.log(`  Baseline: +${avg(blRets[20]).toFixed(2)}%`);

  if (spread > 10) console.log("\n  🚀 SHIP IT — Zones separate cleanly. This is the product.");
  else if (spread > 6) console.log("\n  ✅ STRONG — Ship it and tune with live data.");
  else if (spread > 3) console.log("\n  ⚠️ OK — Works but room for improvement.");
  else console.log("\n  ❌ WEAK — Need different approach.");

  // Output production config
  console.log("\n  PRODUCTION CONFIG:");
  console.log(`  Weights: ${JSON.stringify(WEIGHTS)}`);
  console.log(`  Thresholds: { FULL_SEND: ${p85.toFixed(3)}, NEUTRAL: ${p35.toFixed(3)}, CAUTION: ${p10.toFixed(3)} }`);
  console.log(`  Zones: FULL_SEND (≥${p85.toFixed(2)}) | NEUTRAL (≥${p35.toFixed(2)}) | CAUTION (≥${p10.toFixed(2)}) | DEFENSIVE (<${p10.toFixed(2)})`);
}

main().catch(e => { console.error(e); process.exit(1); });
