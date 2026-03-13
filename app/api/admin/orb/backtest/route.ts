import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// TODO: This route uses child_process.execSync which works in `next dev` (local Mac Mini).
// For production Vercel deployment, proxy to a local Express/Hono wrapper on the Mac Mini (port 3847).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // 60s timeout for backtest runs

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
  }: {
    condition?: string;
    ticker?: string;
    scan?: string;
    minStreak?: number;
    forward?: string[];
  } = body;

  if (!condition && !scan) {
    return NextResponse.json(
      { error: "Must provide either condition or scan" },
      { status: 400 }
    );
  }

  // Build CLI args
  const args: string[] = ["engine.py"];
  if (scan) {
    args.push("--scan", scan);
  } else if (condition) {
    args.push("--condition", condition);
  }
  args.push("--ticker", ticker);
  if (minStreak) args.push("--min-streak", String(minStreak));
  if (forward && forward.length > 0) {
    // Engine expects comma-separated like "1w,2w,4w"
    const forwardArg = forward
      .map((f) => f.replace("w", ""))
      .join(",");
    args.push("--forward", forwardArg);
  }
  args.push("--json");

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process") as typeof import("child_process");
    const engineDir = `${process.env.HOME}/clawd/backtest`;

    const cmd = `python3 ${args.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`;

    let stdout: string;
    try {
      stdout = execSync(cmd, {
        cwd: engineDir,
        timeout: 55_000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        encoding: "utf8",
        // stderr goes to the engine's own stderr — we capture only stdout
      });
    } catch (execError: unknown) {
      const err = execError as { stdout?: string; stderr?: string; message?: string };
      // execSync throws on non-zero exit but stdout may still have data
      stdout = err.stdout ?? "";
      if (!stdout) {
        return NextResponse.json(
          {
            error: "Engine execution failed",
            details: err.stderr ?? err.message ?? "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // The engine outputs mixed text + JSON. Find the JSON object (starts with '{')
    const jsonStart = stdout.indexOf("\n{");
    const jsonStr =
      jsonStart >= 0 ? stdout.slice(jsonStart).trim() : stdout.trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try finding any '{' in the output
      const anyStart = stdout.indexOf("{");
      if (anyStart >= 0) {
        parsed = JSON.parse(stdout.slice(anyStart));
      } else {
        return NextResponse.json(
          { error: "Could not parse engine output", raw: stdout.slice(0, 2000) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ result: parsed });
  } catch (error: unknown) {
    const e = error as Error;
    return NextResponse.json(
      { error: e.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
