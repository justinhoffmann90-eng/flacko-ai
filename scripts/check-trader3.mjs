import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envRaw = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: all_trades } = await sb.from('paper_trades').select('timestamp,action,instrument,price,reasoning,mode').order('timestamp', {ascending: false}).limit(10);
console.log('ALL RECENT TRADES:\n', all_trades?.map(t=>`${t.timestamp} | ${t.action} ${t.instrument} @ ${t.price} | mode:${t.mode} | ${t.reasoning?.slice(0,60)}`).join('\n'));

const { data: tables } = await sb.rpc('get_tables').catch(()=>({data:null}));
const { data: tbls } = await sb.from('information_schema.tables').select('table_name').eq('table_schema','public');
console.log('\nALL TABLES:', tbls?.map(t=>t.table_name).join(', '));
