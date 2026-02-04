import { createServiceClient } from "@/lib/supabase/server";
import { templates, type TweetTemplateType } from "./templates";

export interface TweetDraftInput {
  date: string;
  type: TweetTemplateType;
  content: string;
}

interface TemplateData {
  [key: string]: string | number;
}

const MAX_TWEET_LENGTH = 4000; // X premium allows longer posts

export async function generateTweetDrafts(date?: string): Promise<TweetDraftInput[]> {
  // Use Chicago timezone for "today"
  const targetDate = date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  console.log(`[Tweet Generator] Target date: ${targetDate}, input date: ${date}`);
  const supabase = await createServiceClient();

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("extracted_data, report_date")
    .eq("report_date", targetDate)
    .single();

  if (reportError || !report) {
    throw new Error(`Report not found for ${targetDate}`);
  }

  const extracted = report.extracted_data as any;
  const drafts: TweetDraftInput[] = [];

  // Mode tweet - always generate
  const modeTweet = buildModeTweet(targetDate, extracted);
  if (modeTweet) drafts.push({ date: targetDate, type: "mode", content: modeTweet });

  // Level tweet - from key levels
  const levelTweet = buildLevelTweet(targetDate, extracted);
  if (levelTweet) drafts.push({ date: targetDate, type: "level", content: levelTweet });

  // Key level tweet
  const keyLevelTweet = buildKeyLevelTweet(targetDate, extracted);
  if (keyLevelTweet) drafts.push({ date: targetDate, type: "keyLevel", content: keyLevelTweet });

  return drafts.slice(0, 3);
}

function buildModeTweet(date: string, extracted: any): string | null {
  const mode = String(extracted?.mode?.current || "YELLOW").toLowerCase();
  const dailyCap = extracted?.position?.daily_cap_pct ?? extracted?.mode?.daily_cap ?? 15;
  const modeReason = extracted?.mode?.summary || "market conditions warrant caution";

  const data: TemplateData = {
    mode,
    daily_cap: Number(dailyCap).toFixed(0),
    intraday_move_pct: "TBD",
    mode_reason: modeReason,
  };

  return renderTemplate("mode", data);
}

function buildLevelTweet(date: string, extracted: any): string | null {
  const keyLevels = extracted?.key_levels || {};
  const gammaStrike = keyLevels.gamma_strike;
  
  if (!gammaStrike) return null;

  const data: TemplateData = {
    level_name: "gamma strike",
    level_price: Number(gammaStrike).toFixed(2),
    level_result: "is today's pivot",
    level_emoji: "📍",
    level_action: "action expected near",
    actual_price: Number(gammaStrike).toFixed(2),
  };

  return renderTemplate("level", data);
}

function buildKeyLevelTweet(date: string, extracted: any): string | null {
  const keyLevels = extracted?.key_levels || {};
  const keyCandidates: Array<{ name: string; price?: number | null }> = [
    { name: "put wall", price: keyLevels.put_wall },
    { name: "call wall", price: keyLevels.call_wall },
    { name: "hedge wall", price: keyLevels.hedge_wall },
  ];

  const available = keyCandidates.find(k => typeof k.price === "number" && !Number.isNaN(k.price));
  if (!available || !available.price) return null;

  const levelPrice = Number(available.price);

  const data: TemplateData = {
    key_level_name: available.name,
    key_level_price: levelPrice.toFixed(2),
    key_level_result: "is the key level to watch",
  };

  return renderTemplate("keyLevel", data);
}

function renderTemplate(type: TweetTemplateType, data: TemplateData): string {
  const options = templates[type];
  const shuffled = [...options].sort(() => Math.random() - 0.5);

  for (const template of shuffled) {
    const filled = fillTemplate(template, data).trim();
    if (filled.length <= MAX_TWEET_LENGTH) return filled;
  }

  const fallback = fillTemplate(options[0], data).trim();
  return fallback.length <= MAX_TWEET_LENGTH
    ? fallback
    : fallback.slice(0, MAX_TWEET_LENGTH - 3) + "...";
}

function fillTemplate(template: string, data: TemplateData): string {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => String(data[key] ?? ""));
}
