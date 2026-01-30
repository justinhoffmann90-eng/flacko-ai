import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Load trading rulebook at module level (cached)
let tradingRulebook = "";
try {
  tradingRulebook = readFileSync(
    join(process.cwd(), "content", "trading-rulebook.md"),
    "utf-8"
  );
} catch {
  console.warn("Trading rulebook not found at content/trading-rulebook.md");
}

const DAILY_MESSAGE_LIMIT = 15;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SubscriptionStatus {
  status: string;
  trial_ends_at?: string;
}

interface ChatUsage {
  message_count: number;
}

export async function POST(request: Request) {
  try {
    const devBypass = process.env.DEV_BYPASS_AUTH === "true";
    const supabase = devBypass ? await createServiceClient() : await createClient();

    // Auth check (skip in dev mode)
    let userId: string | null = null;
    if (!devBypass) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = user.id;

      // Check subscription status
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("status, trial_ends_at")
        .eq("user_id", user.id)
        .single();

      const subscription = subscriptionData as SubscriptionStatus | null;
      const { hasSubscriptionAccess } = await import("@/lib/subscription");
      if (!hasSubscriptionAccess(subscription)) {
        return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
      }

      // Check daily usage
      const today = new Date().toISOString().split("T")[0];
      const { data: usageData } = await supabase
        .from("chat_usage")
        .select("message_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .single();

      const usage = usageData as ChatUsage | null;
      if (usage && usage.message_count >= DAILY_MESSAGE_LIMIT) {
        return NextResponse.json({
          error: "Daily message limit reached. Resets at midnight ET.",
        }, { status: 429 });
      }
    }

    const { message, history } = await request.json() as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Get latest report for context
    const { data: report } = await supabase
      .from("reports")
      .select("extracted_data, report_date")
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    // Get user settings for context (only if authenticated)
    let settings = null;
    if (userId) {
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      settings = settingsData;
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(report, settings);

    // Initialize Gemini model (Pro for better reasoning and formatting)
    // Options: gemini-1.5-pro (stable), gemini-2.0-flash (fast), gemini-2.0-flash-thinking-exp (best reasoning)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: systemPrompt,
    });

    // Build conversation history for Gemini
    const geminiHistory = (history || []).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat with history
    const chat = model.startChat({
      history: geminiHistory as { role: "user" | "model"; parts: { text: string }[] }[],
    });

    // Send the current message
    const result = await chat.sendMessage(message);
    const response = result.response;
    const assistantMessage = response.text();

    // Update usage (only if authenticated)
    if (userId && !devBypass) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usageData2 } = await supabase
        .from("chat_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .single();

      const currentUsage = usageData2 as ChatUsage | null;
      const usageToSave = {
        user_id: userId,
        usage_date: today,
        message_count: (currentUsage?.message_count || 0) + 1,
      };
      await (supabase
        .from("chat_usage") as unknown as { upsert: (data: typeof usageToSave, opts: { onConflict: string }) => Promise<unknown> })
        .upsert(usageToSave, {
          onConflict: "user_id,usage_date",
        });
    }

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface ReportData {
  mode?: { current: string; label: string; summary?: string };
  price?: { close: number; change_pct: number; range?: { low: number; high: number } };
  master_eject?: { price: number };
  entry_quality?: { score: number };
  position?: { daily_cap_pct: number; size_recommendation: string; current_stance?: string };
  alerts?: Array<{ type: string; level_name: string; price: number; action?: string; reason?: string }>;
  qqq_status?: string;
  technicals?: {
    bx_trender?: { daily: string; weekly: string; monthly: string };
    smi?: { value: number; signal: string };
    ema_status?: string;
  };
}

