"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import type { ProductUpdate, ProductUpdateCategory } from "@/types";

const CATEGORY_BADGE: Record<ProductUpdateCategory, { label: string; variant: "green" | "blue" | "yellow" | "purple" }> = {
  feature: { label: "Feature", variant: "green" },
  enhancement: { label: "Enhancement", variant: "blue" },
  system: { label: "System", variant: "yellow" },
  content: { label: "Content", variant: "purple" },
};

function isNew(publishedAt: string): boolean {
  const published = new Date(publishedAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return published >= sevenDaysAgo;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Simple markdown-like renderer for body text */
function renderBody(text: string) {
  const blocks = text.split(/\n\n+/);

  return blocks.map((block, blockIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Table: lines starting with |
    const lines = trimmed.split("\n");
    if (lines.every((l) => l.trim().startsWith("|"))) {
      return renderTable(lines, blockIdx);
    }

    // H2 heading: ## text
    if (trimmed.startsWith("## ")) {
      return (
        <h4 key={blockIdx} className="text-sm font-semibold text-foreground mt-2">
          {trimmed.slice(3)}
        </h4>
      );
    }

    // H3 heading: ### text
    if (trimmed.startsWith("### ")) {
      return (
        <h5 key={blockIdx} className="text-xs font-semibold text-foreground uppercase tracking-wide mt-2">
          {trimmed.slice(4)}
        </h5>
      );
    }

    // Horizontal rule: ---
    if (trimmed === "---") {
      return <hr key={blockIdx} className="border-border/50 my-1" />;
    }

    // Bullet list: lines starting with "- "
    if (lines.every((l) => l.trim().startsWith("- ") || l.trim() === "")) {
      const items = lines.filter((l) => l.trim().startsWith("- "));
      return (
        <ul key={blockIdx} className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item.trim().slice(2))}</li>
          ))}
        </ul>
      );
    }

    // Paragraph
    return (
      <p key={blockIdx} className="text-sm text-muted-foreground">
        {renderInline(trimmed)}
      </p>
    );
  });
}

function renderInline(text: string) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderTable(lines: string[], key: number) {
  const rows = lines
    .map((l) => l.trim())
    .filter((l) => !l.match(/^\|[\s-:|]+\|$/)) // skip separator rows
    .map((l) =>
      l
        .split("|")
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
        .map((cell) => cell.trim())
    );

  if (rows.length === 0) return null;

  const header = rows[0];
  const body = rows.slice(1);

  return (
    <div key={key} className="overflow-x-auto -mx-1">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="text-left px-2 py-1 text-muted-foreground border-b border-border font-semibold">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 text-muted-foreground border-b border-border/50">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpdateItem({ update }: { update: ProductUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_BADGE[update.category];
  const showNew = isNew(update.published_at);

  return (
    <div className="py-3 border-b border-border/50 last:border-b-0">
      <div className="flex items-start gap-2 flex-wrap">
        <Badge variant={cat.variant} className="text-[10px] md:text-xs px-1.5 py-0 shrink-0">
          {cat.label}
        </Badge>
        {showNew && (
          <span className="inline-flex items-center text-[10px] font-bold text-green-500 animate-pulse">
            NEW
          </span>
        )}
        {update.pinned && <span className="text-xs shrink-0">📌</span>}
      </div>
      <div className="mt-1.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm md:text-base text-foreground">{update.title}</h4>
          <span className="text-[10px] md:text-xs text-muted-foreground shrink-0">
            {formatDate(update.published_at)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{update.summary}</p>
        {update.body && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1.5 transition-colors"
            >
              {expanded ? "Show less" : "Read more"}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2 pl-1 border-l-2 border-border/50 ml-1 pl-3">
                {renderBody(update.body)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function WhatsNewCard() {
  const [updates, setUpdates] = useState<ProductUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetch("/api/updates?limit=6", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const items: ProductUpdate[] = data.updates || [];
        if (items.length > 5) {
          setHasMore(true);
          setUpdates(items.slice(0, 5));
        } else {
          setUpdates(items);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-4 md:p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 bg-zinc-700/50 rounded" />
          <div className="h-5 w-28 bg-zinc-700/50 rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2 py-3 border-b border-border/50 last:border-b-0">
              <div className="h-4 w-16 bg-zinc-800/40 rounded-full" />
              <div className="h-4 w-3/4 bg-zinc-800/40 rounded" />
              <div className="h-3 w-full bg-zinc-800/40 rounded" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm md:text-base">What&apos;s New</h3>
        </div>
        <p className="text-sm text-muted-foreground">No updates yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm md:text-base">What&apos;s New</h3>
        </div>
      </div>
      <div>
        {updates.map((update) => (
          <UpdateItem key={update.id} update={update} />
        ))}
      </div>
      {hasMore && (
        <p className="text-xs text-muted-foreground text-center mt-3 pt-2">
          More updates available
        </p>
      )}
    </Card>
  );
}
