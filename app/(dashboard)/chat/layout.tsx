import { BottomNav } from "@/components/dashboard/bottom-nav";

// Chat page has its own layout WITHOUT PullToRefresh
// to prevent accidental page refreshes while scrolling through messages
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-16 overflow-hidden">
      {children}
      <BottomNav />
    </div>
  );
}
