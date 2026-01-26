"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ArrowRight, ArrowLeft, Lock, Shield } from "lucide-react";

const steps = [
  { id: 1, title: "Welcome", description: "Let's set up your trading profile" },
  { id: 2, title: "Portfolio", description: "Your portfolio details" },
  { id: 3, title: "Complete", description: "You're all set!" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [portfolioSize, setPortfolioSize] = useState("");
  const [portfolioExact, setPortfolioExact] = useState("");
  const [dailyCap, setDailyCap] = useState("10");
  const [riskTolerance, setRiskTolerance] = useState("moderate");

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

    try {
      // In dev mode, just redirect to dashboard without saving
      if (devBypass) {
        router.push("/dashboard");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      await supabase.from("user_settings").upsert({
        user_id: user.id,
        portfolio_size: portfolioSize || null,
        portfolio_size_exact: portfolioExact ? parseInt(portfolioExact) : null,
        daily_cap_pct: parseFloat(dailyCap),
        risk_tolerance: riskTolerance,
        alerts_enabled: true,
        email_new_reports: true,
        updated_at: new Date().toISOString(),
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > s.id
                    ? "bg-green-500 text-white"
                    : step === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <CheckCircle className="h-5 w-5" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 mx-2 ${
                    step > s.id ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[step - 1].title}</CardTitle>
            <CardDescription>{steps[step - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Welcome to Flacko AI! Let&apos;s personalize your dashboard with
                  your trading parameters.
                </p>
                <p className="text-muted-foreground">
                  This helps you track your daily deployment limits when buying dips.
                </p>

                {/* Privacy Notice */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Your Data is Private</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This information is stored securely and is <strong>never shared</strong> with
                    anyone. Only you can see your portfolio details. We use it solely to
                    display personalized guidance on your dashboard.
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  You can skip this and set it up later in Settings.
                </p>
              </div>
            )}

            {/* Step 2: Portfolio & Daily Cap */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Portfolio Size</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={portfolioExact}
                      onChange={(e) => setPortfolioExact(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total capital you&apos;re trading with
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Daily Cap (%)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={dailyCap}
                      onChange={(e) => setDailyCap(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum % of portfolio to deploy in a single day (default: 10%)
                  </p>
                </div>

                {portfolioExact && dailyCap && (
                  <div className="bg-primary/10 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium">Your Daily Budget</p>
                    <p className="text-2xl font-bold mt-1">
                      ${(parseFloat(portfolioExact) * parseFloat(dailyCap) / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is your max daily deployment for buying dips
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                  <Lock className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>This information is private and never shared.</span>
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Your trading profile is set up! You&apos;ll see your daily budget
                  on the dashboard.
                </p>
                {portfolioExact && dailyCap && (
                  <div className="text-sm space-y-1">
                    <p>Portfolio: ${parseFloat(portfolioExact).toLocaleString()}</p>
                    <p>Daily Cap: {dailyCap}% (${(parseFloat(portfolioExact) * parseFloat(dailyCap) / 100).toLocaleString()})</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              {step > 1 && step < 3 ? (
                <Button variant="ghost" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}

              {step < 3 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} loading={loading}>
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
