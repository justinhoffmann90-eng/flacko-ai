"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ToastProvider } from "@/components/ui/toast";

// Create a fallback for when Convex is not configured
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convex: ConvexReactClient | null = null;

try {
  if (convexUrl && convexUrl !== "http://localhost:3210") {
    convex = new ConvexReactClient(convexUrl);
  }
} catch (e) {
  console.warn("Convex client initialization failed:", e);
}

export function Providers({ children }: { children: React.ReactNode }) {
  // If Convex is configured, wrap with provider
  if (convex) {
    return (
      <ConvexProvider client={convex}>
        <ToastProvider>{children}</ToastProvider>
      </ConvexProvider>
    );
  }

  // Otherwise just return children with ToastProvider
  return <ToastProvider>{children}</ToastProvider>;
}
