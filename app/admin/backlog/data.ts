export type BacklogStatus = "strong" | "weak" | "backlog";
export type BacklogPriority = 1 | 2 | 3 | 4 | 5 | 6;
export type BacklogCategory = "growth" | "workflow" | "platform";

export interface TechSpec {
  overview: string;
  inputs: string[];
  outputs: string[];
  implementation: string[];
  dataFlow?: string;
  apiEndpoints?: string[];
  components?: string[];
  dependencies?: string[];
  acceptanceCriteria: string[];
}

export interface BacklogItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  assessment: string;
  rating: string;
  stars: 5 | 4 | 3;
  status: BacklogStatus;
  category: BacklogCategory;
  isNew?: boolean;
  techSpec?: TechSpec;
}

export interface WeakItem {
  id: string;
  title: string;
  reason: string;
  category: BacklogCategory;
}

export interface BacklogStorageItem {
  id: string;
  title: string;
  description: string;
  reason: string;
}

export const categories = {
  growth: {
    emoji: "🎯",
    title: "GOAL 1: Grow Subscribers",
    bgColor: "bg-green-50",
    titleColor: "text-green-800",
    borderColor: "border-green-200",
  },
  workflow: {
    emoji: "⚡",
    title: "GOAL 2: Streamline Workflows",
    bgColor: "bg-orange-50",
    titleColor: "text-orange-800",
    borderColor: "border-orange-200",
  },
  platform: {
    emoji: "🏗️",
    title: "GOAL 3: Platform Excellence",
    bgColor: "bg-blue-50",
    titleColor: "text-blue-800",
    borderColor: "border-blue-200",
  },
};

