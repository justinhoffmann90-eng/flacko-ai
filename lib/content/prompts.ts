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

// Image card prompts - Visual design descriptions for AI customization
export const MODE_CARD_PROMPT = `Design a Mode Card with the following visual layout:

HEADER SECTION:
- Mode indicator as a prominent traffic light style icon on the left (circular emoji or colored indicator)
- Mode text (GREEN/YELLOW/ORANGE/RED) in large, bold typography next to the indicator
- Date and ticker symbol ($TSLA) in smaller text, right-aligned or below the mode

DAILY CAP SECTION:
- "Daily Cap" label with the percentage value (e.g., "15%") displayed prominently
- Use the mode color for visual emphasis (green/yellow/orange/red gradient or accent)

KEY LEVELS SECTION:
- Visual price ladder or list showing:
  * Call Wall (upside resistance) - green or blue accent
  * Gamma Strike (neutral/balance point) - white or neutral
  * Hedge Wall (first support) - yellow or orange accent
  * Put Wall (key support) - red accent
  * Current Price indicator showing position relative to levels
- Include percentage distance from close for context

ACTION SECTION:
- "What I'd Do" box with actionable text, styled as a call-to-action
- "Would Change My Mind" box with defensive trigger conditions
- Use distinct background colors or borders to differentiate these sections

VISUAL STYLE:
- Dark theme background (slate/zinc 950)
- Rounded corners and subtle borders
- Clean, modern typography with good hierarchy
- Color coding that reinforces the mode (green = bullish, yellow = cautious, orange = elevated risk, red = defensive)`;

export const LEVELS_CARD_PROMPT = `Design a Levels Card showing a vertical price ladder with the following visual layout:

PRICE LADDER (Top to Bottom):
- Call Wall at the top with upside/resistance styling (green or light color)
- Hedge Wall below call wall with support styling (yellow/orange accent)
- Gamma Strike in the center as the neutral pivot point (white or bright color for emphasis)
- Put Wall below gamma strike with support styling (red accent)
- Visual spacing between levels proportional to price distance

CURRENT PRICE INDICATOR:
- Horizontal marker or arrow showing where current price sits relative to the ladder
- Highlighted background or border when price is between two specific levels
- Price value displayed prominently with label

COLOR CODING:
- Levels above current price: green/blue tones (upside targets)
- Levels below current price: red/orange tones (downside support)
- Gamma Strike: neutral/white (the fulcrum)
- Use gradients or solid fills to create visual depth

HEADER:
- "Key Levels" or similar title
- Date of the levels
- Ticker symbol ($TSLA)

VISUAL STYLE:
- Dark background with high contrast text
- Clean geometric shapes for level markers
- Price values in monospace or tabular font for alignment
- Subtle grid lines or separators between levels`;

export const SCORECARD_PROMPT = `Design a Weekly Scorecard with the following visual layout:

HEADER SECTION:
- "Weekly Scorecard" title with week ending date prominently displayed
- Large, bold scenario hit ratio (e.g., "4/5" or "80%") as the primary metric
- Visual progress indicator, gauge, or colored bar showing performance

SCENARIOS SECTION:
- "Scenarios Hit" label with the ratio displayed as large typography
- Color code the performance (green for 80%+, yellow for 60-79%, red for below 60%)

WINS SECTION:
- "Key Wins" header with trophy or checkmark icon
- Bulleted or card-style list of wins (2-4 items)
- Use green accents or checkmarks for positive items
- One win per line with brief description

MISSES SECTION:
- "Key Misses" or "Lessons" header with learning icon
- Bulleted or card-style list of misses/lessons (2-4 items)
- Use orange/yellow accents for these items
- Frame as learning opportunities

SUMMARY SECTION:
- "Summary" or "Takeaway" box at the bottom
- 1-2 sentences capturing the week overall
- Distinct background color (subtle) to separate from lists

VISUAL STYLE:
- Dark theme with good contrast
- Clear visual hierarchy with the hit ratio as the hero element
- Icons or emoji to differentiate sections
- Rounded corners on section containers
- Professional, clean layout suitable for sharing`;

// Storage keys for prompt editor
export const MODE_CARD_STORAGE_KEY = "content-hub-mode-card-prompt";
export const LEVELS_CARD_STORAGE_KEY = "content-hub-levels-card-prompt";
export const SCORECARD_STORAGE_KEY = "content-hub-scorecard-prompt";

// Get default prompt for a content type
export function getDefaultPrompt(key: string): string {
  const contentType = CONTENT_TYPES.find((ct) => ct.key === key);
  if (contentType) {
    return contentType.defaultPrompt;
  }

  // Check image card prompts
  switch (key) {
    case "mode_card":
      return MODE_CARD_PROMPT;
    case "levels_card":
      return LEVELS_CARD_PROMPT;
    case "scorecard":
      return SCORECARD_PROMPT;
    default:
      return "";
  }
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
