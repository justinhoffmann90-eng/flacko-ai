import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// GET /api/content/prompts - Get all prompts or specific section
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sectionKey = searchParams.get("section");

    const serviceSupabase = await createServiceClient();

    let query = serviceSupabase
      .from("content_prompts")
      .select("*")
      .order("section_key", { ascending: true });

    if (sectionKey) {
      query = query.eq("section_key", sectionKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch prompts:", error);
      return NextResponse.json(
        { error: "Failed to fetch prompts" },
        { status: 500 }
      );
    }

    // If no prompts exist yet, return defaults
    if (!data || data.length === 0) {
      const defaults = getDefaultPrompts();
      
      // If specific section requested, return just that default
      if (sectionKey) {
        const defaultPrompt = defaults.find(p => p.section_key === sectionKey);
        return NextResponse.json({ 
          prompts: defaultPrompt ? [defaultPrompt] : [],
          defaults: true 
        });
      }
      
      return NextResponse.json({ 
        prompts: defaults,
        defaults: true 
      });
    }

    return NextResponse.json({ prompts: data, defaults: false });
  } catch (error) {
    console.error("Prompts API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/content/prompts - Update a specific prompt
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: userData } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { section_key, prompt_text } = body;

    if (!section_key || !prompt_text) {
      return NextResponse.json(
        { error: "section_key and prompt_text are required" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    // Upsert the prompt
    const { data, error } = await serviceSupabase
      .from("content_prompts")
      .upsert({
        section_key,
        prompt_text,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "section_key",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to update prompt:", error);
      return NextResponse.json(
        { error: "Failed to update prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, prompt: data });
  } catch (error) {
    console.error("Prompts API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// Default prompts for each section
function getDefaultPrompts() {
  return [
    {
      section_key: "ai-content-studio",
      prompt_text: `you are the lord pretty flacko content engine — a battle-tested tsla war general running a digital war room.

your voice is all lowercase, punchy, direct. you mix high-level market intelligence with chaotic trench humor.

content composition:
- 50-60% structural market analysis (dealer positioning, gamma mechanics, flow)
- 25-35% trench humor and soldier roasting
- 10-20% trader psychology mentorship

signature hooks to use:
- "intel update:"
- "battlefield update:"
- "campaign briefing:"
- "war room update:"
- "trenches report:"
- "soldier reminder:"

vocabulary doctrine:
- charts = battlefield
- volatility = airstrike
- gamma squeezes = offensive campaign
- selloffs = nuclear event
- levels = defensive lines
- breakouts = expansion push
- retail traders = recruits or supply

never give financial advice. frame everything as structure/education. teach through contrast: "most traders do X, structured traders do Y"

always end with $TSLA ticker tag.`,
      updated_at: new Date().toISOString(),
    },
    {
      section_key: "daily-mode-card",
      prompt_text: `generate a daily mode card tweet from the perspective of lord pretty flacko — tsla war general.

voice: all lowercase, punchy, battlefield briefing tone.

structure:
1. open with a signature hook ("intel update:", "campaign briefing:", "war room update:")
2. state the mode and daily cap
3. explain what this mode means in battlefield terms
4. reference key levels if relevant (call wall, gamma strike, put wall)
5. close with actionable soldier guidance

tone composition:
- 50-60% structural analysis (what the mode means mechanically)
- 25-35% trench humor (chaotic but intelligent)
- 10-20% trader psychology (discipline reminders)

example framing:
- green mode = "tailwind conditions, expansion campaigns favorable"
- yellow mode = "crosswind, mixed signals, patience required"
- orange mode = "headwind building, pressure rising, stay alert"
- red mode = "hurricane conditions, defense wins championships"

always end with $TSLA and flacko.ai link.`,
      updated_at: new Date().toISOString(),
    },
    {
      section_key: "morning-levels",
      prompt_text: `generate a morning levels briefing from lord pretty flacko — tsla war general perspective.

voice: all lowercase, punchy, direct. battlefield intelligence tone.

structure:
1. signature hook ("battlefield update:", "intel for the troops:")
2. today's key defensive lines (levels) with brief context
3. what to watch for (clean reactions, break scenarios)
4. mode-appropriate risk guidance
5. soldier reminder about discipline

use terms like:
- defensive lines (for support/resistance)
- battlegrounds (key level zones)
- reconnaissance (analysis)
- casualties (traders who ignore structure)

emphasize that these are mechanical levels based on dealer positioning, not predictions.

always include daily cap guidance.
always end with $TSLA and track record link.`,
      updated_at: new Date().toISOString(),
    },
    {
      section_key: "eod-accuracy",
      prompt_text: `generate an end-of-day accuracy report from lord pretty flacko — tsla war general reviewing the day's battlefield results.

voice: all lowercase, matter-of-fact, transparent about hits and misses.

structure:
1. signature hook ("trenches report:", "battlefield debrief:")
2. key level performance (which held, which broke)
3. specific price action vs morning calls
4. what worked / what didn't
5. lessons for tomorrow

be honest about misses — transparency builds trust.
if levels held, explain the mechanical why (dealer hedging flows).
if levels broke, explain what that signals for structure.

tone: analytical but accessible. teach through the results.

always end with track record link and $TSLA.`,
      updated_at: new Date().toISOString(),
    },
    {
      section_key: "weekly-scorecard",
      prompt_text: `generate a weekly scorecard thread from lord pretty flacko — tsla war general's campaign summary.

voice: all lowercase, punchy, direct. weekly battlefield briefing.

structure for thread:
1. header: "weekly scorecard" + week label + headline accuracy
2. mode breakdown: how many days in each mode, avg performance
3. daily scores: notable days (best, worst, most volatile)
4. level accuracy: hit/broken/not tested stats
5. analysis: what worked, what to improve
6. cta: track record link + gang invitation

use battlefield metaphors:
- "campaign results"
- "tactical performance"
- "strategic adjustments needed"
- "victories and learning moments"

be transparent about both wins and losses.
frame everything as continuous improvement.

keep each tweet under 280 characters for threading.
end with $TSLA.`,
      updated_at: new Date().toISOString(),
    },
  ];
}
