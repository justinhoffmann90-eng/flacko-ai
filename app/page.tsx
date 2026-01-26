"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Simple FAQ Accordion
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium">{question}</span>
        <span className="text-zinc-500 ml-4">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <p className="mt-3 text-zinc-400 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-black text-zinc-100 min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            A Daily Warning System for TSLA Traders
          </h1>
          <p className="text-xl text-zinc-300 mb-4">
            Know when to be <span className="text-green-400 font-semibold">aggressive</span>. Know when to get <span className="text-yellow-400 font-semibold">defensive</span>. Know when to get <span className="text-red-400 font-semibold">out</span>.
          </p>
          <p className="text-zinc-500 mb-10">
            Daily regime reports for swing traders using calls, puts, and shares.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="border-zinc-700 hover:bg-zinc-900">
                See How It Works
              </Button>
            </a>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
                Join
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why TSLA, Why Now */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              TSLA is entering a different phase. Autonomy is going from R&D to revenue. Robotaxi is launching. FSD is getting regulatory approvals. Optimus is moving toward production.
            </p>
            <p>
              These aren't hype cycles. They're <strong className="text-white">real businesses that could scale at the same time</strong>. If the market starts pricing in robotaxi margins and robot revenue, the stock re-rates. Meaningfully.
            </p>
            <p>
              <strong className="text-white">The opportunity is real. The problem is surviving the path there.</strong>
            </p>
            <p>
              TSLA will have <strong className="text-white">30-40% corrections</strong> along the way. It always does. If you're loaded up on calls when one hits, you can give back months of gains in weeks. Or worse, get shaken out right before the next leg.
            </p>
            <p>
              That's what this system is for. Not to predict the corrections. To <strong className="text-white">recognize when conditions are worsening</strong>, adjust your behavior, and preserve capital so you're still in the game when the real moves happen.
            </p>
          </div>
        </div>
      </section>

      {/* What This Actually Is */}
      <section id="how-it-works" className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">What This Actually Is</h2>
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              Every day after the close, you get a regime report. It tells you:
            </p>
            <p>
              <strong>What mode we're in</strong> — <span className="text-green-400">Green</span> (aggressive), <span className="text-yellow-400">Yellow</span> (controlled), or <span className="text-red-400">Red</span> (defensive). Based on weekly and daily technicals, momentum, structure, and dealer flow. Not vibes.
            </p>
            <p>
              <strong>What changed from yesterday</strong> — Conditions improving, worsening, or holding steady. This is the part that matters. Day after day of "still Yellow, still defensive" is what keeps you from buying dips that aren't done.
            </p>
            <p>
              <strong>How to behave</strong> — Which tools to use (calls, puts, covered calls, cash), how much to deploy, what levels to watch.
            </p>
            <p>
              <strong>When it changes</strong> — What signals would shift the mode up or down. You always know what you're watching for.
            </p>
            <p>
              The value isn't in any single call. <strong className="text-white">It's the daily cadence.</strong> Getting told for 35 straight days "conditions are still deteriorating, stay defensive" is what keeps you from making the mistake everyone makes.
            </p>
          </div>
        </div>
      </section>

      {/* The Mode System */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">The Mode System</h2>
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              <strong className="text-green-400">Green Mode</strong> — Trend intact, momentum healthy. Buy calls on dips, size up, let winners run.
            </p>
            <p>
              <strong className="text-yellow-400">Yellow Mode</strong> — Warning signs present. Slow down, smaller sizes, shift to selling puts instead of buying calls. Get paid to wait.
            </p>
            <p>
              <strong className="text-orange-400">Yellow (Worsening)</strong> — Multiple signals deteriorating. Covered calls on existing positions, no new aggressive longs, waiting for clarity.
            </p>
            <p>
              <strong className="text-red-400">Red Mode</strong> — Structure broken, trend down. Exit and wait. Cash is a position. The system tells you what to watch for before re-engaging.
            </p>
            <p>
              Different conditions call for different tools:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="text-green-400 font-medium">Green</span> → Buy calls (3-6-9 month)</li>
              <li><span className="text-yellow-400 font-medium">Yellow</span> → Sell cash-secured puts</li>
              <li><span className="text-orange-400 font-medium">Orange</span> → Covered calls</li>
              <li><span className="text-red-400 font-medium">Red</span> → Cash</li>
            </ul>
            <p>
              The mode tells you which tool. You're not guessing.
            </p>
          </div>
        </div>
      </section>

      {/* The Warning System */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">The Warning System</h2>
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              Corrections don't happen in one day. They unfold over weeks. There are warning signs the whole way down: fading momentum, weakening structure, dealers getting bearish. <strong className="text-white">The problem is nobody tracks them for you.</strong>
            </p>
            <p>
              <strong className="text-white">This system does.</strong>
            </p>
            <p>
              When conditions start deteriorating, <strong className="text-white">you'll know on Day 3, not Day 30</strong>. The daily report will tell you: "Weekly momentum fading. Shift to <span className="text-yellow-400">Yellow</span>. Slow down new buys."
            </p>
            <p>
              And then Day 4: "Still Yellow. Conditions unchanged."
            </p>
            <p>
              And Day 5. And Day 10. And Day 20.
            </p>
            <p>
              <strong className="text-white">That repetition is the feature.</strong> It's easy to talk yourself into "buying the dip" once. It's hard to do it when something has been telling you for three weeks straight that conditions haven't improved.
            </p>
            <p>
              Then when conditions finally turn, you'll know that too. "Recovery signals emerging. Watch for confirmation." And then: "<span className="text-green-400">Green mode confirmed</span>. Begin re-engagement."
            </p>
            <p>
              You're not guessing when it's safe. <strong className="text-white">You have a system telling you.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* What This Isn't */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">What This Isn't</h2>
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              <strong>Not entry signals.</strong> I'm not telling you to buy TSLA. I'm assuming you already want exposure and helping you manage when and how much.
            </p>
            <p>
              <strong>Not day trading.</strong> This is for swing traders building positions over weeks and months. Calls with 3-6-9 month expiries, not weeklies.
            </p>
            <p>
              <strong>Not perfect.</strong> The system won't catch every move. Sometimes you'll be in Yellow while the stock rips. That's the tradeoff for not riding corrections all the way down.
            </p>
            <p>
              <strong>Not financial advice.</strong> This is a framework I use for my own portfolio. I share it because it's useful. Your decisions are yours.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Pricing</h2>
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              <strong className="text-3xl text-white">$29.99/month</strong> to start.
            </p>
            <p>
              Price goes up $5 for every 40 members, caps at $99.99. Early people get the better price.
            </p>
            <p>What's included:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Daily regime report</li>
              <li>Discord with alerts</li>
              <li>Full rulebook and framework documentation</li>
              <li>Weekly review on Fridays</li>
            </ul>
            <p>
              If you're coming from my X subscription, you keep your current rate. I don't raise prices on existing supporters.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
                Join
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Who's Behind This */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Who's Behind This</h2>
          <div className="space-y-6 text-lg text-zinc-300 leading-relaxed">
            <p>
              I'm Justin. I run a TSLA-focused trading community and publish daily analysis.
            </p>
            <p>
              This system started as my own position management framework, a way to make these decisions systematic instead of emotional. The reports I publish are the same analysis I use for my own portfolio.
            </p>
            <p>
              I'm not selling predictions. I'm sharing a framework that enforces discipline.
            </p>
            <p>
              <a
                href="https://twitter.com/flaboratory"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white no-underline"
              >
                @flaboratory on X →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">FAQ</h2>
          <div>
            <FAQItem
              question="How is the report created?"
              answer="The system combines a trained framework built on years of TSLA-specific trading philosophy with real-time data feeds costing over $700/month. Each report pulls from multi-timeframe technical analysis, momentum and trend indicators, market structure assessment, and institutional options flow data from SpotGamma. The AI synthesizes all of this into a single daily read on regime, levels, and positioning. It's not a gut call. It's a systematic process that runs the same way every day."
            />
            <FAQItem
              question="How is risk management factored in?"
              answer="Risk management is the foundation, not an afterthought. We've developed a 1,500+ line rulebook that governs everything: position sizing based on mode, maximum daily deployment caps, level-based entries and exits, and a Master Eject protocol for when conditions break down. The entire system is designed around one principle: don't participate in corrections. By tracking early warning signs across multiple timeframes, the framework shifts you defensive before the damage compounds. You're not reacting to drawdowns. You're anticipating them."
            />
            <FAQItem
              question="What kind of automated signals do I receive?"
              answer="The system pulls key levels directly from each daily report and automatically creates Discord alerts for you (email alerts coming soon). When price hits a level, you get pinged. No staring at charts all day waiting for something to happen. Let the trades come to you. Each alert includes pre-determined sizing guidance based on current conditions, so you know whether to size in aggressively or scale down. Everything is set up for you. All you have to do is react."
            />
            <FAQItem
              question="Is this only for TSLA?"
              answer="For now, yes. The daily reports and levels are TSLA-specific. That said, we're building the infrastructure to add additional tickers in the future. We also monitor the major indexes closely and apply the same regime principles, since TSLA doesn't move in a vacuum. Broader market context is always part of the read."
            />
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/signup">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
              Join the Community
            </Button>
          </Link>
          <p className="mt-6 text-zinc-500">
            Questions?{" "}
            <a
              href="https://twitter.com/flaboratory"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white"
            >
              DM me @flaboratory
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto flex justify-between items-center text-sm text-zinc-600">
          <span>Flacko AI</span>
          <div className="flex gap-6">
            <a
              href="https://twitter.com/flaboratory"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400"
            >
              X
            </a>
            <a href="/terms" className="hover:text-zinc-400">Terms</a>
            <a href="/privacy" className="hover:text-zinc-400">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
