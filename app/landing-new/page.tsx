"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Shield, TrendingDown, Brain, Zap } from "lucide-react";

export default function LandingPageNew() {

  return (
    <main className="bg-black text-zinc-100 min-h-screen">
      {/* Hero */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            The TSLA Trading
            <br />
            <span className="text-zinc-400">Operating System.</span>
          </h1>
          <p className="text-xl text-zinc-300 mb-4">
            Battle map + alerts + context — delivered to you.
          </p>
          <p className="text-zinc-400 mb-8">
            Flacko turns price action, macro + catalysts, and options dealer positioning into a daily TSLA battle map: key levels, if/then scenarios, and posture — then auto-sets alerts so you only engage when your plan activates.
          </p>
          <p className="text-zinc-500 mb-10">
            Built for TSLA swing traders who want conviction without babysitting charts.
          </p>
          
          {/* Main CTA */}
          <div className="flex justify-center mb-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
                Join our group
              </Button>
            </Link>
          </div>
          <p className="text-sm text-zinc-500">
            Private Discord + alerts + weekly live strategy call
          </p>
          
          {/* OS Promise */}
          <p className="text-sm text-zinc-500 mt-8 max-w-md mx-auto">
            Everything is organized into channels and triggers so <strong className="text-zinc-300">information flows to you</strong> — not the other way around.
          </p>
        </div>
        
      </section>
      
      {/* Dashboard Preview - Side by Side */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Your Daily Battle Map
              </h2>
              <p className="text-zinc-400 mb-6">
                Wake up to a complete game plan. Mode, key levels, if/then scenarios — everything you need to trade with conviction.
              </p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Posture mode</strong> — offense, neutral, or defense</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Key levels</strong> — where reactions happen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">If/then scenarios</strong> — pre-written reactions</span>
                </li>
              </ul>
            </div>
            
            {/* Dashboard Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent blur-3xl -z-10"></div>
              
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl shadow-black/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                  </div>
                  <span className="text-xs text-zinc-600 ml-2">Flacko AI — Dashboard</span>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                      <span className="text-lg font-bold text-yellow-400">YELLOW MODE</span>
                    </div>
                    <span className="text-xs text-zinc-500">Jan 24, 2026</span>
                  </div>
                  
                  <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 mb-3">KEY LEVELS</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">High Vol Point</span>
                        <span className="text-sm font-mono text-green-400">$475</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Call Wall</span>
                        <span className="text-sm font-mono text-green-400">$450</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Daily 9 EMA</span>
                        <span className="text-sm font-mono text-yellow-400">$444</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Daily 21 EMA</span>
                        <span className="text-sm font-mono text-yellow-400">$441</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Put Wall</span>
                        <span className="text-sm font-mono text-red-400">$435</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-400">Eject Level</span>
                        <span className="text-sm font-mono text-red-500">$420</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 mb-2">TODAY'S PLAYBOOK</div>
                    <div className="text-sm text-zinc-300 space-y-1">
                      <div><span className="text-green-400">Above $444</span> — controlled longs, let it run</div>
                      <div><span className="text-yellow-400">$435-444</span> — wait for reclaim, no chase</div>
                      <div><span className="text-red-400">Below $435</span> — hands off until structure repairs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem / Why This Matters */}
      <section className="py-20 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-12 text-center">
            The problem this solves
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Correction Chart Visual - Simple Mode Transitions */}
            <div className="relative md:col-span-1 md:min-w-[380px]">
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
                  
                  {/* Declining line - SVG with clear color segments - 10 weeks, steeper after week 6 */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Green segment - Weeks 1-2 */}
                    <path 
                      d="M 0 25 Q 25 20, 50 27 T 100 35" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Yellow segment - Weeks 3-4 */}
                    <path 
                      d="M 100 35 Q 125 45, 150 55 T 200 70" 
                      fill="none" 
                      stroke="#eab308" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Red segment - Weeks 5-10, steeper decline after week 6 */}
                    <path 
                      d="M 200 70 Q 230 85, 260 100 T 320 130 Q 380 160, 440 180 T 500 195" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    
                    {/* Connector lines from each dot to label above */}
                    <line x1="50" y1="27" x2="50" y2="8" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="100" y1="35" x2="100" y2="8" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="200" y1="70" x2="200" y2="8" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="260" y1="100" x2="260" y2="8" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,3" />
                  </svg>
                  
                  {/* Green Mode - early, still healthy */}
                  <div className="absolute -top-5 left-[8%] flex flex-col items-center">
                    <span className="text-[10px] text-green-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">Green Mode</span>
                  </div>
                  <div className="absolute top-[13%] left-[9%]">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-300 shadow-lg shadow-green-500/50"></div>
                  </div>
                  
                  {/* Yellow Mode - at green→yellow transition - staggered lower to avoid overlap */}
                  <div className="absolute top-1 left-[18%] flex flex-col items-center">
                    <span className="text-[10px] text-yellow-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">Yellow Mode</span>
                  </div>
                  <div className="absolute top-[17%] left-[19%]">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse"></div>
                  </div>
                  
                  {/* Red Mode - at yellow→red transition */}
                  <div className="absolute -top-5 left-[38%] flex flex-col items-center">
                    <span className="text-[10px] text-red-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">Red Mode</span>
                  </div>
                  <div className="absolute top-[35%] left-[39%]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-300 shadow-lg shadow-red-500/50"></div>
                  </div>
                  
                  {/* Master Eject - shortly after red mode - staggered lower */}
                  <div className="absolute top-1 left-[50%] flex flex-col items-center">
                    <span className="text-[10px] text-red-600 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">Master Eject</span>
                  </div>
                  <div className="absolute top-[50%] left-[51%]">
                    <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-red-400 shadow-lg shadow-red-600/50"></div>
                  </div>
                </div>
                
                {/* X-axis labels - simplified for mobile */}
                <div className="flex justify-between mt-3 text-[9px] sm:text-[10px] text-zinc-500">
                  <span>Wk 1</span>
                  <span className="hidden sm:inline">Wk 2</span>
                  <span className="hidden md:inline">Wk 3</span>
                  <span className="sm:hidden">Wk 3</span>
                  <span className="hidden sm:inline">Wk 4</span>
                  <span className="hidden md:inline">Wk 5</span>
                  <span className="sm:hidden">Wk 5</span>
                  <span className="hidden md:inline">Wk 6</span>
                  <span className="hidden sm:inline">Wk 7</span>
                  <span className="hidden md:inline">Wk 8</span>
                  <span className="sm:hidden">Wk 8</span>
                  <span className="hidden sm:inline">Wk 9</span>
                  <span>Wk 10</span>
                </div>
                
                {/* Caption */}
                <div className="mt-4 text-center">
                  <span className="text-xs text-zinc-400">Our system is designed to warn us <strong className="text-yellow-400 font-bold">early</strong> — not when it's too late</span>
                </div>
              </div>
            </div>
            
            {/* Text content */}
            <div className="space-y-4 text-zinc-300">
              <p>
                TSLA will have <strong className="text-white">30-40% corrections</strong> on the way to wherever it's going. It always does.
              </p>
              <p>
                The problem isn't finding dips to buy — it's knowing <strong className="text-white">which dips NOT to buy</strong>. Corrections unfold over weeks, with warning signs the whole way down.
              </p>
              <p>
                This system is designed to <strong className="text-white">catch the warning signs early</strong>. You'll know on Week 3, not Week 10.
              </p>
              <p className="text-zinc-500 text-sm pt-2">
                And we'll monitor & discuss together as a team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OS Components Strip */}
      <section className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-sm text-zinc-500 mb-4">What the OS includes</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Daily Map</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Auto Alerts</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Morning Brief</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Dealer Flow Pulse</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Catalyst Calendar</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Weekly Deep-Dive</span>
            <span className="px-3 py-1 bg-zinc-900 rounded-full text-zinc-300">Weekly Live Call</span>
          </div>
        </div>
      </section>

      {/* Regime Mode */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            Regime Mode
          </h2>
          <p className="text-center text-zinc-500 mb-8">
            Conditions deteriorate in stages. We track the signals so you adjust before it's too late.
          </p>
          
          {/* Spectrum Bar */}
          <div className="relative mb-8">
            <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 mb-4"></div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Healthy</span>
              <span>Warning</span>
              <span>Deteriorating</span>
            </div>
          </div>

          {/* Three Phases with Deterioration Flow */}
          <div className="grid md:grid-cols-3 gap-0 relative">
            {/* Green Mode */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-l-lg md:rounded-l-lg md:rounded-r-none p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-bold text-lg text-green-400">Green</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">Trend intact, momentum healthy</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• Full position sizing</li>
                <li>• Press A+ setups</li>
                <li>• Run winners</li>
              </ul>
            </div>
            
            {/* Arrow 1 */}
            <div className="hidden md:flex absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
              <div className="bg-zinc-800 rounded-full p-1 border border-zinc-700">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* Yellow Mode */}
            <div className="bg-yellow-500/10 border-y border-yellow-500/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h3 className="font-bold text-lg text-yellow-400">Yellow</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">Warning signs present</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• Reduce size (50-75%)</li>
                <li>• Daily cap: 10-20%</li>
                <li>• Controlled accumulation</li>
              </ul>
            </div>
            
            {/* Arrow 2 */}
            <div className="hidden md:flex absolute left-2/3 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
              <div className="bg-zinc-800 rounded-full p-1 border border-zinc-700">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* Red Mode */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-r-lg md:rounded-r-lg md:rounded-l-none p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h3 className="font-bold text-lg text-red-400">Red</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-3">Structure broken or at risk</p>
              <ul className="space-y-1 text-sm text-zinc-300">
                <li>• Nibbles only at extremes</li>
                <li>• Daily cap: 10%</li>
                <li>• Master Eject active</li>
              </ul>
            </div>
          </div>
          
          {/* Deterioration note */}
          <p className="text-center text-zinc-500 text-sm mt-6">
            As conditions deteriorate, exposure ratchets down. No averaging into weakness.
          </p>
        </div>
      </section>

      {/* The Methodology */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            How the mode is determined
          </h2>
          <p className="text-center text-zinc-500 mb-8">
            Not vibes. Not gut calls. Indicator confluence across multiple timeframes.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Technical Indicators */}
            <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-400" />
                Technical Confluence
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• <span className="text-zinc-300">Market Structure</span> — HH/HL or broken</li>
                <li>• <span className="text-zinc-300">BX Trender</span> — Momentum regime</li>
                <li>• <span className="text-zinc-300">MA/EMA</span> — Trend position & slope</li>
                <li>• <span className="text-zinc-300">SMI</span> — Leading momentum indicator</li>
                <li>• <span className="text-zinc-300">RSI</span> — Divergences & extremes</li>
                <li>• <span className="text-zinc-300">Fib Levels</span> — Smart money zones</li>
              </ul>
            </div>
            
            {/* Options Flow */}
            <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Dealer Positioning
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• <span className="text-zinc-300">SpotGamma Levels</span> — Put Wall, Call Wall, Hedge Wall</li>
                <li>• <span className="text-zinc-300">HIRO</span> — Real-time institutional flow</li>
                <li>• <span className="text-zinc-300">FlowPatrol</span> — Daily options flow report</li>
                <li>• <span className="text-zinc-300">Gamma Regime</span> — Positive vs negative gamma</li>
                <li>• <span className="text-zinc-300">Key Gamma Strike</span> — Regime pivot point</li>
              </ul>
              <p className="text-xs text-zinc-500 mt-3">Powered by $700+/mo in institutional data feeds</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 rounded-lg p-4 border border-zinc-800">
            <p className="text-sm text-zinc-400 text-center">
              <strong className="text-zinc-300">Timeframe Alignment:</strong> Weekly sets the regime. Daily provides early warning. 1H and 4H confirm entries. When all three align, conviction is high.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            How the Operating System works
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            Map → Triggers → Feed. Your daily workflow in 3 steps.
          </p>
          
          <div className="space-y-8 mb-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-sm font-bold text-blue-400">1</div>
              <div>
                <h3 className="font-semibold text-lg">The Map <span className="text-zinc-500 font-normal">(Your daily battle plan)</span></h3>
                <p className="text-zinc-400 mb-2">Every morning, you know exactly what matters:</p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>• <span className="text-zinc-300">Key levels</span> — where the real reactions happen</li>
                  <li>• <span className="text-zinc-300">If/then scenarios</span> — "if $430 holds, do X; if it breaks, do Y"</li>
                  <li>• <span className="text-zinc-300">Posture mode</span> — offense, neutral, or defense</li>
                  <li>• <span className="text-zinc-300">Dealer positioning</span> — where gamma pins or accelerates</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-sm font-bold text-yellow-400">2</div>
              <div>
                <h3 className="font-semibold text-lg">The Triggers <span className="text-zinc-500 font-normal">(Alerts that fire for you)</span></h3>
                <p className="text-zinc-400 mb-2">Let the levels come to you:</p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>• <span className="text-zinc-300">Auto-alerts</span> — price hits your level, you get pinged</li>
                  <li>• <span className="text-zinc-300">Pre-written reactions</span> — you already know what to do</li>
                  <li>• <span className="text-zinc-300">Posture shift alerts</span> — when the mode changes, you know first</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-sm font-bold text-green-400">3</div>
              <div>
                <h3 className="font-semibold text-lg">The Feed <span className="text-zinc-500 font-normal">(Context that keeps you current)</span></h3>
                <p className="text-zinc-400 mb-2">Stay aligned without hunting for information:</p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>• <span className="text-zinc-300">Morning briefs</span> — what matters today in 2 minutes</li>
                  <li>• <span className="text-zinc-300">Intraday flow</span> — HIRO/SpotGamma updates when they matter</li>
                  <li>• <span className="text-zinc-300">Catalyst calendar</span> — risk windows you can't afford to miss</li>
                  <li>• <span className="text-zinc-300">Weekly review</span> — recalibrate thesis, update levels</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 text-center">
            <p className="text-zinc-400 text-sm">
              <strong className="text-zinc-200">The result:</strong> You wake up, read the map, set your alerts, and go live your life. The system tells you when to pay attention.
            </p>
          </div>
          
        </div>
      </section>
      
      {/* Alerts Preview - Side by Side */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Alerts Mockup */}
            <div className="relative order-2 md:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent blur-3xl -z-10"></div>
              
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Alert Levels</span>
                  <span className="text-xs text-zinc-600">4 active</span>
                </div>
                
                <div className="divide-y divide-zinc-800/50">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div>
                        <div className="text-sm text-zinc-300">Master Eject</div>
                        <div className="text-xs text-zinc-600">Exit all positions</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-red-400">$398</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div>
                        <div className="text-sm text-zinc-300">Put Wall Support</div>
                        <div className="text-xs text-zinc-600">Watch for bounce</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-yellow-400">$415</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="text-sm text-zinc-300">Gamma Strike</div>
                        <div className="text-xs text-zinc-600">Regime pivot</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-blue-400">$430</span>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <div>
                        <div className="text-sm text-zinc-300">Call Wall Target</div>
                        <div className="text-xs text-zinc-600">Take profit zone</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm text-green-400">$445</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Text content */}
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold mb-4">
                Automated Discord Alerts
              </h2>
              <p className="text-zinc-400 mb-6">
                Let the levels come to you. Set it and forget it — you'll be pinged when price hits your zones.
              </p>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Auto-alerts</strong> — price hits level, you get pinged</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Pre-written reactions</strong> — you already know what to do</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Mode shift alerts</strong> — know when posture changes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Daily / Weekly */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Daily execution. Weekly recalibration.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Daily */}
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
              <h3 className="font-semibold text-lg mb-1 text-zinc-200">Daily Report</h3>
              <p className="text-xs text-zinc-500 mb-4">2-minute read</p>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>• Mode (offense / neutral / defense)</li>
                <li>• Key levels + what happens at each</li>
                <li>• Dealer positioning (HIRO, gamma)</li>
                <li>• If/Then scenarios — pre-written reactions</li>
                <li>• Action items — your rules for the day</li>
              </ul>
            </div>
            
            {/* Weekly */}
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800">
              <h3 className="font-semibold text-lg mb-1 text-zinc-200">Weekly Report</h3>
              <p className="text-xs text-zinc-500 mb-4">deep dive</p>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li>• Accountability — how did the calls perform?</li>
                <li>• Regime check — is the trend holding?</li>
                <li>• Technical + flow structure review</li>
                <li>• Correction risk assessment</li>
                <li>• Week ahead setup + scenarios</li>
              </ul>
            </div>
          </div>
          
          <p className="text-center text-zinc-500 text-sm mt-8">
            Daily keeps you executing cleanly; weekly keeps the thesis honest.
          </p>
        </div>
      </section>

      {/* The Rulebook */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            The Rulebook
          </h2>
          <p className="text-center text-zinc-500 mb-8">
            1,500+ lines of tested, documented framework
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                Risk Management
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• <span className="text-zinc-300">Daily caps</span> — 10-20%/day in Yellow, 10%/day in Red</li>
                <li>• <span className="text-zinc-300">Master Eject</span> — Pre-defined, non-negotiable exit</li>
                <li>• <span className="text-zinc-300">Hysteresis</span> — Prevents whipsawing between modes</li>
              </ul>
            </div>
            
            <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                Graduated Response
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• <span className="text-zinc-300">Action spectrum</span> — +5 (aggressive) to -5 (exit)</li>
                <li>• <span className="text-zinc-300">Scaled entries</span> — Not all-or-nothing decisions</li>
                <li>• <span className="text-zinc-300">Fast-track re-entry</span> — Capture V-bottoms when confirmed</li>
              </ul>
            </div>
          </div>

          <p className="text-center text-sm text-zinc-500">
            Tested, documented, and refined through real market conditions.
          </p>
        </div>
      </section>

      {/* Catalyst Calendar - Side by Side */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Catalyst Calendar
              </h2>
              <p className="text-zinc-400 mb-6">
                We track TSLA + macro events that change regime risk, so you're not surprised by volatility windows.
              </p>
              
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Risk windows</strong> — Fed, CPI, jobs, earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">TSLA timelines</strong> — thesis-critical dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span><strong className="text-zinc-300">Weekly recap</strong> — news → thesis impact</span>
                </li>
              </ul>
            </div>
            
            {/* Catalyst Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent blur-3xl -z-10"></div>
              
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">Upcoming Catalysts</span>
                  <span className="text-xs text-zinc-600">This week</span>
                </div>
                
                <div className="divide-y divide-zinc-800/50">
                  <div className="px-4 py-3 flex items-center gap-4">
                    <div className="text-center min-w-[40px]">
                      <div className="text-xs text-zinc-500">JAN</div>
                      <div className="text-lg font-bold text-zinc-300">29</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-300">FOMC Decision</div>
                      <div className="text-xs text-red-400">High volatility risk</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4">
                    <div className="text-center min-w-[40px]">
                      <div className="text-xs text-zinc-500">JAN</div>
                      <div className="text-lg font-bold text-zinc-300">30</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-300">TSLA Earnings</div>
                      <div className="text-xs text-yellow-400">After hours</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-4">
                    <div className="text-center min-w-[40px]">
                      <div className="text-xs text-zinc-500">FEB</div>
                      <div className="text-lg font-bold text-zinc-300">7</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-300">Jobs Report</div>
                      <div className="text-xs text-zinc-500">Pre-market</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Control Center (Discord) */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            The Control Center
          </h2>
          <p className="text-center text-zinc-500 mb-8">
            (your group)
          </p>
          <p className="text-center text-zinc-400 mb-8">
            Your group is the OS dashboard:
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <ul className="space-y-3 text-zinc-300">
                <li>• Filtered market + TSLA news feed (bots)</li>
                <li>• HIRO / SpotGamma intraday pulse</li>
                <li>• Morning brief (what matters today)</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-3 text-zinc-300">
                <li>• Weekly deep-dive (posted + discussed)</li>
                <li>• Weekly live strategy call</li>
                <li>• Recalibrate posture + levels together</li>
              </ul>
            </div>
          </div>
          
          <p className="text-center text-zinc-500 text-sm">
            Everything is separated into channels so you get signal, not noise.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Is this for you?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* For you */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-green-400 flex items-center gap-2">
                <Check className="w-5 h-5" /> This is for you if…
              </h3>
              <ul className="space-y-2 text-zinc-300">
                <li>You swing trade TSLA (or want to)</li>
                <li>You're tired of second-guessing entries and exits</li>
                <li>You want a system, not a signal service</li>
                <li>You value preparation over prediction</li>
                <li>You want to avoid the next 30-40% correction</li>
              </ul>
            </div>
            
            {/* Not for you */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-red-400 flex items-center gap-2">
                <X className="w-5 h-5" /> This is NOT for you if…
              </h3>
              <ul className="space-y-2 text-zinc-300">
                <li>You want someone to tell you exactly when to buy/sell</li>
                <li>You're looking for 0DTE scalping alerts</li>
                <li>You can't handle a few red days without panicking</li>
                <li>You want predictions, not a framework</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">
            Install the system.
          </h2>
          <div className="text-4xl font-bold text-white mb-2">
            $29.99<span className="text-xl text-zinc-500">/month</span>
          </div>
          <p className="text-zinc-500 mb-8">
            Cancel anytime.
          </p>
          
          <Link href="/signup">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
              Join our group
            </Button>
          </Link>
          
          <p className="mt-6 text-zinc-500 text-sm">
            Try it for a week. If you're not more organized and confident, cancel with one click.
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
