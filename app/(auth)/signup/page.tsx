"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ChevronDown } from "lucide-react";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        alert(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setLoading(false);
      alert("Something went wrong. Please try again.");
    }
  };

  const benefits = [
    "daily war briefings before you wake up",
    "get pinged at key levels — with exactly what to do",
    "spotgamma dealer flow — see what institutions see",
    "mode system — attack vs defend",
    "trade alongside disciplined tsla investors",
    "$700/mo of institutional flow data — included",
    "private discord — execute with the gang",
  ];

  return (
    <div className="w-full max-w-md mx-auto px-2 relative">
      {/* Background glow effects */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-60 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Hero */}
      <div className="text-center mb-5 sm:mb-6 relative z-10">
        <p className="text-xs sm:text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1.5">
          flacko ai
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          join the gang ⚔️
        </h1>
        <p className="text-sm text-zinc-400">
          daily war briefings, price alerts, and a system that tells you when to pay attention.
        </p>
      </div>

      {/* Founder Tier Card + CTA - with glow border */}
      <div className="relative mb-4 z-10">
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-white/20 via-white/10 to-white/20 rounded-2xl blur-xl opacity-50" />
        
        <div className="relative bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-4 sm:p-5 overflow-hidden">
          {/* Top accent line with glow */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/10 to-transparent" />
          
          <div className="flex items-center justify-between mb-3 relative">
            <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-zinc-300 uppercase flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              founder tier
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
              11 spots left
            </span>
          </div>
          
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl sm:text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">$29.99</span>
            <span className="text-sm text-zinc-500">/month</span>
            <span className="text-xs text-zinc-600 line-through">$39.99</span>
          </div>

          <div className="mb-4">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-white via-white to-zinc-300 w-[78%] rounded-full relative">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_2s_infinite] -skew-x-12" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
              <span>39 of 50 claimed</span>
              <span>next tier: $39.99/mo</span>
            </div>
          </div>

          {/* CTA Button with glow */}
          <div className="relative">
            <div className="absolute -inset-1 bg-white/30 rounded-xl blur-md" />
            <Button 
              onClick={handleJoin}
              className="relative w-full bg-white text-black hover:bg-zinc-100 h-12 text-base font-semibold shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  redirecting...
                </>
              ) : (
                "join the gang ⚔️"
              )}
            </Button>
          </div>
          
          <p className="text-[10px] text-zinc-500 text-center mt-3">
            your rate stays locked forever
          </p>
        </div>
      </div>

      {/* What You Get - Collapsible on mobile */}
      <div className="mb-4 relative z-10">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 sm:hidden"
        >
          <span className="text-sm text-zinc-300">what you get</span>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Mobile: collapsible / Desktop: always visible */}
        <div className={`${showDetails ? 'block' : 'hidden'} sm:block`}>
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 mt-2 sm:mt-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-zinc-500 mb-3 hidden sm:block">what you get</p>
            <div className="space-y-2 text-[13px] sm:text-sm text-zinc-300">
              {benefits.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-white to-zinc-300 text-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Price Tier Ladder with glowing orbs */}
      <div className="mb-4 relative z-10">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 text-center">
          lock in your price — increases every 50 members
        </p>
        <div className="space-y-1.5">
          {[
            { label: "spots 1-50", price: "$29.99/mo", active: true, glow: "shadow-[0_0_15px_rgba(255,255,255,0.6)]" },
            { label: "spots 51-100", price: "$39.99/mo", active: false, glow: "shadow-[0_0_8px_rgba(161,161,170,0.3)]" },
            { label: "spots 101-150", price: "$49.99/mo", active: false, glow: "shadow-[0_0_6px_rgba(113,113,122,0.2)]" },
            { label: "spots 151+", price: "$59.99+", active: false, glow: "shadow-[0_0_4px_rgba(82,82,91,0.1)]" },
          ].map((tier) => (
            <div
              key={tier.label}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 border transition-all ${
                tier.active
                  ? "bg-zinc-800/80 border-zinc-600 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Glowing orb */}
                <span className="relative flex items-center justify-center">
                  {tier.active && (
                    <span className="absolute w-4 h-4 rounded-full bg-white/30 blur-md animate-pulse" />
                  )}
                  <span
                    className={`relative w-3 h-3 rounded-full ${
                      tier.active 
                        ? "bg-gradient-to-br from-white to-zinc-300 shadow-[0_0_12px_rgba(255,255,255,0.8)]" 
                        : "bg-zinc-700"
                    } ${tier.glow}`}
                  />
                </span>
                <span className={`text-xs ${tier.active ? "text-white font-semibold" : "text-zinc-500"}`}>
                  {tier.label}
                </span>
                {tier.active && (
                  <span className="text-[8px] font-bold bg-gradient-to-r from-white to-zinc-200 text-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                    you are here
                  </span>
                )}
              </div>
              <span className={`text-xs ${tier.active ? "text-white" : "text-zinc-600"}`}>{tier.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-2 pb-4 relative z-10">
        <p className="text-[10px] text-zinc-500">
          by subscribing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-zinc-300">terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-zinc-300">privacy policy</Link>
        </p>
        <p className="text-[10px] text-zinc-600">
          already a member?{" "}
          <Link href="/login" className="underline hover:text-zinc-300">sign in</Link>
        </p>
      </div>

      {/* Add shimmer keyframe */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
}
