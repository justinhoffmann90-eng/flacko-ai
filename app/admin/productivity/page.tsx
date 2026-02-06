"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductivityRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the static HTML page
    window.location.href = "/personal.html";
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading Productivity Hub...</div>
    </div>
  );
}
