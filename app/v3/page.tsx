"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NeuralBackground } from "@/components/neural-background";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, Bell, Crosshair, Calendar, Check } from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium text-zinc-200">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{answer}</p>}
    </div>
  );
}

export default function LandingPageV3() {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="bg-black text-zinc-100 min-h-screen">
      {/* sticky header */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b border-zinc-800 transition-all duration-300 ${
          showSticky ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-zinc-200">flacko ai</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 hidden sm:block">operational status: live</span>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                install the operating system
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* sign in */}
      <div className="absolute top-4 right-6 z-40">
        <Link href="/login">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            sign in
          </Button>
        </Link>
      </div>

      {/* hero */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -top-24">
          <NeuralBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
        </div>

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <p className="text-xs text-zinc-500 mb-4 tracking-widest uppercase">battlefield command intelligence</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            the tsla <span className="text-zinc-400">operating system.</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-300 mb-4">
            flacko uses ai agents to model market structure, dealer positioning, and probabilistic scenarios — surfacing key levels and context for disciplined execution.
          </p>
          <p className="text-sm text-zinc-400 mb-2">probability first. clarity always.</p>
          <p className="text-sm text-zinc-400 mb-8">
            designed for disciplined traders who prioritize structure, probability, and execution clarity.
          </p>

          <div className="flex justify-center mb-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
                install the operating system
              </Button>
            </Link>
          </div>
          <p className="text-xs text-zinc-500">daily war briefings + context alerts + intelligence review</p>
        </div>
      </section>

      {/* sources monitored */}
      <section className="py-6 px-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest mb-4">
            sources monitored
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-zinc-500 text-xs">
            <span className="opacity-60">tesla</span>
            <span className="opacity-60">spotgamma</span>
            <span className="opacity-60">hiro</span>
            <span className="opacity-60">tradingview</span>
            <span className="opacity-60">fs insight</span>
            <span className="opacity-60">bloomberg</span>
            <span className="opacity-60">wsj</span>
          </div>
        </div>
      </section>

      {/* value */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">value framework</h2>
          <p className="text-center text-zinc-500 mb-10">structured outcomes for disciplined execution</p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800">
              <h3 className="font-semibold text-lg mb-2">context over noise</h3>
              <p className="text-sm text-zinc-500">understand what structure says, not how it feels.</p>
            </div>
            <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800">
              <h3 className="font-semibold text-lg mb-2">probability mapping</h3>
              <p className="text-sm text-zinc-500">scenarios, not blind guesses.</p>
            </div>
            <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800">
              <h3 className="font-semibold text-lg mb-2">positioning awareness</h3>
              <p className="text-sm text-zinc-500">dealer flow + regime intersections that shape context.</p>
            </div>
            <div className="bg-zinc-900/60 rounded-xl p-5 border border-zinc-800">
              <h3 className="font-semibold text-lg mb-2">disciplined execution frameworks</h3>
              <p className="text-sm text-zinc-500">rules and thresholds that keep decision-making tight.</p>
            </div>
          </div>
        </div>
      </section>

      {/* the problem - correction chart */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            the problem this solves
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            corrections unfold in stages. we catch them early.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Correction Chart Visual */}
            <div className="relative">
              <div className="bg-zinc-900/30 rounded-xl p-6 border border-zinc-800/50">
                {/* Chart area */}
                <div className="relative h-56">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between opacity-30">
                    <div className="border-b border-zinc-700"></div>
                    <div className="border-b border-zinc-700"></div>
                    <div className="border-b border-zinc-700"></div>
                    <div className="border-b border-zinc-700"></div>
                    <div className="border-b border-zinc-700"></div>
                  </div>
                  
                  {/* Declining line - SVG with clear color segments */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Green segment - Weeks 1-2 */}
                    <path 
                      d="M 0 28 C 12 22, 20 20, 30 18 C 42 16, 50 22, 55 28 C 60 34, 68 30, 78 32 C 88 34, 95 33, 100 35" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Yellow segment - Weeks 3-4 */}
                    <path 
                      d="M 100 35 C 110 40, 118 38, 125 42 C 135 48, 140 44, 148 50 C 158 58, 168 54, 175 52 C 182 50, 188 56, 195 64 C 198 68, 200 70, 200 70" 
                      fill="none" 
                      stroke="#eab308" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Red segment - Weeks 5-10 */}
                    <path 
                      d="M 200 70 C 215 78, 225 74, 235 68 C 248 60, 255 72, 265 85 C 280 105, 290 100, 300 95 C 315 88, 325 98, 340 115 C 360 138, 375 132, 390 140 C 410 150, 420 148, 435 160 C 455 175, 470 172, 485 185 C 495 193, 500 195, 500 195" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    
                    {/* Connector lines - aligned to dot positions */}
                    <line x1="30" y1="18" x2="30" y2="0" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="100" y1="35" x2="100" y2="0" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="200" y1="70" x2="200" y2="0" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="265" y1="85" x2="265" y2="0" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,3" />
                  </svg>
                  
                  {/* Mode Labels & Dots - positioned to center on line */}
                  <div className="absolute -top-5 left-[5%] flex flex-col items-center">
                    <span className="text-[10px] text-green-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">green mode</span>
                  </div>
                  <div className="absolute top-[8%] left-[6%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-300 shadow-lg shadow-green-500/50"></div>
                  </div>
                  
                  <div className="absolute top-1 left-[18%] flex flex-col items-center">
                    <span className="text-[10px] text-yellow-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">yellow mode</span>
                  </div>
                  <div className="absolute top-[17.5%] left-[20%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse"></div>
                  </div>
                  
                  <div className="absolute -top-5 left-[38%] flex flex-col items-center">
                    <span className="text-[10px] text-red-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">red mode</span>
                  </div>
                  <div className="absolute top-[35%] left-[40%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-300 shadow-lg shadow-red-500/50"></div>
                  </div>
                  
                  <div className="absolute top-1 left-[51%] flex flex-col items-center">
                    <span className="text-[10px] text-red-600 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">master eject</span>
                  </div>
                  <div className="absolute top-[42.5%] left-[53%] -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-red-400 shadow-lg shadow-red-600/50"></div>
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between mt-3 text-[9px] text-zinc-500">
                  <span>week 1</span>
                  <span>week 2</span>
                  <span>week 3</span>
                  <span>week 4</span>
                  <span>week 5</span>
                  <span>week 6</span>
                  <span>week 7</span>
                  <span>week 8</span>
                  <span>week 9</span>
                  <span>week 10</span>
                </div>
                
                {/* Caption */}
                <div className="mt-4 text-center">
                  <span className="text-xs text-zinc-400">we warn you <strong className="text-yellow-400 font-bold">early</strong> — not when it's too late</span>
                </div>
              </div>
            </div>
            
            {/* Text content */}
            <div className="space-y-4 text-zinc-300">
              <p>
                tsla will have <strong className="text-white">30-40% corrections</strong> on the way to wherever it's going. it always does.
              </p>
              <p>
                the problem isn't finding dips to buy — it's knowing <strong className="text-white">which dips NOT to buy</strong>. corrections unfold over weeks, with warning signs the whole way down.
              </p>
              <p>
                this system is designed to <strong className="text-white">catch the warning signs early</strong>. you'll know on week 3, not week 10. as conditions deteriorate, exposure ratchets down. no averaging into weakness.
              </p>
              <p className="text-zinc-500 text-sm pt-2">
                and we'll monitor & discuss together as a team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* what you get */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">what you get</h2>
          <p className="text-center text-zinc-500 mb-10">decision clarity tools for disciplined execution</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">structure maps</h3>
                  <p className="text-xs text-zinc-500">daily war briefings</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                ai-generated structure maps before market opens.
              </p>
            </div>

            <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">scenario frameworks</h3>
                  <p className="text-xs text-zinc-500">bullish / neutral / defensive</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                defined paths with invalidation points so you know what breaks the scenario.
              </p>
            </div>

            <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">context alert engine</h3>
                  <p className="text-xs text-zinc-500">positional thresholds hit</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                context alerts when price meets high-impact positional thresholds.
              </p>
            </div>

            <div className="bg-zinc-900/60 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">weekly intelligence</h3>
                  <p className="text-xs text-zinc-500">regime recalibration</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                structural shifts + regime updates you can act on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* differentiation */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">not context alerts. not chat commentary. a decision framework.</h2>
          <p className="text-zinc-400 mb-6">
            flacko is not context alerts. flacko is not chat commentary. flacko is a decision framework.
          </p>
          <div className="text-left inline-block">
            <p className="text-sm text-zinc-500 mb-3">it combines:</p>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>• options dealer flow</li>
              <li>• volatility regime modeled structure</li>
              <li>• multi-timeframe structure confirmation</li>
              <li>• ai-driven probabilistic scenario simulation</li>
            </ul>
            <p className="text-sm text-zinc-400 mt-4">to model how markets behave — not just how they look.</p>
          </div>
        </div>
      </section>

      {/* operating system positioning */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">the operating system positioning</h2>
          <p className="text-zinc-400 mb-4">
            flacko is a trading operating system — not reactive pings, not chat commentary — a structured framework for probabilistic decision context.
          </p>
          <p className="text-sm text-zinc-500">
            as the system evolves, flacko recalibrates scenario logic, probability thresholds, and model structure — giving you a living decision architecture, not static content.
          </p>
        </div>
      </section>

      {/* regime visualization */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">regime command panel</h2>
          <p className="text-center text-zinc-500 mb-10">context posture before the airstrike lands</p>

          <div className="mb-8">
            <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 via-orange-400 to-red-500 mb-3"></div>
            <div className="flex justify-between text-[10px] text-zinc-500 px-1">
              <span>offense</span>
              <span>warning</span>
              <span>caution</span>
              <span>defense</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <h3 className="font-bold text-emerald-300 text-sm">green</h3>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">trend intact, momentum healthy</p>
              <ul className="space-y-1 text-[10px] text-zinc-300">
                <li>• daily cap: up to 25%</li>
                <li>• good to press offense</li>
                <li>• hold with conviction</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <h3 className="font-bold text-yellow-300 text-sm">yellow</h3>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">warning signs present</p>
              <ul className="space-y-1 text-[10px] text-zinc-300">
                <li>• daily cap: &lt;15%</li>
                <li>• reduce leverage</li>
                <li>• shift to watch mode</li>
              </ul>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <h3 className="font-bold text-orange-300 text-sm">orange</h3>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">structure weakening</p>
              <ul className="space-y-1 text-[10px] text-zinc-300">
                <li>• daily cap: 10% or less</li>
                <li>• pause or small probes</li>
                <li>• prep for potential exit</li>
              </ul>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <h3 className="font-bold text-red-300 text-sm">red</h3>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">structure broken or at risk</p>
              <ul className="space-y-1 text-[10px] text-zinc-300">
                <li>• daily cap: 5% or less</li>
                <li>• respect master eject</li>
                <li>• wait for confirmation</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-zinc-900/50 rounded-xl p-5 border border-zinc-800 text-center">
            <p className="text-sm text-zinc-400">
              mode is determined by technical structure + dealer positioning. no single regime framework controls the decision.
            </p>
          </div>
        </div>
      </section>

      {/* social proof */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">social proof</h2>
          <p className="text-zinc-400">
            built for traders who believe managing risk and probability creates long-term edge.
            <br />
            trusted by traders focused on volatility navigation and disciplined execution.
          </p>
        </div>
      </section>

      {/* tiered pricing */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-black text-[10px] font-bold px-3 py-1 rounded-full mb-4">
            limited spots
          </div>
          <h2 className="text-3xl font-bold mb-2">
            join <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">flacko ai</span>
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            tsla trading intelligence. daily briefings, key levels, and context alerts that cut through the noise.
          </p>

          <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-widest text-cyan-300 uppercase">⚡ founder tier</span>
              <span className="text-[11px] font-bold text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">3 spots left</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold">$29.99</span>
              <span className="text-sm text-zinc-500">/month</span>
              <span className="text-xs text-zinc-600 line-through">$39.99</span>
            </div>

            <div className="mb-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 w-[94%] rounded-full" />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
                <span>47 of 50 claimed</span>
                <span>next tier: $39.99/mo</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 mb-6">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-4">what you get</p>
            <div className="space-y-3 text-sm text-zinc-300">
              {[
                "daily tsla reports before market open",
                "context alerts via discord and email",
                "mode and tier system for risk management",
                "key levels from spotgamma flow data",
                "private discord community",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-black text-xs flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/signup" className="block">
            <Button className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-black hover:opacity-90">
              access structured context →
            </Button>
          </Link>

          <p className="text-[11px] uppercase tracking-widest text-zinc-600 mt-8 mb-4 text-center">
            price increases every 50 members
          </p>

          <div className="space-y-2">
            {[
              { label: "spots 1-50", price: "$29.99/mo", active: true },
              { label: "spots 51-100", price: "$39.99/mo" },
              { label: "spots 101-150", price: "$49.99/mo" },
              { label: "spots 151-200", price: "$59.99/mo" },
              { label: "spots 201+", price: "$69.99/mo" },
            ].map((tier) => (
              <div
                key={tier.label}
                className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                  tier.active
                    ? "bg-gradient-to-br from-cyan-500/15 to-emerald-500/15 border-cyan-400/40"
                    : "bg-white/5 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tier.active ? "bg-gradient-to-br from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(0,212,255,0.5)]" : "bg-zinc-700"
                    }`}
                  />
                  <span className={`text-sm ${tier.active ? "text-white font-semibold" : "text-zinc-400"}`}>
                    {tier.label}
                  </span>
                  {tier.active && (
                    <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 text-black px-2 py-0.5 rounded">
                      you are here
                    </span>
                  )}
                </div>
                <span className={`text-sm ${tier.active ? "text-emerald-300" : "text-zinc-500"}`}>{tier.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* cta + onboarding */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">install the operating system</h2>
          <p className="text-zinc-400 mb-6">no experience with dealer flow required. flacko translates institutional positioning into clear structured context.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
              access structured context
            </Button>
          </Link>
          <p className="text-xs text-zinc-500 mt-4">
            flacko does not provide financial advice or guaranteed outcomes. it provides structured market intelligence designed to
            support informed decision context and disciplined execution.
          </p>
        </div>
      </section>

      {/* faq */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">faq</h2>
          <FAQItem
            question="how is the report created?"
            answer="the system combines a trained framework built on years of tsla-specific trading philosophy with real-time data feeds. each report pulls from multi-timeframe modeled structure, momentum and trend regime frameworks, market structure modeling, and institutional options flow data from spotgamma. the ai synthesizes all of this into a single daily read on regime, levels, and positioning. it is a systematic process that runs the same way every day."
          />
          <FAQItem
            question="how is the regime mode determined?"
            answer="the mode is determined by confluence of multiple regime frameworks: market structure, momentum regime, weekly ema hierarchy (9/13/21), dealer positioning from spotgamma, and real-time hiro flow data. no single regime framework controls the decision — we look for alignment across modeled structure and flow."
          />
          <FAQItem
            question="what kind of context alerts do i receive?"
            answer="context alerts when tsla hits key levels from the daily report, mode shift notifications when conditions change, and options flow updates throughout the day. each context alert includes context on what it means and what to do."
          />
          <FAQItem
            question="is this only for tsla?"
            answer="yes, the daily reports and levels are tsla-specific. broader market context is monitored so tsla is not modeled in a vacuum."
          />
        </div>
      </section>

      {/* footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-600 gap-4">
          <span>flacko ai</span>
          <div className="flex gap-6">
            <a href="https://x.com/smdcapital" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">
              x
            </a>
            <a href="/terms" className="hover:text-zinc-400">
              terms
            </a>
            <a href="/privacy" className="hover:text-zinc-400">
              privacy
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
