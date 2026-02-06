import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { format } from "date-fns";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Default system prompt for content generation
const DEFAULT_SYSTEM_PROMPT = `You are Lord Pretty Flacko — a TSLA-focused market war general operating a digital war room that uses AI agents to analyze dealer flow, technical indicators, macro catalysts, and liquidity structure to build battlefield-style trading intelligence.

## Core Identity
You blend high-level market intelligence with chaotic trench-style humor and cult-like tribal identity. Followers are treated as soldiers navigating volatility warfare.

## Narrative Premise
The market is war. TSLA is a battlefield where expansion campaigns and catastrophic liquidity ambushes happen repeatedly.

## Writing Style Rules (CRITICAL)
- **ALL TEXT MUST BE LOWERCASE** — no exceptions
- Language must be punchy, direct, and confident
- Sentences should be concise and high-impact
- Posts should feel like battlefield briefings
- Use military/war metaphors consistently
- Never use: "NFA", "DYOR", fire emojis, rocket emojis, "to the moon", "LFG"
- End tweets with "$TSLA" ticker tag

## Key Concepts (Use Accurately)
- **Gamma Strike**: level where dealer hedging behavior flips
- **Call Wall**: heavy call open interest creating resistance
- **Put Wall**: heavy put open interest creating support
- **Hedge Wall**: largest dealer hedging concentration
- **HIRO**: Hedge Impact Real-time Oracle
- **Mode System**: GREEN/YELLOW/ORANGE/RED with daily caps
- **Master Eject**: price level where all positions should be closed

## Vocabulary Doctrine
- Charts = Battlefield
- Volatility = Airstrike
- Gamma squeezes = Offensive campaign
- Selloffs = Nuclear event
- Levels = Defensive lines
- Breakouts = Expansion push
- Retail traders = Recruits or supply`;

// Default prompts for content types
const DEFAULT_TYPE_PROMPTS: Record<string, string> = {
  tweet_premarket: `Generate a tweet as Lord Pretty Flacko for pre-market hours.

Style: ALL LOWERCASE, battlefield briefing tone.
Topics: overnight flow, dealer positioning, gamma dynamics, pre-market setup.
Must include: $TSLA cashtag.
Constraints: Max 280 characters.

Current context: {{context}}
Report data: {{reportContext}}`,

  tweet_market_hours: `Generate a tweet as Lord Pretty Flacko during market hours.

Style: ALL LOWERCASE, punchy observations.
Topics: intraday action, level tests, gamma dynamics, trader psychology.
Must include: $TSLA cashtag.
Constraints: Max 280 characters.

Current context: {{context}}
Report data: {{reportContext}}`,

  tweet_afterhours: `Generate a tweet as Lord Pretty Flacko for after-hours.

Style: ALL LOWERCASE, reflective/strategic.
Topics: daily recap, structural observations, overnight thesis.
Must include: $TSLA cashtag.
Constraints: Max 280 characters.

Current context: {{context}}
Report data: {{reportContext}}`,

  morning_brief: `Generate a Discord morning brief post.

Format: Sections with emojis, bullet points, NO markdown tables.
Include: Mode, daily cap, key levels, what to watch, guidance.
Tone: Professional but accessible, battlefield commander.

Current context: {{context}}
Report data: {{reportContext}}`,

  hiro_alert: `Generate a Discord HIRO alert post.

Format: Clean sections, emoji indicators for direction.
Include: Current price, HIRO reading, key levels, interpretation.
Keep concise.

Current context: {{context}}
Report data: {{reportContext}}`,

  eod_intelligence: `Generate a Discord EOD intelligence wrap.

Format: Sections with emojis, bullet points, NO markdown tables.
Include: Session recap, level performance, key takeaway, tomorrow outlook.
Tone: Analytical, value-dense.

Current context: {{context}}
Report data: {{reportContext}}`,

  daily_assessment: `Generate a daily assessment post.

Include: Mode performance, level accuracy, key lessons, system adjustments.
Tone: Honest, self-critical, continuous improvement.

Current context: {{context}}
Report data: {{reportContext}}`,

  mode_card: `Generate data for a Mode Card image.

Output format (JSON):
{
  "mode": "GREEN|YELLOW|ORANGE|RED",
  "daily_cap": "X%",
  "posture": "description",
  "guidance": "brief text"
}

Current context: {{context}}
Report data: {{reportContext}}`,

  levels_card: `Generate data for a Levels Card image.

Output format (JSON):
{
  "current_price": number,
  "t1": number, "t2": number, "t3": number, "t4": number,
  "s1": number, "s2": number,
  "hedge_wall": number,
  "gamma_strike": number,
  "put_wall": number,
  "master_eject": number
}

Current context: {{context}}
Report data: {{reportContext}}`,

  tweet: `Generate a tweet as Lord Pretty Flacko.

Style: ALL LOWERCASE, battlefield briefing tone.
Include: $TSLA cashtag.
Constraints: Max 280 characters.

Current context: {{context}}
Report data: {{reportContext}}`,
};

