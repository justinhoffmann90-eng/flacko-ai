"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Check } from "lucide-react";

export default function SignupPageV3() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          setError("this email already has an active subscription. please sign in.");
        } else if (data.error?.includes("Failed to create")) {
          setError("could not create account. please try again.");
        } else {
          setError(data.error || "something went wrong. please try again.");
        }
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("something went wrong. please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* left: value */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">command os</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                activate command os access
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base">
                get tomorrow&apos;s structural battlefield context today — key levels, regime maps, and scenario intelligence from the automated system.
              </p>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">operating system benefits</p>
              <div className="grid gap-3">
                {[
                  "daily command briefings",
                  "real-time key level context",
                  "scenario frameworks (not predictions)",
                  "dealer positioning & technical regime insight",
                  "probabilistic market structure signals",
                  "operating system protocol updates",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 text-black">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-400 mt-5">
                flacko is not alerts or commentary. it&apos;s a structured operating system that interprets positioning and regimes so you can act with clarity and conviction.
              </p>
            </div>

            <p className="text-xs text-zinc-500">
              structured for traders who operate with conviction — system over opinion.
            </p>
          </div>

          {/* right: form */}
          <div className="space-y-4">
            <div className="text-sm text-zinc-400">
              command os access — <span className="text-zinc-200">$29.99/month</span>
            </div>
            <Card className="bg-zinc-900/60 border-zinc-800">
              <form onSubmit={handleSignup} autoComplete="on">
                <CardContent className="space-y-4 pt-6 pb-2">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">email (activation id)</Label>
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
                      className="bg-zinc-950/40 border-zinc-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">password (create command passphrase)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="create your passphrase"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="bg-zinc-950/40 border-zinc-800"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-black hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        redirecting...
                      </>
                    ) : (
                      "activate command os"
                    )}
                  </Button>
                  <p className="text-xs text-zinc-500 text-center">
                    once activated, you&apos;ll receive the current operating system briefing instantly — structure before market opens.
                  </p>
                  <p className="text-xs text-zinc-500 text-center">
                    already activated?{" "}
                    <Link href="/login" className="text-zinc-200 hover:underline">
                      sign in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>

            <p className="text-[11px] text-zinc-600 text-center">
              by subscribing, you agree to our{" "}
              <Link href="/terms" className="underline">terms</Link> and{" "}
              <Link href="/privacy" className="underline">privacy policy</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
