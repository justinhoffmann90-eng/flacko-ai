import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-16">
      <PullToRefresh>
        {children}
      </PullToRefresh>
      <BottomNav />
    </div>
  );
}
