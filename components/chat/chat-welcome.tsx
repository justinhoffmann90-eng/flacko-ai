"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bot, TrendingUp, Calculator, HelpCircle } from "lucide-react";

interface ChatWelcomeProps {
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: HelpCircle,
    text: "What does Yellow Mode mean?",
    category: "Learn",
  },
  {
    icon: Calculator,
    text: "Calculate position size for my portfolio",
    category: "Calculate",
  },
  {
    icon: TrendingUp,
    text: "Explain today's entry quality score",
    category: "Analyze",
  },
];

export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h3 className="font-semibold text-lg mb-2">Flacko AI Assistant</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Ask questions about today&apos;s report, get position sizing calculations,
          or learn about trading concepts.
        </p>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
            Suggested questions
          </p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick?.(suggestion.text)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors text-left"
            >
              <suggestion.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{suggestion.text}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Remember: I provide framework-based guidance, not specific buy/sell advice.
        </p>
      </CardContent>
    </Card>
  );
}
