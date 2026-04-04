import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { evaluateAllSetups, suggestMode } from './lib/orb/evaluate-setups';

type OhlcvRow = {
  bar_date: string; open: number; high: number; low: number; close: number; volume: number;
  rsi: number | null; bxt: number | null; bxt_state: string | null;
  ema_9: number | null; ema_13: number | null; ema_21: number | null; sma_200: number | null;
};
type BxtState = 'HH'|'LH'|'HL'|'LL';
const env = Object.fromEntries(
  fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(Boolean).filter(l=>!l.startsWith('#')).map(l=>{const i=l.indexOf('='); return [l.slice(0,i), l.slice(i+1).replace(/^['"]|['"]$/g,'')]})
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
function toNumber(value: unknown): number | null { if (typeof value==='number' && Number.isFinite(value)) return value; if (typeof value==='string'&&value.trim()) { const p=Number(value); return Number.isFinite(p)?p:null; } return null; }
function normalizeBxtState(value: string | null): BxtState | null { if (!value) return null; const u=value.toUpperCase(); return (u==='HH'||u==='LH'||u==='HL'||u==='LL') ? u as BxtState : null; }
function deriveBxtState(curr:number, prev:number, prevState:BxtState): BxtState { const currentHigh = curr>prev; const previousWasHigh=prevState[0]==='H'; if (currentHigh&&previousWasHigh) return 'HH'; if (!currentHigh&&previousWasHigh) return 'LH'; if (currentHigh&&!previousWasHigh) return 'HL'; return 'LL'; }
function inferBxtStates(values:number[]): BxtState[] { const states = new Array(values.length).fill('LL') as BxtState[]; let first=-1; for(let i=0;i<values.length;i++){ if(Number.isFinite(values[i])){first=i; break;}} if(first<0) return states; states[first]=values[first]>0?'HH':'LL'; for(let i=first+1;i<values.length;i++){ if(!Number.isFinite(values[i])) { states[i]=states[i-1]; continue; } const prev=Number.isFinite(values[i-1])?values[i-1]:values[i]; states[i]=deriveBxtState(values[i],prev,states[i-1]); } return states; }
function ema(values:number[], period:number):number[]{ if(values.length<period) return new Array(values.length).fill(Number.NaN); const k=2/(period+1); const result=new Array(values.length).fill(Number.NaN); let sum=0; for(let i=0;i<period;i++) sum+=values[i]; result[period-1]=sum/period; for(let i=period;i<values.length;i++) result[i]=values[i]*k+result[i-1]*(1-k); return result; }
function highest(values:number[], period:number){ const result=new Array(values.length).fill(Number.NaN); for(let i=period-1;i<values.length;i++){ let max=-Infinity; for(let j=i-period+1;j<=i;j++) if(values[j]>max) max=values[j]; result[i]=max; } return result; }
function lowest(values:number[], period:number){ const result=new Array(values.length).fill(Number.NaN); for(let i=period-1;i<values.length;i++){ let min=Infinity; for(let j=i-period+1;j<=i;j++) if(values[j]<min) min=values[j]; result[i]=min; } return result; }
function computeSmi(highs:number[], lows:number[], closes:number[], kPeriod=10, dPeriod=3, emaPeriod=3){ const upper=highest(highs,kPeriod), lower=lowest(lows,kPeriod); const midpointDiff=closes.map((close,index)=>!Number.isFinite(upper[index])||!Number.isFinite(lower[index])?Number.NaN:close-(upper[index]+lower[index])/2); const fullRange=highs.map((_,index)=>!Number.isFinite(upper[index])||!Number.isFinite(lower[index])?Number.NaN:upper[index]-lower[index]); const diffSmooth1=ema(midpointDiff.map(v=>Number.isFinite(v)?v:0),dPeriod); const diffSmooth2=ema(diffSmooth1.map(v=>Number.isFinite(v)?v:0),emaPeriod); const rangeSmooth1=ema(fullRange.map(v=>Number.isFinite(v)?v:0),dPeriod); const rangeSmooth2=ema(rangeSmooth1.map(v=>Number.isFinite(v)?v:0),emaPeriod); const smiValues=new Array(closes.length).fill(Number.NaN); for(let i=0;i<closes.length;i++){ if(!Number.isFinite(diffSmooth2[i])||!Number.isFinite(rangeSmooth2[i])) continue; smiValues[i]=Math.abs(rangeSmooth2[i])<1e-10?0:(diffSmooth2[i]/(rangeSmooth2[i]/2))*100; } const signal=ema(smiValues.map(v=>Number.isFinite(v)?v:0),emaPeriod); return {smi:smiValues, signal}; }
async function fetchRows(ticker:string, timeframe:'daily'|'weekly', limit:number){ let offset=0; const pageSize=1000; const rows:OhlcvRow[]=[]; while(offset<limit){ const end=Math.min(offset+pageSize-1, limit-1); const {data,error}=await supabase.from('ohlcv_bars').select('bar_date, open, high, low, close, volume, rsi, bxt, bxt_state, ema_9, ema_13, ema_21, sma_200').eq('ticker',ticker).eq('timeframe',timeframe).lte('bar_date','2026-04-04').order('bar_date',{ascending:false}).range(offset,end); if(error) throw error; if(!data||data.length===0) break; rows.push(...data as any); if(data.length<pageSize) break; offset+=pageSize; } return rows.reverse() as OhlcvRow[]; }

async function audit(ticker:string){
  const [dailyRows,weeklyRows,vixDailyRows,vixWeeklyRows, stateRes] = await Promise.all([
    fetchRows(ticker,'daily',450), fetchRows(ticker,'weekly',150), fetchRows('^VIX','daily',120), fetchRows('^VIX','weekly',30),
    supabase.from('orb_setup_states').select('setup_id,status,active_since,active_day,entry_price,gauge_entry_value').eq('ticker', ticker)
  ]);
  const prevMap = new Map(((stateRes.data as any[]) || []).map((row) => [row.setup_id, {
    setup_id: row.setup_id,
    status: row.status,
    active_since: row.active_since ?? undefined,
    active_day: row.active_day ?? undefined,
    entry_price: row.entry_price ?? undefined,
    gauge_entry_value: row.gauge_entry_value ?? undefined,
  }]));
  const latest=dailyRows[dailyRows.length-1], prev=dailyRows[dailyRows.length-2], prev3=dailyRows[Math.max(0,dailyRows.length-4)];
  const weeklyLatest=weeklyRows[weeklyRows.length-1], weeklyPrev=weeklyRows[weeklyRows.length-2];
  const closes=dailyRows.map(r=>r.close), highs=dailyRows.map(r=>r.high), lows=dailyRows.map(r=>r.low), volumes=dailyRows.map(r=>r.volume);
  const smiResult=computeSmi(highs,lows,closes);
  const dailyBxtSeries=dailyRows.map(r=>toNumber(r.bxt)??Number.NaN), dailyInferredStates=inferBxtStates(dailyBxtSeries);
  const weeklyBxtSeries=weeklyRows.map(r=>toNumber(r.bxt)??Number.NaN), weeklyInferredStates=inferBxtStates(weeklyBxtSeries);
  let dailyHhStreak=0; for(let i=dailyRows.length-1;i>=0;i--){ const state=normalizeBxtState(dailyRows[i].bxt_state) ?? dailyInferredStates[i] ?? 'LL'; if(state==='HH') dailyHhStreak++; else break; }
  let daysBelowEma9=0; for(let i=dailyRows.length-1;i>=0;i--){ const e=toNumber(dailyRows[i].ema_9); if(e==null) break; if(dailyRows[i].close<e) daysBelowEma9++; else break; }
  const ema9=toNumber(latest.ema_9)!; const ema9FiveDaysAgo=toNumber(dailyRows[Math.max(0,dailyRows.length-6)]?.ema_9); const ema9Slope5d=ema9FiveDaysAgo!=null&&ema9FiveDaysAgo!==0?((ema9-ema9FiveDaysAgo)/ema9FiveDaysAgo)*100:0;
  let wasFullBull5d=false; for(let i=Math.max(0,dailyRows.length-5);i<dailyRows.length;i++){ const bar=dailyRows[i]; const e9=toNumber(bar.ema_9); const e21=toNumber(bar.ema_21); if(e9==null||e21==null) continue; if(bar.close>e9&&e9>e21){ wasFullBull5d=true; break; } }
  const ind:any={
    date: latest.bar_date,
    close: latest.close,
    open: latest.open,
    volume: latest.volume,
    volumes: volumes.slice(-30),
    vix_close: toNumber(vixDailyRows[vixDailyRows.length-1]?.close) ?? 0,
    vix_weekly_change_pct: (()=>{ const lv=toNumber(vixWeeklyRows[vixWeeklyRows.length-1]?.close); const pv=toNumber(vixWeeklyRows[vixWeeklyRows.length-2]?.close); return lv!=null&&pv!=null&&pv!==0?((lv-pv)/pv)*100:0; })(),
    bx_daily: toNumber(latest.bxt)!, bx_daily_prev: toNumber(prev?.bxt)!,
    bx_daily_state: normalizeBxtState(latest.bxt_state) ?? dailyInferredStates[dailyRows.length-1] ?? 'LL',
    bx_daily_state_prev: normalizeBxtState(prev?.bxt_state ?? null) ?? dailyInferredStates[dailyRows.length-2] ?? 'LL',
    bx_weekly: toNumber(weeklyLatest.bxt)!, bx_weekly_prev: toNumber(weeklyPrev?.bxt)!,
    bx_weekly_state: normalizeBxtState(weeklyLatest.bxt_state) ?? weeklyInferredStates[weeklyRows.length-1] ?? 'LL',
    bx_weekly_state_prev: normalizeBxtState(weeklyPrev?.bxt_state ?? null) ?? weeklyInferredStates[weeklyRows.length-2] ?? 'LL',
    bx_weekly_transition: ((normalizeBxtState(weeklyPrev?.bxt_state ?? null) ?? weeklyInferredStates[weeklyRows.length-2]) !== (normalizeBxtState(weeklyLatest.bxt_state) ?? weeklyInferredStates[weeklyRows.length-1])) ? `${normalizeBxtState(weeklyPrev?.bxt_state ?? null) ?? weeklyInferredStates[weeklyRows.length-2]}_to_${normalizeBxtState(weeklyLatest.bxt_state) ?? weeklyInferredStates[weeklyRows.length-1]}` : null,
    rsi: toNumber(latest.rsi)!, rsi_prev: toNumber(prev?.rsi)!, rsi_change_3d: toNumber(latest.rsi)! - (toNumber(prev3?.rsi) ?? toNumber(prev?.rsi)!),
    smi: smiResult.smi[smiResult.smi.length-1], smi_signal: smiResult.signal[smiResult.signal.length-1],
    smi_prev: smiResult.smi[smiResult.smi.length-2], smi_signal_prev: smiResult.signal[smiResult.signal.length-2], smi_change_3d: smiResult.smi[smiResult.smi.length-1]-smiResult.smi[Math.max(0,smiResult.smi.length-4)],
    smi_bull_cross: smiResult.smi[smiResult.smi.length-2] <= smiResult.signal[smiResult.signal.length-2] && smiResult.smi[smiResult.smi.length-1] > smiResult.signal[smiResult.signal.length-1],
    smi_bear_cross: smiResult.smi[smiResult.smi.length-2] >= smiResult.signal[smiResult.signal.length-2] && smiResult.smi[smiResult.smi.length-1] < smiResult.signal[smiResult.signal.length-1],
    ema9: toNumber(latest.ema_9)!, ema21: toNumber(latest.ema_21)!, sma200: toNumber(latest.sma_200)!,
    sma200_dist: ((latest.close - toNumber(latest.sma_200)!)/toNumber(latest.sma_200)!)*100,
    price_vs_ema9: ((latest.close - toNumber(latest.ema_9)!)/toNumber(latest.ema_9)!)*100,
    price_vs_ema21: ((latest.close - toNumber(latest.ema_21)!)/toNumber(latest.ema_21)!)*100,
    consecutive_down: 0, consecutive_up: 0, stabilization_days: 0,
    weekly_ema9: toNumber(weeklyLatest.ema_9)!, weekly_ema13: toNumber(weeklyLatest.ema_13)!, weekly_ema21: toNumber(weeklyLatest.ema_21)!,
    weekly_emas_stacked: toNumber(weeklyLatest.ema_9)! > toNumber(weeklyLatest.ema_13)! && toNumber(weeklyLatest.ema_13)! > toNumber(weeklyLatest.ema_21)!,
    price_above_weekly_all: latest.close > toNumber(weeklyLatest.ema_9)! && latest.close > toNumber(weeklyLatest.ema_13)! && latest.close > toNumber(weeklyLatest.ema_21)!,
    price_above_weekly_13: latest.close > toNumber(weeklyLatest.ema_13)!,
    price_above_weekly_21: latest.close > toNumber(weeklyLatest.ema_21)!,
    daily_hh_streak: dailyHhStreak, ema9_slope_5d: ema9Slope5d, days_below_ema9: daysBelowEma9, was_full_bull_5d: wasFullBull5d, bx_weekly_consec_ll: 0,
  };
  const setups=evaluateAllSetups(ind, prevMap as any);
  const active=setups.filter(s=>s.is_active).map(s=>({id:s.setup_id, reason:s.reason}));
  const watching=setups.filter(s=>s.is_watching).map(s=>({id:s.setup_id, reason:s.reason}));
  console.log(JSON.stringify({ticker, prev_state_keys:[...prevMap.keys()], mode:suggestMode(ind, setups.filter(s=>s.is_active)), key:{close:ind.close, smi:ind.smi, bx_daily_state:ind.bx_daily_state, bx_weekly_state:ind.bx_weekly_state, sma200_dist:ind.sma200_dist, days_below_ema9:ind.days_below_ema9, ema9_slope_5d:ind.ema9_slope_5d, was_full_bull_5d:ind.was_full_bull_5d}, active, watching}, null, 2));
}

async function main() {
  await audit('QQQ');
  await audit('NVDA');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
