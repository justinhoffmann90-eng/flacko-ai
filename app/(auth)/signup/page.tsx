"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Check } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);

  // Capture lead when user leaves email field
  const captureLead = async () => {
    if (!email || leadCaptured || !email.includes("@")) return;
    setLeadCaptured(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, xHandle, source: "signup" }),
      });
    } catch {
      // Silent fail - lead capture is non-critical
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Clean up X handle - remove @ if provided
    const cleanHandle = xHandle.trim().replace(/^@/, "");

    try {
      // Combined signup + checkout in one call
      const response = await fetch("/api/signup-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, xHandle: cleanHandle || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("Already subscribed")) {
          setError("This email already has an active subscription. Please sign in.");
        } else if (data.error?.includes("Failed to create")) {
          setError("Could not create account. Please try again.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-lg mx-auto space-y-4 md:space-y-5">
      {/* Hero */}
      <div className="text-center space-y-2 mb-2">
        <h1 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          flacko ai
        </h1>
        <p className="text-2xl md:text-3xl font-bold text-white">
          join the gang ⚔️
        </p>
        <p className="text-zinc-400 md:text-lg">
          daily war briefings, price alerts, and a system that tells you when to pay attention.
        </p>
      </div>

      {/* Founder Tier Card */}
      <div className="bg-zinc-900/80 border border-zinc-700 rounded-2xl p-5 md:p-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-white" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">⚡ founder tier</span>
          <span className="text-[11px] font-bold text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full">3 spots left</span>
        </div>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold text-white">$29.99</span>
          <span className="text-sm text-zinc-500">/month</span>
          <span className="text-xs text-zinc-600 line-through">$39.99</span>
        </div>

        <div className="mb-4">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white w-[94%] rounded-full" />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 mt-2">
            <span>47 of 50 claimed</span>
            <span>next tier: $39.99/mo</span>
          </div>
        </div>

        {/* Value Leverage */}
        <div className="text-sm text-zinc-400 mb-3 pt-3 border-t border-zinc-800">
          you'll leverage <span className="text-emerald-400 font-semibold">$800/mo</span> in institutional data & tools:
        </div>
        <div className="text-[12px] text-zinc-500 leading-relaxed mb-4">
          <span className="text-zinc-400">fs insight</span> <span className="text-zinc-600">(macro & technical)</span> · <span className="text-zinc-400">spotgamma</span> <span className="text-zinc-600">(alpha, hiro)</span>
          <br />
          <span className="text-zinc-400">ai agents & infra</span> <span className="text-zinc-600">(claude max, grok, m4 mini)</span>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-zinc-900/50 rounded-xl p-4 md:p-5 border border-zinc-800">
        <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3">what you get</p>
        <div className="space-y-2.5 text-sm text-zinc-300">
          {[
            "daily tsla reports before market open",
            "price alerts via discord and email",
            "mode and tier system for risk management",
            "key levels from spotgamma flow data",
            "private discord community",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-white text-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signup Form */}
      <div className="bg-zinc-900/50 rounded-xl p-4 md:p-5 border border-zinc-800">
        <form onSubmit={handleSignup} autoComplete="on" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={captureLead}
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="xHandle" className="text-zinc-300">x (twitter) username <span className="text-zinc-500 font-normal">(optional)</span></Label>
            <Input
              id="xHandle"
              name="xHandle"
              type="text"
              placeholder="@yourhandle"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              disabled={loading}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                redirecting...
              </>
            ) : (
              "join the gang ⚔️"
            )}
          </Button>
          <p className="text-sm text-zinc-500 text-center">
            already have an account?{" "}
            <Link href="/login" className="text-white hover:underline">
              sign in
            </Link>
          </p>
        </form>
      </div>

      {/* Price Tier Ladder */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-zinc-600 mb-3 text-center">
          price increases every 50 members
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
              className={`flex items-center justify-between rounded-lg px-4 py-2.5 border ${
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
      </div>

      <p className="text-xs text-zinc-500 text-center">
        by subscribing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-zinc-300">terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-zinc-300">privacy policy</Link>
      </p>
    </div>
  );
}
