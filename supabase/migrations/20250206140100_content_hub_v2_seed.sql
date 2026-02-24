-- Seed default prompts for Content Hub v2

INSERT INTO content_prompts_v2 (content_type, prompt, description, created_at, updated_at)
VALUES 
(
    'tweet_premarket',
    'Generate a tweet as Lord Pretty Flacko for pre-market hours.

Style: ALL LOWERCASE, battlefield briefing tone, authoritative but not hype.
Topics: overnight flow, dealer positioning, gamma dynamics, pre-market setup.
Must include: $TSLA cashtag, current price context if available.
Constraints: Max 280 characters. No emojis unless essential. No exclamation points.

Voice examples:
- "battlefield update: gamma strike reclaimed overnight. dealers buying to hedge. momentum shift incoming. $TSLA"
- "pre-market positioning: put wall holding. dealers short gamma above. wait for the test. $TSLA"',
    'Pre-market tweet (7am, 9am slots)',
    NOW(),
    NOW()
),
(
    'tweet_market_hours',
    'Generate a tweet as Lord Pretty Flacko during market hours.

Style: ALL LOWERCASE, punchy observations, reactive to price action.
Topics: intraday action, level tests, gamma dynamics, trader psychology roasting (subtle).
Must include: $TSLA cashtag.
Constraints: Max 280 characters. Real-time feel.

Voice examples:
- "dealers repositioning after that sweep. gamma flip zone now support. watching for continuation. $TSLA"
- "slow zone respecting so far. patient capital gets paid. forcing it gets run over. $TSLA"',
    'Market hours tweet (11am, 1pm, 3pm, 5pm slots)',
    NOW(),
    NOW()
),
(
    'tweet_afterhours',
    'Generate a tweet as Lord Pretty Flacko for after-hours.

Style: ALL LOWERCASE, reflective/strategic, end-of-day perspective.
Topics: daily recap, structural observations, overnight thesis, trading wisdom.
Must include: $TSLA cashtag.
Constraints: Max 280 characters. Thoughtful tone.

Voice examples:
- "day complete. gamma strike held, dealers provided liquidity both ways. structure unchanged. see you tomorrow. $TSLA"
- "session takeaway: mode worked, levels delivered, patience paid. same time tomorrow. $TSLA"',
    'After-hours tweet (7pm, 9pm, 11pm slots)',
    NOW(),
    NOW()
),
(
    'morning_brief',
    'Generate a Discord morning brief post.

Format structure:
1. Opening line with mode emoji + "Good morning gang"
2. Key levels section (R1, R2, S1, S2, Gamma Strike, Hedge Wall, Put Wall)
3. What to watch today (bullet points)
4. Mode guidance (daily cap, posture)
5. Closing with "Let''s get it"

Format rules:
- Use section headers with emojis
- Bullet points with "•" 
- NO markdown tables
- Keep it scannable
- Include specific numbers/levels when available

Tone: Professional but accessible, battlefield commander briefing the troops.',
    'Discord #morning-brief (8am daily)',
    NOW(),
    NOW()
),
(
    'hiro_alert',
    'Generate a Discord HIRO alert post.

Format structure:
1. Alert header with timestamp
2. Current price + HIRO reading
3. Direction indicator (🟢 positive / 🔴 negative)
4. Key levels context
5. Brief interpretation (1-2 sentences)

Data to include:
- Current price
- HIRO value
- HIRO percentile (if available)
- Nearby gamma levels
- Trading implication

Tone: Alert-style, concise, actionable.
Keep to 4-6 lines maximum.',
    'Discord #hiro-intraday alerts (9am, 11am, 1pm)',
    NOW(),
    NOW()
),
(
    'eod_intelligence',
    'Generate a Discord EOD intelligence wrap.

Format structure:
1. Session recap header
2. What happened today (key moves)
3. Levels performance (which held/broke)
4. FS Insight quote (rich, 4-6 sentences, verbatim)
5. Overnight setup/looking ahead

Format rules:
- Section headers with emojis
- Bullet points for scannability
- Rich quotes in block format with source attribution
- NO markdown tables
- Include TSLA chart summary if available

Tone: Analytical, value-dense, institutional-quality summary.',
    'Discord #fs-insight EOD wrap (7pm daily)',
    NOW(),
    NOW()
),
(
    'daily_assessment',
    'Generate a daily assessment post.

Format structure:
1. Assessment header with date
2. Mode performance (did it work?)
3. Level accuracy summary
4. Key lessons from today
5. System adjustments (if any)

Include:
- Mode accuracy rating
- Level hit rate
- Best/worst level performance
- Trader psychology observations

Tone: Honest, self-critical, continuous improvement mindset.',
    'Discord #assessment (5pm daily)',
    NOW(),
    NOW()
),
(
    'mode_card',
    'Generate data for a Mode Card image.

Output format (JSON):
{
  "mode": "GREEN|YELLOW|ORANGE|RED",
  "daily_cap": "25%|15%|10%|5%",
  "posture": "Aggressive|Cautious|Defensive|Protective",
  "guidance": "Brief guidance text (1-2 sentences)",
  "key_points": ["point 1", "point 2", "point 3"]
}

Mode definitions:
- GREEN: Favorable conditions, up to 25% daily cap
- YELLOW: Proceed with caution, 15% or less
- ORANGE: Elevated caution, 10% or less  
- RED: Defensive only, 5% or less, capital protection priority',
    'Mode Card image data (daily)',
    NOW(),
    NOW()
),
(
    'levels_card',
    'Generate data for a Levels Card image.

Output format (JSON):
{
  "current_price": number,
  "t1": number,
  "t2": number,
  "t3": number,
  "t4": number,
  "s1": number,
  "s2": number,
  "slow_zone_low": number,
  "slow_zone_high": number,
  "master_eject": number,
  "hedge_wall": number,
  "put_wall": number,
  "gamma_strike": number
}

All levels should be precise numbers pulled from current report data.',
    'Levels Card image data (daily)',
    NOW(),
    NOW()
),
(
    'weekly_scorecard',
    'Generate data for Weekly Scorecard thread.

Output format:
- Week label (e.g., "Week 6: Feb 3-7")
- Trading days summary (each day: date, mode, score, key levels hit)
- Weekly aggregate score
- Best performing day
- Worst performing day
- Level accuracy breakdown by tier (T1, T2, T3, T4)
- Key patterns observed

Include specific numbers and percentages.
Make it ready for X thread format.',
    'Weekly Scorecard thread (Fridays)',
    NOW(),
    NOW()
)
ON CONFLICT (content_type) DO NOTHING;
