"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceTickerProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
}

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export function PriceTicker({ className, refreshInterval = 60000 }: PriceTickerProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = async () => {
    try {
      const res = await fetch("/api/price");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPriceData({
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        lastUpdated: new Date(),
      });
      setError(null);
    } catch (err) {
      setError("Unable to load price");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <span>TSLA</span>
        <span>--</span>
      </div>
    );
  }

  const isPositive = priceData.changePercent >= 0;

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="font-medium">TSLA</span>
      <span className="font-bold">${priceData.price.toFixed(2)}</span>
      <span
        className={cn(
          "flex items-center gap-0.5",
          isPositive ? "text-green-500" : "text-red-500"
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? "+" : ""}
        {priceData.changePercent.toFixed(2)}%
      </span>
    </div>
  );
}
