import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const envRaw = readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.from('paper_bot_state').select('*').eq('id', 1).single();
console.log('BOT STATE:', error?.message || JSON.stringify(data, null, 2));
