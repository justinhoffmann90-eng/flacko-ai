import { NextResponse } from "next/server";
import { queryKnowledge } from "@/lib/bot/rag";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { question, user_id } = (await request.json()) as {
      question?: string;
      user_id?: string;
    };

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const { answer, chunks } = await queryKnowledge(question);

    const supabase = await createServiceClient();
    await supabase.from("bot_queries").insert({
      user_id: user_id || "api-test",
      question,
      answer,
      chunks_used: chunks.map((chunk) => chunk.id),
    });

    return NextResponse.json({ answer, chunks });
  } catch (error) {
    console.error("Bot query error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
