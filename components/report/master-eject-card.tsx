"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface MasterEjectCardProps {
  price: number;
  action?: string;
  currentPrice?: number;
  className?: string;
}

export function MasterEjectCard({
  price,
  action = "Exit all positions immediately",
  currentPrice,
  className,
}: MasterEjectCardProps) {
  const isNear = currentPrice && currentPrice <= price * 1.02; // Within 2%
  const isBreached = currentPrice && currentPrice <= price;

  return (
    <Card
      className={cn(
        "border-red-500/50 bg-red-500/5",
        isBreached && "border-red-500 bg-red-500/20 animate-pulse",
        isNear && !isBreached && "border-red-500 bg-red-500/10",
        className
      )}
    >
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle
            className={cn(
              "h-6 w-6 flex-shrink-0",
              isBreached ? "text-red-500" : "text-red-500/80"
            )}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-red-500">Master Eject Level</p>
              {isBreached && (
                <span className="text-xs font-bold text-red-500 uppercase">BREACHED</span>
              )}
              {isNear && !isBreached && (
                <span className="text-xs font-bold text-yellow-500 uppercase">NEAR</span>
              )}
            </div>
            <p className="text-2xl font-bold mt-1">{formatPrice(price)}</p>
            <p className="text-sm text-muted-foreground mt-2">{action}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
