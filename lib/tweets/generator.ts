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

function getChicagoDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

export async function generateTweetDrafts(date?: string): Promise<TweetDraftInput[]> {
  const targetDate = date || getChicagoDate();
  console.log(`[Tweet Generator] Target date: ${targetDate}`);
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

  // 1. Mode + Posture tweet
  const modeTweet = buildModeTweet(targetDate, extracted);
  if (modeTweet) drafts.push({ date: targetDate, type: "mode", content: modeTweet });

  // 2. Gamma Strike level tweet
  const levelTweet = buildLevelTweet(targetDate, extracted);
  if (levelTweet) drafts.push({ date: targetDate, type: "level", content: levelTweet });

  // 3. Key level tweet (put/call/hedge wall)
  const keyLevelTweet = buildKeyLevelTweet(targetDate, extracted);
  if (keyLevelTweet) drafts.push({ date: targetDate, type: "keyLevel", content: keyLevelTweet });

  // 4. HIRO tweet
  const hiroTweet = buildHiroTweet(targetDate, extracted);
  if (hiroTweet) drafts.push({ date: targetDate, type: "hiro", content: hiroTweet });

  // 5. Scenarios tweet
  const scenarioTweet = buildScenarioTweet(targetDate, extracted);
  if (scenarioTweet) drafts.push({ date: targetDate, type: "scenario", content: scenarioTweet });

  return drafts.slice(0, 5);
}

function buildModeTweet(date: string, extracted: any): string | null {
  const mode = String(extracted?.mode?.current || "YELLOW").toLowerCase();
  const dailyCap = extracted?.position?.daily_cap_pct ?? extracted?.mode?.daily_cap ?? 15;
  const modeReason = extracted?.mode?.summary || "market conditions warrant caution";
  const posture = extracted?.positioning?.posture || extracted?.position?.posture || "cautiously positioned";

  const data: TemplateData = {
    mode,
    daily_cap: Number(dailyCap).toFixed(0),
    mode_reason: modeReason,
    posture: posture.toLowerCase(),
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

function buildHiroTweet(date: string, extracted: any): string | null {
  const hiro = extracted?.hiro;
  if (!hiro) return null;

  const reading = hiro.reading ?? hiro.value ?? null;
  const context = hiro.context || hiro.interpretation || "institutional flow being monitored";

  if (reading === null) return null;

  // Format reading (could be number or string)
  const readingStr = typeof reading === 'number' 
    ? `${reading > 0 ? '+' : ''}${reading}%`
    : String(reading);

  const data: TemplateData = {
    hiro_reading: readingStr,
    hiro_context: context,
  };

  return renderTemplate("hiro", data);
}

function buildScenarioTweet(date: string, extracted: any): string | null {
  const scenarios = extracted?.scenarios;
  if (!scenarios) return null;

  const bull = scenarios.bull || {};
  const base = scenarios.base || {};
  const bear = scenarios.bear || {};

  // Need at least base case
  if (!base.trigger && !base.target && !bull.trigger && !bear.trigger) return null;

  const data: TemplateData = {
    bull_trigger: bull.trigger || "break above resistance",
    bull_target: bull.target || "continuation higher",
    base_trigger: base.trigger || "hold key levels",
    base_target: base.target || "range-bound action",
    bear_trigger: bear.trigger || "break below support",
    bear_target: bear.target || "test lower levels",
  };

  return renderTemplate("scenario", data);
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