function buildSystemPrompt(
  report: { extracted_data: unknown; report_date: string } | null,
  settings: {
    portfolio_size?: string;
    portfolio_size_exact?: number;
    daily_cap_pct?: number;
    risk_tolerance?: string;
    per_trade_limit_pct?: number;
    options_cap_pct?: number;
  } | null
): string {
  let context = `You are the Flacko AI trading assistant. You help users understand their daily TSLA trading reports and provide framework-based guidance.

IMPORTANT RULES:
1. Never give specific "buy at $X" or "sell at $Y" advice
2. Always frame guidance in terms of the trading framework (Traffic Light System, position sizing rules)
3. Be helpful but remind users that this is educational, not financial advice
4. Help users calculate position sizes based on their settings
5. Explain concepts clearly (BX-Trender, SMI, gamma, Master Eject, etc.)
6. Keep responses concise and actionable
7. Reference specific data from the current report when answering questions

`;

  // Add trading rulebook if available
  if (tradingRulebook) {
    context += `=== TRADING RULEBOOK ===
${tradingRulebook}
=== END RULEBOOK ===

`;
  }

  if (report) {
    const data = report.extracted_data as ReportData;

    context += `=== CURRENT REPORT (${report.report_date}) ===

MODE & STATUS:
- Current Mode: ${data.mode?.current?.toUpperCase() || "Unknown"} (${data.mode?.label || ""})
- Mode Summary: ${data.mode?.summary || "No summary available"}
- Position Stance: ${data.position?.current_stance || "See report for details"}
- Size Recommendation: ${data.position?.size_recommendation || "Partial"}
- Daily Cap for this mode: ${data.position?.daily_cap_pct || 25}%

PRICE DATA:
- TSLA Close: $${data.price?.close || 0}
- Daily Change: ${data.price?.change_pct || 0}%
${data.price?.range ? `- Day Range: $${data.price.range.low} - $${data.price.range.high}` : ""}

CRITICAL LEVELS:
- Master Eject (EXIT if broken): $${data.master_eject?.price || 0}
- Entry Quality Score: ${data.entry_quality?.score || 0}/5

`;

    // Add alerts/levels
    if (data.alerts && data.alerts.length > 0) {
      context += `KEY PRICE LEVELS:\n`;

      const upsideAlerts = data.alerts.filter(a => a.type === "upside");
      const downsideAlerts = data.alerts.filter(a => a.type === "downside");

      if (upsideAlerts.length > 0) {
        context += `\nUpside Targets:\n`;
        upsideAlerts.forEach(alert => {
          context += `- $${alert.price} (${alert.level_name}): ${alert.action || ""} - ${alert.reason || ""}\n`;
        });
      }

      if (downsideAlerts.length > 0) {
        context += `\nDownside Supports:\n`;
        downsideAlerts.forEach(alert => {
          context += `- $${alert.price} (${alert.level_name}): ${alert.action || ""} - ${alert.reason || ""}\n`;
        });
      }
      context += `\n`;
    }

    // Add technicals if available
    if (data.technicals) {
      context += `TECHNICAL INDICATORS:\n`;
      if (data.technicals.bx_trender) {
        context += `- BX-Trender: Daily=${data.technicals.bx_trender.daily}, Weekly=${data.technicals.bx_trender.weekly}, Monthly=${data.technicals.bx_trender.monthly}\n`;
      }
      if (data.technicals.smi) {
        context += `- SMI: ${data.technicals.smi.value} (${data.technicals.smi.signal})\n`;
      }
      if (data.technicals.ema_status) {
        context += `- EMA Status: ${data.technicals.ema_status}\n`;
      }
      context += `\n`;
    }

    // Add QQQ context if available
    if (data.qqq_status) {
      context += `QQQ MARKET CONTEXT:\n${data.qqq_status}\n\n`;
    }

    context += `=== END REPORT ===\n\n`;
  } else {
    context += `NOTE: No report data available yet. Help the user with general framework questions based on the rulebook.\n\n`;
  }

  if (settings) {
    const portfolioDisplay = settings.portfolio_size_exact
      ? `$${settings.portfolio_size_exact.toLocaleString()}`
      : settings.portfolio_size?.replace("_", "-").replace("k", "K") || "Not set";

    const dailyCap = settings.daily_cap_pct || 10;
    const dailyBudget = settings.portfolio_size_exact
      ? `$${(settings.portfolio_size_exact * dailyCap / 100).toLocaleString()}`
      : "Not calculated";

    context += `USER'S TRADING SETTINGS:
- Portfolio Size: ${portfolioDisplay}
- User's Daily Cap Setting: ${dailyCap}% (${dailyBudget} daily budget)
- Risk Tolerance: ${settings.risk_tolerance || "Moderate"}
- Per-Trade Limit: ${settings.per_trade_limit_pct || 2}%
- Options Cap: ${settings.options_cap_pct || 20}%

`;
  }

  context += `When calculating position sizes, use the user's portfolio size and the current mode's daily cap percentage. Show your math clearly. Reference specific prices and levels from the report when relevant.`;

  return context;
}
