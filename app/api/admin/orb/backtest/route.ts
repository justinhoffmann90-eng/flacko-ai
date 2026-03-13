import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Backtest proxy running on Mac Mini via Cloudflare Tunnel
// Falls back to local execSync for dev mode
const BACKTEST_PROXY_URL = process.env.BACKTEST_PROXY_URL || "https://adaptation-vsnet-none-colony.trycloudflare.com";

// POST /api/admin/orb/backtest
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

  try {
    // Try proxy first (works in both dev and prod)
    const proxyRes = await fetch(`${BACKTEST_PROXY_URL}/backtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition, scan, ticker, timeframe, minStreak, forward }),
      signal: AbortSignal.timeout(55000),
    });

    if (!proxyRes.ok) {
      const errData = await proxyRes.json().catch(() => ({ error: "Proxy error" }));
      return NextResponse.json(errData, { status: proxyRes.status });
    }

    const data = await proxyRes.json();
    return NextResponse.json(data);
  } catch (proxyError) {
    // Fallback to local execSync (dev mode only)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { execSync } = require("child_process") as typeof import("child_process");
      const engineDir = `${process.env.HOME}/clawd/backtest`;

      const args: string[] = ["engine.py"];
      if (scan) {
        args.push("--scan", scan);
      } else if (condition) {
        args.push("--condition", condition);
      }
      args.push("--ticker", ticker);
      if (timeframe && timeframe !== "weekly") args.push("--tf", timeframe);
      if (minStreak) args.push("--min-streak", String(minStreak));
      args.push("--json");

      const cmd = `python3 ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`;

      let stdout: string;
      try {
        stdout = execSync(cmd, {
          cwd: engineDir,
          timeout: 55_000,
          maxBuffer: 10 * 1024 * 1024,
          encoding: "utf8",
        });
      } catch (execError: unknown) {
        const err = execError as { stdout?: string; stderr?: string; message?: string };
        stdout = err.stdout ?? "";
        if (!stdout) {
          return NextResponse.json(
            { error: "Engine execution failed", details: err.stderr ?? err.message },
            { status: 500 }
          );
        }
      }

      const jsonStart = stdout.indexOf("\n{");
      const jsonStr = jsonStart >= 0 ? stdout.slice(jsonStart).trim() : stdout.trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        const anyStart = stdout.indexOf("{");
        if (anyStart >= 0) {
          parsed = JSON.parse(stdout.slice(anyStart));
        } else {
          return NextResponse.json(
            { error: "Could not parse engine output" },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ result: parsed });
    } catch (fallbackError: unknown) {
      const e = fallbackError as Error;
      return NextResponse.json(
        { error: `Proxy unreachable and local fallback failed: ${e.message}` },
        { status: 500 }
      );
    }
  }
}
