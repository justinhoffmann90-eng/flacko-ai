const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rctbqtemkahdbifxrqom.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function uploadWeeklyReview() {
  const markdown = fs.readFileSync(process.argv[2] || '/Users/trunks/clawd/posts/weekly-reviews/2026-01-30-FINAL.md', 'utf-8');
  
  // Simplified extraction for this review
  const extracted_data = {
    week_start: '2026-01-26',
    week_end: '2026-01-30',
    mode: 'orange',
    mode_guidance: 'Structure stressed, controlled entries only — 10% daily cap',
    daily_cap_pct: 10,
    candle: {
      open: 435.20,
      high: 444.95,
      low: 416.51,
      close: 430.00,
      change_dollars: -5.20,
      change_pct: -1.19
    },
    monthly: {
      signal: 'yellow',
      bx_trender: { color: 'red', pattern: 'LL' },
      structure: 'Consolidating',
      ema_9_status: 'below',
      ema_21_status: 'above',
      interpretation: 'Monthly structure holding above 21 EMA'
    },
    weekly: {
      signal: 'orange',
      bx_trender: { color: 'red', pattern: 'LL' },
      structure: 'Stressed',
      ema_9_status: 'below',
      ema_13_status: 'below',
      ema_21_status: 'above',
      interpretation: 'Weekly 21 EMA held as critical support. Below 9/13 EMAs, structure damaged but not broken.'
    },
    daily: {
      signal: 'yellow',
      bx_trender: { color: 'green', pattern: 'HL' },
      structure: 'Recovering',
      ema_9_status: 'above',
      ema_21_status: 'below',
      interpretation: 'Daily attempting 21 EMA reclaim, 4H/1H green'
    },
    confluence: {
      reading: 'Monthly ✓ → Weekly ⚠️ → Daily →',
      explanation: 'Weekly structure stressed but daily showing recovery signs'
    },
    what_happened: 'Earnings week rollercoaster. Monday gave back prior week\'s rally (-3.09%). Tuesday held waiting for earnings. Wednesday\'s beat sent post-market to $445 (+3.13%). Thursday crashed -6.4% to $417 as the market "sold the news." Friday bounced +3.2% off Weekly 21 EMA support. The long lower wick shows buyers defended structure.',
    lessons: {
      what_worked: [
        'Monday: Correctly identified Hedge Wall as decision point, not entry',
        'Tuesday: Didn\'t gamble on pre-earnings direction',
        'Thursday: Defensive posture saved capital during -6.4% crash',
        'Friday: Held positions through bounce, didn\'t panic sell Thursday'
      ],
      what_didnt: [
        'Wednesday: Catalyst Override was premature. The earnings beat looked like thesis validation, but calling for 25-30% allocation before the regular session confirmed was aggressive. Thursday\'s crash would have hurt anyone who went heavy.'
      ],
      lessons_forward: [
        'Even material catalysts need regular session confirmation before expanding position size. Post-market moves can reverse. Wait for Day 1 close above key levels before increasing allocation.'
      ]
    },
    thesis: {
      status: 'intact',
      supporting_points: [
        'Q4 earnings beat',
        'Energy + Services record revenue',
        'Weekly 21 EMA held as support',
        'HIRO +1B Friday (institutions buying)'
      ],
      concerning_points: [
        'Margins pressure mentioned',
        'Auto revenue flat YoY',
        'Weekly structure damaged',
        '"Sell the news" reaction'
      ],
      narrative: 'Q4 was a beat. Robotaxi timeline unchanged. FSD is progressing. The selloff was positioning-driven (profit taking after run-up), not fundamental deterioration.'
    },
    looking_ahead: 'A daily close above $433 (Slow Zone) would clear the pause and allow small nibbles to resume. Above $440 (Key Gamma Strike) would flip gamma regime to positive and stabilize price action.',
    key_levels: [
      { price: 460, name: 'Mark Newton Resistance', emoji: '📈', description: 'Major overhead — trim zone' },
      { price: 440, name: 'Key Gamma Strike', emoji: '⚡', description: 'Above = positive gamma, stable moves' },
      { price: 437, name: 'Weekly 9 EMA', emoji: '📊', description: 'First reclaim target' },
      { price: 433, name: 'Slow Zone (Daily 21 EMA)', emoji: '⏸️', description: 'KEY — close above clears pause' },
      { price: 424, name: 'Weekly 21 EMA', emoji: '🛡️', description: 'Must hold — structure support' },
      { price: 400, name: 'Put Wall', emoji: '🛡️', description: 'Major support floor' },
      { price: 380, name: 'Master Eject', emoji: '❌', description: 'Exit all if breached' }
    ],
    scenarios: [
      { type: 'bull', probability: 30, trigger: 'Reclaims $433, tests $440+', response: 'Slow Zone cleared — nibbles resume at 10%/day' },
      { type: 'base', probability: 50, trigger: 'Chops $424-437, builds base', response: 'Stay patient, no new buys, let structure repair' },
      { type: 'bear', probability: 20, trigger: 'Loses $424, retests $410-416', response: 'Full defensive, prepare for $400 test' }
    ],
    gamma_shifts: {
      call_wall: { start: 500, end: 500 },
      gamma_strike: { start: 440, end: 440 },
      hedge_wall: { start: 435, end: 435 },
      put_wall: { start: 400, end: 400 },
      interpretation: 'Below Key Gamma Strike ($440) all week = negative gamma territory. Moves amplified in both directions.'
    }
  };

  console.log('Uploading weekly review for', extracted_data.week_start, 'to', extracted_data.week_end);

  const { data, error } = await supabase
    .from('weekly_reviews')
    .upsert({
      week_start: extracted_data.week_start,
      week_end: extracted_data.week_end,
      raw_markdown: markdown,
      extracted_data,
      parser_version: '1.0.0',
      parser_warnings: [],
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'week_start,week_end',
    })
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Weekly review uploaded successfully!');
  console.log('ID:', data.id);
}

uploadWeeklyReview().catch(console.error);
