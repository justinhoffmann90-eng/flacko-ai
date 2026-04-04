"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, TrendingUp, BarChart3, Bell, Mail, Zap } from "lucide-react";

interface TickerCard {
  symbol: string;
  name: string;
  price: string;
  description: string;
  popular?: boolean;
}

const AVAILABLE_TICKERS: TickerCard[] = [
  { symbol: "TSLA", name: "Tesla", price: "$29.99", description: "Full access: daily report, Discord, price alerts, call options signal" },
  { symbol: "NVDA", name: "NVIDIA", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "AAPL", name: "Apple", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "AMZN", name: "Amazon", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "GOOGL", name: "Alphabet", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "META", name: "Meta", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "MSFT", name: "Microsoft", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "AMD", name: "AMD", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "PLTR", name: "Palantir", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
  { symbol: "COIN", name: "Coinbase", price: "$9.99", description: "Daily report with mode, levels, gameplan, and price alerts" },
];

export default function ReportsPage() {
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (symbol: string) => {
    // TSLA uses the existing signup flow
    if (symbol === "TSLA") {
      window.location.href = "/pricing";
      return;
    }

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
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold">
            AI-Powered Trading Reports
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Daily mode, levels, and gameplan for the tickers you trade.
            Built by AI, reviewed by humans. Delivered after market close.
          </p>
        </div>

        {/* What You Get */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Daily Report</p>
            <p className="text-xs text-muted-foreground">Mode, tiers, levels</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Price Alerts</p>
            <p className="text-xs text-muted-foreground">Key level triggers</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Email Delivery</p>
            <p className="text-xs text-muted-foreground">Every trading day</p>
          </div>
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium">Gameplan</p>
            <p className="text-xs text-muted-foreground">What I&apos;d do today</p>
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
            <Card key={ticker.symbol} className={`relative overflow-hidden transition-all hover:shadow-lg ${
              ticker.symbol === "TSLA" ? "border-primary/50 shadow-md" : ""
            }`}>
              {ticker.symbol === "TSLA" && (
                <div className="absolute top-3 right-3">
                  <Badge variant="default" className="text-[10px]">
                    <Zap className="w-3 h-3 mr-1" />
                    FLAGSHIP
                  </Badge>
                </div>
              )}
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
                    variant={ticker.symbol === "TSLA" ? "default" : "outline"}
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
            Reports published daily after market close. Cancel anytime.
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