// ============ GOAL 1: GROW SUBSCRIBERS ============
export const goal1Strong: BacklogItem[] = [
  {
    id: "daily-mode-card",
    rank: 1,
    title: "Daily Mode Card",
    description: "Branded daily post with MODE, key levels, posture.",
    assessment: "Compounds daily. Zero-effort once templated. Becomes must-check ritual. Brand building 101.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "growth",
    techSpec: {
      overview: "Generate a branded image card showing today's trading mode, key levels, and market posture. Designed for X/Twitter posting with consistent visual identity.",
      inputs: [
        "Daily report markdown file (~/trading_inputs/daily-reports/TSLA_Daily_Report_YYYY-MM-DD.md)",
        "Mode (GREEN/YELLOW/ORANGE/RED) from report frontmatter",
        "Key levels array from report (call_wall, put_wall, gamma_strike, hedge_wall)",
        "Daily cap percentage from mode",
        "Posture/stance text from report"
      ],
      outputs: [
        "PNG image (1200x675px for X optimal display)",
        "Alt text for accessibility",
        "Suggested tweet text with $TSLA hashtag"
      ],
      implementation: [
        "1. Create React component `DailyModeCard` with props: mode, levels, posture, date",
        "2. Design system: Mode colors (green=#22c55e, yellow=#eab308, orange=#f97316, red=#ef4444)",
        "3. Layout: Mode badge (top), key levels grid (middle), posture text (bottom), Flacko AI branding (corner)",
        "4. Use @vercel/og or similar for server-side image generation",
        "5. API endpoint: GET /api/cards/daily-mode?date=YYYY-MM-DD returns PNG",
        "6. Parser extracts mode/levels from daily report markdown"
      ],
      apiEndpoints: [
        "GET /api/cards/daily-mode?date=YYYY-MM-DD → returns PNG image",
        "GET /api/cards/daily-mode/data?date=YYYY-MM-DD → returns JSON { mode, levels, posture, dailyCap }"
      ],
      components: [
        "components/cards/DailyModeCard.tsx — React component for card layout",
        "app/api/cards/daily-mode/route.ts — Image generation endpoint",
        "lib/parser/extractModeData.ts — Extract mode/levels from report"
      ],
      dependencies: [
        "@vercel/og (image generation)",
        "Existing report parser (lib/parser/index.ts)"
      ],
      acceptanceCriteria: [
        "Card renders correctly for all 4 modes with appropriate colors",
        "All key levels display with proper formatting ($XXX.XX)",
        "Image is exactly 1200x675px",
        "Branding is consistent (Flacko AI logo, fonts)",
        "API returns image in <2 seconds",
        "Works with any valid report date"
      ]
    }
  },
  {
    id: "hiro-eod-recap",
    rank: 2,
    title: "HIRO End-of-Day Recap",
    description: "Daily post showing how HIRO readings informed price action.",
    assessment: "Daily post showing how HIRO readings informed price action. Educational, proves the edge, simple to execute.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "growth",
    techSpec: {
      overview: "Generate an end-of-day recap showing HIRO readings throughout the day overlaid with price action, demonstrating how flow data predicted moves.",
      inputs: [
        "HIRO readings from SpotGamma (9am, 11am, 1pm CT screenshots or API)",
        "TSLA price data for the day (OHLC + intraday)",
        "Key levels from morning report",
        "Actual high/low/close vs predicted levels"
      ],
      outputs: [
        "PNG image (1200x675px) showing HIRO timeline with price overlay",
        "Text summary: 'HIRO signaled X at Y time, price did Z'",
        "Tweet thread draft (3-4 tweets)"
      ],
      implementation: [
        "1. Store HIRO readings in database table `hiro_readings` (timestamp, value, signal)",
        "2. Fetch TSLA intraday data via Yahoo Finance API or TradingView",
        "3. Create visualization component showing HIRO vs price correlation",
        "4. Generate narrative: identify key HIRO signals and subsequent price moves",
        "5. Template: 'At [time], HIRO hit [value] ([signal]). Price then [moved X%].'",
        "6. Image generation via @vercel/og with chart component"
      ],
      dataFlow: "SpotGamma screenshot → OCR/manual entry → hiro_readings table → API → visualization",
      apiEndpoints: [
        "POST /api/hiro/reading — Store HIRO reading { timestamp, value, signal }",
        "GET /api/hiro/daily?date=YYYY-MM-DD — Get all readings for date",
        "GET /api/cards/hiro-recap?date=YYYY-MM-DD — Generate recap image"
      ],
      components: [
        "components/cards/HIRORecapCard.tsx — Visualization component",
        "lib/hiro/correlateWithPrice.ts — Match HIRO signals to price moves",
        "app/api/hiro/* — HIRO data endpoints"
      ],
      dependencies: [
        "Yahoo Finance API or TradingView data",
        "Chart library (recharts or similar)",
        "@vercel/og"
      ],
      acceptanceCriteria: [
        "Shows minimum 3 HIRO readings per day",
        "Price data matches HIRO timestamps",
        "Clear visual correlation between HIRO signal and price move",
        "Narrative text is accurate and specific",
        "Image renders in <3 seconds"
      ]
    }
  },
  {
    id: "daily-forecast-vs-actual",
    rank: 3,
    title: "Daily Forecast vs Actual Posts",
    description: "Compare morning report forecasts (levels, scenarios) to actual price action.",
    assessment: "Compare morning report forecasts (levels, scenarios) to that day's actual price action. Screenshot prediction → show result. Undeniable proof the system works.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "growth",
    techSpec: {
      overview: "Generate comparison content showing morning predictions vs end-of-day reality. Visual proof that the system works.",
      inputs: [
        "Morning report: key levels, scenarios (bull/base/bear), mode, posture",
        "EOD data: actual high, low, close",
        "Which levels were tested/held/broken",
        "Which scenario played out"
      ],
      outputs: [
        "Comparison image (1200x675px) — left side: AM prediction, right side: EOD result",
        "Accuracy metrics: X of Y levels hit, scenario accuracy",
        "Tweet text with specific callouts"
      ],
      implementation: [
        "1. Parse morning report for: levels array, scenarios object, mode",
        "2. Fetch EOD price data: high, low, close from Yahoo Finance",
        "3. Compare: for each level, check if price touched within $0.50",
        "4. Determine which scenario played out based on close price vs scenario ranges",
        "5. Generate side-by-side visual: AM card | EOD card with checkmarks/X marks",
        "6. Calculate accuracy: (levels_hit / total_levels) * 100"
      ],
      dataFlow: "Morning report → parser → predictions table | EOD price fetch → comparison logic → image generation",
      apiEndpoints: [
        "GET /api/accuracy/daily?date=YYYY-MM-DD — Returns { predictions, actuals, accuracy }",
        "GET /api/cards/forecast-vs-actual?date=YYYY-MM-DD — Returns comparison PNG"
      ],
      components: [
        "components/cards/ForecastVsActualCard.tsx — Side-by-side comparison",
        "lib/accuracy/compareLevels.ts — Level hit detection logic",
        "lib/accuracy/determineScenario.ts — Which scenario played out"
      ],
      dependencies: [
        "Yahoo Finance API (EOD data)",
        "Existing report parser",
        "@vercel/og"
      ],
      acceptanceCriteria: [
        "All levels from morning report are compared",
        "Hit/miss detection is accurate (within $0.50 tolerance)",
        "Scenario determination matches actual price action",
        "Visual clearly shows prediction vs result",
        "Accuracy percentage is calculated correctly"
      ]
    }
  },
  {
    id: "weekly-scorecard-thread",
    rank: 4,
    title: "Weekly Scorecard Thread",
    description: "Repurpose existing daily journals + weekly assessment into X thread format.",
    assessment: "Repurpose existing daily journals + weekly assessment into X thread format. No new work — just reformat what we already track. Radical transparency builds trust.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "growth",
    techSpec: {
      overview: "Transform weekly assessment data into a formatted X thread showing the week's performance with daily breakdowns.",
      inputs: [
        "Daily journals from ~/clawd/obsidian/Daily Notes/ (Mon-Fri)",
        "Weekly assessment from ~/clawd/obsidian/Performance/",
        "Daily accuracy scores, mode accuracy, scenario outcomes"
      ],
      outputs: [
        "X thread (5-7 tweets) with weekly summary",
        "Header image showing week's stats",
        "Individual day cards (optional)"
      ],
      implementation: [
        "1. Aggregate daily journal data for the week (Mon-Fri)",
        "2. Calculate: total accuracy, mode accuracy by color, best/worst days",
        "3. Format thread: Tweet 1: Week summary + headline stat, Tweets 2-5: Daily highlights, Tweet 6: Accuracy link",
        "4. Generate header image with key metrics",
        "5. Store thread draft for approval before posting"
      ],
      dataFlow: "Daily journals → aggregation → thread formatter → draft storage → approval → post",
      apiEndpoints: [
        "GET /api/accuracy/weekly?week=YYYY-WW — Returns weekly aggregated data",
        "GET /api/content/weekly-thread?week=YYYY-WW — Returns formatted thread array",
        "GET /api/cards/weekly-scorecard?week=YYYY-WW — Returns header image"
      ],
      components: [
        "lib/accuracy/aggregateWeekly.ts — Combine daily data",
        "lib/content/formatThread.ts — Convert data to tweet array",
        "components/cards/WeeklyScorecardCard.tsx — Header image"
      ],
      dependencies: [
        "Access to daily journal files",
        "@vercel/og",
        "Twitter/X API (for posting, optional)"
      ],
      acceptanceCriteria: [
        "Thread covers all 5 trading days",
        "Accuracy metrics match source journals",
        "Each tweet is under 280 characters",
        "Header image shows week's key stat prominently",
        "Thread is stored for approval before posting"
      ]
    }
  },
  {
    id: "public-accuracy-dashboard",
    rank: 5,
    title: "Public Accuracy Dashboard",
    description: "Every post links to flacko.ai/accuracy. Social proof at scale.",
    assessment: `Every post links to flacko.ai/accuracy. Social proof at scale. "Don't trust me, check the numbers."`,
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "growth",
    isNew: true,
    techSpec: {
      overview: "Public-facing page at flacko.ai/accuracy showing historical track record with verifiable data. No login required.",
      inputs: [
        "Historical daily accuracy data (levels hit, scenarios correct)",
        "Mode accuracy breakdown (GREEN/YELLOW/ORANGE/RED)",
        "Running averages (7-day, 30-day, all-time)",
        "Individual day records with links to archived reports"
      ],
      outputs: [
        "Public page at /accuracy",
        "Real-time accuracy stats",
        "Historical chart showing accuracy over time",
        "Downloadable CSV of all records (optional)"
      ],
      implementation: [
        "1. Create Supabase table `accuracy_records` (date, levels_predicted, levels_hit, mode, scenario_predicted, scenario_actual)",
        "2. Daily cron job calculates and stores accuracy after market close",
        "3. Page components: headline stat, accuracy chart, mode breakdown, daily log",
        "4. No auth required — fully public",
        "5. SEO optimized for 'TSLA trading accuracy' keywords"
      ],
      dataFlow: "Daily report + EOD data → accuracy calculation → accuracy_records table → /accuracy page",
      apiEndpoints: [
        "GET /api/accuracy/summary — Returns { overall, last7, last30, byMode }",
        "GET /api/accuracy/history?days=N — Returns daily records array",
        "POST /api/accuracy/record — (internal) Store daily accuracy"
      ],
      components: [
        "app/accuracy/page.tsx — Public accuracy page",
        "components/accuracy/AccuracyChart.tsx — Historical line chart",
        "components/accuracy/ModeBreakdown.tsx — Accuracy by mode color",
        "components/accuracy/DailyLog.tsx — Scrollable daily records"
      ],
      dependencies: [
        "Supabase (accuracy_records table)",
        "Chart library (recharts)",
        "Existing accuracy calculation logic"
      ],
      acceptanceCriteria: [
        "Page loads without authentication",
        "Shows at least 30 days of historical data",
        "Accuracy calculations are verifiable (show math)",
        "Mobile responsive",
        "Loads in <2 seconds",
        "Updates automatically after each trading day"
      ]
    }
  },
];

