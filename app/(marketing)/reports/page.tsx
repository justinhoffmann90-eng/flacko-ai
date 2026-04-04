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
        <div className="text-center space-y-5 mb-10 sm:mb-12 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs sm:text-sm text-muted-foreground">
            Post-close reports for the tickers we cover
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl mx-auto text-balance">
            Know the trend, the levels, and the gameplan before the next session
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-7 sm:leading-8 text-balance">
            Every report gives you the current posture, the key levels that matter, the bull vs bear scenarios, and a clear execution framework for the next trading day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto pt-2 text-left">
            <div className="rounded-xl border bg-card/60 p-4">
              <p className="text-sm font-semibold">Cut through the noise</p>
              <p className="text-sm text-muted-foreground mt-1">Get the setup, the risk, and the inflection levels fast.</p>
            </div>
            <div className="rounded-xl border bg-card/60 p-4">
              <p className="text-sm font-semibold">See both paths clearly</p>
              <p className="text-sm text-muted-foreground mt-1">Know what confirms upside, what breaks the trade, and what changes the bias.</p>
            </div>
            <div className="rounded-xl border bg-card/60 p-4">
              <p className="text-sm font-semibold">Show up prepared</p>
              <p className="text-sm text-muted-foreground mt-1">Open the next session with a plan instead of reacting in real time.</p>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
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

        {/* FAQ-ish footer */}
        <div className="text-center mt-12 space-y-3">
          <p className="text-sm text-muted-foreground">
            Reports are published every trading day after market close and delivered by email with web access included. Cancel anytime.
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
