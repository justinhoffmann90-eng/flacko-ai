"use client";

import { Scenario } from "@/types/weekly-review";

interface ScenariosCardProps {
  scenarios: Scenario[];
}

const scenarioConfig: Record<string, { emoji: string; color: string; label: string }> = {
  bull: { emoji: "🐂", color: "text-green-500", label: "Bull Case" },
  base: { emoji: "⚖️", color: "text-yellow-500", label: "Base Case" },
  bear: { emoji: "🐻", color: "text-red-500", label: "Bear Case" },
};

export function ScenariosCard({ scenarios }: ScenariosCardProps) {
  if (scenarios.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <h3 className="text-sm font-semibold mb-4">Scenarios</h3>
      <div className="space-y-3">
        {scenarios.map((scenario, i) => {
          const config = scenarioConfig[scenario.type];
          return (
            <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <span className="text-lg">{config.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${config.color}`}>
                    {scenario.probability}%
                  </span>
                  <span className="text-muted-foreground text-sm">
                    — {scenario.trigger}
                  </span>
                </div>
                {scenario.response && (
                  <p className="text-xs text-muted-foreground">
                    {scenario.response}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