export const goal1Weak: WeakItem[] = [
  { id: "monday-preview-posts", title: "Monday Preview Posts", reason: "Maintains audience, doesn't grow it", category: "growth" },
  { id: "gamma-strike-rejection", title: "Gamma Strike Rejection", reason: "Opportunistic only, can't schedule", category: "growth" },
  { id: "quote-tweet-news", title: "Quote Tweet the News", reason: "Undifferentiated, everyone does it", category: "growth" },
  { id: "why-it-moved-recaps", title: '"Why It Moved" Recaps', reason: "Reactive content, not differentiated", category: "growth" },
  { id: "pre-earnings-playbook", title: "Pre-Earnings Playbook", reason: "High effort, only 4x/year", category: "growth" },
  { id: "free-daily-levels-email", title: "Free Daily Levels Email", reason: "Not building email list", category: "growth" },
  { id: "what-would-you-do-polls", title: '"What Would You Do?" Polls', reason: "Not a fit", category: "growth" },
  { id: "contrarian-call-accountability", title: "Contrarian Call + Accountability", reason: "Not a fit", category: "growth" },
  { id: "subscriber-testimonials", title: "Subscriber Testimonials", reason: "Not a fit", category: "growth" },
  { id: "loss-autopsy-posts", title: "Loss Autopsy Posts", reason: "Not a fit", category: "growth" },
];

