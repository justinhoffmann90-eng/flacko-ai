"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, BookOpen, CheckSquare, Clock, X, Loader2 } from "lucide-react";
import { format } from "date-fns";

const categoryIcons: Record<string, React.ReactNode> = {
  memory: <Clock className="w-4 h-4" />,
  template: <FileText className="w-4 h-4" />,
  checklist: <CheckSquare className="w-4 h-4" />,
  document: <BookOpen className="w-4 h-4" />,
};

const categoryLabels: Record<string, string> = {
  memory: "Memory",
  template: "Templates",
  checklist: "Checklists",
  document: "Documents",
};

const categoryColors: Record<string, string> = {
  memory: "text-purple-400 bg-purple-500/10",
  template: "text-blue-400 bg-blue-500/10",
  checklist: "text-green-400 bg-green-500/10",
  document: "text-yellow-400 bg-yellow-500/10",
};

interface SearchResult {
  _id: string;
  path: string;
  title: string;
  content: string;
  category: string;
  last_modified: number;
}

// Demo search results
const demoResults: SearchResult[] = [
  {
    _id: "1",
    path: "~/clawd/templates/morning-brief.md",
    title: "Morning Brief Template",
    content: "Template for daily morning brief. Includes sections for market overview, TSLA technicals, and key levels.",
    category: "template",
    last_modified: Date.now() - 7 * 24 * 3600000,
  },
  {
    _id: "2",
    path: "~/clawd/templates/eod-wrap.md",
    title: "EOD Wrap Template",
    content: "End of day wrap template with daily assessment framework.",
    category: "template",
    last_modified: Date.now() - 14 * 24 * 3600000,
  },
  {
    _id: "3",
    path: "~/clawd/checklists/daily-report-build.md",
    title: "Daily Report Build Checklist",
    content: "Complete checklist for building the daily TSLA report.",
    category: "checklist",
    last_modified: Date.now() - 3 * 24 * 3600000,
  },
  {
    _id: "4",
    path: "~/clawd/MEMORY.md",
    title: "Long-term Memory",
    content: "Key insights, lessons learned, and important context.",
    category: "document",
    last_modified: Date.now() - 1 * 24 * 3600000,
  },
  {
    _id: "5",
    path: "~/clawd/memory/2026-02-05.md",
    title: "February 5, 2026",
    content: "Daily log for February 5, 2026. Morning brief posted successfully.",
    category: "memory",
    last_modified: Date.now() - 1 * 24 * 3600000,
  },
];

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
  
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippet(content: string, query: string, maxLength: number = 150): string {
  if (!query.trim()) return content.slice(0, maxLength) + "...";
  
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  
  if (index === -1) return content.slice(0, maxLength) + "...";
  
  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, index + query.length + 50);
  
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  
  return snippet;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter demo results based on query
  const filteredResults = useCallback(() => {
    if (debouncedQuery.length < 2) return [];
    
    return demoResults.filter((result) => {
      const matchesQuery = 
        result.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        result.content.toLowerCase().includes(debouncedQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || result.category === selectedCategory;
      
      return matchesQuery && matchesCategory;
    });
  }, [debouncedQuery, selectedCategory])();

  // Group results by category
  const groupedResults = filteredResults.reduce((acc: Record<string, SearchResult[]>, result: SearchResult) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {});

  const hasResults = filteredResults.length > 0;

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setShowResults(false);
  };

  // Keyboard shortcut: Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
      if (e.key === "Escape") {
        setShowResults(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          id="global-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search everything... (Cmd+K)"
          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs bg-white/10 text-gray-400 rounded">⌘K</kbd>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && debouncedQuery.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-white/10 rounded-xl shadow-2xl max-h-[500px] overflow-y-auto z-50">
          {isSearching ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-gray-400">
              No results found for &quot;{debouncedQuery}&quot;
              <div className="mt-2 text-xs text-gray-500">
                (Demo search - Convex setup required for full search)
              </div>
            </div>
          ) : (
            <div className="py-2">
              {/* Category Filter */}
              {Object.keys(groupedResults).length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                      !selectedCategory 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    All
                  </button>
                  {Object.keys(groupedResults).map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors flex items-center gap-1 ${
                        selectedCategory === category
                          ? categoryColors[category] || "bg-blue-500/20 text-blue-400"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {categoryIcons[category]}
                      {categoryLabels[category] || category}
                      <span className="text-gray-500">({groupedResults[category].length})</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Results */}
              {Object.entries(groupedResults).map(([category, results]) => {
                if (selectedCategory && selectedCategory !== category) return null;
                
                return (
                  <div key={category} className="border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5">
                      <span className={categoryColors[category] || "text-gray-400"}>
                        {categoryIcons[category]}
                      </span>
                      <span className="text-sm font-medium text-gray-300">
                        {categoryLabels[category] || category}
                      </span>
                    </div>
                    <div className="divide-y divide-white/5">
                      {results.map((result) => (
                        <div
                          key={result._id}
                          className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="font-medium text-white mb-1">
                            {highlightMatch(result.title, debouncedQuery)}
                          </div>
                          <div className="text-sm text-gray-400 line-clamp-2">
                            {highlightMatch(getSnippet(result.content, debouncedQuery), debouncedQuery)}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span className="font-mono">{result.path}</span>
                            <span>•</span>
                            <span>{format(result.last_modified, "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-white/5 flex justify-between">
                <span>Press <kbd className="px-1 bg-white/10 rounded">Esc</kbd> to close</span>
                <span>(Demo results - full search with Convex)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
