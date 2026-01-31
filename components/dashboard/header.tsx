"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

interface HeaderProps {
  title?: string;
  showSettings?: boolean;
}

export function Header({ title = "Flacko AI", showSettings = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-14 md:h-16 lg:h-18 px-4 md:px-6 max-w-lg md:max-w-none mx-auto">
        <h1 className="text-lg md:text-xl lg:text-2xl font-semibold">{title}</h1>
        {showSettings && (
          <Link 
            href="/settings" 
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="h-5 w-5 md:h-6 md:w-6" />
          </Link>
        )}
      </div>
    </header>
  );
}
