import { format, subDays } from "date-fns";
import { createServiceClient } from "@/lib/supabase/server";
import { generateEODAccuracyCard } from "@/lib/content/eod-accuracy-card";
import { templates, type TweetTemplateType } from "./templates";
import type { LevelResult } from "@/lib/accuracy/compareLevels";

export interface TweetDraftInput {
  date: string;
  type: TweetTemplateType;
  content: string;
}

interface TemplateData {
  [key: string]: string | number;
}

const MAX_TWEET_LENGTH = 280;

export async function generateTweetDrafts(date?: string): Promise<TweetDraftInput[]> {
  // Use provided date or today's date
  const targetDate = date || format(new Date(), "yyyy-MM-dd");
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
  const eod = await generateEODAccuracyCard(targetDate);

  if (!eod.data) {
    throw new Error(eod.error || "EOD data unavailable");
  }

  const { ohlc, results } = eod.data;

  const drafts: TweetDraftInput[] = [];

  // Generate exactly 3 tweet types: mode, level, keyLevel
  const modeTweet = buildModeRecapTweet(targetDate, extracted, ohlc);
  if (modeTweet) drafts.push({ date: targetDate, type: "mode", content: modeTweet });

  const levelTweet = buildLevelAccuracyTweet(targetDate, results);
  if (levelTweet) drafts.push({ date: targetDate, type: "level", content: levelTweet });

  const keyLevelTweet = buildKeyLevelTweet(targetDate, extracted, ohlc);
  if (keyLevelTweet) drafts.push({ date: targetDate, type: "keyLevel", content: keyLevelTweet });

  return drafts.slice(0, 3); // Ensure max 3 drafts
}

function buildLevelAccuracyTweet(date: string, results: LevelResult[]): string | null {
  if (!results || results.length === 0) return null;

  const hit = results.find(r => r.status === "hit") ||
    results.find(r => r.status === "broken") ||
    results[0];

  const levelResult = hit.status === "hit" ? "held" :
    hit.status === "broken" ? "broke" : "was not tested";

  const data: TemplateData = {
    level_name: hit.level,
    level_price: hit.price.toFixed(2),
    level_result: levelResult,
    level_emoji: hit.status === "hit" ? "✅" : hit.status === "broken" ? "📉" : "⏸️",
    level_action: hit.type === "support" ? "low" : "high",
    actual_price: (hit.actualPrice ?? hit.price).toFixed(2),
  };

  return renderTemplate("level", data);
}

function buildModeRecapTweet(date: string, extracted: any, ohlc: { open: number; high: number; low: number; close: number; }): string | null {
  const mode = String(extracted?.mode?.current || "YELLOW").toUpperCase();
  const dailyCap = extracted?.position?.daily_cap_pct ?? extracted?.mode?.daily_cap ?? 15;
  const intradayMovePct = ((ohlc.high - ohlc.low) / ohlc.open) * 100;

  const data: TemplateData = {
    mode,
    daily_cap: Number(dailyCap).toFixed(0),
    intraday_move_pct: intradayMovePct.toFixed(1),
    mode_reason: extracted?.mode?.summary || "Discipline first",
  };

  return renderTemplate("mode", data);
}

function buildScenarioTweet(date: string, extracted: any, ohlc: { high: number; low: number; close: number; }): string | null {
  const scenario = extracted?.scenarios?.base || extracted?.scenarios?.bull || extracted?.scenarios?.bear;
  const scenarioName = extracted?.scenarios?.base
    ? "Base"
    : extracted?.scenarios?.bull
      ? "Bull"
      : extracted?.scenarios?.bear
        ? "Bear"
        : "Base";

  const scenarioPrediction = scenario
    ? `${scenario.trigger} → ${scenario.target}`
    : buildFallbackScenario(extracted);

  const data: TemplateData = {
    scenario_name: scenarioName,
    scenario_prediction: scenarioPrediction,
    high: ohlc.high.toFixed(2),
    low: ohlc.low.toFixed(2),
    close: ohlc.close.toFixed(2),
  };

  return renderTemplate("scenario", data);
}

function buildKeyLevelTweet(date: string, extracted: any, ohlc: { high: number; low: number; close: number; }): string | null {
  const keyLevels = extracted?.key_levels || {};
  const keyCandidates: Array<{ name: string; price?: number | null }> = [
    { name: "Gamma Strike", price: keyLevels.gamma_strike },
    { name: "Put Wall", price: keyLevels.put_wall },
    { name: "Call Wall", price: keyLevels.call_wall },
    { name: "Hedge Wall", price: keyLevels.hedge_wall },
    { name: "Pause Zone", price: keyLevels.pause_zone },
  ];

  const available = keyCandidates.find(k => typeof k.price === "number" && !Number.isNaN(k.price));
  if (!available || !available.price) return null;

  const levelPrice = Number(available.price);
  const tested = ohlc.low <= levelPrice && ohlc.high >= levelPrice;
  const result = tested
    ? (ohlc.close >= levelPrice
        ? `bounced ${(((ohlc.close - levelPrice) / levelPrice) * 100).toFixed(1)}%`
        : `rejected ${(((levelPrice - ohlc.close) / levelPrice) * 100).toFixed(1)}%`)
    : (ohlc.high < levelPrice ? "never reached" : "held above");

  const data: TemplateData = {
    key_level_name: available.name,
    key_level_price: levelPrice.toFixed(2),
    key_level_result: result,
  };

  return renderTemplate("keyLevel", data);
}

function buildFallbackScenario(extracted: any): string {
  const keyLevels = extracted?.key_levels || {};
  if (keyLevels.put_wall && keyLevels.call_wall) {
    return `Range between $${Number(keyLevels.put_wall).toFixed(2)}–$${Number(keyLevels.call_wall).toFixed(2)}`;
  }
  return "Structured action around key levels";
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
