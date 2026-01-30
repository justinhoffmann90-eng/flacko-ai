"use client";

interface ConfluenceBoxProps {
  reading: string;
  explanation: string;
}

export function ConfluenceBox({ reading, explanation }: ConfluenceBoxProps) {
  return (
    <div className="bg-gradient-to-br from-card to-muted border border-border rounded-xl p-6 text-center">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Confluence Reading
      </h3>
      <div className="text-lg sm:text-xl font-medium text-foreground mb-3">
        {reading}
      </div>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto">
        {explanation}
      </p>
    </div>
  );
}
