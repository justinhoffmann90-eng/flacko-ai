import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatDate(date: string | Date): string {
  // For date-only strings (YYYY-MM-DD), append noon time to prevent timezone shifts
  let dateObj: Date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    dateObj = new Date(date + 'T12:00:00');
  } else {
    dateObj = new Date(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateObj);
}

// Short date format without year (for mobile UI)
export function formatDateShort(date: string | Date): string {
  let dateObj: Date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    dateObj = new Date(date + 'T12:00:00');
  } else {
    dateObj = new Date(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(date));
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatLevel(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(price));
}

export function getTrafficLightColor(mode: "green" | "yellow" | "red"): string {
  const colors = {
    green: "text-green-500",
    yellow: "text-yellow-500",
    red: "text-red-500",
  };
  return colors[mode];
}

export function getTrafficLightBg(mode: "green" | "yellow" | "red"): string {
  const colors = {
    green: "bg-green-500/10",
    yellow: "bg-yellow-500/10",
    red: "bg-red-500/10",
  };
  return colors[mode];
}

export function isMarketHours(): boolean {
  const now = new Date();
  const day = now.getDay();

  // Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) return false;

  // Convert to ET
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

export function isExtendedHours(): boolean {
  const now = new Date();
  const day = now.getDay();

  // Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) return false;

  // Convert to ET
  const etTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Pre-market: 4:00 AM - 9:30 AM ET
  const preMarketOpen = 4 * 60; // 4:00 AM
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  
  // After-hours: 4:00 PM - 8:00 PM ET
  const marketClose = 16 * 60; // 4:00 PM
  const afterHoursClose = 20 * 60; // 8:00 PM

  return (timeInMinutes >= preMarketOpen && timeInMinutes < marketOpen) ||
         (timeInMinutes > marketClose && timeInMinutes <= afterHoursClose);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
