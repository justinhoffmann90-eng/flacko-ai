"use client";

interface NarrativeCardProps {
  content: string;
}

export function NarrativeCard({ content }: NarrativeCardProps) {
  // Check if content has day markers (e.g., "Monday (1/27):", "Tuesday (1/28):")
  const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*\([^)]+\):/gi;
  const hasDayMarkers = dayPattern.test(content);

  if (hasDayMarkers) {
    // Split by day markers and render as bullet list
    const days = content.split(/(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*\([^)]+\):)/gi).filter(Boolean);

    return (
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <ul className="space-y-3">
          {days.map((day, i) => {
            // Extract day name and content
            const match = day.match(/^((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*\([^)]+\)):\s*(.*)/is);
            if (match) {
              const [, dayLabel, dayContent] = match;
              return (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">•</span>
                  <div>
                    <span className="text-foreground font-medium">{dayLabel}:</span>{" "}
                    <span className="text-foreground">{dayContent.trim()}</span>
                  </div>
                </li>
              );
            }
            // Fallback for non-matching content
            return (
              <li key={i} className="text-muted-foreground">{day.trim()}</li>
            );
          })}
        </ul>
      </div>
    );
  }

  // Default: Split content into paragraphs and render with proper formatting
  const paragraphs = content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="prose prose-invert prose-sm max-w-none">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-foreground leading-relaxed mb-4 last:mb-0">
            {paragraph.split(/\*\*([^*]+)\*\*/).map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className="text-foreground font-medium">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