// ============ GOAL 2: STREAMLINE WORKFLOWS ============
export const goal2Strong: BacklogItem[] = [
  {
    id: "daily-levels-card-improvements",
    rank: 1,
    title: "Daily Levels Card Improvements",
    description: "Enhance existing daily levels chart workflow. Improve visual design, branding, X-readability.",
    assessment: "Enhance existing daily levels chart workflow. Improve visual design, branding, X-readability. Already generates key levels/mode/take — refine for social sharing.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "workflow",
    techSpec: {
      overview: "Redesign the existing daily levels card for better X/Twitter engagement. Focus on visual hierarchy, brand consistency, and mobile readability.",
      inputs: [
        "Existing daily-chart component/endpoint",
        "Mode, levels, posture from daily report",
        "Flacko AI brand assets (logo, colors, fonts)"
      ],
      outputs: [
        "Improved PNG card (1200x675px)",
        "Consistent visual identity across all cards",
        "Higher engagement rate on X"
      ],
      implementation: [
        "1. Audit current card design — identify readability issues",
        "2. Create design system: colors, typography, spacing, logo placement",
        "3. Redesign card with: larger mode badge, cleaner level grid, better contrast",
        "4. Add subtle background texture/gradient for premium feel",
        "5. Ensure text is readable at X thumbnail size (small preview)",
        "6. A/B test new design vs old"
      ],
      components: [
        "components/cards/DailyLevelsCard.tsx — Redesigned component",
        "lib/design/brandColors.ts — Centralized color palette",
        "public/brand/* — Logo assets in various sizes"
      ],
      acceptanceCriteria: [
        "Mode color is immediately visible (large badge)",
        "All levels are readable at 50% zoom",
        "Flacko AI branding is subtle but present",
        "Card looks good in X timeline and expanded view",
        "Design is consistent with other card types"
      ]
    }
  },
  {
    id: "eod-accuracy-card",
    rank: 2,
    title: "EOD Accuracy Card (daily-chart extension)",
    description: "Add second template to existing daily-chart tool. Morning card shows levels; EOD card shows actual.",
    assessment: "Add second template to existing daily-chart tool. Morning card shows levels; EOD card shows same levels + actual high/low/close + which levels hit. Same data pipeline, new visual output.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "workflow",
    techSpec: {
      overview: "Extend the daily-chart system to generate an EOD version showing which levels were hit/missed with actual price data.",
      inputs: [
        "Morning card data (levels, mode, posture)",
        "EOD price data (high, low, close)",
        "Level hit/miss status for each level"
      ],
      outputs: [
        "EOD accuracy card PNG (1200x675px)",
        "Same layout as morning card but with results overlay",
        "Checkmarks (✓) for hit levels, X for missed"
      ],
      implementation: [
        "1. Reuse morning card component as base",
        "2. Add 'variant' prop: 'morning' | 'eod'",
        "3. EOD variant overlays: actual H/L/C, hit/miss indicators",
        "4. Color coding: green checkmark for hits, gray X for misses",
        "5. Add summary stat: 'X of Y levels hit'",
        "6. Same API endpoint with ?variant=eod parameter"
      ],
      dataFlow: "Morning data + EOD prices → compareLevels() → EOD card generation",
      apiEndpoints: [
        "GET /api/cards/daily-levels?date=YYYY-MM-DD&variant=morning — Morning card",
        "GET /api/cards/daily-levels?date=YYYY-MM-DD&variant=eod — EOD card with results"
      ],
      components: [
        "components/cards/DailyLevelsCard.tsx — Add variant prop",
        "lib/accuracy/compareLevels.ts — Reuse from forecast-vs-actual"
      ],
      dependencies: [
        "Yahoo Finance API (EOD data)",
        "Existing daily-chart infrastructure"
      ],
      acceptanceCriteria: [
        "EOD card shows same levels as morning card",
        "Hit/miss status is clearly indicated",
        "Actual H/L/C is displayed prominently",
        "Summary stat shows accuracy fraction",
        "Card generates after market close (4pm ET)"
      ]
    }
  },
  {
    id: "report-to-tweet-pipeline",
    rank: 3,
    title: "Report-to-Tweet Pipeline",
    description: "Auto-generate tweets from PREVIOUS day's report (show value after the fact, don't give away today's levels).",
    assessment: `Auto-generate tweets from PREVIOUS day's report (show value after the fact, don't give away today's levels). Tweet types: (1) Level accuracy — "Yesterday's $424 support held at $422.70" (2) Mode call recap — "ORANGE mode kept size small before the drop" (3) Scenario outcome — "Base case played out exactly." Proves system without giving away current intel.`,
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "workflow",
    isNew: true,
    techSpec: {
      overview: "Generate draft tweets from yesterday's report showing how predictions played out. Proves the system without giving away current intel.",
      inputs: [
        "Yesterday's daily report (levels, mode, scenarios)",
        "Yesterday's actual price action (H/L/C)",
        "Level hit/miss data",
        "Scenario outcome"
      ],
      outputs: [
        "3-5 draft tweets in different formats",
        "Level accuracy tweet: 'Yesterday's $X support held at $Y'",
        "Mode recap tweet: 'ORANGE mode kept size small before the drop'",
        "Scenario tweet: 'Base case played out exactly'",
        "Stored for approval before posting"
      ],
      implementation: [
        "1. Create tweet templates for each type (level, mode, scenario)",
        "2. Fill templates with yesterday's data + actual results",
        "3. Add variability: 5+ templates per type, randomly selected",
        "4. Include relevant $TSLA hashtag and optional image",
        "5. Store drafts in `tweet_drafts` table for approval",
        "6. Approval UI in admin panel"
      ],
      dataFlow: "Yesterday report + EOD data → template selection → draft generation → approval queue → post",
      apiEndpoints: [
        "GET /api/tweets/generate?date=YYYY-MM-DD — Generate drafts for date",
        "GET /api/tweets/drafts — List pending drafts",
        "POST /api/tweets/approve/:id — Approve and queue for posting",
        "DELETE /api/tweets/drafts/:id — Reject draft"
      ],
      components: [
        "lib/tweets/templates.ts — Tweet template library",
        "lib/tweets/generator.ts — Fill templates with data",
        "app/admin/tweets/page.tsx — Approval UI"
      ],
      dependencies: [
        "Twitter/X API (optional, for auto-posting)",
        "Existing accuracy data"
      ],
      acceptanceCriteria: [
        "Generates at least 3 unique tweet drafts per day",
        "Tweets are under 280 characters",
        "Data is accurate (matches actual results)",
        "Drafts are stored for approval (not auto-posted)",
        "Templates have enough variety to not feel repetitive"
      ]
    }
  },
  {
    id: "intelligent-chart-update-bot",
    rank: 4,
    title: "Intelligent Chart Update Bot",
    description: "Auto-capture chart at key times → feed to AI with full context → post intelligent update to Discord.",
    assessment: `Auto-capture chart at key times → feed to AI with full context (daily report, key levels, rulebook) → post intelligent update to Discord. Not just screenshots — contextual analysis: "Price testing $424 support from this morning's report. HIRO at +800M. Holding so far."`,
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "workflow",
    isNew: true,
    techSpec: {
      overview: "Automated system that captures charts at scheduled times, analyzes with AI using full context, and posts intelligent updates to Discord.",
      inputs: [
        "TradingView chart screenshot (automated capture)",
        "Current TSLA price",
        "Today's daily report (levels, mode, scenarios)",
        "Current HIRO reading (if available)",
        "Rulebook context"
      ],
      outputs: [
        "Discord message with chart image + AI-generated analysis",
        "Analysis format: 'Price at $X, testing [level name] from today's report. HIRO at [value]. [Assessment].'",
        "Posted to appropriate Discord channel"
      ],
      implementation: [
        "1. Schedule: 10:30am, 12:00pm, 2:00pm, 3:30pm CT",
        "2. Capture: Use Puppeteer/Playwright to screenshot TradingView chart",
        "3. Context: Load today's report, current price, HIRO data",
        "4. AI prompt: 'Given these levels [X], current price [Y], HIRO [Z], write a 2-sentence update.'",
        "5. Post: Send image + AI text to Discord via webhook",
        "6. Store: Log all updates in `chart_updates` table"
      ],
      dataFlow: "Scheduler → chart capture → price fetch → AI analysis → Discord webhook",
      apiEndpoints: [
        "POST /api/chart-bot/capture — Trigger manual capture",
        "GET /api/chart-bot/history — List recent updates",
        "POST /api/chart-bot/analyze — Generate analysis from screenshot"
      ],
      components: [
        "lib/chart-bot/capture.ts — Puppeteer chart screenshot",
        "lib/chart-bot/analyze.ts — AI analysis with context",
        "lib/chart-bot/discord.ts — Post to Discord webhook"
      ],
      dependencies: [
        "Puppeteer or Playwright (chart capture)",
        "OpenAI or Claude API (analysis)",
        "Discord webhook",
        "Cron scheduler (Vercel cron or external)"
      ],
      acceptanceCriteria: [
        "Captures chart at scheduled times without manual intervention",
        "AI analysis references specific levels from today's report",
        "Analysis is concise (2-3 sentences max)",
        "Posts to correct Discord channel",
        "Handles errors gracefully (no duplicate posts, no crashes)"
      ]
    }
  },
  {
    id: "content-calendar-dashboard",
    rank: 5,
    title: "Content Calendar Dashboard",
    description: "Planning + tracking dashboard for all content tasks.",
    assessment: "Planning + tracking dashboard for all content tasks. Shows: (1) Daily/weekly content schedule (2) Status of each task (pending/in-progress/done) (3) Links to template + checklist for each task type (morning brief, EOD wrap, HIRO alert, weekly review, etc). Single view to see what's due, what's done, what's blocked.",
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "workflow",
    isNew: true,
    techSpec: {
      overview: "Admin dashboard showing all scheduled content tasks with status tracking. Single view to manage daily/weekly content production.",
      inputs: [
        "Content schedule (static config of what's due when)",
        "Task status from database or state file",
        "Links to templates and checklists"
      ],
      outputs: [
        "Calendar view showing week's content tasks",
        "Status indicators: pending (gray), in-progress (yellow), done (green), blocked (red)",
        "Quick links to templates, checklists, and output destinations"
      ],
      implementation: [
        "1. Define content schedule in config: { task, time, channel, template, checklist }",
        "2. Create database table `content_tasks` (date, task_id, status, completed_at, notes)",
        "3. Calendar UI: week view with task cards",
        "4. Task card shows: name, time, status, action buttons",
        "5. Click task → modal with template link, checklist link, mark complete button",
        "6. Dashboard header: today's pending count, this week's completion rate"
      ],
      dataFlow: "Schedule config + task status → calendar rendering → status updates → database",
      apiEndpoints: [
        "GET /api/content/schedule?week=YYYY-WW — Returns week's tasks with status",
        "PATCH /api/content/tasks/:id — Update task status",
        "GET /api/content/templates — List all templates with links"
      ],
      components: [
        "app/admin/content-calendar/page.tsx — Main dashboard",
        "components/content/WeekCalendar.tsx — Calendar grid",
        "components/content/TaskCard.tsx — Individual task display",
        "lib/content/schedule.ts — Static schedule configuration"
      ],
      dependencies: [
        "Supabase (content_tasks table)",
        "Existing templates and checklists"
      ],
      acceptanceCriteria: [
        "Shows all scheduled content tasks for the week",
        "Status is accurate and updates in real-time",
        "Templates and checklists are accessible in one click",
        "Dashboard loads in <2 seconds",
        "Mobile responsive for on-the-go checking"
      ]
    }
  },
  {
    id: "ai-video-content-pipeline",
    rank: 6,
    title: "AI Video Content Pipeline",
    description: "Daily report → 90-sec video recap. ElevenLabs voice + chart visuals via FFmpeg.",
    assessment: "Daily report → 90-sec video recap. ElevenLabs voice + chart visuals via FFmpeg. Scales content infinitely — one report becomes text + image + video. Distribution: X, YouTube Shorts, TikTok.",
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "workflow",
    techSpec: {
      overview: "Automated pipeline that converts daily reports into short-form video content with AI voiceover and chart visuals.",
      inputs: [
        "Daily report markdown",
        "Key levels and mode",
        "Chart screenshots (static or animated)",
        "Script generated from report"
      ],
      outputs: [
        "90-second MP4 video (1080x1920 for Shorts/TikTok, 1920x1080 for X)",
        "AI voiceover from ElevenLabs",
        "Subtitles/captions burned in",
        "Thumbnail image"
      ],
      implementation: [
        "1. Script generator: Extract key points from report, format as 90-sec script",
        "2. Voice: Send script to ElevenLabs API, get MP3",
        "3. Visuals: Generate chart cards, key level overlays, mode badge animations",
        "4. Compose: FFmpeg combines audio + visuals + subtitles",
        "5. Output: Two formats (vertical for Shorts, horizontal for X)",
        "6. Storage: Upload to cloud storage, return URLs"
      ],
      dataFlow: "Report → script → ElevenLabs audio → visual generation → FFmpeg composition → output",
      apiEndpoints: [
        "POST /api/video/generate — Start video generation job",
        "GET /api/video/status/:jobId — Check job status",
        "GET /api/video/download/:jobId — Get video URL when complete"
      ],
      components: [
        "lib/video/scriptGenerator.ts — Report to script",
        "lib/video/elevenlabs.ts — TTS API wrapper",
        "lib/video/visualGenerator.ts — Chart/overlay images",
        "lib/video/composer.ts — FFmpeg composition"
      ],
      dependencies: [
        "ElevenLabs API (TTS)",
        "FFmpeg (installed on server or Lambda)",
        "Cloud storage (S3/Cloudflare R2)",
        "Queue system for async processing"
      ],
      acceptanceCriteria: [
        "Video is 60-90 seconds long",
        "Audio is clear and properly synced",
        "Subtitles are accurate and readable",
        "Both vertical and horizontal formats generated",
        "Generation completes in <5 minutes",
        "Video file size is reasonable (<50MB)"
      ]
    }
  },
];

