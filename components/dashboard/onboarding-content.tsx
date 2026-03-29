"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Layers,
  Target,
  FileText,
  Bell,
  CalendarDays,
  Radar,
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  Gauge,
  Calendar,
  BookOpen,
} from "lucide-react";

// ─── A. Hero Section ─────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <div className="text-center py-8 md:py-14 px-2">
      <p className="text-xs md:text-sm text-muted-foreground tracking-widest uppercase">
        battlefield command intelligence
      </p>
      <h1 className="text-2xl md:text-5xl font-bold tracking-tight mt-3 leading-tight">
        the tsla operating system.
      </h1>
      <p className="text-base md:text-xl text-muted-foreground mt-2 max-w-xl mx-auto">
        one system. every scenario covered.
      </p>
      <p className="text-sm text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed px-2">
        we turn technicals, flow and catalysts into a daily playbook. wake up
        with a plan already prepared for you — scenarios mapped, price alerts
        activated, risk managed.
      </p>
    </div>
  );
}

// ─── B. Philosophy Card ──────────────────────────────────────────────────────

const philosophyItems = [
  {
    icon: Shield,
    title: "Risk First",
    description:
      "Every decision starts with how much risk the market warrants. You know your maximum exposure BEFORE you look at any chart. Mode sets the rules — you follow them.",
  },
  {
    icon: Layers,
    title: "Regime-Aware",
    description:
      "The system reads momentum, structure, and trend context across four timeframes — hourly, 4H, daily, and weekly. It adapts in real-time as conditions change.",
  },
  {
    icon: Target,
    title: "Rules-Based",
    description:
      "No gut feelings. Every mode assignment, every cap, every trim level follows documented rules — backtested across multiple market cycles and continuously validated.",
  },
];

function PhilosophyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Philosophy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {philosophyItems.map((item) => (
            <div key={item.title} className="flex gap-4 items-start">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── C. How It Works Card ────────────────────────────────────────────────────

const timelineSteps = [
  {
    step: 1,
    title: "BX-Trender reads market state",
    detail: "Mode assigned (GREEN → RED)",
  },
  {
    step: 2,
    title: "Mode sets your caps",
    detail: "Daily buy cap, trim cap, max invested",
  },
  {
    step: 3,
    title: "Report delivers levels",
    detail: "Support zones, trim targets, Kill Leverage",
  },
  {
    step: 4,
    title: "Alerts fire in real-time",
    detail: "React to pre-planned levels, not emotion",
  },
  {
    step: 5,
    title: "Weekly review grades performance",
    detail: "Accountability and system evolution",
  },
];

function HowItWorksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How the System Works</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {timelineSteps.map((item, idx) => (
            <div key={item.step} className="flex gap-4 relative">
              {idx < timelineSteps.length - 1 && (
                <div className="absolute left-[15px] top-8 w-0.5 h-full bg-border" />
              )}
              <div className="relative z-10 flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {item.step}
              </div>
              <div className="pb-8 last:pb-0">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── D. Mode System Card ─────────────────────────────────────────────────────

const modeRows = [
  {
    mode: "GREEN",
    color: "bg-green-500",
    textColor: "text-green-500",
    stance: "Full deployment",
    description: "Trend intact, momentum healthy. Lean in with conviction.",
  },
  {
    mode: "YELLOW (Improving)",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    stance: "Cautious optimism",
    description: "Early signs of recovery. System warming up — ease back in.",
  },
  {
    mode: "YELLOW",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    stance: "Moderate caution",
    description: "Warning signs present. Reduce exposure, tighten stops.",
  },
  {
    mode: "ORANGE",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    stance: "Defensive posture",
    description: "Structure weakening. Minimize new risk, protect capital.",
  },
  {
    mode: "RED",
    color: "bg-red-500",
    textColor: "text-red-500",
    stance: "Maximum defense",
    description: "Structure broken. Preserve capital above all else.",
  },
  {
    mode: "EJECTED",
    color: "bg-zinc-600",
    textColor: "text-zinc-400",
    stance: "Sideline",
    description: "Master Eject breached. Core position only — no new buys.",
  },
];

const spectrumColors = [
  { label: "GREEN", color: "bg-green-500" },
  { label: "YLW", color: "bg-yellow-500" },
  { label: "ORANGE", color: "bg-orange-500" },
  { label: "RED", color: "bg-red-500" },
  { label: "EJECT", color: "bg-zinc-600" },
];

function ModeSystemCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>The Mode System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mode is not commentary — it&apos;s your position-sizing rule set.
          Multiple inputs work together to classify market state and determine
          how aggressively you should be positioned.
        </p>

        {/* What drives modes — 2-col on mobile */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">What Determines Mode</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Gauge, title: "BX-Trender", desc: "Momentum structure — HH/HL/LH/LL patterns on daily + weekly." },
              { icon: TrendingUp, title: "EMA Structure", desc: "9, 13, 21 EMAs stacked bullish or bearish across timeframes." },
              { icon: TrendingDown, title: "RSI + SMI", desc: "Momentum oscillators confirming trend energy or fade." },
              { icon: Layers, title: "Multi-Timeframe", desc: "Hourly, 4H, daily, weekly all read before assigning mode." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs font-semibold">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Speed limit analogy */}
        <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary flex-shrink-0" />
            Think of it like a speed limit
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            GREEN is 65 mph on the highway — you can cruise. ORANGE is a 25 mph
            school zone — slow down. RED is a stop sign. You don&apos;t decide
            how fast to go — the road conditions do.
          </p>
        </div>

        {/* Mode cards — stacked on mobile, readable on all sizes */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Mode Reference</h3>
          <div className="space-y-2">
            {modeRows.map((row) => (
              <div
                key={row.mode}
                className="rounded-lg border border-border p-3 flex items-start gap-3"
              >
                <div className="flex-shrink-0 flex items-center gap-2 min-w-[130px]">
                  <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${row.color}`} />
                  <span className={`text-xs font-semibold ${row.textColor}`}>{row.mode}</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-medium text-foreground">{row.stance}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{row.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spectrum Bar */}
        <div className="space-y-1.5">
          <div className="flex rounded-lg overflow-hidden h-2.5">
            {spectrumColors.map((s) => (
              <div key={s.label} className={`flex-1 ${s.color}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
            {spectrumColors.map((s) => (
              <span key={s.label}>{s.label}</span>
            ))}
          </div>
        </div>

        {/* Early Warning + trend behavior */}
        <div className="space-y-2">
          <div className="rounded-lg border border-border p-3 space-y-1.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              Early Warning System
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mode downgrades happen BEFORE price crashes — not after. By the
              time mainstream indicators confirm a downtrend, the system has
              already reduced your exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-1">
              <h4 className="text-sm font-medium text-green-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                In an Uptrend
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                BX confirms higher highs, EMAs stack bullish. GREEN lets you
                deploy with conviction because structure is confirmed.
              </p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1">
              <h4 className="text-sm font-medium text-red-500 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 flex-shrink-0" />
                In a Downtrend
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                BX flags lower lows, EMAs roll bearish. Modes downgrade and
                trim caps activate automatically.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── E. What You Get Card ────────────────────────────────────────────────────

const featureItems = [
  {
    icon: FileText,
    title: "Daily Report",
    description: "Mode, levels, scenarios, and action plan. Published before market open.",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description: "Price alerts at every key level. Know when to act without watching charts.",
  },
  {
    icon: CalendarDays,
    title: "Weekly Review",
    description: "Performance grading with accuracy scores. System evolution tracked weekly.",
  },
  {
    icon: Radar,
    title: "Orb Signal Tracker",
    description: "17 backtested buy setups and avoid signals. See what's active right now.",
  },
];

function WhatYouGetCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What You Get Every Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featureItems.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border p-4 space-y-2 flex gap-3"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── E2. Beyond the Report Card ──────────────────────────────────────────────

const beyondItems = [
  {
    icon: MessageSquare,
    title: "Discord Community",
    description:
      "#tesla-research for curated news. #fs-insight for daily Fundstrat macro (Tom Lee, Mark Newton). #alerts for real-time price notifications. Taylor — our paper trading bot that runs the system live for full transparency.",
  },
  {
    icon: Calendar,
    title: "Catalyst Calendar",
    description:
      "Upcoming events that could move the stock — earnings, robotaxi milestones, product launches, macro events — with context on why each one matters.",
  },
  {
    icon: Radar,
    title: "Orb Signal Tracker",
    description:
      "17 backtested setups tracked in real-time. See what's active, what's on watch, and historical win rates. Quantified edge, not vibes.",
  },
  {
    icon: BookOpen,
    title: "Education Hub",
    description:
      "20+ articles explaining every concept — modes, gamma, kill leverage, EMA structure, and more. Understand the why behind every call.",
  },
];

function BeyondTheReportCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Beyond the Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {beyondItems.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border p-3 flex gap-3"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── F. Key Levels Explained Card ────────────────────────────────────────────

const levelTypes = [
  {
    type: "Support (S1–S4)",
    badge: "bg-blue-500/20 text-blue-400",
    description: "Where to buy, with stops defined below each level.",
  },
  {
    type: "Trim (T1–T4)",
    badge: "bg-green-500/20 text-green-400",
    description: "Where to take profit based on mode trim cap %.",
  },
  {
    type: "Kill Leverage",
    badge: "bg-red-500/20 text-red-400",
    description: "Non-negotiable defense line. Cut all leverage if breached.",
  },
  {
    type: "Slow Zone",
    badge: "bg-yellow-500/20 text-yellow-400",
    description: "Buying caps reduce dramatically to prevent overexposure.",
  },
];

function KeyLevelsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Understanding Your Levels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          SpotGamma gamma data + EMA structure creates a precise map of support
          and resistance. These aren&apos;t arbitrary lines — they&apos;re
          institutional flow zones where buyers and sellers cluster.
        </p>

        <div className="space-y-2">
          {levelTypes.map((row) => (
            <div key={row.type} className="rounded-lg border border-border p-3 space-y-1">
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${row.badge}`}>
                {row.type}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">{row.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── G. Backtested Results Card ──────────────────────────────────────────────

const backtestRows = [
  { ticker: "TSLA", sysReturn: "+53,307%", bh: "+23,937%", outperf: "+123%", maxDD: "-45.0%" },
  { ticker: "QQQ",  sysReturn: "+500%",    bh: "+389%",    outperf: "+28%",  maxDD: "-14.3%" },
  { ticker: "NVDA", sysReturn: "+5,985%",  bh: "+6,241%",  outperf: "-4%",   maxDD: "-43.3%" },
  { ticker: "AMZN", sysReturn: "+437%",    bh: "+400%",    outperf: "+9%",   maxDD: "-28.5%" },
  { ticker: "GOOGL", sysReturn: "+604%",   bh: "+569%",    outperf: "+6%",   maxDD: "-23.1%" },
  { ticker: "META", sysReturn: "+748%",    bh: "+324%",    outperf: "+131%", maxDD: "-42.3%" },
];

function BacktestCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backtested Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          We don&apos;t just tell you what to do — we prove it works. The v3
          engine has been tested across 905 daily bars (July 2022 – February
          2026) on 6 major tickers.
        </p>

        {/* Mobile-first: card layout instead of wide table */}
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-1 px-3 py-1">
            <span className="text-xs font-semibold text-muted-foreground">Ticker</span>
            <span className="text-xs font-semibold text-muted-foreground text-right">System</span>
            <span className="text-xs font-semibold text-muted-foreground text-right">Edge</span>
            <span className="text-xs font-semibold text-muted-foreground text-right">Max DD</span>
          </div>
          {backtestRows.map((row) => (
            <div
              key={row.ticker}
              className="grid grid-cols-4 gap-1 rounded-lg border border-border/50 px-3 py-2.5 items-center"
            >
              <span className="text-sm font-bold">{row.ticker}</span>
              <span className="text-sm font-mono text-green-500 text-right">{row.sysReturn}</span>
              <span className={`text-sm font-mono text-right ${row.outperf.startsWith("-") ? "text-red-400" : "text-green-400"}`}>
                {row.outperf}
              </span>
              <span className="text-sm font-mono text-yellow-500 text-right">{row.maxDD}</span>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground/60 text-center pt-1">
            B&H returns: TSLA +23,937% / QQQ +389% / NVDA +6,241%
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          v3 outperforms buy-and-hold on 5 of 6 tickers while cutting maximum
          drawdowns by 35–59%. The system&apos;s value is most apparent during
          severe drawdowns — protecting capital when it matters most.
        </p>

        <p className="text-xs text-muted-foreground/70 italic">
          Past performance is not indicative of future results. Backtested
          results are hypothetical and do not represent actual trading.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── H. Quality Controls Card ────────────────────────────────────────────────

const qualityControls = [
  "12-point automated content validation",
  "Mode assignments cross-checked against live BX engine",
  "SMI values verified (daily, weekly, 4H)",
  "Kill Leverage level validated against live market data",
  "Paper trading bot (Taylor) runs the same rules in real-time for accountability",
];

function QualityControlsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Built-In Quality Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every report is machine-verified before it reaches you.
        </p>
        <ul className="space-y-2.5">
          {qualityControls.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── I. Getting Started Card ─────────────────────────────────────────────────

const gettingStartedSteps = [
  {
    text: "Read today's daily report",
    href: "/report",
    linkText: "Go to Report",
  },
  {
    text: "Check the current mode — it determines your position sizing for the day",
    href: null,
    linkText: null,
  },
  {
    text: "Note your key levels — especially support and trim targets",
    href: null,
    linkText: null,
  },
  {
    text: "Set up position sizing so you see personalized dollar amounts",
    href: "/settings",
    linkText: "Open Settings",
  },
  {
    text: "Connect Discord for real-time alerts and community access",
    href: "/settings",
    linkText: "Open Settings",
  },
];

function GettingStartedCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ol className="space-y-4">
          {gettingStartedSteps.map((item, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </span>
              <div className="pt-0.5 min-w-0">
                <p className="text-sm leading-relaxed">{item.text}</p>
                {item.href && (
                  <Link
                    href={item.href}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    {item.linkText}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="pt-2">
          <Link href="/dashboard">
            <Button size="lg" className="w-full">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function OnboardingContent() {
  useEffect(() => {
    localStorage.setItem("flacko_onboarding_viewed", "true");
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-32 px-1">
      {/* A. Hero */}
      <HeroSection />

      {/* B. Philosophy */}
      <PhilosophyCard />

      {/* C. How It Works */}
      <HowItWorksCard />

      {/* D. Mode System */}
      <ModeSystemCard />

      {/* E. What You Get */}
      <WhatYouGetCard />

      {/* E2. Beyond the Report */}
      <BeyondTheReportCard />

      {/* F. Key Levels */}
      <KeyLevelsCard />

      {/* G. Backtest Results */}
      <BacktestCard />

      {/* H. Quality Controls */}
      <QualityControlsCard />

      {/* I. Getting Started */}
      <GettingStartedCard />

      {/* J. Footer */}
      <div className="text-center space-y-1 pt-4 pb-8">
        <p className="text-xs text-muted-foreground">
          Questions? Reach out in Discord or email{" "}
          <a
            href="mailto:flackoai@gmail.com"
            className="text-primary hover:underline"
          >
            flackoai@gmail.com
          </a>
        </p>
        <p className="text-xs text-muted-foreground/60">
          This page is always available from your dashboard.
        </p>
      </div>
    </div>
  );
}
