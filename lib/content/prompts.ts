/**
 * Default prompts for Content Hub v3
 * Each content type has a default prompt that users can customize
 * Prompts include {{variable}} placeholders that get replaced with real data
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
    defaultPrompt: `Generate a pre-market tweet for $TSLA.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Current Price: ${{currentPrice}}
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- Master Eject: ${{masterEject}}
- HIRO: {{hiro}}
- Positioning: {{positioning}}

STYLE:
- Max 280 characters
- Battlefield briefing tone, all lowercase
- Include $TSLA cashtag
- Key level to watch + what happens if we break/hold it
- No hashtags, no fluff

EXAMPLE VIBE:
"$tsla watching 405 hedge wall. above it dealers stay long delta. below and we revisit 400 gamma strike. hiro flipped positive yesterday — first time in weeks. cautiously adding above 405."`,
  },
  {
    key: "market_open_tweet",
    label: "Market Open Tweet",
    defaultPrompt: `Generate a market open tweet for $TSLA.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Current Price: ${{currentPrice}}
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- HIRO: {{hiro}}

STYLE:
- Max 280 characters
- Battlefield briefing tone, all lowercase
- React to opening action vs. pre-market levels
- Note if we gapped up/down and where we are vs. key levels
- Include $TSLA cashtag

EXAMPLE VIBE:
"$tsla opened above hedge wall, testing 410 now. watching for acceptance above gamma strike 400 — that's the bull/bear line today. volume light so far."`,
  },
  {
    key: "midday_tweet",
    label: "Midday Tweet",
    defaultPrompt: `Generate a midday update tweet for $TSLA.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Current Price: ${{currentPrice}}
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- HIRO: {{hiro}}

STYLE:
- Max 280 characters
- Battlefield briefing tone, all lowercase  
- Summarize morning action — what levels held/broke
- Where we are now vs. key levels
- Include $TSLA cashtag

EXAMPLE VIBE:
"$tsla midday — holding above 405 hedge wall after morning dip to 403. gamma strike 400 defended twice. staying orange mode, nibbles only until we reclaim daily 9ema at 417."`,
  },
  {
    key: "power_hour_tweet",
    label: "Power Hour Tweet",
    defaultPrompt: `Generate a power hour tweet for $TSLA.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Current Price: ${{currentPrice}}
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- Master Eject: ${{masterEject}}
- HIRO: {{hiro}}

STYLE:
- Max 280 characters
- Battlefield briefing tone, all lowercase
- Focus on closing level implications
- What a close above/below key level means
- Include $TSLA cashtag

EXAMPLE VIBE:
"$tsla power hour — need a close above 405 hedge wall to confirm today's bounce. below 400 gamma strike and we're back in negative gamma. watching dealer positioning into close."`,
  },
  {
    key: "eod_tweet",
    label: "EOD Tweet",
    defaultPrompt: `Generate an end-of-day tweet for $TSLA.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Close: ${{currentPrice}} ({{priceChangePct}}%)
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- HIRO: {{hiro}}
- Tomorrow's key level: {{tomorrowKey}}

STYLE:
- Max 280 characters
- Battlefield briefing tone, all lowercase
- Include close price and % change
- Note what level we closed relative to
- Forward-looking setup for tomorrow
- Include $TSLA cashtag

EXAMPLE VIBE:
"$tsla closed 411.11 (+2.55%) above hedge wall 405. hiro flipped to +480m — strongest single day swing in weeks. watching 417 daily 9ema tomorrow for mode upgrade to yellow."`,
  },
  {
    key: "eod_wrap",
    label: "EOD Wrap (Discord)",
    defaultPrompt: `Generate an end-of-day market wrap for Discord #fs-insight channel.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Close: ${{currentPrice}} ({{priceChangePct}}%)
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}  
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- Master Eject: ${{masterEject}}
- HIRO: {{hiro}} (30-day range: {{hiroLow}} to {{hiroHigh}})
- Positioning: {{positioning}}

FORMAT:
**EOD Wrap - {{date}}**

📊 **The Day**
(2-3 sentences on price action, what levels were tested)

🎯 **Key Levels Performance**  
• Call Wall ${{callWall}}: (held/broke/not tested)
• Hedge Wall ${{hedgeWall}}: (held/broke/not tested)
• Gamma Strike ${{gammaStrike}}: (held/broke/not tested)
• Put Wall ${{putWall}}: (held/broke/not tested)

📈 **HIRO Read**
(What dealer positioning tells us)

🔮 **Tomorrow**
(Key level to watch and what triggers mode change)

STYLE:
- Factual, analytical tone
- Use Discord formatting (bold, bullet points)
- No fluff, just signal`,
  },
  {
    key: "morning_brief",
    label: "Morning Brief (Discord)",
    defaultPrompt: `Generate a morning brief for Discord.

TODAY'S DATA:
- Mode: {{mode}} (Daily Cap: {{dailyCap}}%)
- Previous Close: ${{currentPrice}}
- Call Wall: ${{callWall}}
- Gamma Strike: ${{gammaStrike}}
- Hedge Wall: ${{hedgeWall}}
- Put Wall: ${{putWall}}
- Master Eject: ${{masterEject}}
- HIRO: {{hiro}}
- Weekly 9 EMA: ${{weekly9ema}}
- Weekly 21 EMA: ${{weekly21ema}}
- Daily 9 EMA: ${{daily9ema}}
- Daily 21 EMA: ${{daily21ema}}

FORMAT:
**Morning Brief - {{date}}**

🚦 **Mode: {{mode}}** | Daily Cap: {{dailyCap}}%

📊 **Key Levels**
🔼 Upside: ${{callWall}} (Call Wall) → ${{weekly9ema}} (Weekly 9)
📍 Current: ${{currentPrice}}
🔽 Support: ${{hedgeWall}} (Hedge) → ${{gammaStrike}} (Gamma) → ${{putWall}} (Put Wall)
🚨 Eject: ${{masterEject}}

📈 **HIRO**: {{hiro}}
(Brief interpretation)

🎯 **Today's Focus**
• Bull trigger: (specific price + condition)
• Bear trigger: (specific price + condition)

STYLE:
- Actionable and clear
- Use Discord formatting
- Front-load the important info`,
  },
  {
    key: "hiro_alert",
    label: "HIRO Alert (Discord)",
    defaultPrompt: `Generate a HIRO alert for Discord #alerts channel.

CURRENT DATA:
- HIRO: {{hiro}}
- 30-Day Range: {{hiroLow}} to {{hiroHigh}}
- Current Price: ${{currentPrice}}
- Gamma Strike: ${{gammaStrike}}
- Mode: {{mode}}

FORMAT:
🚨 **HIRO Alert**

**Reading**: {{hiro}}
**Percentile**: (calculate where this falls in 30-day range)
**Price**: ${{currentPrice}}

**What This Means**:
(1-2 sentences on dealer positioning implication)

**Action**:
(What the mode system suggests doing)

STYLE:
- Alert format, urgent but not panicked
- Factual interpretation
- Clear action guidance based on mode`,
  },
];

// Image card prompts - Visual design descriptions
export const MODE_CARD_PROMPT = `Design a Mode Card with the following visual layout:

HEADER SECTION:
- Flacko AI logo top left
- Ticker ($TSLA) and date
- Mode pill (GREEN/YELLOW/ORANGE/RED) with appropriate color
- Daily Cap percentage

PRICE LADDER (Left Side):
- Vertical layout showing levels from high to low
- Call Wall (green) at top
- Gamma Strike (yellow/white)
- Hedge Wall (orange)
- Put Wall (red)
- Master Eject (dark red)
- Current price indicator showing position
- % distance from each level

RIGHT PANEL:
- "FLACKO AI'S TAKE" header
- "What I'd Do" section with action text
- "Would Change My Mind" section with caution text

KEY LEVELS BOX:
- Compact list of all levels with colors
- Price and % from current

FOOTER:
- "Your TSLA trading operating system" tagline
- flacko.ai link

VISUAL STYLE:
- Dark theme (slate-950 background)
- 1200x675 aspect ratio for Twitter/Discord
- Clean typography, good contrast`;

export const LEVELS_CARD_PROMPT = `Design a Levels Card showing a vertical price ladder:

LAYOUT:
- Vertical price ladder from Call Wall (top) to Master Eject (bottom)
- Current price marker showing position in the ladder
- Color coding: green for upside, red for downside, yellow for neutral
- Price labels with % distance from current

STYLE:
- Dark background
- Clean geometric design
- Monospace font for prices
- 1200x675 aspect ratio`;

export const SCORECARD_PROMPT = `Design a Weekly Scorecard:

LAYOUT:
- Week ending date prominently displayed
- Large "4/5" or "80%" scenario hit ratio
- Key Wins list (green checkmarks)
- Key Misses list (orange caution)
- Summary takeaway at bottom

STYLE:
- Dark theme
- Performance color coding (green = good, yellow = ok, red = poor)
- Clean card-based sections
- 1200x675 aspect ratio`;

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

// Helper to inject report data into a prompt template
export function injectReportData(prompt: string, data: {
  mode?: string;
  dailyCap?: number;
  currentPrice?: number;
  priceChangePct?: number;
  callWall?: number;
  gammaStrike?: number;
  hedgeWall?: number;
  putWall?: number;
  masterEject?: number;
  hiro?: string;
  hiroLow?: string;
  hiroHigh?: string;
  positioning?: string;
  date?: string;
  weekly9ema?: number;
  weekly21ema?: number;
  daily9ema?: number;
  daily21ema?: number;
  tomorrowKey?: string;
}): string {
  return prompt
    .replace(/\{\{mode\}\}/g, data.mode || 'N/A')
    .replace(/\{\{dailyCap\}\}/g, String(data.dailyCap || 'N/A'))
    .replace(/\{\{currentPrice\}\}/g, String(data.currentPrice || 'N/A'))
    .replace(/\{\{priceChangePct\}\}/g, String(data.priceChangePct || 'N/A'))
    .replace(/\{\{callWall\}\}/g, String(data.callWall || 'N/A'))
    .replace(/\{\{gammaStrike\}\}/g, String(data.gammaStrike || 'N/A'))
    .replace(/\{\{hedgeWall\}\}/g, String(data.hedgeWall || 'N/A'))
    .replace(/\{\{putWall\}\}/g, String(data.putWall || 'N/A'))
    .replace(/\{\{masterEject\}\}/g, String(data.masterEject || 'N/A'))
    .replace(/\{\{hiro\}\}/g, data.hiro || 'N/A')
    .replace(/\{\{hiroLow\}\}/g, data.hiroLow || 'N/A')
    .replace(/\{\{hiroHigh\}\}/g, data.hiroHigh || 'N/A')
    .replace(/\{\{positioning\}\}/g, data.positioning || 'N/A')
    .replace(/\{\{date\}\}/g, data.date || new Date().toLocaleDateString())
    .replace(/\{\{weekly9ema\}\}/g, String(data.weekly9ema || 'N/A'))
    .replace(/\{\{weekly21ema\}\}/g, String(data.weekly21ema || 'N/A'))
    .replace(/\{\{daily9ema\}\}/g, String(data.daily9ema || 'N/A'))
    .replace(/\{\{daily21ema\}\}/g, String(data.daily21ema || 'N/A'))
    .replace(/\{\{tomorrowKey\}\}/g, data.tomorrowKey || 'See report');
}
