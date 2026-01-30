"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

// Clean up markdown content for display
function cleanContent(raw: string): string {
  let cleaned = raw;

  // Remove REPORT_DATA HTML comment
  cleaned = cleaned.replace(/<!--\s*REPORT_DATA[\s\S]*?-->/g, '');

  // Remove YAML frontmatter if present
  cleaned = cleaned.replace(/^---[\s\S]*?---\n*/m, '');

  // Remove redundant "TSLA Daily Report" header (already in page title)
  cleaned = cleaned.replace(/^#\s*TSLA Daily Report\s*\n/m, '');
  
  // Remove the date line that follows (e.g., "## Thursday, January 29, 2026")
  cleaned = cleaned.replace(/^##\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d{1,2},?\s+\d{4}\s*\n/m, '');
  
  // Also remove standalone date lines
  cleaned = cleaned.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d{1,2},?\s+\d{4}\s*\n/m, '');
  
  // Remove horizontal rules that might be left orphaned at the start
  cleaned = cleaned.replace(/^---\s*\n+/m, '');

  // Fix malformed tables: separator line (no leading |) followed by data rows
  // Pattern: line like "---|---|---" followed by lines starting with "|"
  const lines = cleaned.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty header rows like "| | |"
    if (/^\|\s*\|\s*\|/.test(trimmed) && !/[a-zA-Z0-9]/.test(trimmed)) {
      continue;
    }

    // Detect ANY separator line (with or without leading |) that has no proper header before it
    // Patterns: "---|---|---" or "|---|---|" or "|---|---|---|"
    const isSeparator = /^-{2,}[\s]*\|/.test(trimmed) || /^\|[\s]*-{2,}/.test(trimmed);
    const isOnlySeparator = /^[\|\s-:]+$/.test(trimmed) && trimmed.includes('--');

    if (isSeparator && isOnlySeparator) {
      // Check if previous non-empty line was a valid header (has text content with |)
      let hasHeaderBefore = false;
      for (let k = i - 1; k >= 0 && k >= i - 3; k--) {
        const prevLine = lines[k].trim();
        if (prevLine === '') continue;
        // Check if it looks like a header (has | and text content)
        if (prevLine.includes('|') && /[a-zA-Z]/.test(prevLine)) {
          hasHeaderBefore = true;
        }
        break;
      }

      if (!hasHeaderBefore) {
        // Look ahead to collect data rows
        const dataRows: string[] = [];
        let j = i + 1;

        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (nextLine.startsWith('|') && nextLine.endsWith('|') && /[a-zA-Z0-9]/.test(nextLine)) {
            dataRows.push(lines[j]);
            j++;
          } else if (nextLine === '') {
            j++; // skip blank lines within table
          } else {
            break;
          }
        }

        if (dataRows.length > 0) {
          // Count columns from first data row
          const colCount = (dataRows[0].match(/\|/g) || []).length - 1;

          // Create empty header row (invisible but valid markdown)
          const headerRow = '| ' + Array(colCount).fill(' ').join(' | ') + ' |';
          const separatorRow = '| ' + Array(colCount).fill('---').join(' | ') + ' |';

          result.push(headerRow);
          result.push(separatorRow);
          dataRows.forEach(row => result.push(row));

          i = j - 1; // skip processed lines
          continue;
        }
      }
    }

    result.push(line);
  }

  cleaned = result.join('\n');

  // Format "Tier N: Name" as "Name (Tier N)" and "Tier N (Name)" as "Name (Tier N)"
  cleaned = cleaned.replace(/Tier (\d+):\s*(\w+)/g, '$2 (Tier $1)');
  cleaned = cleaned.replace(/Tier (\d+)\s*\((\w+)\)/g, '$2 (Tier $1)');

  // Format indicator detail headers - simple text replacements
  cleaned = cleaned.replace(/Regime \(Tier 1\) \(Weekly\)/g, 'Regime (Tier 1) - Weekly');
  cleaned = cleaned.replace(/Trend \(Tier 2\) \(Daily\)/g, 'Trend (Tier 2) - Daily');
  cleaned = cleaned.replace(/Timing \(Tier 3\) \(4H \+ 1H\)/g, 'Timing (Tier 3) - 4H and 1H');
  cleaned = cleaned.replace(/Dealer \(Tier 4\) Flow/g, 'Dealer Flow (Tier 4)');

  // Change "Per-Trade Size" to "Bullet Size"
  cleaned = cleaned.replace(/Per-Trade Size/gi, 'Bullet Size');

  // Clean up excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// Helper to extract text from React children
function getTextContent(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getTextContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return getTextContent((children as React.ReactElement).props.children);
  }
  return '';
}

// Detect table type from first header
function getTableType(children: React.ReactNode): string {
  const text = getTextContent(children).toLowerCase();
  if (text.includes('tier') && text.includes('timeframe')) return 'tier-summary';
  if (text.includes('price') && text.includes('level')) return 'alert-levels';
  if (text.includes('scenario') && text.includes('trigger')) return 'gameplan';
  if (text.includes('scenario') && text.includes('target')) return 'scenarios';
  return 'default';
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const cleanedContent = cleanContent(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom table rendering with type detection
          table: ({ children }) => {
            const tableType = getTableType(children);
            return (
              <div className="my-4">
                <table className={`w-full border-collapse table-${tableType}`}>{children}</table>
              </div>
            );
          },
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border/50 px-2 py-2 text-left font-medium text-[11px] uppercase tracking-wide text-muted-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border/50 px-2 py-2">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="even:bg-muted/20 hover:bg-muted/40 transition-colors">{children}</tr>
          ),
          // Headers - cleaner typography
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-8 mb-3 text-foreground flex items-center gap-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-5 mb-2 text-foreground/90">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-foreground/80 text-[15px]">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 space-y-2 list-disc">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 space-y-4 list-decimal">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground/90 pl-1">{children}</li>
          ),
          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          // Code
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto my-4">
                {children}
              </code>
            );
          },
          // Blockquotes - for Flacko AI's Take sections
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/60 pl-4 py-3 my-5 bg-primary/5 rounded-r-lg">
              {children}
            </blockquote>
          ),
          // Horizontal rules
          hr: () => <hr className="my-6 border-border" />,
          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary underline hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
}
