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
    <div className="w-full max-w-md mx-auto px-2">
      {/* Hero */}
      <div className="text-center mb-5 sm:mb-6">
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

      {/* Founder Tier Card + CTA */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 sm:p-5 relative overflow-hidden mb-4">
        <div className="absolute inset-x-0 top-0 h-1 bg-white" />
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-zinc-300 uppercase">⚡ founder tier</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full">11 spots left</span>
        </div>
        
        <div className="flex items-end gap-2 mb-3">
          <span className="text-3xl sm:text-4xl font-bold text-white">$29.99</span>
          <span className="text-sm text-zinc-500">/month</span>
          <span className="text-xs text-zinc-600 line-through">$39.99</span>
        </div>

        <div className="mb-4">
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white w-[78%] rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5">
            <span>39 of 50 claimed</span>
            <span>next tier: $39.99/mo</span>
          </div>
        </div>

        {/* CTA Button - Inside card for prominence */}
        <Button 
          onClick={handleJoin}
          className="w-full bg-white text-black hover:bg-zinc-200 h-12 text-base font-semibold" 
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
        
        <p className="text-[10px] text-zinc-500 text-center mt-3">
          your rate stays locked forever
        </p>
      </div>

      {/* What You Get - Collapsible on mobile */}
      <div className="mb-4">
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 sm:hidden"
        >
          <span className="text-sm text-zinc-300">what you get</span>
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Mobile: collapsible / Desktop: always visible */}
        <div className={`${showDetails ? 'block' : 'hidden'} sm:block`}>
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 sm:rounded-xl mt-2 sm:mt-0">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-zinc-500 mb-3 hidden sm:block">what you get</p>
            <div className="space-y-2 text-[13px] sm:text-sm text-zinc-300">
              {benefits.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Price Tier Ladder - Compact */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 text-center">
          lock in your price — increases every 50 members
        </p>
        <div className="space-y-1">
          {[
            { label: "spots 1-50", price: "$29.99/mo", active: true },
            { label: "spots 51-100", price: "$39.99/mo", active: false },
            { label: "spots 101-150", price: "$49.99/mo", active: false },
            { label: "spots 151+", price: "$49.99+", active: false },
          ].map((tier) => (
            <div
              key={tier.label}
              className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                tier.active
                  ? "bg-zinc-800 border-zinc-600"
                  : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    tier.active ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-zinc-700"
                  }`}
                />
                <span className={`text-xs ${tier.active ? "text-white font-semibold" : "text-zinc-500"}`}>
                  {tier.label}
                </span>
                {tier.active && (
                  <span className="text-[8px] font-bold bg-white text-black px-1.5 py-0.5 rounded">
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
      <div className="text-center space-y-2 pb-4">
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
    </div>
  );
}