export const goal2Weak: WeakItem[] = [
  { id: "hiro-alert-delay-system", title: "HIRO Alert Delay System", reason: "Over-engineered, simpler solutions exist", category: "workflow" },
  { id: "catalyst-calendar-visual", title: "Catalyst Calendar Visual", reason: "Parent item was cut", category: "workflow" },
  { id: "weekly-flow-digest", title: "Weekly Flow Digest", reason: "Too vague to build", category: "workflow" },
  { id: "one-click-post-queue", title: "One-Click Post Queue", reason: "Not useful at this stage", category: "workflow" },
];

// ============ GOAL 3: PLATFORM EXCELLENCE ============
export const goal3Strong: BacklogItem[] = [
  {
    id: "spotgamma-data-expansion",
    rank: 1,
    title: "SpotGamma Data Expansion",
    description: "Capture additional SpotGamma screenshots (Equity Hub, FlowPatrol, etc.) and incorporate into daily reports.",
    assessment: "Capture additional SpotGamma screenshots (Equity Hub, FlowPatrol, etc.) and incorporate into daily reports. Subscribers get $200/mo worth of SpotGamma intel distilled into actionable format. Currently only using HIRO — 80% of features untapped.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "platform",
    isNew: true,
    techSpec: {
      overview: "Expand SpotGamma data capture to include Equity Hub, FlowPatrol, and other tools. Distill into daily reports for subscribers.",
      inputs: [
        "SpotGamma Equity Hub data (TSLA key levels, gamma exposure)",
        "SpotGamma FlowPatrol (institutional flow signals)",
        "SpotGamma HIRO (already captured)",
        "SpotGamma Options Hub (OI, volume, Greeks)"
      ],
      outputs: [
        "Daily screenshots saved to ~/trading_inputs/YYYY-MM-DD/",
        "Extracted key data points in structured format",
        "Integration into daily report template"
      ],
      implementation: [
        "1. Document all SpotGamma pages and their key data points",
        "2. Create capture schedule: Equity Hub (7am), FlowPatrol (market hours), HIRO (3x daily)",
        "3. Automated capture via browser automation (Puppeteer/Playwright)",
        "4. OCR or manual extraction of key numbers",
        "5. Store in database table `spotgamma_data` (date, source, data_json)",
        "6. Update daily report template to include new sections"
      ],
      dataFlow: "SpotGamma pages → screenshot capture → data extraction → database → report integration",
      apiEndpoints: [
        "POST /api/spotgamma/capture — Trigger capture for specific source",
        "GET /api/spotgamma/data?date=YYYY-MM-DD — Get all SpotGamma data for date",
        "GET /api/spotgamma/sources — List available sources and capture status"
      ],
      components: [
        "lib/spotgamma/capture.ts — Browser automation for screenshots",
        "lib/spotgamma/extract.ts — Data extraction from images/pages",
        "lib/spotgamma/sources.ts — Source configuration (URLs, selectors)"
      ],
      dependencies: [
        "Puppeteer/Playwright (capture)",
        "SpotGamma subscription (already have)",
        "OCR service (optional, for text extraction)"
      ],
      acceptanceCriteria: [
        "Capture Equity Hub, FlowPatrol, HIRO at scheduled times",
        "Key levels are extracted accurately",
        "Data is stored and accessible via API",
        "Daily report includes new SpotGamma sections",
        "No manual intervention required for capture"
      ]
    }
  },
  {
    id: "public-accuracy-page",
    rank: 2,
    title: "Public Accuracy Page",
    description: "flacko.ai/accuracy — historical track record anyone can verify. Marketing + transparency.",
    assessment: "flacko.ai/accuracy — historical track record anyone can verify. Marketing + transparency.",
    rating: "★★★★★",
    stars: 5,
    status: "strong",
    category: "platform",
    isNew: true,
    techSpec: {
      overview: "Same as 'Public Accuracy Dashboard' in Goal 1. Single implementation serves both growth and platform goals.",
      inputs: ["See 'public-accuracy-dashboard' tech spec"],
      outputs: ["See 'public-accuracy-dashboard' tech spec"],
      implementation: ["Reference: goal1Strong → public-accuracy-dashboard"],
      acceptanceCriteria: ["See 'public-accuracy-dashboard' tech spec"]
    }
  },
  {
    id: "discord-ideas-feedback-integration",
    rank: 3,
    title: "Discord #ideas-and-feedback Integration",
    description: "Channel exists. Need: Trunks gets access to messages → reviews periodically → adds good ideas to backlog.",
    assessment: "Channel exists. Need: Trunks gets access to messages in #ideas-and-feedback → reviews periodically → adds good ideas to product backlog. Closes the feedback loop.",
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "platform",
    techSpec: {
      overview: "Connect Trunks (AI agent) to Discord #ideas-and-feedback channel to review suggestions and add good ones to product backlog.",
      inputs: [
        "Discord channel messages from #ideas-and-feedback",
        "Message content, author, timestamp, reactions"
      ],
      outputs: [
        "Weekly summary of new ideas",
        "Curated ideas added to product backlog",
        "Acknowledgment posted to channel for implemented ideas"
      ],
      implementation: [
        "1. Set up Discord bot or webhook to receive messages from #ideas-and-feedback",
        "2. Store messages in `discord_feedback` table (message_id, content, author, created_at, status)",
        "3. Weekly review job: Trunks reads new messages, categorizes, and rates",
        "4. High-rated ideas → add to backlog with 'community-suggested' tag",
        "5. Optional: Post acknowledgment when idea is added or implemented"
      ],
      dataFlow: "Discord channel → webhook/bot → database → weekly review → backlog integration",
      apiEndpoints: [
        "POST /api/discord/feedback — Webhook endpoint for new messages",
        "GET /api/discord/feedback?status=new — List unreviewed feedback",
        "PATCH /api/discord/feedback/:id — Update feedback status"
      ],
      components: [
        "lib/discord/feedbackWebhook.ts — Receive and store messages",
        "app/admin/feedback/page.tsx — Review UI for feedback",
        "lib/discord/postAcknowledgment.ts — Reply to channel"
      ],
      dependencies: [
        "Discord bot token or webhook",
        "Supabase (discord_feedback table)"
      ],
      acceptanceCriteria: [
        "All messages from #ideas-and-feedback are captured",
        "Messages can be reviewed in admin UI",
        "Good ideas can be promoted to backlog with one click",
        "Optional acknowledgment posts work correctly"
      ]
    }
  },
  {
    id: "education-hub",
    rank: 4,
    title: "Education Hub",
    description: "Onboarding curriculum for new members. Explains mode system, key levels, how to use alerts.",
    assessment: "Onboarding curriculum for new members. Explains mode system, key levels, how to use alerts. Reduces churn, increases perceived value.",
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "platform",
    techSpec: {
      overview: "Educational section on flacko.ai explaining the Flacko system: modes, levels, alerts, and how to use them for trading.",
      inputs: [
        "Existing documentation (rulebook, mode explanations)",
        "FAQs from Discord",
        "Visual examples of each concept"
      ],
      outputs: [
        "Multi-page education section at /learn",
        "Topics: Intro, Modes, Key Levels, Alerts, Reading Reports",
        "Progress tracking for logged-in users (optional)"
      ],
      implementation: [
        "1. Outline curriculum: 5-7 core topics",
        "2. Write content for each topic (500-1000 words + visuals)",
        "3. Create page structure: /learn, /learn/modes, /learn/levels, etc.",
        "4. Add interactive elements: quizzes, hover tooltips, example cards",
        "5. Optional: track completion in user profile",
        "6. Link from onboarding email and Discord welcome"
      ],
      components: [
        "app/learn/page.tsx — Main education hub",
        "app/learn/[topic]/page.tsx — Individual topic pages",
        "components/learn/TopicCard.tsx — Topic overview card",
        "components/learn/Quiz.tsx — Interactive quiz component"
      ],
      dependencies: [
        "Existing rulebook content",
        "MDX or CMS for content management"
      ],
      acceptanceCriteria: [
        "Covers all core concepts: modes, levels, alerts, reports",
        "Each topic has clear explanations + visual examples",
        "Navigation is intuitive (sidebar or progress bar)",
        "Mobile responsive",
        "Accessible to non-subscribers (marketing value)"
      ]
    }
  },
  {
    id: "discord-knowledge-bot-rag",
    rank: 5,
    title: "Discord Knowledge Bot (RAG)",
    description: "AI bot trained on daily reports, rulebook, key levels. Members ask questions, get instant answers.",
    assessment: "AI bot trained on daily reports, rulebook, key levels. Members ask questions, get instant answers. Bobby Axelrod personality. 24/7 support without Justin's time.",
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "platform",
    techSpec: {
      overview: "Discord bot using RAG (Retrieval Augmented Generation) to answer member questions based on Flacko knowledge base.",
      inputs: [
        "Knowledge base: daily reports, rulebook, mode definitions, FAQs",
        "User question from Discord",
        "Context: current mode, today's levels (for relevant answers)"
      ],
      outputs: [
        "AI-generated answer in Discord",
        "Bobby Axelrod personality (confident, direct, trading-focused)",
        "Source citation when referencing reports"
      ],
      implementation: [
        "1. Build knowledge base: index all reports, rulebook, FAQs into vector DB",
        "2. Create Discord bot that listens in designated channels",
        "3. On question: embed query → retrieve relevant docs → generate answer with LLM",
        "4. System prompt: Bobby Axelrod personality, trading context",
        "5. Rate limiting: prevent spam, track usage",
        "6. Fallback: 'I don't know, ask Justin' for edge cases"
      ],
      dataFlow: "User question → embed → vector search → relevant docs → LLM → Discord reply",
      apiEndpoints: [
        "POST /api/bot/query — Internal endpoint for RAG query",
        "POST /api/bot/index — Reindex knowledge base",
        "GET /api/bot/stats — Usage statistics"
      ],
      components: [
        "lib/bot/vectorStore.ts — Vector DB operations (Pinecone/Supabase pgvector)",
        "lib/bot/rag.ts — Retrieval and generation logic",
        "lib/bot/discord.ts — Discord bot client",
        "lib/bot/personality.ts — Bobby Axelrod system prompt"
      ],
      dependencies: [
        "Vector database (Pinecone, Supabase pgvector, or similar)",
        "OpenAI or Claude API (generation)",
        "Discord.js (bot framework)",
        "Embedding model (OpenAI ada-002 or similar)"
      ],
      acceptanceCriteria: [
        "Answers questions about modes, levels, alerts accurately",
        "Personality is consistent (Bobby Axelrod vibe)",
        "Response time <5 seconds",
        "Cites sources when referencing specific reports",
        "Handles 'I don't know' gracefully",
        "Rate limiting prevents abuse"
      ]
    }
  },
  {
    id: "paper-trading-bot",
    rank: 6,
    title: "Paper Trading Bot",
    description: "Simulated trader using Flacko system. Proves the system works with real-time paper trades.",
    assessment: "Simulated trader using Flacko system. Proves the system works with real-time paper trades. Marketing asset + builds trust.",
    rating: "★★★★",
    stars: 4,
    status: "strong",
    category: "platform",
    techSpec: {
      overview: "Automated paper trading bot that follows Flacko signals, tracking hypothetical P&L to prove the system works.",
      inputs: [
        "Daily mode and key levels from report",
        "Alert triggers (price hits level)",
        "Position sizing rules from mode (daily cap %)",
        "Entry/exit rules from rulebook"
      ],
      outputs: [
        "Paper trade log: entry, exit, P&L, reasoning",
        "Running P&L tracker (daily, weekly, monthly)",
        "Public dashboard showing performance",
        "Discord posts for significant trades"
      ],
      implementation: [
        "1. Define trading rules: when to enter (alert trigger), position size (mode cap), exit (target/stop)",
        "2. Create trade executor: monitors price, executes paper trades based on rules",
        "3. Store trades in `paper_trades` table (entry_price, exit_price, size, pnl, reasoning)",
        "4. Calculate running P&L with proper position sizing",
        "5. Public dashboard at /paper-trading showing all trades and performance",
        "6. Optional: Discord announcements for entries/exits"
      ],
      dataFlow: "Price alerts → trade executor → paper_trades table → P&L calculation → public dashboard",
      apiEndpoints: [
        "GET /api/paper-trading/trades — List all paper trades",
        "GET /api/paper-trading/performance — P&L summary",
        "POST /api/paper-trading/execute — (internal) Execute paper trade"
      ],
      components: [
        "lib/paper-trading/executor.ts — Trade execution logic",
        "lib/paper-trading/rules.ts — Entry/exit/sizing rules",
        "lib/paper-trading/pnl.ts — P&L calculation",
        "app/paper-trading/page.tsx — Public dashboard"
      ],
      dependencies: [
        "Price data feed (Yahoo Finance or similar)",
        "Existing alert system",
        "Supabase (paper_trades table)"
      ],
      acceptanceCriteria: [
        "Follows Flacko rules exactly (no cherry-picking)",
        "All trades are logged with reasoning",
        "P&L is calculated accurately with position sizing",
        "Public dashboard shows full transparency",
        "No real money is ever used"
      ]
    }
  },
];

