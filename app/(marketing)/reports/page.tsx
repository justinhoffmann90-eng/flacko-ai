"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, TrendingUp, BarChart3, Layers3, Compass } from "lucide-react";

interface TickerCard {
  symbol: string;
  name: string;
  price: string;
  description: string;
}

const AVAILABLE_TICKERS: TickerCard[] = [
  { symbol: "QQQ", name: "Invesco QQQ", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "SPY", name: "SPDR S&P 500", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "GOOGL", name: "Alphabet", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "META", name: "Meta", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "MU", name: "Micron", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "NVDA", name: "NVIDIA", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "MSFT", name: "Microsoft", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "PLTR", name: "Palantir", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "HOOD", name: "Robinhood", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "BABA", name: "Alibaba", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
  { symbol: "SNDK", name: "Sandisk", price: "$9.99", description: "Daily report with trend, key levels, scenarios, and a clear post-close gameplan." },
];

export default function ReportsPage() {
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (symbol: string) => {
    setError(null);
    setLoadingTicker(symbol);

    try {
      const response = await fetch("/api/checkout/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        setError(data.error || "Something went wrong.");
        setLoadingTicker(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoadingTicker(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="text-center space-y-5 mb-8 sm:mb-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs sm:text-sm text-muted-foreground">
            Daily reports for the tickers we cover
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-4xl mx-auto text-balance">
            Stop guessing what matters tomorrow.
            <span className="block mt-2">Get the trend, the levels, and the exact gameplan in one report.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-7 sm:leading-8 text-balance">
            Each report is built to help you prepare for the next session fast: what regime the ticker is in, where the most important support and resistance levels sit, what confirms upside or downside, and how to approach the trade without overthinking it.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto pt-2 text-left">
            <div className="rounded-xl border bg-card/60 p-4 sm:p-5">
              <p className="text-sm font-semibold">Know the real posture fast</p>
              <p className="text-sm text-muted-foreground mt-1">See whether the setup is bullish, bearish, improving, stretched, or not worth pressing.</p>
            </div>
            <div className="rounded-xl border bg-card/60 p-4 sm:p-5">
              <p className="text-sm font-semibold">Trade around the right levels</p>
              <p className="text-sm text-muted-foreground mt-1">Get the inflection zones, kill-leverage level, and the price areas that actually change the trade.</p>
            </div>
            <div className="rounded-xl border bg-card/60 p-4 sm:p-5">
              <p className="text-sm font-semibold">Walk in with a plan</p>
              <p className="text-sm text-muted-foreground mt-1">Know what would improve the setup, what would weaken it, and what to do next session if price confirms.</p>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 sm:mb-10 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Trend & Bias</p>
            <p className="text-xs text-muted-foreground">The current posture and what it means</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Key Levels</p>
            <p className="text-xs text-muted-foreground">Support, resistance, and inflection zones</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Layers3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Scenario Map</p>
            <p className="text-xs text-muted-foreground">What confirms upside vs downside</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Execution Plan</p>
            <p className="text-xs text-muted-foreground">A practical gameplan for the next session</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Included */}
        <div className="rounded-2xl border bg-card/50 p-5 sm:p-6 mb-8 sm:mb-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">What&apos;s included</p>
              <div className="space-y-3 text-sm sm:text-base text-muted-foreground">
                <p><span className="text-foreground font-medium">Trend and posture:</span> know whether the tape is constructive, fragile, or outright broken.</p>
                <p><span className="text-foreground font-medium">Key levels:</span> support, resistance, trigger zones, and the prices that change the trade.</p>
                <p><span className="text-foreground font-medium">Scenario planning:</span> clear bull vs bear paths so you know what confirms and what invalidates.</p>
                <p><span className="text-foreground font-medium">Execution framework:</span> a clean next-session gameplan instead of a wall of generic commentary.</p>
              </div>
            </div>
            <div className="rounded-xl border bg-background/60 p-4 sm:p-5 space-y-3">
              <p className="text-sm font-semibold">Best for traders who want:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• faster prep after the close</li>
                <li>• clearer levels and cleaner decision-making</li>
                <li>• less noise and more signal</li>
                <li>• a daily framework they can actually trade around</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ticker Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVAILABLE_TICKERS.map((ticker) => (
            <Card key={ticker.symbol} className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{ticker.symbol}</span>
                    <span className="text-sm text-muted-foreground">{ticker.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ticker.description}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold">{ticker.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <Button
                    onClick={() => handlePurchase(ticker.symbol)}
                    disabled={loadingTicker === ticker.symbol}
                    size="sm"
                    variant="outline"
                  >
                    {loadingTicker === ticker.symbol ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Get Reports"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12 space-y-3 max-w-3xl mx-auto">
          <p className="text-sm sm:text-base text-muted-foreground">
            Reports are published every trading day after market close and delivered by email with web access included. Cancel anytime.
          </p>
          <p className="text-sm text-muted-foreground">
            Pick the names you actually trade. Skip the noise. Show up with a plan.
          </p>
          <p className="text-xs text-muted-foreground">
            Already subscribed?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in to view your reports
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
