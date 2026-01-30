"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ReportToggle() {
  const pathname = usePathname();
  const isWeekly = pathname === "/weekly";

  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-muted rounded-lg w-fit mx-auto">
      <Link
        href="/report"
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          !isWeekly
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Daily
      </Link>
      <Link
        href="/weekly"
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          isWeekly
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Weekly
      </Link>
    </div>
  );
}
