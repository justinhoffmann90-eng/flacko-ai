"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Disable pull-to-refresh on chat page (has its own scroll handling)
  const disablePullToRefresh = pathname === "/chat";

  return (
    <div className="min-h-screen bg-background pb-16">
      <PullToRefresh disabled={disablePullToRefresh}>
        {children}
      </PullToRefresh>
      <BottomNav />
    </div>
  );
}
