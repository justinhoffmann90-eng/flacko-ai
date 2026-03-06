"use client";

import { useState } from "react";

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong. Please try again or contact support@flacko.ai");
      }
    } catch {
      alert("Something went wrong. Please try again or contact support@flacko.ai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg py-3 px-4 font-medium transition-colors"
    >
      {loading ? "Redirecting..." : "Update Payment Method"}
    </button>
  );
}
