"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Zap, Globe, LayoutGrid } from "lucide-react";

export function CatalystFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") || "all";

  const setType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "all") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`/catalysts?${params.toString()}`);
  };

  return (
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
  );
}
