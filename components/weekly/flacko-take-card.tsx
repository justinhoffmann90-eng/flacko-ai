"use client";

interface FlackoTakeCardProps {
  content: string;
}

export function FlackoTakeCard({ content }: FlackoTakeCardProps) {
  if (!content) return null;

  // Parse markdown-style formatting
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💡</span>
        <h3 className="font-semibold text-lg">The &quot;So What&quot; — Flacko AI&apos;s Take</h3>
      </div>
      
      <div className="prose prose-invert prose-sm max-w-none space-y-4">
        {paragraphs.map((p, i) => {
          // Handle **bold** text
          const parts = p.split(/\*\*([^*]+)\*\*/);
          
          return (
            <p key={i} className="text-foreground leading-relaxed">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <span key={j} className="text-foreground font-medium">
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}