export const goal3Weak: WeakItem[] = [
  { id: "tradingagents-review", title: "TradingAgents Review", reason: "Research, not shipping value", category: "platform" },
  { id: "alert-accuracy-tracking", title: "Alert Accuracy Tracking", reason: "We show levels/scenarios, not directional calls", category: "platform" },
  { id: "mobile-push-notifications", title: "Mobile Push Notifications", reason: "No mobile app; alternatives not worth complexity", category: "platform" },
  { id: "member-performance-dashboard", title: "Member Performance Dashboard", reason: "Not useful at this stage", category: "platform" },
];

// ============ BACKLOG (Future Consideration) ============
export const backlogStorage: BacklogStorageItem[] = [
  { id: "b12", title: "Gamma Explainer Series", description: "Educational thread series explaining gamma mechanics and how they affect TSLA price action.", reason: "High effort, low conversion — better focus on proof-based content first." },
  { id: "b13", title: "Monthly State of TSLA", description: "Monthly macro-style recap of TSLA trend, catalysts, and positioning.", reason: "Not differentiated vs broader market commentary — low ROI for now." },
  { id: "b14", title: "HIRO Swing Visualization", description: "Visual map of HIRO swing signals over time with price overlays.", reason: "Too niche for current audience; limited growth impact." },
  { id: "b15", title: "TradingView Table Export", description: "Automated export of key TradingView indicator tables into report format.", reason: "Nice-to-have; not a core driver of value." },
  { id: "b16", title: "QMD Local Search", description: "Local semantic search over past reports, journals, and system docs.", reason: "Internal tooling only; not subscriber-facing." },
  { id: "b17", title: "Export Claude KB", description: "Periodic export of Claude knowledge base for backup/portability.", reason: "Maintenance task; not urgent." },
];

// ============ CODEX OVERNIGHT PRIORITY ============
export const codexPriorities = [
  { id: 1, title: "Weekly Report Template", enables: "Unblocks Sunday workflow immediately" },
  { id: 2, title: "Daily Mode Card Generator", enables: "Enables daily X presence with zero effort" },
  { id: 3, title: "Accuracy Comparison Generator", enables: "Enables proof content at scale" },
  { id: 4, title: "Report-to-Tweet Pipeline", enables: "Eliminates blank page, generates draft tweets from reports" },
];

// Combined arrays for easy access
export const allStrongItems = [...goal1Strong, ...goal2Strong, ...goal3Strong];
export const allWeakItems = [...goal1Weak, ...goal2Weak, ...goal3Weak];
