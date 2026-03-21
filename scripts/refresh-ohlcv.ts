import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const env = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim()!;
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim()!;
const sb = createClient(url, key);

const tickers = ["TSLA","QQQ","SPY","NVDA","AAPL","AMZN","MU","GOOGL","BABA","^VIX"];

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchYahoo(symbol: string, period1: string, period2: string) {
  const p1 = Math.floor(new Date(period1).getTime() / 1000);
  const p2 = Math.floor(new Date(period2).getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${p1}&period2=${p2}&interval=1d`;
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (res.status === 429) {
      const wait = (attempt + 1) * 15000;
      console.log(`  Rate limited on ${symbol}, waiting ${wait/1000}s...`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`Yahoo ${res.status} for ${symbol}`);
    return await res.json();
  }
  throw new Error(`Max retries for ${symbol}`);
}

async function main() {
  for (const ticker of tickers) {
    console.log(`\n📥 ${ticker}...`);
    
    // Get latest bar date
    const { data: latest } = await sb.from("ohlcv_bars")
      .select("bar_date")
      .eq("ticker", ticker)
      .eq("timeframe", "daily")
      .order("bar_date", { ascending: false })
      .limit(1);
    
    const latestDate = latest?.[0]?.bar_date ?? "2026-03-01";
    console.log(`  Latest: ${latestDate}`);
    
    // Fetch from day after latest to today
    const startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    
    if (startDate >= endDate) {
      console.log(`  ✅ Already up to date`);
      continue;
    }
    
    try {
      const data = await fetchYahoo(ticker, startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]);
      const result = data?.chart?.result?.[0];
      if (!result?.timestamp) {
        console.log(`  ⚠ No new data`);
        continue;
      }
      
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      const adjClose = result.indicators?.adjclose?.[0]?.adjclose;
      
      const rows: any[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000).toISOString().split("T")[0];
        const o = quotes.open?.[i];
        const h = quotes.high?.[i];
        const l = quotes.low?.[i];
        const c = adjClose?.[i] ?? quotes.close?.[i];
        const v = quotes.volume?.[i];
        
        if (!o || !h || !l || !c || o <= 0 || c <= 0) continue;
        
        rows.push({
          ticker,
          bar_date: date,
          timeframe: "daily",
          open: Math.round(o * 100) / 100,
          high: Math.round(h * 100) / 100,
          low: Math.round(l * 100) / 100,
          close: Math.round(c * 100) / 100,
          volume: v ?? 0,
        });
      }
      
      // Deduplicate by ticker+bar_date+timeframe — Yahoo can return duplicate timestamps
      // which causes "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const deduped = Object.values(
        rows.reduce((acc: Record<string, any>, row) => {
          const key = `${row.ticker}|${row.bar_date}|${row.timeframe}`;
          acc[key] = row; // last write wins
          return acc;
        }, {})
      );

      if (deduped.length > 0) {
        const { error } = await sb.from("ohlcv_bars").upsert(deduped, { onConflict: "ticker,bar_date,timeframe" });
        if (error) {
          console.log(`  ❌ Upsert error: ${error.message}`);
        } else {
          console.log(`  ✅ Inserted ${deduped.length} bars (${deduped[0].bar_date} → ${deduped[deduped.length-1].bar_date})`);
        }
      } else {
        console.log(`  ⚠ No valid bars to insert`);
      }
    } catch (e: any) {
      console.log(`  ❌ ${e.message}`);
    }
    
    // Be nice to Yahoo
    await sleep(3000);
  }
  
  console.log("\n✅ Done");
}

main();
