/**
 * Seed the orb_setup_pipeline table with all 18 active setups
 * plus 5 weekly BXT variations.
 *
 * Run: npx tsx scripts/seed-orb-pipeline.ts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency)
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const setups = [
  // ─── 18 Live Active Setups ────────────────────────────────────────────────
  {
    id: "smi-oversold-gauge",
    name: "SMI Oversold Gauge",
    type: "buy",
    status: "active",
    one_liner: "SMI crosses below -60, tracks recovery to +30",
    hypothesis: "When SMI crosses below -60, momentum is deeply oversold. Historically price recovers significantly by the time SMI reverses to +30.",
    category_tags: ["Oversold", "Momentum"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
  },
  {
    id: "oversold-extreme",
    name: "Oversold Extreme",
    type: "buy",
    status: "active",
    one_liner: "Price >40% below 200 SMA + stabilization — generational entry",
    hypothesis: "When price falls more than 40% below the 200 SMA and shows 2+ days of stabilization, downside momentum is exhausted. Historically produces outsized forward returns.",
    category_tags: ["Oversold", "Value"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A+",
  },
  {
    id: "regime-shift",
    name: "Regime Shift",
    type: "buy",
    status: "active",
    one_liner: "Weekly BXT LL→HL transition + above W13 + 3d daily HH streak",
    hypothesis: "When weekly BXT shifts from lower-lows to higher-lows AND price reclaims the weekly 13 EMA AND daily BXT has 3+ consecutive HH bars, the trend regime is flipping from bearish to bullish.",
    category_tags: ["Trend", "Regime"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
  },
  {
    id: "deep-value",
    name: "Deep Value",
    type: "buy",
    status: "active",
    one_liner: "200 SMA distance -10% to -20% + daily BX Higher Low",
    hypothesis: "Price in the deep value zone (10-20% below 200 SMA) with daily BXT posting a higher low signals the correction is exhausting with price at a historically attractive level.",
    category_tags: ["Value", "Recovery"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "B+",
  },
  {
    id: "green-shoots",
    name: "Green Shoots",
    type: "buy",
    status: "active",
    one_liner: "Daily BX flips LL→HL while below 200 SMA",
    hypothesis: "The first daily BXT higher low while price remains below the 200 SMA is an early sign that selling pressure is decelerating. An early entry into a potential recovery.",
    category_tags: ["Recovery", "Early Signal"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "B",
  },
  {
    id: "momentum-flip",
    name: "Momentum Flip",
    type: "buy",
    status: "active",
    one_liner: "Daily BX flips HL→HH + RSI < 55 (room to run)",
    hypothesis: "When daily BXT transitions from higher-low to higher-high AND RSI is below 55, momentum has flipped bullish without being overbought — conditions for a sustained move up.",
    category_tags: ["Momentum", "Trend"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
  },
  {
    id: "trend-confirm",
    name: "Trend Confirmation",
    type: "buy",
    status: "active",
    one_liner: "SMI bull cross + daily BX in HH",
    hypothesis: "When SMI crosses bullishly AND daily BXT is in higher-highs, both momentum indicators confirm an uptrend. Higher conviction buy signal.",
    category_tags: ["Confirmation", "Momentum"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
  },
  {
    id: "trend-ride",
    name: "Trend Ride",
    type: "buy",
    status: "active",
    one_liner: "BX HH + D9>D21 + above D21 + above W21",
    hypothesis: "Full bullish alignment: daily BXT making higher highs, daily 9 EMA above 21 EMA, price above both daily and weekly 21 EMAs. Ride the trend with conviction.",
    category_tags: ["Trend", "Continuation"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
  },
  {
    id: "trend-continuation",
    name: "Trend Continuation",
    type: "buy",
    status: "active",
    one_liner: "Weekly EMAs stacked + above all + daily BX HH",
    hypothesis: "When weekly EMAs are in full bullish stack (9>13>21) AND price is above all of them AND daily BXT is in HH — the trend is intact at every timeframe. Strongest continuation signal.",
    category_tags: ["Trend", "Continuation"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A+",
  },
  {
    id: "goldilocks",
    name: "Goldilocks",
    type: "buy",
    status: "active",
    one_liner: "RSI 45-65 + SMI 0-40 + daily BX HH — not too hot, not too cold",
    hypothesis: "When all three conditions are in the 'just right' zone — RSI not overbought, SMI positive but not extreme, BXT in higher highs — conditions are optimal for entering or adding to longs.",
    category_tags: ["Optimal Entry", "Momentum"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
  },
  {
    id: "capitulation",
    name: "Capitulation Bounce",
    type: "buy",
    status: "active",
    one_liner: "4+ consecutive down days + RSI < 40",
    hypothesis: "After 4 or more consecutive down days with RSI below 40, short-term selling is exhausted. A bounce is historically likely as oversold conditions get unwound.",
    category_tags: ["Oversold", "Bounce"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "B+",
  },
  {
    id: "vix-spike-reversal",
    name: "VIX Spike Reversal",
    type: "buy",
    status: "active",
    one_liner: "VIX spikes 30%+ in a week — 5-day reversal window",
    hypothesis: "When VIX surges 30%+ in a single week, fear is peaking. Historically, equity prices recover strongly over the next 5 trading days as volatility mean-reverts.",
    category_tags: ["VIX", "Fear", "Reversal"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
  },
  {
    id: "smi-overbought",
    name: "SMI Overbought",
    type: "avoid",
    status: "active",
    one_liner: "SMI crosses above +75 — avoid adding, wait for reset to -30",
    hypothesis: "When SMI crosses above +75, momentum is at an extreme. Adding new longs here risks being caught in a mean-reversion. Wait for SMI to reset to -30 before re-entering.",
    category_tags: ["Overbought", "Caution"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
  },
  {
    id: "dual-ll",
    name: "Dual LL (Double Downtrend)",
    type: "avoid",
    status: "active",
    one_liner: "Daily BX LL + Weekly BX LL — full bearish alignment",
    hypothesis: "When both daily and weekly BXT are making lower lows, the downtrend is confirmed at multiple timeframes. Avoid new longs until at least one timeframe posts a higher low.",
    category_tags: ["Downtrend", "Avoid"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A+",
  },
  {
    id: "overextended",
    name: "Overextended",
    type: "avoid",
    status: "active",
    one_liner: "Price >25% above 200 SMA — trim territory",
    hypothesis: "When price is more than 25% above the 200 SMA, it is historically overextended. Risk/reward for new longs is poor. Consider trimming existing positions.",
    category_tags: ["Overbought", "Extended"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
  },
  {
    id: "momentum-crack",
    name: "Momentum Crack",
    type: "avoid",
    status: "active",
    one_liner: "SMI was >50, dropped 10+ pts in 3 days — momentum breaking",
    hypothesis: "When SMI was elevated above 50 and drops more than 10 points in 3 days, momentum is cracking from strength. Avoid adding until the selling pressure stabilizes.",
    category_tags: ["Momentum", "Deterioration"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
  },
  {
    id: "ema-shield-caution",
    name: "EMA Shield Caution",
    type: "avoid",
    status: "active",
    one_liner: "3+ days below D9 EMA with slope -2%+ and was recently bullish",
    hypothesis: "After a period of bullish EMA alignment, when price spends 3+ days below the daily 9 EMA and the EMA itself is declining >2%, the short-term trend support is cracking. Don't add new calls.",
    category_tags: ["Caution", "Trend"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "B+",
    sample_size: 33,
    win_rate_20d: 0.485,
    forward_returns: { "5d": 0.79, "10d": -0.16, "20d": -1.73, "60d": 10.47 },
  },
  {
    id: "ema-shield-break",
    name: "EMA Shield Break",
    type: "avoid",
    status: "active",
    one_liner: "5+ days below D9 EMA with slope -2%+ — reduce call exposure",
    hypothesis: "Full shield break: price has spent a full week below the daily 9 EMA with the EMA declining. Strongest EMA caution signal. Actively reduce call positions until the shield is reclaimed.",
    category_tags: ["Caution", "Exhaustion"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
    sample_size: 31,
    win_rate_20d: 0.419,
    forward_returns: { "5d": -1.84, "10d": -1.65, "20d": -2.93, "60d": 6.41 },
  },

  // ─── 5 Weekly BXT Variations ──────────────────────────────────────────────
  {
    id: "weekly-bxt-base",
    name: "Weekly BXT Extended Negative → First HL (Base)",
    type: "buy",
    status: "active",
    one_liner: "Weekly BXT negative 8+ weeks then first higher low — deceleration of selling",
    hypothesis: "When weekly BXT has been negative for 8+ consecutive weeks and prints its first higher low, selling is decelerating. The edge is in catching deceleration, not waiting for confirmed buying.",
    category_tags: ["Weekly", "BXT", "Reversal"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
    sample_size: 22,
    win_rate_20d: 0.73,
    forward_returns: { "1wk": 0.7, "2wk": 2.8, "4wk": 5.9, "8wk": 7.0, "13wk": 8.7 },
    backtest_stats: { "1wk": { win_rate: 0.59, avg: 0.7, n: 22 }, "4wk": { win_rate: 0.73, avg: 5.9, n: 22 }, "8wk": { win_rate: 0.73, avg: 7.0, n: 22 }, "13wk": { win_rate: 0.68, avg: 8.7, n: 22 } },
  },
  {
    id: "weekly-bxt-rsi50",
    name: "Weekly BXT + RSI < 50",
    type: "buy",
    status: "active",
    one_liner: "Weekly BXT base setup + weekly RSI below 50 — best filter",
    hypothesis: "Adding the RSI < 50 filter to the weekly BXT base setup removes 4 instances where RSI was already elevated (>50), improving win rate to 83% at 8wk. RSI below 50 means more room to run.",
    category_tags: ["Weekly", "BXT", "RSI", "Filtered"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
    sample_size: 18,
    win_rate_20d: 0.78,
    forward_returns: { "4wk": 7.9, "8wk": 10.4, "13wk": 14.6 },
    backtest_stats: { "4wk": { win_rate: 0.78, avg: 7.9, n: 18 }, "8wk": { win_rate: 0.83, avg: 10.4, n: 18 }, "13wk": { win_rate: 0.83, avg: 14.6, n: 18 } },
    notes: "Excludes: 2018-10-19 (RSI 52), 2019-02-22 (50.5), 2023-09-29 (56.5), 2023-11-10 (50.4)",
  },
  {
    id: "weekly-bxt-below-w21",
    name: "Weekly BXT + Below Weekly 21 EMA",
    type: "buy",
    status: "active",
    one_liner: "Weekly BXT base setup + price below the weekly 21 EMA",
    hypothesis: "When the base BXT setup fires while price is still below the weekly 21 EMA, the stock hasn't recovered yet — giving more upside runway. 79% win rate at 8wk.",
    category_tags: ["Weekly", "BXT", "EMA", "Filtered"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A",
    sample_size: 19,
    win_rate_20d: 0.79,
    forward_returns: { "4wk": 7.9, "8wk": 9.7, "13wk": 13.1 },
    backtest_stats: { "4wk": { win_rate: 0.79, avg: 7.9, n: 19 }, "8wk": { win_rate: 0.79, avg: 9.7, n: 19 }, "13wk": { win_rate: 0.79, avg: 13.1, n: 19 } },
  },
  {
    id: "weekly-bxt-10wk",
    name: "Weekly BXT 10+ Week Streaks",
    type: "buy",
    status: "active",
    one_liner: "Weekly BXT negative 10+ consecutive weeks then first HL",
    hypothesis: "Extended streaks of 10+ weeks of BXT lower-lows represent the most extreme selling. First HL after these historically long streaks produces strong forward returns.",
    category_tags: ["Weekly", "BXT", "Extended"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A-",
    sample_size: 19,
    win_rate_20d: 0.74,
    forward_returns: { "4wk": 6.4, "8wk": 7.0, "13wk": 9.8 },
    backtest_stats: { "4wk": { win_rate: 0.74, avg: 6.4, n: 19 }, "8wk": { win_rate: 0.74, avg: 7.0, n: 19 }, "13wk": { win_rate: 0.74, avg: 9.8, n: 19 } },
    notes: "⚠️ Earlier version incorrectly showed n=14, 86% — was a code bug. Corrected n=19, 74%.",
  },
  {
    id: "weekly-bxt-trough-hl",
    name: "Weekly BXT Trough Higher Than Prior Trough",
    type: "buy",
    status: "active",
    one_liner: "Weekly BXT base setup + current cycle trough is higher than prior cycle trough",
    hypothesis: "When the weekly BXT recovery fires AND the current trough is higher than the prior cycle's trough, it signals diminishing bearish momentum. Strongest variation: 91% win rate at 8wk.",
    category_tags: ["Weekly", "BXT", "Divergence"],
    tickers: ["TSLA"],
    source: "manual",
    grade: "A+",
    sample_size: 11,
    win_rate_20d: 0.91,
    forward_returns: { "8wk": 11.4, "13wk": 14.2 },
    backtest_stats: { "8wk": { win_rate: 0.91, avg: 11.4, n: 11 }, "13wk": { win_rate: 0.91, avg: 14.2, n: 11 } },
    notes: "NOT ACTIVE as of 2026-03-12: current trough (-43.06) is LOWER than prior cycle trough (-25.66 on 2025-11-17).",
  },
];

async function seed() {
  console.log(`Seeding ${setups.length} setups into orb_setup_pipeline...`);

  const { error } = await supabase
    .from("orb_setup_pipeline")
    .upsert(setups, { onConflict: "id" });

  if (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${setups.length} setups successfully`);

  // Verify
  const { data, error: countError } = await supabase
    .from("orb_setup_pipeline")
    .select("id, name, status, type")
    .order("status")
    .order("name");

  if (countError) {
    console.error("Verify failed:", countError.message);
  } else {
    console.log(`\n📋 Pipeline contents (${data?.length} total):`);
    data?.forEach((s) => console.log(`  [${s.status.toUpperCase()}] [${s.type}] ${s.name}`));
  }
}

seed();
