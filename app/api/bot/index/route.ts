import { NextResponse } from "next/server";
import { indexKnowledgeBase } from "@/lib/bot/indexer";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const reset = url.searchParams.get("reset") === "1";

    let days = 30;
    try {
      const body = (await request.json()) as { days?: number };
      if (body?.days && Number.isFinite(body.days)) {
        days = Number(body.days);
      }
    } catch {
      // ignore body parse errors
    }

    const result = await indexKnowledgeBase({ days, reset });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Bot index error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
