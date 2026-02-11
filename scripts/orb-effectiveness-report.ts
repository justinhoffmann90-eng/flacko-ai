/**
 * Orb Score Effectiveness Report
 * 
 * Compares live Orb zone performance against backtest benchmarks.
 * Run: cd ~/Flacko_AI/flacko-ai && npx tsx scripts/orb-effectiveness-report.ts
 */

import pg from 'pg';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const { Pool } = pg;

// --- Config ---
const pool = new Pool({
  host: 'db.rctbqtemkahdbifxrqom.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'zTgMqT1zIc5DZeHh',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

const BACKTEST_BENCHMARKS: Record<string, { avg20d: number; win20d: number }> = {
  FULL_SEND:  { avg20d: 6.22,  win20d: 66 },
  NEUTRAL:    { avg20d: 4.22,  win20d: 52 },
  CAUTION:    { avg20d: -1.24, win20d: 41 },
  DEFENSIVE:  { avg20d: -1.84, win20d: 43 },
};

const EXPECTED_DISTRIBUTION: Record<string, number> = {
  FULL_SEND: 15, NEUTRAL: 51, CAUTION: 24, DEFENSIVE: 10,
};

const HORIZONS = [5, 10, 20, 60];

const SETUP_BACKTEST_WIN_RATES: Record<string, number> = {
  'regime-shift': 60, 'momentum-flip': 55, 'ema-shield-caution': 50,
  'ema-shield-break': 48, 'trend-confirm': 62, 'smi-oversold-gauge': 58,
  'oversold-extreme': 65, 'dual-ll': 45, 'capitulation': 70,
  'trend-continuation': 57, 'overextended': 52, 'smi-overbought': 50,
  'trend-ride': 60, 'green-shoots': 55, 'momentum-crack': 48,
  'deep-value': 63, 'goldilocks': 65,
};

// --- Helpers ---
function fmt(n: number | null, decimals = 2): string {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  return n.toFixed(decimals);
}

function pctDiff(live: number, backtest: number): string {
  const diff = live - backtest;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}pp`;
}

function flag(live: number, backtest: number, threshold: number): string {
  return Math.abs(live - backtest) > threshold ? ' ⚠️' : ' ✅';
}

// --- Data Fetching ---
async function fetchLiveZoneData() {
  const { rows } = await pool.query(`
    SELECT date, orb_score, orb_zone, orb_zone_prev, close_price
    FROM orb_daily_indicators
    WHERE orb_zone IS NOT NULL
    ORDER BY date
  `);
  return rows.map((r: any) => ({
    date: r.date.toISOString().slice(0, 10),
    score: parseFloat(r.orb_score),
    zone: r.orb_zone as string,
    zonePrev: r.orb_zone_prev as string | null,
    price: parseFloat(r.close_price),
  }));
}

async function fetchSignalLog() {
  const { rows } = await pool.query(`
    SELECT setup_id, event_type, event_date, event_price, previous_status, new_status
    FROM orb_signal_log
    ORDER BY event_date, id
  `);
  return rows.map((r: any) => ({
    setupId: r.setup_id,
    eventType: r.event_type,
    date: r.event_date.toISOString().slice(0, 10),
    price: r.event_price ? parseFloat(r.event_price) : null,
    prevStatus: r.previous_status,
    newStatus: r.new_status,
  }));
}

async function fetchSetupSnapshots() {
  const { rows } = await pool.query(`
    SELECT setup_id, date, status, entry_price, active_day
    FROM orb_daily_snapshots
    ORDER BY date, setup_id
  `);
  return rows.map((r: any) => ({
    setupId: r.setup_id,
    date: r.date.toISOString().slice(0, 10),
    status: r.status,
    entryPrice: r.entry_price ? parseFloat(r.entry_price) : null,
    activeDay: r.active_day,
  }));
}

function fetchTSLAPrices(): Record<string, number> {
  const cmd = `python3 -c "import yfinance as yf; import json; t = yf.download('TSLA', start='2022-01-01', progress=False); prices = {idx.strftime('%Y-%m-%d'): float(row['Close'].iloc[0]) if hasattr(row['Close'], 'iloc') else float(row['Close']) for idx, row in t.iterrows()}; print(json.dumps(prices))"`;
  const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  // yfinance prints warnings to stderr; stdout has the JSON
  const lines = output.trim().split('\n');
  const jsonLine = lines[lines.length - 1];
  return JSON.parse(jsonLine);
}

// --- Analysis ---
function computeForwardReturns(
  zoneData: { date: string; zone: string; price: number }[],
  prices: Record<string, number>,
) {
  const sortedDates = Object.keys(prices).sort();

  type ZoneStats = {
    days: number;
    returns: Record<number, number[]>;
  };

  const stats: Record<string, ZoneStats> = {};
  for (const zone of Object.keys(BACKTEST_BENCHMARKS)) {
    stats[zone] = { days: 0, returns: {} };
    for (const h of HORIZONS) stats[zone].returns[h] = [];
  }

  for (const row of zoneData) {
    const zone = row.zone;
    if (!stats[zone]) continue;
    stats[zone].days++;

    const idx = sortedDates.indexOf(row.date);
    if (idx < 0) continue;

    for (const h of HORIZONS) {
      const futureIdx = idx + h;
      if (futureIdx < sortedDates.length) {
        const futureDate = sortedDates[futureIdx];
        const futurePrice = prices[futureDate];
        const entryPrice = row.price || prices[row.date];
        if (entryPrice && futurePrice) {
          const ret = ((futurePrice - entryPrice) / entryPrice) * 100;
          stats[zone].returns[h].push(ret);
        }
      }
    }
  }

  return stats;
}

function computeTransitions(
  zoneData: { date: string; zone: string; zonePrev: string | null; price: number }[],
  prices: Record<string, number>,
) {
  const sortedDates = Object.keys(prices).sort();
  const transitions: { date: string; from: string; to: string; returns: Record<number, number | null> }[] = [];

  for (const row of zoneData) {
    if (row.zonePrev && row.zonePrev !== row.zone) {
      const idx = sortedDates.indexOf(row.date);
      const entryPrice = row.price || prices[row.date];
      const rets: Record<number, number | null> = {};
      for (const h of HORIZONS) {
        const fi = idx + h;
        if (fi >= 0 && fi < sortedDates.length && entryPrice) {
          rets[h] = ((prices[sortedDates[fi]] - entryPrice) / entryPrice) * 100;
        } else {
          rets[h] = null;
        }
      }
      transitions.push({ date: row.date, from: row.zonePrev, to: row.zone, returns: rets });
    }
  }
  return transitions;
}

function avg(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function winRate(arr: number[]): number | null {
  if (arr.length === 0) return null;
  return (arr.filter(x => x > 0).length / arr.length) * 100;
}

// --- Report Generation ---
async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`\n📊 ORB SCORE EFFECTIVENESS REPORT — ${today}\n${'='.repeat(55)}\n`);

  // Fetch all data
  console.log('Fetching TSLA prices via yfinance...');
  const prices = fetchTSLAPrices();
  console.log(`  Got ${Object.keys(prices).length} trading days of price data.`);

  console.log('Fetching live zone data from Supabase...');
  const zoneData = await fetchLiveZoneData();
  console.log(`  Got ${zoneData.length} days with orb_zone populated.`);

  const signalLog = await fetchSignalLog();
  console.log(`  Got ${signalLog.length} signal log entries.`);

  const snapshots = await fetchSetupSnapshots();
  console.log(`  Got ${snapshots.length} setup snapshots.\n`);

  const insufficientData = zoneData.length < 20;
  if (insufficientData) {
    console.log(`⚠️  INSUFFICIENT DATA: Only ${zoneData.length} trading days (need 20+). Results are preliminary.\n`);
  }

  // 1. Zone Accuracy
  const zoneStats = computeForwardReturns(zoneData, prices);

  console.log('## 1. ZONE ACCURACY (vs Backtest)\n');
  const zoneReport: any[] = [];
  for (const zone of ['FULL_SEND', 'NEUTRAL', 'CAUTION', 'DEFENSIVE']) {
    const s = zoneStats[zone];
    const bench = BACKTEST_BENCHMARKS[zone];
    const avgRets: Record<number, number | null> = {};
    const winRates: Record<number, number | null> = {};
    for (const h of HORIZONS) {
      avgRets[h] = avg(s.returns[h]);
      winRates[h] = winRate(s.returns[h]);
    }

    console.log(`### ${zone} (${s.days} days)`);
    console.log(`  Horizon | Avg Return | Win Rate | N`);
    console.log(`  --------|-----------|---------|---`);
    for (const h of HORIZONS) {
      console.log(`  ${String(h).padStart(4)}D   | ${fmt(avgRets[h]).padStart(8)}% | ${fmt(winRates[h]).padStart(6)}% | ${s.returns[h].length}`);
    }
    
    const live20dAvg = avgRets[20];
    const live20dWin = winRates[20];
    if (live20dAvg !== null && live20dWin !== null) {
      console.log(`\n  vs Backtest 20D: Avg ${fmt(live20dAvg)}% vs ${bench.avg20d}% ${pctDiff(live20dAvg, bench.avg20d)}${flag(live20dAvg, bench.avg20d, 2)}`);
      console.log(`                   Win ${fmt(live20dWin)}% vs ${bench.win20d}% ${pctDiff(live20dWin, bench.win20d)}${flag(live20dWin, bench.win20d, 2)}`);
    } else {
      console.log(`\n  vs Backtest 20D: Insufficient forward data`);
    }
    console.log('');

    zoneReport.push({
      zone, days: s.days,
      avgReturns: avgRets, winRates, n: Object.fromEntries(HORIZONS.map(h => [h, s.returns[h].length])),
      backtest: bench,
    });
  }

  // 2. Zone Distribution
  console.log('## 2. ZONE DISTRIBUTION\n');
  const totalDays = zoneData.length;
  const distReport: Record<string, { actual: number; expected: number; flag: boolean }> = {};
  for (const zone of ['FULL_SEND', 'NEUTRAL', 'CAUTION', 'DEFENSIVE']) {
    const actual = totalDays > 0 ? (zoneStats[zone].days / totalDays) * 100 : 0;
    const expected = EXPECTED_DISTRIBUTION[zone];
    const flagged = Math.abs(actual - expected) > 10;
    console.log(`  ${zone.padEnd(12)} ${fmt(actual, 1).padStart(5)}% (expected ${expected}%) ${pctDiff(actual, expected)}${flagged ? ' ⚠️ DIVERGENT' : ' ✅'}`);
    distReport[zone] = { actual, expected, flag: flagged };
  }
  console.log('');

  // 3. Transitions
  console.log('## 3. ZONE TRANSITIONS\n');
  const transitions = computeTransitions(zoneData, prices);
  if (transitions.length === 0) {
    console.log('  No zone transitions recorded yet.\n');
  } else {
    console.log(`  Date       | From -> To          | 5D Ret  | 10D Ret | 20D Ret`);
    console.log(`  -----------|--------------------|---------|---------|---------`);
    for (const t of transitions) {
      console.log(`  ${t.date} | ${t.from.padEnd(10)} -> ${t.to.padEnd(10)} | ${fmt(t.returns[5]).padStart(6)}% | ${fmt(t.returns[10]).padStart(6)}% | ${fmt(t.returns[20]).padStart(6)}%`);
    }
    console.log('');
  }

  // 4. Setup Alpha Tracking
  console.log('## 4. SETUP ALPHA TRACKING\n');
  // Group snapshots by setup, find activations
  const setupActivations: Record<string, { date: string; entryPrice: number }[]> = {};
  for (const s of snapshots) {
    if (s.status === 'active' && s.activeDay === 1 && s.entryPrice) {
      if (!setupActivations[s.setupId]) setupActivations[s.setupId] = [];
      setupActivations[s.setupId].push({ date: s.date, entryPrice: s.entryPrice });
    }
  }

  // Also check signal log for activations
  for (const s of signalLog) {
    if (s.eventType === 'activated' && s.price) {
      if (!setupActivations[s.setupId]) setupActivations[s.setupId] = [];
      // Avoid duplicates
      const exists = setupActivations[s.setupId].some(a => a.date === s.date);
      if (!exists) {
        setupActivations[s.setupId].push({ date: s.date, entryPrice: s.price });
      }
    }
  }

  const sortedDates = Object.keys(prices).sort();
  const setupReport: any[] = [];

  console.log(`  Setup              | Activations | Live Win% | Backtest Win% | Δ`);
  console.log(`  -------------------|-------------|-----------|---------------|------`);

  for (const setupId of Object.keys(SETUP_BACKTEST_WIN_RATES).sort()) {
    const acts = setupActivations[setupId] || [];
    const returns20d: number[] = [];
    for (const a of acts) {
      const idx = sortedDates.indexOf(a.date);
      if (idx >= 0 && idx + 20 < sortedDates.length) {
        const fp = prices[sortedDates[idx + 20]];
        if (fp && a.entryPrice) {
          returns20d.push(((fp - a.entryPrice) / a.entryPrice) * 100);
        }
      }
    }
    const liveWin = winRate(returns20d);
    const backtestWin = SETUP_BACKTEST_WIN_RATES[setupId];
    const flagStr = liveWin !== null && Math.abs(liveWin - backtestWin) > 15 ? ' ⚠️' : (liveWin !== null ? ' ✅' : '');
    
    console.log(`  ${setupId.padEnd(19)} | ${String(acts.length).padStart(11)} | ${(liveWin !== null ? fmt(liveWin) + '%' : 'N/A').padStart(9)} | ${String(backtestWin + '%').padStart(13)} | ${liveWin !== null ? pctDiff(liveWin, backtestWin) : 'N/A'}${flagStr}`);

    setupReport.push({
      setupId, activations: acts.length, liveWinRate: liveWin, backtestWinRate: backtestWin,
      returns20d, flagged: liveWin !== null && Math.abs(liveWin - backtestWin) > 15,
    });
  }
  console.log('');

  // --- Output ---
  const outputDir = path.join(process.env.HOME!, 'clawd', 'orb', 'effectiveness');
  fs.mkdirSync(outputDir, { recursive: true });

  // JSON
  const jsonSummary = {
    reportDate: today,
    liveDays: zoneData.length,
    insufficientData,
    liveStart: zoneData[0]?.date || null,
    liveEnd: zoneData[zoneData.length - 1]?.date || null,
    zoneAccuracy: zoneReport,
    zoneDistribution: distReport,
    transitions: transitions.map(t => ({ ...t })),
    setupAlpha: setupReport.map(({ returns20d, ...rest }) => rest),
  };
  const jsonPath = path.join(outputDir, `${today}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonSummary, null, 2));
  console.log(`✅ JSON saved to ${jsonPath}`);

  // Markdown
  let md = `# Orb Score Effectiveness Report -- ${today}\n\n`;
  if (insufficientData) {
    md += `> **INSUFFICIENT DATA:** Only ${zoneData.length} trading days with live orb_zone data (need 20+). Results are preliminary.\n\n`;
  }
  md += `**Live period:** ${zoneData[0]?.date || 'N/A'} to ${zoneData[zoneData.length - 1]?.date || 'N/A'} (${zoneData.length} trading days)\n\n`;

  md += `## Zone Accuracy (vs Backtest)\n\n`;
  for (const zr of zoneReport) {
    md += `### ${zr.zone} (${zr.days} days)\n\n`;
    md += `| Horizon | Avg Return | Win Rate | N |\n|---------|-----------|---------|---|\n`;
    for (const h of HORIZONS) {
      md += `| ${h}D | ${fmt(zr.avgReturns[h])}% | ${fmt(zr.winRates[h])}% | ${zr.n[h]} |\n`;
    }
    md += `\nBacktest 20D benchmark: avg ${zr.backtest.avg20d}%, win ${zr.backtest.win20d}%\n\n`;
  }

  md += `## Zone Distribution\n\n| Zone | Actual | Expected | Delta |\n|------|--------|----------|-------|\n`;
  for (const zone of ['FULL_SEND', 'NEUTRAL', 'CAUTION', 'DEFENSIVE']) {
    const d = distReport[zone];
    md += `| ${zone} | ${fmt(d.actual, 1)}% | ${d.expected}% | ${pctDiff(d.actual, d.expected)}${d.flag ? ' ⚠️' : ''} |\n`;
  }
  md += '\n';

  md += `## Zone Transitions\n\n`;
  if (transitions.length === 0) {
    md += `No zone transitions recorded yet.\n\n`;
  } else {
    md += `| Date | From | To | 5D | 10D | 20D |\n|------|------|----|----|-----|-----|\n`;
    for (const t of transitions) {
      md += `| ${t.date} | ${t.from} | ${t.to} | ${fmt(t.returns[5])}% | ${fmt(t.returns[10])}% | ${fmt(t.returns[20])}% |\n`;
    }
    md += '\n';
  }

  md += `## Setup Alpha Tracking\n\n| Setup | Activations | Live Win% | Backtest Win% | Delta |\n|-------|-------------|-----------|---------------|-------|\n`;
  for (const sr of setupReport.sort((a, b) => a.setupId.localeCompare(b.setupId))) {
    md += `| ${sr.setupId} | ${sr.activations} | ${sr.liveWinRate !== null ? fmt(sr.liveWinRate) + '%' : 'N/A'} | ${sr.backtestWinRate}% | ${sr.liveWinRate !== null ? pctDiff(sr.liveWinRate, sr.backtestWinRate) : 'N/A'}${sr.flagged ? ' ⚠️' : ''} |\n`;
  }

  const mdPath = path.join(outputDir, `${today}.md`);
  fs.writeFileSync(mdPath, md);
  console.log(`✅ Markdown saved to ${mdPath}`);

  await pool.end();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
