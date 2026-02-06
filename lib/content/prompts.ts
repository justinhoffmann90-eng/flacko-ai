/**
 * Default prompts for Content Hub v3
 * Each content type has a default prompt that users can customize
 */

export interface ContentType {
  key: string;
  label: string;
  defaultPrompt: string;
}

export const CONTENT_TYPES: ContentType[] = [
  {
    key: "pre_market_tweet",
    label: "Pre-Market Tweet",
    defaultPrompt: `Generate a pre-market tweet for TSLA based on the daily report.

Context: Overnight price action, futures, and key levels to watch.

Requirements:
- Max 280 characters
- Include relevant emojis
- Mention key levels if significant
- Tone: professional but engaging
- Include $TSLA ticker`,
  },
  {
    key: "market_open_tweet",
    label: "Market Open Tweet",
    defaultPrompt: `Generate a market open tweet for TSLA.

Context: Opening price action, initial volume, and early direction vs. overnight levels.

Requirements:
- Max 280 characters
- Reference opening levels or gap
- Tone: energetic, observational
- Include $TSLA ticker`,
  },
  {
    key: "midday_tweet",
    label: "Midday Tweet",
    defaultPrompt: `Generate a midday update tweet for TSLA.

Context: Midday price action, volume trends, and key level tests.

Requirements:
- Max 280 characters
- Summarize morning action
- Mention any level breaks or holds
- Tone: informative, measured
- Include $TSLA ticker`,
  },
  {
    key: "power_hour_tweet",
    label: "Power Hour Tweet",
    defaultPrompt: `Generate a power hour tweet for TSLA.

Context: Last 60-90 minutes of trading, EOD positioning, key closing levels to watch.

Requirements:
- Max 280 characters
- Highlight important closing levels
- Mention gamma strike if relevant
- Tone: urgent but professional
- Include $TSLA ticker`,
  },
  {
    key: "eod_tweet",
    label: "EOD Tweet",
    defaultPrompt: `Generate an end-of-day tweet for TSLA.

Context: Closing price, daily performance, and setup for next session.

Requirements:
- Max 280 characters
- Include closing price and daily change
- Mention any significant level breaks
- Tone: summary, forward-looking
- Include $TSLA ticker`,
  },
  {
    key: "eod_wrap",
    label: "EOD Wrap (Discord)",
    defaultPrompt: `Generate an end-of-day market wrap for Discord.

Context: Full day recap of TSLA price action, key events, level performance, and overnight setup.

Requirements:
- Longer format (multiple paragraphs OK)
- Include bullet points for key levels tested
- Mention any macro catalysts
- Include tomorrow's key levels
- Tone: detailed, analytical
- Use Discord formatting (bold, bullet points)`,
  },
  {
    key: "morning_brief",
    label: "Morning Brief (Discord)",
    defaultPrompt: `Generate a morning brief for Discord.

Context: Pre-market setup for TSLA, overnight action, key levels to watch, and macro context.

Requirements:
- Structured format with headers
- Include mode color and daily cap
- List key upside and downside levels
- Mention any upcoming catalysts
- Tone: professional, actionable
- Use Discord formatting`,
  },
  {
    key: "hiro_alert",
    label: "HIRO Alert (Discord)",
    defaultPrompt: `Generate a HIRO alert for Discord.

Context: HIRO (High Interest Rate Opportunity) signals for TSLA - unusual options flow or significant gamma levels being tested.

Requirements:
- Alert-style format
- Include specific price levels
- Mention gamma implications if relevant
- Tone: urgent, actionable
- Use Discord formatting with emojis`,
  },
];

// Image card prompts
export const MODE_CARD_PROMPT = `Generate a daily mode card for TSLA.

The mode card should display:
- Mode color (GREEN/YELLOW/ORANGE/RED)
- Daily cap percentage
- Key levels (Call Wall, Gamma Strike, Hedge Wall, Put Wall)
- Current price
- Brief take on market conditions

Format as JSON with fields: mode, dailyCap, levels (array), currentPrice, take`;

export const LEVELS_CARD_PROMPT = `Generate a levels card for TSLA.

The levels card should display key trading levels:
- Call Wall
- Hedge Wall
- Key Gamma level
- Put Wall
- Current price with visual positioning

Format as JSON with fields: callWall, hedgeWall, gammaStrike, putWall, currentPrice`;

export const SCORECARD_PROMPT = `Generate a weekly scorecard for TSLA trading.

The scorecard should display:
- Week ending date
- Scenarios hit (e.g., "4/5")
- Key wins for the week
- Key misses or lessons
- Overall performance summary

Format as JSON with fields: weekEnding, scenariosHit, keyWins, keyMisses, summary`;

// Get default prompt for a content type
export function getDefaultPrompt(key: string): string {
  const contentType = CONTENT_TYPES.find((ct) => ct.key === key);
  return contentType?.defaultPrompt || "";
}

// Get label for a content type
export function getContentTypeLabel(key: string): string {
  const contentType = CONTENT_TYPES.find((ct) => ct.key === key);
  return contentType?.label || key;
}

// All content type keys for dropdowns
export const CONTENT_TYPE_KEYS = CONTENT_TYPES.map((ct) => ({
  key: ct.key,
  label: ct.label,
}));
