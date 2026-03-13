import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/admin/orb/backtest
// Proxies to the Python serverless function at /api/backtest
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    condition,
    ticker = "TSLA",
    scan,
    minStreak,
    forward,
    timeframe = "weekly",
  }: {
    condition?: string;
    ticker?: string;
    scan?: string;
    minStreak?: number;
    forward?: string[];
    timeframe?: string;
  } = body;

  if (!condition && !scan) {
    return NextResponse.json(
      { error: "Must provide either condition or scan" },
      { status: 400 }
    );
  }

  // Build the base URL for the Python function
  // In production: same origin. In dev: localhost with correct port.
  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3000}`;

  try {
    const res = await fetch(`${baseUrl}/api/backtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition, scan, ticker, timeframe, minStreak, forward }),
      signal: AbortSignal.timeout(55000),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json(
      { error: `Backtest engine error: ${e.message}` },
      { status: 500 }
    );
  }
}
