import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read env
const envRaw = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l=>l.includes('=')).map(l=>l.split('=').map(s=>s.trim())));

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: trades, error: e1 } = await sb.from('paper_trades').select('*').order('created_at', {ascending: false}).limit(3);
const { data: state, error: e2 } = await sb.from('bot_state').select('*').limit(1);
const { data: logs, error: e3 } = await sb.from('bot_logs').select('*').order('created_at', {ascending: false}).limit(5);

console.log('LAST TRADES:', e1?.message || JSON.stringify(trades, null, 2));
console.log('STATE:', e2?.message || JSON.stringify(state, null, 2));
console.log('LOGS:', e3?.message || JSON.stringify(logs, null, 2));
