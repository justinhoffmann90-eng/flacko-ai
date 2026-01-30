"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Calendar,
  GraduationCap,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/report",
    label: "Report",
    icon: FileText,
  },
  {
    href: "/chat",
    label: "Chat",
    icon: MessageSquare,
  },
  {
    href: "/catalysts",
    label: "Catalysts",
    icon: Calendar,
  },
  {
    href: "/learn",
    label: "Learn",
    icon: GraduationCap,
    comingSoon: true,
  },
];

export function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Prevent hydration mismatch - only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return placeholder during SSR and initial hydration
  if (!mounted) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto pb-2">
          {navItems.map((item) => {
            const isComingSoon = 'comingSoon' in item && item.comingSoon;
            return (
              <div
                key={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 pt-2",
                  isComingSoon ? "text-muted-foreground/50" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isComingSoon = 'comingSoon' in item && item.comingSoon;
          
          if (isComingSoon) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 pt-2 text-muted-foreground/50 cursor-not-allowed"
                title="Coming Soon"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </div>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 pt-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
