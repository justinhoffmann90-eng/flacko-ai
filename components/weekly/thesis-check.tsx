"use client";

import { ThesisCheck, ThesisStatus } from "@/types/weekly-review";

interface ThesisCheckCardProps {
  thesis: ThesisCheck;
}

const statusConfig: Record<ThesisStatus, { bg: string; text: string; label: string }> = {
  intact: { bg: "bg-green-500/10", text: "text-green-500", label: "✅ THESIS INTACT" },
  strengthening: { bg: "bg-green-500/20", text: "text-green-500", label: "💪 THESIS STRENGTHENING" },
  weakening: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "⚠️ THESIS WEAKENING" },
  under_review: { bg: "bg-red-500/10", text: "text-red-500", label: "🔍 THESIS UNDER REVIEW" },
};

export function ThesisCheckCard({ thesis }: ThesisCheckCardProps) {
  const config = statusConfig[thesis.status];

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
      {/* Status Badge */}
      <div className={`text-center p-3 rounded-lg mb-4 ${config.bg}`}>
        <span className={`font-semibold text-lg ${config.text}`}>
          {config.label}
        </span>
      </div>

      {/* Supporting / Concerning Grid */}
      {(thesis.supporting_points.length > 0 || thesis.concerning_points.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {thesis.supporting_points.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-green-500 mb-2">
                Supporting
              </h4>
              <ul className="space-y-1 text-sm">
                {thesis.supporting_points.map((point, i) => (
                  <li key={i} className="text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {thesis.concerning_points.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-red-500 mb-2">
                Concerning
              </h4>
              <ul className="space-y-1 text-sm">
                {thesis.concerning_points.map((point, i) => (
                  <li key={i} className="text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Narrative */}
      {thesis.narrative && (
        <div className="prose prose-invert prose-sm max-w-none">
          {thesis.narrative.split(/\n\n+/).map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed mb-3 last:mb-0">
              {p.split(/\*\*([^*]+)\*\*/).map((part, j) =>
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
      )}
    </div>
  );
}
