"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

// ─── A. Hero Section ─────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <div className="text-center py-10 md:py-16">
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
        The Flacko AI System
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mt-3 max-w-xl mx-auto">
        A risk-first TSLA operating system. Here&apos;s how it works — and why.
      </p>
      <p className="text-sm md:text-base text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
        Most trading services give you picks. We give you a system. Every day,
        Flacko AI tells you the market&apos;s current state, how much risk to
        take, where to buy, where to trim, and when to get out. The goal
        isn&apos;t to predict — it&apos;s to prepare.
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
      "Every decision starts with how much risk the market warrants. Mode determines position sizing before you look at any chart.",
  },
  {
    icon: Layers,
    title: "Regime-Aware",
    description:
      "The system reads momentum, structure, and trend context across four timeframes. It knows when to push and when to protect.",
  },
  {
    icon: Target,
    title: "Rules-Based",
    description:
      "No gut feelings. Every mode assignment, every cap, every trim level follows documented rules that have been backtested across multiple market cycles.",
  },
];

function PhilosophyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Philosophy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {philosophyItems.map((item) => (
            <div key={item.title} className="text-center md:text-left space-y-2">
              <div className="flex justify-center md:justify-start">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
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
              {/* Vertical line */}
              {idx < timelineSteps.length - 1 && (
                <div className="absolute left-[15px] top-8 w-0.5 h-full bg-border" />
              )}
              {/* Step number */}
              <div className="relative z-10 flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {item.step}
              </div>
              {/* Content */}
              <div className="pb-8 last:pb-0">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ChevronRight className="h-3 w-3" />
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
    dailyCap: "25%",
    maxInvested: "85%",
    trimCap: "10%",
    slowZone: "Inactive",
  },
  {
    mode: "YELLOW (Improving)",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    dailyCap: "20%",
    maxInvested: "70%",
    trimCap: "15%",
    slowZone: "Inactive",
  },
  {
    mode: "YELLOW",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    dailyCap: "17.5%",
    maxInvested: "60%",
    trimCap: "20%",
    slowZone: "Halves cap",
  },
  {
    mode: "ORANGE",
    color: "bg-orange-500",
    textColor: "text-orange-500",
    dailyCap: "10%",
    maxInvested: "40%",
    trimCap: "25%",
    slowZone: "25% of cap",
  },
  {
    mode: "RED",
    color: "bg-red-500",
    textColor: "text-red-500",
    dailyCap: "5%",
    maxInvested: "20%",
    trimCap: "30%",
    slowZone: "25% of cap",
  },
  {
    mode: "EJECTED",
    color: "bg-zinc-600",
    textColor: "text-zinc-400",
    dailyCap: "0%",
    maxInvested: "50% core",
    trimCap: "N/A",
    slowZone: "N/A",
  },
];

const spectrumColors = [
  { label: "GREEN", color: "bg-green-500" },
  { label: "YELLOW", color: "bg-yellow-500" },
  { label: "ORANGE", color: "bg-orange-500" },
  { label: "RED", color: "bg-red-500" },
  { label: "EJECTED", color: "bg-zinc-600" },
];

function ModeSystemCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>The Mode System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mode is not commentary — it&apos;s your position-sizing rule set. The
          BX-Trender indicator reads momentum across daily and weekly timeframes
          to classify market state. Each mode has exact caps.
        </p>

        {/* Mode Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-semibold">Mode</th>
                <th className="text-left py-3 px-3 font-semibold">Daily Cap</th>
                <th className="text-left py-3 px-3 font-semibold">Max Invested</th>
                <th className="text-left py-3 px-3 font-semibold">Trim Cap</th>
                <th className="text-left py-3 pl-3 font-semibold">Slow Zone</th>
              </tr>
            </thead>
            <tbody>
              {modeRows.map((row) => (
                <tr key={row.mode} className="border-b border-border/50">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${row.color}`}
                      />
                      <span className={`font-medium ${row.textColor}`}>
                        {row.mode}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono">{row.dailyCap}</td>
                  <td className="py-3 px-3 font-mono">{row.maxInvested}</td>
                  <td className="py-3 px-3 font-mono">{row.trimCap}</td>
                  <td className="py-3 pl-3 text-muted-foreground">
                    {row.slowZone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Spectrum Bar */}
        <div className="space-y-2">
          <div className="flex rounded-lg overflow-hidden h-3">
            {spectrumColors.map((s) => (
              <div key={s.label} className={`flex-1 ${s.color}`} />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            {spectrumColors.map((s) => (
              <span key={s.label}>{s.label}</span>
            ))}
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
    description:
      "Complete analysis with mode, levels, scenarios, and action plan. Published before market open.",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description:
      "Price alerts at every key level. Know when to act without watching charts all day.",
  },
  {
    icon: CalendarDays,
    title: "Weekly Review",
    description:
      "Performance grading with accuracy scores. System evolution tracked weekly.",
  },
  {
    icon: Radar,
    title: "Orb Signal Tracker",
    description:
      "17 backtested buy setups and avoid signals. See what's active and what's watching.",
  },
];

function WhatYouGetCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>What You Get Every Day</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureItems.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border p-4 space-y-2"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
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
    type: "Support Levels (S1–S4)",
    description: "Where to buy, with stops defined below each level",
  },
  {
    type: "Trim Levels (T1–T4)",
    description: "Where to take profit based on mode trim cap percentage",
  },
  {
    type: "Kill Leverage",
    description:
      "The non-negotiable defense line (Weekly 21 EMA). All leverage must be cut if breached.",
  },
  {
    type: "Slow Zone",
    description:
      "When price drops below Daily 21 EMA × 0.98, buying caps are reduced dramatically",
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
          SpotGamma gamma data combined with EMA structure across multiple
          timeframes creates a precise map of support and resistance. These
          aren&apos;t arbitrary lines — they&apos;re institutional flow zones
          where buyers and sellers cluster.
        </p>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-semibold">Level Type</th>
                <th className="text-left py-3 pl-3 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {levelTypes.map((row) => (
                <tr key={row.type} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium whitespace-nowrap">
                    {row.type}
                  </td>
                  <td className="py-3 pl-3 text-muted-foreground">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── G. Backtested Results Card ──────────────────────────────────────────────

const backtestRows = [
  { ticker: "TSLA", sysReturn: "+53,307%", bh: "+23,937%", outperf: "+123%", maxDD: "-45.0%", bhDD: "-73.6%" },
  { ticker: "QQQ", sysReturn: "+500%", bh: "+389%", outperf: "+28%", maxDD: "-14.3%", bhDD: "-35.1%" },
  { ticker: "NVDA", sysReturn: "+5,985%", bh: "+6,241%", outperf: "-4%", maxDD: "-43.3%", bhDD: "-66.3%" },
  { ticker: "AMZN", sysReturn: "+437%", bh: "+400%", outperf: "+9%", maxDD: "-28.5%", bhDD: "-56.1%" },
  { ticker: "GOOGL", sysReturn: "+604%", bh: "+569%", outperf: "+6%", maxDD: "-23.1%", bhDD: "-44.3%" },
  { ticker: "META", sysReturn: "+748%", bh: "+324%", outperf: "+131%", maxDD: "-42.3%", bhDD: "-76.7%" },
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

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-3 font-semibold">Ticker</th>
                <th className="text-right py-3 px-3 font-semibold">System</th>
                <th className="text-right py-3 px-3 font-semibold">Buy &amp; Hold</th>
                <th className="text-right py-3 px-3 font-semibold">Edge</th>
                <th className="text-right py-3 px-3 font-semibold">Max DD</th>
                <th className="text-right py-3 pl-3 font-semibold">B&amp;H DD</th>
              </tr>
            </thead>
            <tbody>
              {backtestRows.map((row) => (
                <tr key={row.ticker} className="border-b border-border/50">
                  <td className="py-3 pr-3 font-semibold">{row.ticker}</td>
                  <td className="py-3 px-3 text-right font-mono text-green-500">
                    {row.sysReturn}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                    {row.bh}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span
                      className={
                        row.outperf.startsWith("-")
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {row.outperf}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-yellow-500">
                    {row.maxDD}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono text-red-400">
                    {row.bhDD}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  "Kill Leverage validated against exact Weekly 21 EMA",
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
        <ul className="space-y-2">
          {qualityControls.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
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
              <div className="pt-0.5">
                <p className="text-sm">{item.text}</p>
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
    <div className="max-w-3xl mx-auto space-y-6 pb-32">
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
