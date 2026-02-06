"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, LayoutGrid, Archive } from "lucide-react";

export function CatalystFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";
  const currentView = searchParams.get("view") || "upcoming";

  const setType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`/catalysts?${params.toString()}`);
  };

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "upcoming") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`/catalysts?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("upcoming")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentView === "upcoming"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setView("archived")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentView === "archived"
              ? "bg-zinc-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Archive className="h-3.5 w-3.5" />
          Archived
        </button>
      </div>
      
      {/* Type Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setType("all")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentType === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          All
        </button>
        <button
          onClick={() => setType("tesla")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentType === "tesla"
              ? "bg-blue-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Tesla
        </button>
        <button
          onClick={() => setType("macro")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentType === "macro"
              ? "bg-purple-500 text-white"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          Macro
        </button>
      </div>
    </div>
  );
}
