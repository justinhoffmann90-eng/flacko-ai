export type BacklogStatus = "strong" | "weak" | "backlog";
export type BacklogPriority = 1 | 2 | 3 | 4 | 5 | 6;
export type BacklogCategory = "growth" | "workflow" | "platform";

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
  },
];

export const goal1Weak: WeakItem[] = [
  {
    id: "monday-preview-posts",
    title: "Monday Preview Posts",
    reason: "Maintains audience, doesn't grow it",
    category: "growth",
  },
  {
    id: "gamma-strike-rejection",
    title: "Gamma Strike Rejection",
    reason: "Opportunistic only, can't schedule",
    category: "growth",
  },
  {
    id: "quote-tweet-news",
    title: "Quote Tweet the News",
    reason: "Undifferentiated, everyone does it",
    category: "growth",
  },
  {
    id: "why-it-moved-recaps",
    title: '"Why It Moved" Recaps',
    reason: "Reactive content, not differentiated",
    category: "growth",
  },
  {
    id: "pre-earnings-playbook",
    title: "Pre-Earnings Playbook",
    reason: "High effort, only 4x/year",
    category: "growth",
  },
  {
    id: "free-daily-levels-email",
    title: "Free Daily Levels Email",
    reason: "Not building email list",
    category: "growth",
  },
  {
    id: "what-would-you-do-polls",
    title: '"What Would You Do?" Polls',
    reason: "Not a fit",
    category: "growth",
  },
  {
    id: "contrarian-call-accountability",
    title: "Contrarian Call + Accountability",
    reason: "Not a fit",
    category: "growth",
  },
  {
    id: "subscriber-testimonials",
    title: "Subscriber Testimonials",
    reason: "Not a fit",
    category: "growth",
  },
  {
    id: "loss-autopsy-posts",
    title: "Loss Autopsy Posts",
    reason: "Not a fit",
    category: "growth",
  },
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
  },
];

export const goal2Weak: WeakItem[] = [
  {
    id: "hiro-alert-delay-system",
    title: "HIRO Alert Delay System",
    reason: "Over-engineered, simpler solutions exist",
    category: "workflow",
  },
  {
    id: "catalyst-calendar-visual",
    title: "Catalyst Calendar Visual",
    reason: "Parent item was cut",
    category: "workflow",
  },
  {
    id: "weekly-flow-digest",
    title: "Weekly Flow Digest",
    reason: "Too vague to build",
    category: "workflow",
  },
  {
    id: "one-click-post-queue",
    title: "One-Click Post Queue",
    reason: "Not useful at this stage",
    category: "workflow",
  },
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
  },
];

export const goal3Weak: WeakItem[] = [
  {
    id: "tradingagents-review",
    title: "TradingAgents Review",
    reason: "Research, not shipping value",
    category: "platform",
  },
  {
    id: "alert-accuracy-tracking",
    title: "Alert Accuracy Tracking",
    reason: "We show levels/scenarios, not directional calls",
    category: "platform",
  },
  {
    id: "mobile-push-notifications",
    title: "Mobile Push Notifications",
    reason: "No mobile app; alternatives not worth complexity",
    category: "platform",
  },
  {
    id: "member-performance-dashboard",
    title: "Member Performance Dashboard",
    reason: "Not useful at this stage",
    category: "platform",
  },
];

// ============ BACKLOG (Future Consideration) ============
export const backlogStorage: BacklogStorageItem[] = [
  { id: "b1", title: "Monday Preview Posts", reason: "Maintains, doesn't grow" },
  { id: "b2", title: "Gamma Strike Posts", reason: "Opportunistic only" },
  { id: "b3", title: "Quote Tweet News", reason: "Undifferentiated" },
  { id: "b4", title: "HIRO Delay System", reason: "Over-engineered" },
  { id: "b5", title: "Catalyst Visual", reason: "Parent cut" },
  { id: "b6", title: "AI Video Pipeline", reason: "High effort, unproven" },
  { id: "b7", title: "Weekly Flow Digest", reason: "Too vague" },
  { id: "b8", title: "TradingAgents Review", reason: "Research only" },
  { id: "b9", title: "Education Hub", reason: "Not priority" },
  { id: "b10", title: "Paper Trading Bot", reason: "Complex" },
  { id: "b11", title: "Discord Knowledge Bot", reason: "Low volume" },
  { id: "b12", title: "Gamma Explainer Series", reason: "Low conversion" },
  { id: "b13", title: "Monthly State of TSLA", reason: "Not differentiated" },
  { id: "b14", title: "HIRO Swing Visualization", reason: "Too niche" },
  { id: "b15", title: "TradingView Export", reason: "Nice-to-have" },
  { id: "b16", title: "QMD Local Search", reason: "Internal only" },
  { id: "b17", title: "Export Claude KB", reason: "Maintenance" },
];

// ============ CODEX OVERNIGHT PRIORITY ============
export const codexPriorities = [
  {
    id: 1,
    title: "Weekly Report Template",
    enables: "Unblocks Sunday workflow immediately",
  },
  {
    id: 2,
    title: "Daily Mode Card Generator",
    enables: "Enables daily X presence with zero effort",
  },
  {
    id: 3,
    title: "Accuracy Comparison Generator",
    enables: "Enables proof content at scale",
  },
  {
    id: 4,
    title: "Report-to-Tweet Pipeline",
    enables: "Eliminates blank page, generates draft tweets from reports",
  },
];

// Combined arrays for easy access
export const allStrongItems = [...goal1Strong, ...goal2Strong, ...goal3Strong];
export const allWeakItems = [...goal1Weak, ...goal2Weak, ...goal3Weak];
