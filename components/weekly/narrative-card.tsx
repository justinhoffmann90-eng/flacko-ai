"use client";

interface NarrativeCardProps {
  content: string;
}

export function NarrativeCard({ content }: NarrativeCardProps) {
  // Split content into paragraphs and render with proper formatting
  const paragraphs = content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      <div className="prose prose-invert prose-sm max-w-none">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
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
