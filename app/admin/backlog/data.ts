export type BacklogStatus = "backlog" | "in-progress" | "done";
export type BacklogPriority = "P0" | "P1" | "P2";

export interface BacklogItem {
  id: string;
  priority: BacklogPriority;
  title: string;
  description: string;
  status: BacklogStatus;
  tags: string[];
  sourceUrl?: string;
  sourceAuthor?: string;
  dateAdded: string;
  effort: "quick" | "medium" | "large";
  valueProposition: string;
  techHighlights?: string[];
  dependencies?: string[];
  nextActions?: string[];
}

export const backlogItems: BacklogItem[] = [
  {
    id: "multi-timeframe-analysis",
    priority: "P0",
    title: "Multi-timeframe analysis in daily reports",
    description:
      "Add multi-timeframe breakdowns (1H/4H/1D/1W) to improve context and trend alignment in daily reports.",
    status: "in-progress",
    tags: ["Reports", "Analysis", "Pipeline"],
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Gives subscribers clearer regime context and higher-confidence trade planning across time horizons.",
  },
  {
    id: "email-delivery-monitoring",
    priority: "P0",
    title: "Email delivery reliability monitoring",
    description:
      "Track bounce rates, delays, and deliverability metrics with alerting tied to onboarding health.",
    status: "backlog",
    tags: ["Email", "Monitoring", "Onboarding"],
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Prevents silent onboarding failures and protects subscriber retention by catching delivery issues early.",
  },
  {
    id: "subscriber-growth-dashboard",
    priority: "P1",
    title: "Subscriber growth dashboard",
    description:
      "Visualize new signups, churn, and conversion funnels with daily/weekly trend lines.",
    status: "backlog",
    tags: ["Growth", "Analytics", "Dashboard"],
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Makes growth bottlenecks visible so marketing and onboarding improvements are data-driven.",
  },
  {
    id: "alert-accuracy-tracking",
    priority: "P1",
    title: "Alert accuracy tracking",
    description:
      "Measure alert hit rate, false positives, and post-alert performance outcomes.",
    status: "backlog",
    tags: ["Alerts", "Quality", "Analytics"],
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Builds trust by quantifying alert performance and guiding tuning decisions.",
  },
  {
    id: "mobile-push-notifications",
    priority: "P2",
    title: "Mobile app push notifications",
    description:
      "Add mobile push alerts for key price levels, report drops, and system updates.",
    status: "backlog",
    tags: ["Mobile", "Notifications"],
    dateAdded: "2026-02-01",
    effort: "large",
    valueProposition: "Improves engagement and response speed for subscribers who rely on mobile alerts.",
  },
  {
    id: "historical-report-archive",
    priority: "P2",
    title: "Historical report archive",
    description:
      "Create a searchable archive for past reports with filters by date, theme, and market regime.",
    status: "done",
    tags: ["Reports", "Archive", "Search"],
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Lets subscribers and internal teams reference prior regimes and decisions for better context.",
  },
  {
    id: "clawdbot-kling-ugc-video-ads",
    priority: "P1",
    title: "Clawdbot + Kling AI Video Ad Automation",
    description:
      "Automated UGC video ad creation pipeline using Clawdbot for scripting, prompt generation, QC, and campaign organization with Kling AI for video generation. The core value is scalable ad or educational video production, though the viral post’s cost claims are disputed.",
    status: "backlog",
    tags: ["Video", "Automation", "UGC"],
    sourceUrl: "https://x.com/maverickecom/status/2017245473145245815",
    sourceAuthor: "@maverickecom",
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Could accelerate creation of educational or promotional video content if Flacko AI decides to invest in video distribution.",
    techHighlights: [
      "Clawdbot generates scripts and Kling prompts, triggers batch video jobs, and runs QC loops.",
      "Automated vision review flags bad motion/off-brand outputs for human review.",
      "Pipeline organizes, tags, and tracks A/B testing across generated ads.",
      "Batch workflow scales video library creation with rate-limit awareness.",
    ],
    dependencies: [
      "Kling AI account and (if available) API access",
      "Kling pricing and rate limit validation",
      "Video storage/hosting for generated assets",
    ],
    nextActions: [
      "Test Kling directly and verify real pricing/rate limits.",
      "Run a small manual batch (3-5 scripts) to assess quality.",
      "Decide whether to pursue a semi-automated pilot.",
    ],
  },
  {
    id: "clawdbot-makeugc-v2-video-automation",
    priority: "P2",
    title: "Clawdbot + MakeUGC V.2 Video Automation",
    description:
      "UGC ad automation concept similar to the Kling workflow but using MakeUGC V.2 as the video generation layer. Requires verification of the tool’s legitimacy, pricing, and API access before any build work.",
    status: "backlog",
    tags: ["Video", "Automation", "Research"],
    sourceUrl: "https://x.com/spwfeijen/status/2017561060144816416",
    sourceAuthor: "@spwfeijen",
    dateAdded: "2026-02-01",
    effort: "quick",
    valueProposition: "If MakeUGC V.2 is real and cheaper than Kling, it could lower costs for future video automation experiments.",
    techHighlights: [
      "Same Clawdbot orchestration flow as Kling: scripts → prompts → video gen → QC → library.",
      "Unknown API and pricing; research is prerequisite before integration.",
      "Potential consolidation with other video automation specs after validation.",
    ],
    nextActions: [
      "Research whether MakeUGC V.2 exists and identify pricing/API access.",
      "Compare capabilities vs Kling/Sora and decide if it’s worth a pilot.",
      "If unverified, mark as WONTFIX or merge into broader video automation backlog.",
    ],
  },
  {
    id: "longform-ai-video-creation",
    priority: "P1",
    title: "Longform AI Video Creation",
    description:
      "End-to-end workflow for creating 30+ second realistic AI videos with high-quality audio and human-like visuals. Covers base image creation, script writing, TTS, and multiple video generation paths for talking-head and dynamic content.",
    status: "backlog",
    tags: ["Video", "Content", "Workflow"],
    sourceUrl: "https://x.com/Mho_23/status/2017345525305995532",
    sourceAuthor: "@Mho_23",
    dateAdded: "2026-02-01",
    effort: "large",
    valueProposition: "Enables Flacko AI to ship polished explainer and educational videos with a repeatable pipeline and modest monthly tooling costs.",
    techHighlights: [
      "High-quality base image generation via Nano Banana Pro (Gemini) with JSON styling templates.",
      "Audio generation options: Minimax (easy), ElevenLabs v3 (highest quality), Qwen3-TTS (open source).",
      "Video generation paths for talking-head (InfiniteTalk/Veed/Wan) and dynamic UGC (Sora 2 Storyboard).",
      "Phased rollout from proof-of-concept to automation with reusable prompt templates.",
    ],
    dependencies: [
      "Minimax or ElevenLabs account",
      "wavespeed.ai or cloud rendering access",
      "Sora 2 access (for dynamic content)",
    ],
    nextActions: [
      "Run a POC: generate base image, script, audio, and one 30s video.",
      "Compare Minimax vs ElevenLabs quality for target content.",
      "Document a repeatable workflow before automation.",
    ],
  },
  {
    id: "multi-agent-mission-control-system",
    priority: "P0",
    title: "Multi-Agent Mission Control System",
    description:
      "Blueprint for scaling Clawdbot into a coordinated team of 10+ agents with shared task management, heartbeats, and persistent memory. Directly maps to Flacko AI’s research, monitoring, content, and QA needs.",
    status: "backlog",
    tags: ["Agents", "Automation", "Ops"],
    sourceUrl: "https://x.com/pbteja1998/status/2017662163540971756",
    sourceAuthor: "@pbteja1998",
    dateAdded: "2026-02-01",
    effort: "large",
    valueProposition: "Could save 3–5 hours/day by distributing research, monitoring, and content production across specialized agents.",
    techHighlights: [
      "Each agent is a separate Clawdbot session with its own SOUL.md, memory, and cron heartbeat.",
      "Mission Control task database (file-based MVP or Convex/Supabase) coordinates tasks and activity feed.",
      "Notification/mention system routes messages to agents on their next heartbeat.",
      "Phased rollout: 2-agent POC → backend → specialized agents → UI.",
    ],
    dependencies: [
      "Define agent roles and session keys",
      "Mission Control storage (file-based or database)",
      "Notification daemon/cron scheduling",
    ],
    nextActions: [
      "Review spec and decide GO/NO-GO for Phase 1.",
      "Spin up a Monitor agent (Scout) with 15-min heartbeat.",
      "Validate agent-to-agent communication before scaling.",
    ],
  },
  {
    id: "reddit-bot-tomo-ai",
    priority: "P1",
    title: "Reddit Bot for Tomo AI",
    description:
      "Automated Reddit auto-commenter to promote Tomo AI, based on an open-source bot that learns writing style and batches comments across subreddits. Includes lead identification and activity tracking with rate-limit compliance.",
    status: "backlog",
    tags: ["Growth", "Reddit", "Automation"],
    sourceUrl: "https://x.com/joshuaipark/status/2017945310706934010",
    sourceAuthor: "@joshuaipark",
    dateAdded: "2026-02-01",
    effort: "medium",
    valueProposition: "Could drive low-cost lead generation for Tomo AI by scaling authentic Reddit engagement.",
    techHighlights: [
      "Uses Claude for context-aware comment generation with a 16-point quality checklist.",
      "Playwright-based browser automation and batch quotas across subreddits.",
      "Style personalization via sample comments and community-specific rules.",
      "Tracking system for comments, leads, and daily activity logs.",
    ],
    dependencies: [
      "Access to the auto-commenter repo",
      "Reddit account and subreddit rule analysis",
      "Style samples for personalization",
    ],
    nextActions: [
      "Collect 8–10 sample comments for personalization.",
      "Configure the bot and test a single comment workflow.",
      "Set initial subreddit list and daily quotas.",
    ],
  },
  {
    id: "remote-clawdbot-setup-service",
    priority: "P1",
    title: "Remote Clawdbot Setup Service",
    description:
      "Remote-first, white-glove Clawdbot setup service with screen sharing, tiered packages, and follow-up support. Aims to remove technical friction for non-technical users and generate a side revenue stream.",
    status: "backlog",
    tags: ["Business", "Services", "Clawdbot"],
    sourceUrl: "https://x.com/michael_chomsky/status/2017127819722256686",
    sourceAuthor: "@michael_chomsky",
    dateAdded: "2026-02-01",
    effort: "large",
    valueProposition: "Potential side business that monetizes Clawdbot expertise and builds brand credibility without impacting core product if managed carefully.",
    techHighlights: [
      "Remote setup flow using Stripe + Calendly/Cal.com + Zoom, with pre-call checklist and QA steps.",
      "Tiered service packages (basic/full/team) and support windows.",
      "Operational playbook includes setup checklist, recordings, and follow-up automation.",
      "Scalable model via contractor specialists and standardized training.",
    ],
    dependencies: [
      "Landing page and payment scheduling stack",
      "Setup checklists and support workflow",
      "Validation interviews or beta customers",
    ],
    nextActions: [
      "Validate demand with 5 free setups and pricing feedback.",
      "If positive, build MVP landing page with Stripe + scheduling.",
      "Decide GO/NO-GO based on early conversion.",
    ],
  },
];
