"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Gift } from "lucide-react";

export default function FounderSignupPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/signup-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, trial: true }), // 30-day trial
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Founder Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
            <Gift className="w-4 h-4" />
            Founder Offer
          </div>
          <h1 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Flacko AI
          </h1>
          <p className="text-2xl font-bold">
            30 Days Free + Locked Pricing
          </p>
          <p className="text-muted-foreground">
            Try everything free, then lock in founder pricing forever.
          </p>
        </div>

        {/* Pricing */}
        <div className="text-center space-y-2 py-2">
          <div className="text-sm text-muted-foreground">After trial:</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl text-muted-foreground line-through">$34.99</span>
            <span className="text-sm bg-green-500/20 text-green-500 px-2.5 py-1 rounded-full font-medium">FOUNDER</span>
          </div>
          <div className="text-4xl font-bold">
            $19.99<span className="text-xl text-muted-foreground font-normal">/month</span>
          </div>
          <p className="text-sm text-muted-foreground">Use code <strong>FOUNDER</strong> at checkout</p>
        </div>

        <Card>
          <form onSubmit={handleSignup} autoComplete="on">
            <CardContent className="space-y-4 pt-6">
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
                  required
                  autoComplete="email"
                  autoFocus
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
                  "Start 30-Day Free Trial"
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
    </div>
  );
}
