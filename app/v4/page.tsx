"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronDown, FileText, Bell, Radio, Users, Calendar, Lightbulb } from "lucide-react";
import { NeuralBackground } from "@/components/neural-background";
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

export default function LandingPageV4() {
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
          <span className="font-semibold text-zinc-200">flacko ai</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">39 of 50 spots claimed</span>
            <Link href="/signup">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                join the gang ⚔️
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Sign In Link - Top Right */}
      <div className="absolute top-4 right-6 z-40">
        <Link href="/login">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
            sign in
          </Button>
        </Link>
      </div>

      {/* ============================================
          SECTION 1: HERO - What It Is
          ============================================ */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden">
        {/* Neural Network Background */}
        <div className="absolute inset-0 -top-24">
          <NeuralBackground />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </div>
        
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <p className="text-sm text-zinc-500 mb-4">battlefield command intelligence</p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            the tsla
            <br />
            <span className="text-zinc-400">operating system.</span>
          </h1>
          <p className="text-xl text-zinc-300 mb-4">
            one system. every scenario covered.
          </p>
          <p className="text-zinc-400 mb-8">
            we turn technicals, flow and catalysts into a daily playbook. wake up with a plan already prepared for you: scenarios mapped & price alerts activated.
          </p>
          
          {/* Main CTA */}
          <div className="flex justify-center mb-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
                join the gang ⚔️
              </Button>
            </Link>
          </div>
          <p className="text-sm text-zinc-500">
            daily war briefings + price alerts + discord group
          </p>
        </div>
      </section>

      {/* Sources Monitored Band */}
      <section className="py-6 px-6 border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest mb-4">
            ai-powered monitoring & analysis:
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
            {/* Tesla */}
            <a href="https://tesla.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-red-500 transition-all cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5.362l2.475-3.026s4.245.09 8.471 2.054c-1.082 1.636-3.231 2.438-3.231 2.438-.146-1.439-1.154-1.79-4.354-1.79L12 24 8.619 5.034c-3.18 0-4.188.354-4.335 1.792 0 0-2.148-.795-3.229-2.43C5.28 2.431 9.525 2.34 9.525 2.34L12 5.362z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">tesla</span>
            </a>
            {/* SpotGamma */}
            <a href="https://spotgamma.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <img src="/logos/spotgamma.png" alt="SpotGamma" className="w-5 h-5 rounded" />
              <span className="text-xs font-medium hidden sm:inline">spotgamma</span>
            </a>
            {/* Robotaxi Tracker */}
            <a href="https://robotaxitracker.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-amber-400 transition-all cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">robotaxi tracker</span>
            </a>
            {/* TradingView */}
            <a href="https://tradingview.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <img src="/logos/tradingview.png" alt="TradingView" className="w-5 h-5 rounded" />
              <span className="text-xs font-medium hidden sm:inline">tradingview</span>
            </a>
            {/* FS Insight */}
            <a href="https://fsinsight.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <img src="/logos/fsinsight.png" alt="FS Insight" className="w-5 h-5 rounded" />
              <span className="text-xs font-medium hidden sm:inline">fs insight</span>
            </a>
            {/* CNBC */}
            <a href="https://cnbc.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <img src="/logos/cnbc.png" alt="CNBC" className="w-5 h-5 rounded" />
              <span className="text-xs font-medium hidden sm:inline">cnbc</span>
            </a>
            {/* Bloomberg */}
            <a href="https://bloomberg.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <img src="/logos/bloomberg.png" alt="Bloomberg" className="w-5 h-5 rounded" />
              <span className="text-xs font-medium hidden sm:inline">bloomberg</span>
            </a>
            {/* WSJ */}
            <a href="https://wsj.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <img src="/logos/wsj.png" alt="WSJ" className="w-5 h-5 rounded" />
              <span className="text-xs font-medium hidden sm:inline">wsj</span>
            </a>
            {/* Discord */}
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-[#5865F2] transition-all cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">discord</span>
            </a>
            {/* X */}
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-500 opacity-50 hover:opacity-100 hover:text-white transition-all cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span className="text-xs font-medium hidden sm:inline">x</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 2: WHAT YOU GET - Deliverables
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            your daily battle map
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            wake up to a complete game plan. mode, key levels, if/then scenarios — everything you need to trade with conviction.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Report */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">daily report</h3>
                  <p className="text-sm text-zinc-500">your morning game plan</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                mode (green/yellow/orange/red), key levels with if/then reactions, 
                daily cap tied to conditions. read it in 5 minutes, wake up with a plan.
              </p>
            </div>

            {/* Price Alerts */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">price alerts</h3>
                  <p className="text-sm text-zinc-500">levels come to you</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                price hits a key level → you get pinged with what to do and how to size. 
                no chart-watching required. go live your life.
              </p>
            </div>

            {/* Intraday Updates */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">intraday updates</h3>
                  <p className="text-sm text-zinc-500">we curate, you receive</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                hiro options flow throughout the day. curated market-moving headlines — batched, not spammed. 
                stay informed without hunting for information.
              </p>
            </div>

            {/* Weekly Calls */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Users className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">weekly strategy calls</h3>
                  <p className="text-sm text-zinc-500">zoom out together</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                share ideas, reflect on how the system performed, calibrate for the week ahead. 
                step back from the noise and see the bigger picture.
              </p>
            </div>

            {/* Catalyst Calendar */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">catalyst calendar</h3>
                  <p className="text-sm text-zinc-500">continuously updated</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                tsla timelines and macro events — fomc, cpi, jobs, earnings. 
                always know what's coming so you're never caught off guard.
              </p>
            </div>

            {/* Thesis Snapshot */}
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">thesis snapshot</h3>
                  <p className="text-sm text-zinc-500">stay connected to the story</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">
                fsd/autonomy progress, robotaxi updates, optimus developments — 
                the latest on everything that matters for the long-term thesis.
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
            how it works
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            your daily workflow — simple and effective.
          </p>
          
          <div className="space-y-6 md:space-y-8">
            {/* Morning */}
            <div className="flex gap-3 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <span className="text-base md:text-lg">☀️</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg mb-1">morning: read the report</h3>
                <p className="text-sm md:text-base text-zinc-400 mb-2 md:mb-3">
                  the daily report drops after market close, giving you plenty of time to review 
                  and prepare your plan for the next day. takes 5 minutes to read. you'll know:
                </p>
                <ul className="text-xs md:text-sm text-zinc-500 space-y-1">
                  <li>• what mode we're in (green, yellow, orange, or red)</li>
                  <li>• key levels to watch and what to do at each one</li>
                  <li>• your daily cap and position sizing guidance</li>
                </ul>
              </div>
            </div>

            {/* During the Day */}
            <div className="flex gap-3 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-zinc-300" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg mb-1">intraday: receive updates</h3>
                <p className="text-sm md:text-base text-zinc-400 mb-2 md:mb-3">
                  go live your life while we curate what matters. key level triggered? headline worth knowing? 
                  options flow shift? you'll get notified. no more staring at charts all day.
                </p>
                <ul className="text-xs md:text-sm text-zinc-500 space-y-1">
                  <li>• price alerts when levels are hit — with what to do and how to size</li>
                  <li>• hiro options flow updates throughout the day</li>
                  <li>• curated market-moving headlines — batched, not spammed</li>
                </ul>
              </div>
            </div>

            {/* Weekly */}
            <div className="flex gap-3 md:gap-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <span className="text-base md:text-lg">📆</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg mb-1">weekly: zooming out</h3>
                <p className="text-sm md:text-base text-zinc-400 mb-2 md:mb-3">
                  step back from the noise. reflect on how the system performed, 
                  calibrate for what's ahead, and stay connected to the bigger picture.
                </p>
                <ul className="text-xs md:text-sm text-zinc-500 space-y-1">
                  <li>• weekly strategy calls — share ideas, reflect on the operating system</li>
                  <li>• tesla catalyst calendar — continuously updated, including macro events</li>
                  <li>• thesis snapshot — fsd/autonomy, robotaxi, optimus, latest developments</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="mt-10 bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 text-center">
            <p className="text-zinc-300 font-medium">
              read the report, go live your life. the system tells you when to pay attention.
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

      {/* ============================================
          SECTION 5: THE SYSTEM - Mode + Methodology Combined
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">
            regime mode
          </h2>
          <p className="text-center text-zinc-500 mb-10">
            conditions deteriorate in stages. we track the signals so you adjust before it's too late.
          </p>
          
          {/* Mode Spectrum */}
          <div className="mb-8 md:mb-10">
            <div className="h-2 md:h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 mb-3 md:mb-4"></div>
            <div className="flex justify-between text-[10px] md:text-xs text-zinc-500 px-1">
              <span>healthy</span>
              <span>warning</span>
              <span>caution</span>
              <span>defensive</span>
            </div>
          </div>

          {/* Four Modes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
            {/* Green */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-bold text-green-400 text-sm md:text-base">green</h3>
              </div>
              <p className="text-[10px] md:text-xs text-zinc-400 mb-2">trend intact, momentum healthy</p>
              <ul className="space-y-1 text-[10px] md:text-xs text-zinc-300">
                <li>• daily cap: up to 25%</li>
                <li>• good to buy dips</li>
                <li>• hold with conviction</li>
              </ul>
            </div>
            
            {/* Yellow */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <h3 className="font-bold text-yellow-400 text-sm md:text-base">yellow</h3>
              </div>
              <p className="text-[10px] md:text-xs text-zinc-400 mb-2">warning signs present</p>
              <ul className="space-y-1 text-[10px] md:text-xs text-zinc-300">
                <li>• reducing daily cap to &lt;15%</li>
                <li>• ratcheting down leverage</li>
                <li>• shifting to watch and see</li>
              </ul>
            </div>
            
            {/* Orange */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <h3 className="font-bold text-orange-400 text-sm md:text-base">orange</h3>
              </div>
              <p className="text-[10px] md:text-xs text-zinc-400 mb-2">structure weakening</p>
              <ul className="space-y-1 text-[10px] md:text-xs text-zinc-300">
                <li>• daily cap: 10% or less</li>
                <li>• pause or small nibbles only</li>
                <li>• preparing for potential exit</li>
              </ul>
            </div>
            
            {/* Red */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h3 className="font-bold text-red-400 text-sm md:text-base">red</h3>
              </div>
              <p className="text-[10px] md:text-xs text-zinc-400 mb-2">structure broken or at risk</p>
              <ul className="space-y-1 text-[10px] md:text-xs text-zinc-300">
                <li>• daily cap: 5% or less</li>
                <li>• respecting master eject level</li>
                <li>• requiring evidence of bottom</li>
              </ul>
            </div>
          </div>

          {/* What Determines Mode */}
          <div className="bg-zinc-900/50 rounded-xl p-5 md:p-8 border border-zinc-800">
            <h3 className="font-semibold text-lg md:text-xl mb-2 text-center">how the mode is determined</h3>
            <p className="text-center text-zinc-500 text-sm mb-6 md:mb-8">systematic clarity when you need it most.</p>
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-16">
              <div className="md:pr-4 lg:pr-8">
                <h4 className="text-sm md:text-base font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  technical confluence
                </h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>• market structure — hh/hl or broken</li>
                  <li>• bx trender — momentum regime</li>
                  <li>• ma/ema — trend position & slope</li>
                  <li>• smi — leading momentum indicator</li>
                  <li>• rsi — divergences & extremes</li>
                </ul>
              </div>
              <div className="md:pl-4 lg:pl-8 md:border-l md:border-zinc-800">
                <h4 className="text-sm md:text-base font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  dealer positioning
                </h4>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li>• spotgamma levels — put/call/hedge walls</li>
                  <li>• hiro — real-time institutional flow</li>
                  <li>• flowpatrol — daily options flow report</li>
                  <li>• gamma regime — positive vs negative</li>
                  <li>• key gamma strike — regime pivot point</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-6 md:mt-8 text-center border-t border-zinc-800 pt-4">
              powered by $700+/mo in data feed subscriptions. you get the synthesis, not the complexity.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 6: WHO IT'S FOR
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            is this for you?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* For you */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-green-400 flex items-center gap-2">
                <Check className="w-5 h-5" /> this is for you if…
              </h3>
              <ul className="space-y-3 text-zinc-300">
                <li>you want to <strong>sidestep the next 30-40% correction</strong> before it happens</li>
                <li>you're tired of <strong>buying the dip that keeps dipping</strong></li>
                <li>you want to <strong>wake up knowing exactly what to do</strong> if price hits x</li>
                <li>you'd rather <strong>spend 10 minutes a day</strong> than 4 hours glued to charts</li>
                <li>you want <strong>conviction</strong> — not second-guessing every entry</li>
              </ul>
            </div>
            
            {/* Not for you */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-red-400 flex items-center gap-2">
                <X className="w-5 h-5" /> this is NOT for you if…
              </h3>
              <ul className="space-y-3 text-zinc-300">
                <li>you want someone to say "buy now" and "sell now"</li>
                <li>you're chasing 0dte lottery tickets</li>
                <li>you panic-sell on any red day</li>
                <li>you think preparation is "too much work"</li>
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
            faq
          </h2>
          
          <div>
            <FAQItem
              question="how is the report created?"
              answer="the system combines a trained framework built on years of tsla-specific trading philosophy with real-time data feeds costing over $500/month. each report pulls from multi-timeframe technical analysis, momentum and trend indicators, market structure assessment, and institutional options flow data from spotgamma. the ai synthesizes all of this into a single daily read on regime, levels, and positioning. it's not a gut call. it's a systematic process that runs the same way every day."
            />
            <FAQItem
              question="how is the regime mode determined?"
              answer="the mode is determined by confluence of multiple indicators: market structure (higher highs/lows), bx trender momentum, weekly ema hierarchy (9/13/21), dealer positioning from spotgamma, and real-time hiro flow data. no single indicator controls the decision — we're looking for alignment across technicals and flow. the system runs the same way every day, systematically."
            />
            <FAQItem
              question="what kind of alerts do i receive?"
              answer="price alerts when tsla hits key levels from the daily report, mode shift notifications when conditions change, and hiro flow updates throughout the day. each alert includes context on what it means and what to do. you're not getting spam — just the signals that matter."
            />
            <FAQItem
              question="is this only for tsla?"
              answer="yes, the daily reports and levels are tsla-specific. we also monitor spy/qqq for broader context since tsla doesn't move in a vacuum. we're building infrastructure to add more tickers in the future."
            />
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 8: PRICING + CTA
          ============================================ */}
      <section className="py-16 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            install our operating system.
          </h2>

          {/* Founder Tier Card */}
          <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-white" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">⚡ founder tier</span>
              <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full">11 spots left</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-bold text-white">$29.99</span>
              <span className="text-sm text-zinc-500">/month</span>
              <span className="text-xs text-zinc-600 line-through">$39.99</span>
            </div>

            <div className="mb-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[78%] rounded-full" />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
                <span>39 of 50 claimed</span>
                <span>next tier: $39.99/mo</span>
              </div>
            </div>
          </div>

          {/* What You Get */}
          <div className="bg-zinc-900/50 rounded-xl p-5 mb-6 border border-zinc-800">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-4">what you get</p>
            <div className="space-y-3 text-sm text-zinc-300">
              {[
                "daily war briefings before you wake up",
                "get pinged at key levels — with exactly what to do",
                "spotgamma dealer flow — see what institutions see",
                "mode system — attack vs defend",
                "trade alongside disciplined tsla investors",
                "$700/mo of institutional flow data — included",
                "private discord — execute with the gang",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/signup" className="block">
            <Button className="w-full bg-white text-black hover:bg-zinc-200">
              join the gang ⚔️
            </Button>
          </Link>

          {/* Price Tier Ladder */}
          <p className="text-[11px] uppercase tracking-widest text-zinc-600 mt-8 mb-4 text-center">
            lock in your price — increases every 50 members
          </p>

          <div className="space-y-2">
            {[
              { label: "spots 1-50", price: "$29.99/mo", active: true },
              { label: "spots 51-100", price: "$39.99/mo", active: false },
              { label: "spots 101-150", price: "$49.99/mo", active: false },
              { label: "spots 151-200", price: "$59.99/mo", active: false },
              { label: "spots 201+", price: "$69.99/mo", active: false },
            ].map((tier) => (
              <div
                key={tier.label}
                className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                  tier.active
                    ? "bg-zinc-800 border-zinc-600"
                    : "bg-zinc-900/50 border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tier.active ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-zinc-700"
                    }`}
                  />
                  <span className={`text-sm ${tier.active ? "text-white font-semibold" : "text-zinc-500"}`}>
                    {tier.label}
                  </span>
                  {tier.active && (
                    <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded">
                      you are here
                    </span>
                  )}
                </div>
                <span className={`text-sm ${tier.active ? "text-white" : "text-zinc-600"}`}>{tier.price}</span>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-zinc-500 text-center mt-3">
            your rate stays locked forever — price only increases for new members
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto flex justify-between items-center text-sm text-zinc-600">
          <span>flacko ai</span>
          <div className="flex gap-6">
            <a
              href="https://x.com/smdcapital"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400"
            >
              x
            </a>
            <a href="/terms" className="hover:text-zinc-400">terms</a>
            <a href="/privacy" className="hover:text-zinc-400">privacy</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
