"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

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
    <div className="w-full max-w-md md:max-w-lg mx-auto space-y-4 md:space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2 md:space-y-3 mb-2 md:mb-4">
        <h1 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Flacko AI
        </h1>
        <p className="text-2xl md:text-3xl font-bold">
          Wake up with a plan.
        </p>
        <p className="text-muted-foreground md:text-lg">
          Daily reports, price alerts and a system that tells you when to pay attention.
        </p>
      </div>

      {/* Pricing - larger */}
      <div className="text-center space-y-1 md:space-y-2 mb-2 md:mb-4">
        <div className="flex items-center justify-center gap-3">
          <span className="text-xl md:text-2xl text-muted-foreground line-through">$39.99</span>
          <span className="text-sm bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-medium">🔥 LAUNCH PROMOTION</span>
        </div>
        <div className="text-4xl md:text-5xl font-bold">
          $29.99<span className="text-xl md:text-2xl text-muted-foreground font-normal">/month</span>
        </div>
      </div>

      {/* Value Leverage */}
      <div className="text-center text-sm md:text-base text-muted-foreground mb-1 md:mb-2">
        You'll leverage <span className="text-emerald-500 font-semibold">$800/mo</span> in institutional data & tools that power our system:
      </div>
      <div className="text-center text-[13px] md:text-sm text-muted-foreground/70 leading-relaxed mb-3 md:mb-5">
        <span className="text-muted-foreground">FS Insight</span> <span className="text-muted-foreground/50">(Macro & Technical)</span> · <span className="text-muted-foreground">SpotGamma</span> <span className="text-muted-foreground/50">(Alpha, HIRO)</span>
        <br />
        <span className="text-muted-foreground">AI Agents & Infra</span> <span className="text-muted-foreground/50">(Claude Max, Grok, M4 Mini)</span>
      </div>

      <Card>
        <form onSubmit={handleSignup} autoComplete="on">
          <CardContent className="space-y-4 md:space-y-5 pt-5 md:pt-6 md:pb-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="xHandle">X (Twitter) Username <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="xHandle"
                name="xHandle"
                type="text"
                placeholder="@yourhandle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Continue to Checkout"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        By subscribing, you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>
      </p>
    </div>
  );
}
