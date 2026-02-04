"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-5 px-1">
      {/* Hero - tighter on mobile */}
      <div className="text-center space-y-1.5 sm:space-y-2">
        <p className="text-xs sm:text-sm font-medium text-zinc-500 uppercase tracking-wider">
          flacko ai
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          join the gang ⚔️
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 px-2">
          daily war briefings, price alerts, and a system that tells you when to pay attention.
        </p>
      </div>

      {/* Founder Tier Card */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-white" />
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-semibold tracking-widest text-zinc-300 uppercase">⚡ founder tier</span>
          <span className="text-[10px] sm:text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-0.5 sm:py-1 rounded-full">11 spots left</span>
        </div>
        <div className="flex items-end gap-2 mb-2 sm:mb-3">
          <span className="text-3xl sm:text-4xl font-bold text-white">$29.99</span>
          <span className="text-sm text-zinc-500">/month</span>
          <span className="text-xs text-zinc-600 line-through">$39.99</span>
        </div>

        <div>
          <div className="h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white w-[78%] rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-zinc-500 mt-1.5 sm:mt-2">
            <span>39 of 50 claimed</span>
            <span>next tier: $39.99/mo</span>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-zinc-900/50 rounded-xl p-4 sm:p-5 border border-zinc-800">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-zinc-500 mb-2.5 sm:mb-3">what you get</p>
        <div className="space-y-2 sm:space-y-2.5 text-[13px] sm:text-sm text-zinc-300">
          {[
            "daily war briefings before you wake up",
            "get pinged at key levels — with exactly what to do",
            "spotgamma dealer flow — see what institutions see",
            "mode system — attack vs defend",
            "trade alongside disciplined tsla investors",
            "$700/mo of institutional flow data — included",
            "private discord — execute with the gang",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 sm:gap-3">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-black text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Join Button */}
      <Button 
        onClick={handleJoin}
        className="w-full bg-white text-black hover:bg-zinc-200 h-11 sm:h-12 text-sm sm:text-base font-medium" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            redirecting to checkout...
          </>
        ) : (
          "join the gang ⚔️"
        )}
      </Button>

      {/* Price Tier Ladder */}
      <div>
        <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-zinc-600 mb-2.5 sm:mb-3 text-center">
          lock in your price — increases every 50 members
        </p>
        <div className="space-y-1.5 sm:space-y-2">
          {[
            { label: "spots 1-50", price: "$29.99/mo", active: true },
            { label: "spots 51-100", price: "$39.99/mo", active: false },
            { label: "spots 101-150", price: "$49.99/mo", active: false },
            { label: "spots 151-200", price: "$59.99/mo", active: false },
            { label: "spots 201+", price: "$69.99/mo", active: false },
          ].map((tier) => (
            <div
              key={tier.label}
              className={`flex items-center justify-between rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 border ${
                tier.active
                  ? "bg-zinc-800 border-zinc-600"
                  : "bg-zinc-900/50 border-zinc-800"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                    tier.active ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-zinc-700"
                  }`}
                />
                <span className={`text-[13px] sm:text-sm ${tier.active ? "text-white font-semibold" : "text-zinc-500"}`}>
                  {tier.label}
                </span>
                {tier.active && (
                  <span className="text-[9px] sm:text-[10px] font-bold bg-white text-black px-1.5 sm:px-2 py-0.5 rounded">
                    you are here
                  </span>
                )}
              </div>
              <span className={`text-[13px] sm:text-sm ${tier.active ? "text-white" : "text-zinc-600"}`}>{tier.price}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 text-center mt-3">
          your rate stays locked forever — price only increases for new members
        </p>
      </div>

      <div className="text-center space-y-2 pb-2">
        <p className="text-[10px] sm:text-xs text-zinc-500">
          by subscribing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-zinc-300">terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-zinc-300">privacy policy</Link>
        </p>
        <p className="text-[10px] sm:text-xs text-zinc-600">
          already a member?{" "}
          <Link href="/login" className="underline hover:text-zinc-300">sign in</Link>
        </p>
      </div>
    </div>
  );
}
