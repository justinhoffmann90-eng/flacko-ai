/**
 * Validate Orb Score weights by measuring each setup's individual predictive edge.
 * Compares current production weights vs actual backtest performance.
 * 
 * For each setup:
 * - Pull all instances from orb_backtest_instances
 * - Compute avg 20D return when active vs baseline
 * - Compare implied weight (based on edge) to current production weight
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Current production weights from score.ts
const PROD_WEIGHTS: Record<string, number> = {
  "oversold-extreme": 0.60,
  "climactic-volume-reversal": 0.48,
  "capitulation": 0.51,
  "momentum-crack": 0.22,
  "overextended": 0.49,
  "deep-value": 0.47,
  "goldilocks": 0.44,
  "smi-overbought": 0.44,
  "trend-confirm": 0.43,
  "regime-shift": 0.28,
  "ema-shield-caution": 0.39,
  "dual-ll": 0.39,
  "trend-ride": 0.35,
  "momentum-flip": 0.33,
  "green-shoots": 0.32,
  "smi-oversold-gauge": 0.47,
  "trend-continuation": 0.47,
  "ema-shield-break": 0.30,
  "vix-spike-reversal": 0.35,
};

const SETUP_TYPES: Record<string, "buy" | "avoid"> = {
  "smi-oversold-gauge": "buy", "oversold-extreme": "buy", "regime-shift": "buy",
  "deep-value": "buy", "green-shoots": "buy", "momentum-flip": "buy",
  "trend-confirm": "buy", "trend-ride": "buy", "trend-continuation": "buy",
  "goldilocks": "buy", "capitulation": "buy", "vix-spike-reversal": "buy",
  "climactic-volume-reversal": "buy",
  "smi-overbought": "avoid", "dual-ll": "avoid", "overextended": "avoid",
  "momentum-crack": "avoid", "ema-shield-caution": "avoid", "ema-shield-break": "avoid",
};

async function main() {
  // Fetch all backtest instances
  const allInstances: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("orb_backtest_instances")
      .select("setup_id, signal_date, signal_price, ret_5d, ret_10d, ret_20d, ret_60d")
      .order("signal_date", { ascending: true })
      .range(offset, offset + 999);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    allInstances.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  console.log(`Loaded ${allInstances.length} backtest instances\n`);

  // Group by setup
  const bySetup = new Map<string, any[]>();
  for (const inst of allInstances) {
    const arr = bySetup.get(inst.setup_id) || [];
    arr.push(inst);
    bySetup.set(inst.setup_id, arr);
  }

  // Compute edge for each setup
  interface SetupEdge {
    id: string;
    type: "buy" | "avoid";
    n: number;
    avgRet20d: number;
    winRate20d: number;
    avgRet60d: number;
    winRate60d: number;
    edge: number; // normalized 0-1 score based on 20D performance
    currentWeight: number;
    suggestedWeight: number;
  }

  const edges: SetupEdge[] = [];

  for (const [setupId, instances] of bySetup) {
    const type = SETUP_TYPES[setupId];
    if (!type) continue;

    const rets20 = instances.map((i: any) => i.ret_20d).filter((v: any) => v != null) as number[];
    const rets60 = instances.map((i: any) => i.ret_60d).filter((v: any) => v != null) as number[];

    if (rets20.length === 0) continue;

    const avgRet20d = rets20.reduce((a, b) => a + b, 0) / rets20.length;
    const avgRet60d = rets60.length > 0 ? rets60.reduce((a, b) => a + b, 0) / rets60.length : 0;

    // For buy signals, positive return = win. For avoid, negative = win.
    const winRate20d = type === "buy"
      ? rets20.filter(v => v > 0).length / rets20.length * 100
      : rets20.filter(v => v < 0).length / rets20.length * 100;

    const winRate60d = rets60.length > 0
      ? (type === "buy"
        ? rets60.filter(v => v > 0).length / rets60.length * 100
        : rets60.filter(v => v < 0).length / rets60.length * 100)
      : 0;

    // Edge = how much better than random (50% / 0% avg return)
    // For buy: edge = avgRet20d (positive is good)
    // For avoid: edge = -avgRet20d (negative returns = the signal works)
    const rawEdge = type === "buy" ? avgRet20d : -avgRet20d;

    edges.push({
      id: setupId,
      type,
      n: rets20.length,
      avgRet20d,
      winRate20d,
      avgRet60d,
      winRate60d,
      edge: rawEdge,
      currentWeight: PROD_WEIGHTS[setupId] || 0.30,
      suggestedWeight: 0, // computed below
    });
  }

  // Normalize edges to 0.15-0.60 range for weights
  const maxEdge = Math.max(...edges.map(e => e.edge), 1);
  const minEdge = Math.min(...edges.map(e => e.edge), 0);
  const edgeRange = maxEdge - minEdge || 1;

  for (const e of edges) {
    // Map edge to weight range [0.15, 0.60]
    const normalized = (e.edge - minEdge) / edgeRange;
    e.suggestedWeight = Math.round((0.15 + normalized * 0.45) * 100) / 100;
    
    // Penalize low sample sizes
    if (e.n < 10) e.suggestedWeight = Math.round(e.suggestedWeight * 0.8 * 100) / 100;
  }

  // Sort by edge
  edges.sort((a, b) => b.edge - a.edge);

  console.log("═".repeat(95));
  console.log("SETUP WEIGHT VALIDATION — sorted by edge (20D predictive power)");
  console.log("═".repeat(95));
  console.log(`${"Setup".padEnd(28)} ${"Type".padEnd(6)} ${"N".padEnd(5)} ${"20D Win%".padEnd(10)} ${"20D Avg".padEnd(10)} ${"Edge".padEnd(8)} ${"Curr W".padEnd(8)} ${"Sugg W".padEnd(8)} ${"Delta".padEnd(8)}`);
  console.log("─".repeat(95));

  for (const e of edges) {
    const delta = e.suggestedWeight - e.currentWeight;
    const deltaStr = delta > 0.05 ? `+${delta.toFixed(2)} ⬆️` : delta < -0.05 ? `${delta.toFixed(2)} ⬇️` : `${delta.toFixed(2)}`;
    const retStr = `${e.avgRet20d >= 0 ? '+' : ''}${e.avgRet20d.toFixed(1)}%`;
    console.log(
      `${e.id.padEnd(28)} ${e.type.padEnd(6)} ${String(e.n).padEnd(5)} ${(e.winRate20d.toFixed(1) + '%').padEnd(10)} ${retStr.padEnd(10)} ${e.edge.toFixed(2).padEnd(8)} ${e.currentWeight.toFixed(2).padEnd(8)} ${e.suggestedWeight.toFixed(2).padEnd(8)} ${deltaStr}`
    );
  }

  // Summary
  const adjustments = edges.filter(e => Math.abs(e.suggestedWeight - e.currentWeight) > 0.05);
  console.log(`\n${"═".repeat(95)}`);
  console.log(`Setups needing adjustment (>0.05 delta): ${adjustments.length}`);
  for (const a of adjustments) {
    console.log(`  ${a.id}: ${a.currentWeight.toFixed(2)} → ${a.suggestedWeight.toFixed(2)} (edge=${a.edge.toFixed(2)})`);
  }
}

main().catch(console.error);
