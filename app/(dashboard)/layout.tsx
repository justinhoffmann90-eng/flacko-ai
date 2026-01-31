"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { ProgressTrigger } from "@/components/ui/progress-trigger";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Disable pull-to-refresh on chat page (has its own scroll handling)
  const disablePullToRefresh = pathname === "/chat";

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <ProgressTrigger />
      {/* Desktop sidebar nav */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 lg:w-80 md:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-border bg-card">
          <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
            <div className="flex flex-shrink-0 items-center px-5">
              <span className="text-2xl font-bold">Flacko AI</span>
            </div>
            <nav className="mt-10 flex-1 space-y-2 px-3">
              <DesktopNavLink href="/dashboard" icon="home" label="Home" currentPath={pathname} />
              <DesktopNavLink href="/report" icon="file" label="Reports" currentPath={pathname} />
              <DesktopNavLink href="/catalysts" icon="spark" label="Catalysts" currentPath={pathname} />
              <DesktopNavLink href="/chat" icon="message" label="Chat" currentPath={pathname} />
              <DesktopNavLink href="/settings" icon="settings" label="Settings" currentPath={pathname} />
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main content - offset for desktop sidebar */}
      <div className="md:pl-72 lg:pl-80">
        <div className="mx-auto max-w-7xl md:px-8 lg:px-12">
          <PullToRefresh disabled={disablePullToRefresh}>
            {children}
          </PullToRefresh>
        </div>
      </div>
      
      {/* Mobile bottom nav - hidden on desktop */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

// Desktop nav link component
function DesktopNavLink({ 
  href, 
  icon, 
  label, 
  currentPath 
}: { 
  href: string; 
  icon: string; 
  label: string; 
  currentPath: string;
}) {
  const isActive = currentPath === href;
  
  return (
    <a
      href={href}
      className={`group flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors ${
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <NavIcon name={icon} className={`mr-4 h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
      {label}
    </a>
  );
}

// Simple icon component
function NavIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    spark: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    file: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    message: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    settings: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };
  
  return <>{icons[name] || null}</>;
}
