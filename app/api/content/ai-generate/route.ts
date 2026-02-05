import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { format } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const SYSTEM_PROMPT = `You are the content engine for Flacko AI — a TSLA-focused trading intelligence platform built on SpotGamma options flow data. You generate content for X (Twitter) and Discord.

BRAND VOICE:
- Lowercase, clean, confident. Never salesy or hype-driven.
- Teach through contrast: "most traders do X, structured traders do Y"
- Data-first: always anchor claims in mechanics (dealer positioning, gamma, options flow)
- Never give financial advice. Frame everything as structure/education.
- Never use: "NFA", "DYOR", fire emojis, rocket emojis, "to the moon", "LFG"
- Allowed emojis: mode circles only (use sparingly)
- End tweets with "$TSLA" ticker tag — no other cashtags
- Tone: like a veteran trader teaching in a private chat, not a guru selling a course

KEY CONCEPTS (use these accurately):
- Gamma Strike: the level where dealer hedging behavior flips (positive gamma above = stabilizing, negative gamma below = amplifying)
- Call Wall: heavy call open interest creating resistance (dealers sell stock to hedge)
- Put Wall: heavy put open interest creating support (dealers buy stock to hedge)
- Hedge Wall: largest dealer hedging concentration
- HIRO: Hedge Impact Real-time Oracle — real-time institutional flow indicator
- Mode System: GREEN (25% cap, lean in) / YELLOW (15%, selective) / ORANGE (10%, cautious) / RED (5%, defend)
- Master Eject: the price level where all positions should be closed

CONTENT RULES:
- Never reveal exact Flacko AI report contents or subscriber-only data
- Tease structure and methodology, not specific numbers (unless generating subscriber content)
- For public tweets: show the framework, not the fish
- For Discord subscriber content: be specific with levels, scenarios, and guidance
- Always be accurate about how options mechanics work — our credibility is our product
- Max tweet length: 4000 chars (X premium). Aim for 800-1500 for engagement.`;

interface ContentRequest {
  type: "tweet" | "thread" | "morning-brief" | "eod-wrap" | "educational" | "custom";
  context?: string; // Additional context from the user
  date?: string;
  tone?: "professional" | "casual" | "educational";
  audience?: "public" | "subscriber";
  reportData?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: ContentRequest = await request.json();
    const { type, context, date, tone = "casual", audience = "public" } = body;

    // Fetch report data for context
    const serviceSupabase = await createServiceClient();
    let reportContext = "";

    const targetDate = date || new Date().toISOString().split("T")[0];
    const { data: report } = await serviceSupabase
      .from("reports")
      .select("extracted_data, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (report?.extracted_data) {
      const e = report.extracted_data as any;
      const dateStr = format(new Date(report.report_date + "T12:00:00"), "MMM d, yyyy");

      reportContext = `
LATEST REPORT DATA (${dateStr}):
- Mode: ${e.mode?.current || "YELLOW"}
- Daily Cap: ${e.position?.daily_cap_pct || e.mode?.daily_cap || 15}%
- Posture: ${e.positioning?.posture || "cautiously positioned"}
- Mode Summary: ${e.mode?.summary || "N/A"}
- Close Price: $${e.price?.close || "N/A"}
- Change: ${e.price?.change_pct || "N/A"}%

Key Levels:
- Call Wall: $${e.key_levels?.call_wall || "N/A"}
- Gamma Strike: $${e.key_levels?.gamma_strike || "N/A"}
- Put Wall: $${e.key_levels?.put_wall || "N/A"}
- Hedge Wall: $${e.key_levels?.hedge_wall || "N/A"}
- Master Eject: $${e.master_eject?.price || e.key_levels?.master_eject || "N/A"}

${e.scenarios ? `Scenarios:
- Bull: ${e.scenarios.bull?.trigger || "N/A"} → ${e.scenarios.bull?.target || "N/A"}
- Base: ${e.scenarios.base?.trigger || "N/A"} → ${e.scenarios.base?.target || "N/A"}
- Bear: ${e.scenarios.bear?.trigger || "N/A"} → ${e.scenarios.bear?.target || "N/A"}` : ""}

${e.positioning?.guidance ? `Guidance: ${e.positioning.guidance}` : ""}`;
    }

    // Build the generation prompt based on content type
    let userPrompt = "";

    switch (type) {
      case "tweet":
        userPrompt = `Generate 3 tweet variations for X (Twitter).

Audience: ${audience === "public" ? "Public / non-subscribers (tease methodology, don't reveal specific levels)" : "Subscribers (be specific with levels and guidance)"}
Tone: ${tone}
${context ? `Topic/angle: ${context}` : "Generate based on today's report data — pick the most interesting angle."}

${reportContext}

Return exactly 3 tweets separated by "---". Each should take a different angle on the same data. Vary the structure (some with bullet points, some narrative, some with contrasts). Keep each under 1500 characters.`;
        break;

      case "thread":
        userPrompt = `Generate an X thread (3-5 tweets).

Audience: ${audience === "public" ? "Public" : "Subscribers"}
Tone: ${tone}
${context ? `Topic: ${context}` : "Pick the most educational angle from today's report data."}

${reportContext}

Return tweets numbered 1/, 2/, 3/, etc. Each tweet should be under 280 characters (standard limit for threads). The thread should build a coherent narrative — each tweet leads to the next. End with a CTA to flacko.ai.`;
        break;

      case "morning-brief":
        userPrompt = `Generate a Morning Brief for the Discord #morning-brief channel.

This is subscriber-only content. Be specific with levels and guidance.

${reportContext}

Format as a Discord message with:
1. Mode header with emoji and daily cap
2. Key levels section (call wall, gamma strike, put wall, hedge wall)
3. "What I'd do" section with specific guidance based on mode and posture
4. Bull/Base/Bear scenarios with triggers
5. Master eject level with warning
6. Keep it scannable — traders read this before market open

Use Discord formatting (bold with **, headers with ##, bullets with •).
Keep it under 1500 characters.`;
        break;

      case "eod-wrap":
        userPrompt = `Generate an EOD Wrap for the Discord #market-pulse channel.

This is subscriber-only content.

${reportContext}
${context ? `Additional EOD context: ${context}` : ""}

Format as a Discord message with:
1. Session summary (describe the price action narrative)
2. Level accuracy (which levels held, which broke, which weren't tested)
3. Key takeaway — what did we learn about current structure?
4. Tomorrow outlook — based on how today's levels performed, what to watch
5. Use Discord formatting

Keep it under 1500 characters. Be honest about misses — transparency builds trust.`;
        break;

      case "educational":
        userPrompt = `Generate an educational thread for X about options market structure.

Topic: ${context || "How dealer positioning creates support and resistance in TSLA"}
Audience: Public (non-subscribers)
Tone: educational but accessible

Requirements:
- Explain mechanics simply — "explain like I'm 25 and interested"
- Use analogies but don't overdo them
- Never condescend
- End with what this means practically for traders
- Final tweet should mention flacko.ai naturally

Return 4-6 tweets numbered 1/, 2/, 3/, etc. Each under 280 characters.`;
        break;

      case "custom":
        userPrompt = `${context || "Generate content based on the latest report data."}

${reportContext}`;
        break;

      default:
        return NextResponse.json({ error: `Unknown content type: ${type}` }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response.text();

    return NextResponse.json({
      content: response,
      type,
      date: targetDate,
      reportDate: report?.report_date,
    });
  } catch (error) {
    console.error("AI content generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
