"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw, TrendingUp, Shield, DollarSign, HelpCircle, Target, BookOpen } from "lucide-react";

interface ChatWelcomeProps {
  onSuggestionClick?: (suggestion: string) => void;
}

// High-quality example questions organized by category
const questionPool = {
  understand: [
    { icon: HelpCircle, text: "What does the current mode mean for my trading?", category: "Understand" },
    { icon: HelpCircle, text: "Why are we in this mode right now?", category: "Understand" },
    { icon: BookOpen, text: "Explain the 4-tier system in simple terms", category: "Understand" },
    { icon: BookOpen, text: "What's the difference between Tier 1-2 and Tier 3-4?", category: "Understand" },
    { icon: HelpCircle, text: "What does 'negative gamma' mean for price action?", category: "Understand" },
    { icon: BookOpen, text: "How do I read the BX-Trender indicator?", category: "Understand" },
  ],
  sizing: [
    { icon: DollarSign, text: "How much can I deploy today based on the current mode?", category: "Position Sizing" },
    { icon: DollarSign, text: "Calculate my bullet size for today", category: "Position Sizing" },
    { icon: DollarSign, text: "What's my daily budget in this mode?", category: "Position Sizing" },
    { icon: Target, text: "How should I split my entries across the day?", category: "Position Sizing" },
  ],
  levels: [
    { icon: TrendingUp, text: "What are the key levels to watch today?", category: "Levels" },
    { icon: Target, text: "Where should I set my buy alerts?", category: "Levels" },
    { icon: TrendingUp, text: "What price would trigger a trim?", category: "Levels" },
    { icon: Shield, text: "Where is the Kill Leverage level and why?", category: "Levels" },
    { icon: Target, text: "What's the Slow Zone and am I in it?", category: "Levels" },
  ],
  risk: [
    { icon: Shield, text: "What's the correction risk right now?", category: "Risk" },
    { icon: Shield, text: "What would make you more cautious?", category: "Risk" },
    { icon: Shield, text: "What signals would upgrade us to a better mode?", category: "Risk" },
    { icon: HelpCircle, text: "Should I be worried about the current setup?", category: "Risk" },
  ],
};

// Get random questions from each category
function getRandomQuestions(count: number = 4) {
  const categories = Object.keys(questionPool) as (keyof typeof questionPool)[];
  const selected: typeof questionPool.understand = [];
  
  // Shuffle categories
  const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
  
  // Pick one from each category until we have enough
  for (let i = 0; i < count && i < shuffledCategories.length; i++) {
    const category = shuffledCategories[i];
    const questions = questionPool[category];
    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    selected.push(randomQ);
  }
  
  return selected;
}

export function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  const [suggestions, setSuggestions] = useState(() => getRandomQuestions(4));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Brief animation delay
    setTimeout(() => {
      setSuggestions(getRandomQuestions(4));
      setIsRefreshing(false);
    }, 300);
  }, []);

  const categoryColors: Record<string, string> = {
    "Understand": "text-blue-500 bg-blue-500/10",
    "Position Sizing": "text-green-500 bg-green-500/10",
    "Levels": "text-yellow-500 bg-yellow-500/10",
    "Risk": "text-red-500 bg-red-500/10",
  };

  return (
    <Card className="bg-gradient-to-b from-muted/50 to-background border-muted">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <Bot className="h-7 w-7 md:h-9 md:w-9 lg:h-10 lg:w-10 text-primary" />
            </div>
          </div>
          <h3 className="font-bold text-xl md:text-2xl lg:text-3xl mb-1">Flacko AI Assistant</h3>
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
            Your personal guide to today&apos;s report
          </p>
        </div>

        {/* Suggested Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Try asking
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.text}-${index}`}
                onClick={() => onSuggestionClick?.(suggestion.text)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-primary/30 transition-all text-left group"
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[suggestion.category] || 'bg-muted'}`}>
                  <suggestion.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                    {suggestion.text}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {suggestion.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-muted">
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            💡 I provide framework-based guidance using today&apos;s report data.<br />
            <span className="text-muted-foreground/70">Not financial advice — always do your own research.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
