"use client";

export interface Catalyst {
  date: string;
  event: string;
  impact?: string;
}

interface CatalystsCardProps {
  catalysts: Catalyst[];
}

export function CatalystsCard({ catalysts }: CatalystsCardProps) {
  if (!catalysts || catalysts.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Event</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Impact</th>
            </tr>
          </thead>
          <tbody>
            {catalysts.map((catalyst, i) => (
              <tr 
                key={i}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 font-medium whitespace-nowrap">{catalyst.date}</td>
                <td className="px-4 py-3">{catalyst.event}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{catalyst.impact || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
