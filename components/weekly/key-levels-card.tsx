"use client";

import { WeeklyKeyLevel } from "@/types/weekly-review";

interface KeyLevelsCardProps {
  levels: WeeklyKeyLevel[];
  currentPrice?: number;
}

export function KeyLevelsCard({ levels, currentPrice }: KeyLevelsCardProps) {
  if (!levels || levels.length === 0) return null;

  // Sort levels by price descending
  const sortedLevels = [...levels].sort((a, b) => b.price - a.price);

  // Build rows including current price marker
  const rows: Array<{ type: 'level' | 'current'; level?: WeeklyKeyLevel; price?: number }> = [];
  
  let insertedCurrent = false;
  for (const level of sortedLevels) {
    if (currentPrice && !insertedCurrent && level.price < currentPrice) {
      rows.push({ type: 'current', price: currentPrice });
      insertedCurrent = true;
    }
    rows.push({ type: 'level', level });
  }
  
  // If current price is below all levels
  if (currentPrice && !insertedCurrent) {
    rows.push({ type: 'current', price: currentPrice });
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">What It Means</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.type === 'current') {
                return (
                  <tr key="current" className="bg-primary/10 border-y border-primary/30">
                    <td className="px-4 py-2 font-bold text-primary">${row.price?.toFixed(0)}</td>
                    <td className="px-4 py-2 font-bold text-primary">📍 Current Price</td>
                    <td className="px-4 py-2 hidden sm:table-cell text-muted-foreground">—</td>
                  </tr>
                );
              }

              const level = row.level!;
              const isEject = level.name.toLowerCase().includes('eject');
              const isGammaStrike = level.name.toLowerCase().includes('gamma strike');

              return (
                <tr 
                  key={level.price}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                    isEject ? 'bg-red-500/5' : isGammaStrike ? 'bg-yellow-500/5' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-medium">${level.price}</td>
                  <td className="px-4 py-3">
                    <span className="mr-1">{level.emoji}</span>
                    <span className={isEject ? 'text-red-500 font-semibold' : ''}>
                      {level.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{level.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
