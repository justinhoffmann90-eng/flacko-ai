"use client";

import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
}

export function Header({ title = "Flacko AI", showNotifications = true }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-lg font-semibold">{title}</h1>
        {showNotifications && <NotificationBell />}
      </div>
    </header>
  );
}
