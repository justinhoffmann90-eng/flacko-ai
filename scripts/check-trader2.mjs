import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envRaw = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}));

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Find what tables actually exist
const { data: tables } = await sb.from('information_schema.tables').select('table_name').eq('table_schema','public');
console.log('TABLES:', tables?.map(t=>t.table_name).join(', '));

// Try paper_trades with correct columns
const { data: trades, error: e1 } = await sb.from('paper_trades').select('*').order('timestamp', {ascending: false}).limit(3);
console.log('TRADES:', e1?.message || JSON.stringify(trades?.slice(0,2), null, 2));
