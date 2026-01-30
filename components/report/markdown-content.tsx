"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

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

  // Format tier names with line break for mobile: "Tier 1 (Long)" → "Long<br>(Tier 1)"
  cleaned = cleaned.replace(/Tier (\d+):\s*(\w+)/g, '$2<br>(Tier $1)');
  cleaned = cleaned.replace(/Tier (\d+)\s*\((\w+)\)/g, '$2<br>(Tier $1)');

  // Process Tier tables: rename headers to Tier | Time | Definition | Status
  // Handle both formats: 
  // 1. | Tier | Timeframe | What It Measures | Signal |
  // 2. | Tier | Timeframe | Signal | Implication |
  const tierTableLines = cleaned.split('\n');
  let inTierTable = false;
  let tierTableFormat = 0; // 1 = first format, 2 = second format
  const tierResult: string[] = [];
  
  for (let i = 0; i < tierTableLines.length; i++) {
    const line = tierTableLines[i];
    const trimmed = line.trim();
    
    // Detect Tier table header row (either format)
    if (/\|\s*Tier\s*\|/i.test(line) && /Timeframe/i.test(line)) {
      if (/What It Measures/i.test(line)) {
        // Format 1: | Tier | Timeframe | What It Measures | Signal |
        tierTableFormat = 1;
        inTierTable = true;
        tierResult.push('| Tier | Time | Definition | Status |');
        continue;
      } else if (/Signal/i.test(line) && /Implication/i.test(line)) {
        // Format 2: | Tier | Timeframe | Signal | Implication |
        tierTableFormat = 2;
        inTierTable = true;
        tierResult.push('| Tier | Time | Definition | Status |');
        continue;
      }
    }
    
    // Handle separator row
    if (inTierTable && /^\|[-:\s|]+\|$/.test(trimmed) && trimmed.includes('---')) {
      tierResult.push('|------|------|------------|--------|');
      continue;
    }
    
    // Handle data rows
    if (inTierTable && trimmed.startsWith('|') && trimmed.endsWith('|') && !trimmed.includes('---')) {
      const parts = line.split('|');
      if (parts.length >= 5) {
        const col1 = parts[1]; // Tier
        const col2 = parts[2]; // Timeframe
        const col3 = parts[3]; // What It Measures OR Signal
        const col4 = parts[4]; // Signal OR Implication
        
        if (tierTableFormat === 1) {
          // Format 1: cols are Tier | Timeframe | What It Measures | Signal
          // Reorder to: Tier | Time | Definition (col3) | Status (col4)
          tierResult.push(`|${col1}|${col2}|${col3}|${col4}|`);
        } else {
          // Format 2: cols are Tier | Timeframe | Signal | Implication
          // Reorder to: Tier | Time | Definition (col4) | Status (col3)
          tierResult.push(`|${col1}|${col2}|${col4}|${col3}|`);
        }
        continue;
      }
    }
    
    // End of table
    if (inTierTable && trimmed !== '' && !trimmed.startsWith('|')) {
      inTierTable = false;
      tierTableFormat = 0;
    }
    
    tierResult.push(line);
  }
  
  cleaned = tierResult.join('\n');

  // Change "Per-Trade Size" to "Bullet Size"
  cleaned = cleaned.replace(/Per-Trade Size/gi, 'Bullet Size');

  // Remove PRICE TARGET column (3rd column) from Gameplan table
  const lines2 = cleaned.split('\n');
  let inGameplanTable = false;
  const result2: string[] = [];
  
  for (let i = 0; i < lines2.length; i++) {
    const line = lines2[i];
    const trimmed = line.trim();
    
    // Detect Gameplan table header (has Scenario and Price Target)
    if (/Scenario/i.test(line) && /Price\s*Target/i.test(line)) {
      inGameplanTable = true;
    }
    
    // If in Gameplan table and this is a table row with pipes
    if (inGameplanTable && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Split by | but keep structure
      const parts = line.split('|');
      // parts[0] is empty (before first |), parts[1] is col1, etc.
      if (parts.length >= 5) { // 4 columns = 5 parts (empty + 4 cols + empty-ish)
        parts.splice(3, 1); // Remove 4th element (3rd column, index 3 since [0] is empty)
        result2.push(parts.join('|'));
        continue;
      }
    }
    
    // Detect end of table (non-empty line that doesn't start with |)
    if (inGameplanTable && trimmed !== '' && !trimmed.startsWith('|')) {
      inGameplanTable = false;
    }
    
    result2.push(line);
  }
  
  cleaned = result2.join('\n');

  // Clean up excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

// Helper to extract text from React children
function getTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (typeof node === 'object' && 'props' in node) {
    return getTextContent((node as React.ReactElement).props?.children);
  }
  return '';
}

// Detect table type from content
function getTableClass(children: React.ReactNode): string {
  const text = getTextContent(children).toLowerCase();
  if (text.includes('tier') && text.includes('time') && text.includes('definition')) {
    return 'table-tier-summary';
  }
  return '';
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const cleanedContent = cleanContent(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Table with type detection for custom styling
          table: ({ children }) => {
            const tableClass = getTableClass(children);
            return (
              <div className="my-4">
                <table className={`w-full border-collapse ${tableClass}`}>{children}</table>
              </div>
            );
          },
          thead: ({ children }) => (
            <thead className="bg-slate-700">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-slate-600 px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-wider text-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border/50 px-3 py-2 align-top">{children}</td>
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