// Fetch report context from database
async function getReportContext(
  supabase: Awaited<ReturnType<typeof createServiceClient>>
): Promise<string> {
  try {
    const { data: report } = await supabase
      .from("reports")
      .select("extracted_data, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    if (!report?.extracted_data) {
      return "No recent report data available.";
    }

    const e = report.extracted_data as Record<string, unknown>;
    const dateStr = format(new Date(report.report_date + "T12:00:00"), "MMM d, yyyy");

    return `
LATEST REPORT DATA (${dateStr}):
- Mode: ${(e.mode as Record<string, unknown>)?.current || "YELLOW"}
- Daily Cap: ${(e.position as Record<string, unknown>)?.daily_cap_pct || (e.mode as Record<string, unknown>)?.daily_cap || 15}%
- Posture: ${(e.positioning as Record<string, unknown>)?.posture || "cautious"}
- Close Price: $${(e.price as Record<string, unknown>)?.close || "N/A"}
- Change: ${(e.price as Record<string, unknown>)?.change_pct || "N/A"}%

Key Levels:
- Call Wall: $${(e.key_levels as Record<string, unknown>)?.call_wall || "N/A"}
- Gamma Strike: $${(e.key_levels as Record<string, unknown>)?.gamma_strike || "N/A"}
- Put Wall: $${(e.key_levels as Record<string, unknown>)?.put_wall || "N/A"}
- Hedge Wall: $${(e.key_levels as Record<string, unknown>)?.hedge_wall || "N/A"}
- Master Eject: $${(e.master_eject as Record<string, unknown>)?.price || (e.key_levels as Record<string, unknown>)?.master_eject || "N/A"}

${e.scenarios ? `Scenarios:
- Bull: ${((e.scenarios as Record<string, unknown>).bull as Record<string, unknown>)?.trigger || "N/A"} → ${((e.scenarios as Record<string, unknown>).bull as Record<string, unknown>)?.target || "N/A"}
- Base: ${((e.scenarios as Record<string, unknown>).base as Record<string, unknown>)?.trigger || "N/A"} → ${((e.scenarios as Record<string, unknown>).base as Record<string, unknown>)?.target || "N/A"}
- Bear: ${((e.scenarios as Record<string, unknown>).bear as Record<string, unknown>)?.trigger || "N/A"} → ${((e.scenarios as Record<string, unknown>).bear as Record<string, unknown>)?.target || "N/A"}` : ""}`;
  } catch {
    return "No recent report data available.";
  }
}

// Fetch custom prompt from database
async function getCustomPrompt(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  contentType: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("content_prompts_v2")
      .select("prompt")
      .eq("content_type", contentType)
      .single();

    if (error || !data) return null;
    return data.prompt;
  } catch {
    return null;
  }
}

// Generate content using Gemini
async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userPrompt);
  return result.response.text();
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

    const body = await request.json();
    const { type, context, regenerate } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Missing required field: type" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    // Get report context
    const reportContext = await getReportContext(serviceSupabase);

    // Get custom prompt or use default
    const customPrompt = await getCustomPrompt(serviceSupabase, type);
    const typePrompt = customPrompt || DEFAULT_TYPE_PROMPTS[type] || DEFAULT_TYPE_PROMPTS.tweet;

    // Build user prompt
    const userPrompt = typePrompt
      .replace(/\{\{context\}\}/g, context || "Generate based on current market conditions and report data.")
      .replace(/\{\{reportContext\}\}/g, reportContext)
      + (regenerate ? "\n\nGenerate a fresh variation different from before." : "");

    // Generate content
    const content = await generateWithGemini(DEFAULT_SYSTEM_PROMPT, userPrompt);

    return NextResponse.json({
      content,
      type,
      used_custom_prompt: !!customPrompt,
    });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
