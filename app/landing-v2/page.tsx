"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

// FAQ Accordion Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium text-zinc-200">{question}</span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export default function LandingPageV2() {
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
      {/* Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur border-b border-zinc-800 transition-all duration-300 ${showSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-zinc-200">Flacko AI</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">500+ members</span>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                Get Access
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================
          SECTION 1: HERO - What It Is
          ============================================ */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-zinc-500 mb-4">Join 500+ TSLA investors</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            Our TSLA Trading
            <br />
            <span className="text-zinc-400">Operating System.</span>
          </h1>
          <p className="text-xl text-zinc-300 mb-4">
            One system. Every scenario covered.
          </p>
          <p className="text-zinc-400 mb-8">
            We turn technicals, flow and catalysts into a daily playbook. Wake up with a plan already prepared for you: scenarios mapped & price alerts activated.
          </p>
          
          {/* Main CTA */}
          <div className="flex justify-center mb-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
                Get Access — $29.99/mo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-zinc-500">
            Daily Report + Alerts + VIP Discord + Weekly Calls
          </p>
        </div>
      </section>

      {/* Sources Monitored Band */}
      <section className="py-6 px-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest mb-4">
            Powered by Continuous Monitoring
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 opacity-50 hover:opacity-70 transition-opacity">
            {/* Discord */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#5865F2] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">Discord</span>
            </div>
            {/* X */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">X</span>
            </div>
            {/* SpotGamma */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#00D4AA] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">SpotGamma</span>
            </div>
            {/* FS Insight */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#FF6B35] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">FS Insight</span>
            </div>
            {/* CNBC */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#005594] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">CNBC</span>
            </div>
            {/* Bloomberg */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#FF6600] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">Bloomberg</span>
            </div>
            {/* TradingView */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#2962FF] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17h2v-7H3v7zm4 0h2V7H7v10zm4 0h2V4h-2v13zm4 0h2v-4h-2v4zm4 0h2v-9h-2v9z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">TradingView</span>
            </div>
            {/* WSJ */}
            <div className="flex items-center gap-2 text-zinc-500 hover:text-[#0080C6] transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">WSJ</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: WHAT YOU GET - Deliverables
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            Your Daily Battle Map
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            Wake up to a complete game plan. Mode, key levels, if/then scenarios — everything you need to trade with conviction.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Report */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Daily Report</h3>
                  <p className="text-sm text-zinc-500">Your morning game plan</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Mode (Green/Yellow/Orange/Red), key levels with if/then reactions, 
                daily cap tied to conditions, and dealer positioning context. 
                Read it in 5 minutes, know exactly what to do.
              </p>
            </div>

            {/* Automated Alerts */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-xl">🔔</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Automated Alerts</h3>
                  <p className="text-sm text-zinc-500">Levels come to you</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Price hits a level → you get pinged. Mode shifts → you know immediately. 
                Pre-written reactions ready. Set it and forget it — no chart-watching required.
              </p>
            </div>

            {/* VIP Discord */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Context Feed</h3>
                  <p className="text-sm text-zinc-500">Stay current without hunting</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Morning brief: what matters today. Intraday flow: HIRO + SpotGamma updates. 
                Market headlines: batched and synthesized. Information flows to you — not the other way around.
              </p>
            </div>

            {/* Weekly Call */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-xl">🎙️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Weekly Live Call</h3>
                  <p className="text-sm text-zinc-500">Walk through the week together</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Accountability, regime check, correction risk assessment, week ahead setup. 
                Ask questions, get answers. Weekly keeps the thesis honest.
              </p>
            </div>

            {/* Catalyst Calendar */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Catalyst Calendar</h3>
                  <p className="text-sm text-zinc-500">Never surprised by volatility</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                Risk windows tracked: Fed, CPI, jobs, earnings. TSLA timelines: thesis-critical dates. 
                Weekly recap: news → thesis impact. Don't get caught off guard.
              </p>
            </div>

            {/* Weekly Research */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-xl">🔬</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">State of Tesla</h3>
                  <p className="text-sm text-zinc-500">Weekly thesis deep-dive</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                FSD progress, Robotaxi updates, Energy business, Optimus, analyst moves — 
                everything that matters for the thesis, synthesized so you don't have to hunt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 3: HOW IT WORKS - User Perspective
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            How It Works
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            Your daily workflow — simple and effective.
          </p>
          
          <div className="space-y-8">
            {/* Morning */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border border-yellow-500/50 flex items-center justify-center">
                  <span className="text-lg">☀️</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Morning: Read the Report</h3>
                <p className="text-zinc-400 mb-3">
                  The daily report drops after market close, giving you plenty of time to review 
                  and prepare your plan for the next day. Takes 5 minutes to read. You'll know:
                </p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>• What mode we're in (Green, Yellow, Orange, or Red)</li>
                  <li>• Key levels to watch and what to do at each one</li>
                  <li>• Your daily cap and position sizing guidance</li>
                </ul>
              </div>
            </div>

            {/* During the Day */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5865F2]/30 to-[#5865F2]/10 border border-[#5865F2]/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Intraday: Receive Updates</h3>
                <p className="text-zinc-400 mb-3">
                  Go live your life while we curate what matters. Key level triggered? Headline worth knowing? 
                  Options flow shift? You'll get notified. No more staring at charts all day.
                </p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>• Price alerts when levels are hit — with what to do and how to size</li>
                  <li>• HIRO options flow updates throughout the day</li>
                  <li>• Curated market-moving headlines — batched, not spammed</li>
                </ul>
              </div>
            </div>

            {/* Weekly */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/50 flex items-center justify-center">
                  <span className="text-lg">📆</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Weekly: Zooming Out</h3>
                <p className="text-zinc-400 mb-3">
                  Step back from the noise. Reflect on how the system performed, 
                  calibrate for what's ahead, and stay connected to the bigger picture.
                </p>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>• Weekly strategy calls — share ideas, reflect on the operating system</li>
                  <li>• Tesla catalyst calendar — continuously updated, including macro events</li>
                  <li>• Thesis Snapshot — FSD/autonomy, Robotaxi, Optimus, latest developments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="mt-10 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 text-center">
            <p className="text-zinc-300 font-medium">
              Read the report, go live your life. The system tells you when to pay attention.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 4: THE PROBLEM - Correction Chart
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            The Problem This Solves
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            Corrections unfold in stages. We catch them early.
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
                    {/* Red segment - Weeks 5-10 */}
                    <path 
                      d="M 200 70 Q 230 85, 260 100 T 320 130 Q 380 160, 440 180 T 500 195" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    
                    {/* Connector lines */}
                    <line x1="50" y1="27" x2="50" y2="8" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="100" y1="35" x2="100" y2="8" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="200" y1="70" x2="200" y2="8" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                    <line x1="260" y1="100" x2="260" y2="8" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3,3" />
                  </svg>
                  
                  {/* Mode Labels */}
                  <div className="absolute -top-5 left-[8%] flex flex-col items-center">
                    <span className="text-[10px] text-green-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">Green Mode</span>
                  </div>
                  <div className="absolute top-[13%] left-[9%]">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-green-300 shadow-lg shadow-green-500/50"></div>
                  </div>
                  
                  <div className="absolute top-1 left-[18%] flex flex-col items-center">
                    <span className="text-[10px] text-yellow-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">Yellow Mode</span>
                  </div>
                  <div className="absolute top-[17%] left-[19%]">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-yellow-300 shadow-lg shadow-yellow-500/50 animate-pulse"></div>
                  </div>
                  
                  <div className="absolute -top-5 left-[38%] flex flex-col items-center">
                    <span className="text-[10px] text-red-400 font-bold bg-zinc-900/80 px-1.5 py-0.5 rounded">Red Mode</span>
                  </div>
                  <div className="absolute top-[35%] left-[39%]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-red-300 shadow-lg shadow-red-500/50"></div>
                  </div>
                  
                  <div className="absolute top-1 left-[50%] flex flex-col items-center">
                    <span className="text-[10px] text-red-600 font-bold bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">Master Eject</span>
                  </div>
                  <div className="absolute top-[50%] left-[51%]">
                    <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-red-400 shadow-lg shadow-red-600/50"></div>
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between mt-3 text-[9px] text-zinc-500">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                  <span>Week 5</span>
                  <span>Week 6</span>
                  <span>Week 7</span>
                  <span>Week 8</span>
                  <span>Week 9</span>
                  <span>Week 10</span>
                </div>
                
                {/* Caption */}
                <div className="mt-4 text-center">
                  <span className="text-xs text-zinc-400">We warn you <strong className="text-yellow-400 font-bold">early</strong> — not when it's too late</span>
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
                This system is designed to <strong className="text-white">catch the warning signs early</strong>. You'll know on Week 3, not Week 10. As conditions deteriorate, exposure ratchets down. No averaging into weakness.
              </p>
              <p className="text-zinc-500 text-sm pt-2">
                And we'll monitor & discuss together as a team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: THE SYSTEM - Mode + Methodology Combined
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            Regime Mode
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            Conditions deteriorate in stages. We track the signals so you adjust before it's too late.
          </p>
          
          {/* Mode Spectrum */}
          <div className="mb-10">
            <div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 mb-4"></div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Healthy</span>
              <span>Warning</span>
              <span>Caution</span>
              <span>Defensive</span>
            </div>
          </div>

          {/* Four Modes */}
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {/* Green */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-bold text-green-400">Green</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-2">Trend intact, momentum healthy</p>
              <ul className="space-y-1 text-xs text-zinc-300">
                <li>• Good to buy dips</li>
                <li>• Hold with conviction</li>
                <li>• Don't sell too fast</li>
              </ul>
            </div>
            
            {/* Yellow */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h3 className="font-bold text-yellow-400">Yellow</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-2">Warning signs present</p>
              <ul className="space-y-1 text-xs text-zinc-300">
                <li>• Reducing daily cap to 15-20%</li>
                <li>• Ratcheting down leverage</li>
                <li>• Shifting to watch and see</li>
              </ul>
            </div>
            
            {/* Orange */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <h3 className="font-bold text-orange-400">Orange</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-2">Structure weakening</p>
              <ul className="space-y-1 text-xs text-zinc-300">
                <li>• Dropping daily cap to 10%</li>
                <li>• Small nibbles only</li>
                <li>• Preparing for potential exit</li>
              </ul>
            </div>
            
            {/* Red */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h3 className="font-bold text-red-400">Red</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-2">Structure broken or at risk</p>
              <ul className="space-y-1 text-xs text-zinc-300">
                <li>• Dropping daily cap to 0-5%</li>
                <li>• Respecting Master Eject level</li>
                <li>• Requiring evidence of bottom</li>
              </ul>
            </div>
          </div>

          {/* What Determines Mode */}
          <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
            <h3 className="font-semibold mb-4 text-center">How the Mode is Determined</h3>
            <p className="text-center text-zinc-500 text-sm mb-6">Systematic clarity when you need it most.</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Technical Confluence</h4>
                <ul className="space-y-1 text-sm text-zinc-400">
                  <li>• Market Structure — HH/HL or broken</li>
                  <li>• BX Trender — Momentum regime</li>
                  <li>• MA/EMA — Trend position & slope</li>
                  <li>• SMI — Leading momentum indicator</li>
                  <li>• RSI — Divergences & extremes</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Dealer Positioning</h4>
                <ul className="space-y-1 text-sm text-zinc-400">
                  <li>• SpotGamma Levels — Put Wall, Call Wall, Hedge Wall</li>
                  <li>• HIRO — Real-time institutional flow</li>
                  <li>• FlowPatrol — Daily options flow report</li>
                  <li>• Gamma Regime — Positive vs negative gamma</li>
                  <li>• Key Gamma Strike — Regime pivot point</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-4 text-center">
              Powered by $700+/mo in institutional data feeds. You get the synthesis, not the complexity.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: CATALYST CALENDAR
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
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

      {/* ============================================
          SECTION 7: WHO IT'S FOR
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Is This For You?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* For you */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-green-400 flex items-center gap-2">
                <Check className="w-5 h-5" /> This is for you if…
              </h3>
              <ul className="space-y-3 text-zinc-300">
                <li>You want to <strong>sidestep the next 30-40% correction</strong> before it happens</li>
                <li>You're tired of <strong>buying the dip that keeps dipping</strong></li>
                <li>You want to <strong>wake up knowing exactly what to do</strong> if price hits X</li>
                <li>You'd rather <strong>spend 10 minutes a day</strong> than 4 hours glued to charts</li>
                <li>You want <strong>conviction</strong> — not second-guessing every entry</li>
              </ul>
            </div>
            
            {/* Not for you */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-red-400 flex items-center gap-2">
                <X className="w-5 h-5" /> This is NOT for you if…
              </h3>
              <ul className="space-y-3 text-zinc-300">
                <li>You want someone to say "buy now" and "sell now"</li>
                <li>You're chasing 0DTE lottery tickets</li>
                <li>You panic-sell on any red day</li>
                <li>You think preparation is "too much work"</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 7: FAQ
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            FAQ
          </h2>
          
          <div>
            <FAQItem
              question="How is the report created?"
              answer="The system combines a trained framework built on years of TSLA-specific trading philosophy with real-time data feeds costing over $700/month. Each report pulls from multi-timeframe technical analysis, momentum and trend indicators, market structure assessment, and institutional options flow data from SpotGamma. The AI synthesizes all of this into a single daily read on regime, levels, and positioning. It's not a gut call. It's a systematic process that runs the same way every day."
            />
            <FAQItem
              question="How is the Regime mode determined?"
              answer="The mode is determined by confluence of multiple indicators: market structure (higher highs/lows), BX Trender momentum, Weekly EMA hierarchy (9/13/21), dealer positioning from SpotGamma, and real-time HIRO flow data. No single indicator controls the decision — we're looking for alignment across technicals and flow. The system runs the same way every day, systematically."
            />
            <FAQItem
              question="What kind of alerts do I receive?"
              answer="Price alerts when TSLA hits key levels from the daily report, mode shift notifications when conditions change, and HIRO flow updates throughout the day. Each alert includes context on what it means and what to do. You're not getting spam — just the signals that matter."
            />
            <FAQItem
              question="Is this only for TSLA?"
              answer="Yes, the daily reports and levels are TSLA-specific. We also monitor SPY/QQQ for broader context since TSLA doesn't move in a vacuum. We're building infrastructure to add more tickers in the future."
            />
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 8: PRICING + CTA
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">
            Get the system.
          </h2>
          <p className="text-zinc-500 mb-6">
            Sleep at night knowing you have a plan for every scenario.
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-2xl text-zinc-500 line-through">$39.99</span>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">25% OFF</span>
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            $29.99<span className="text-xl text-zinc-500">/month</span>
          </div>
          <p className="text-zinc-500 mb-8">
            Cancel anytime.
          </p>
          
          <Link href="/signup">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
              Start Free Trial
            </Button>
          </Link>
          
          <p className="mt-6 text-zinc-500 text-sm">
            Join 500+ members who wake up with a plan.
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
