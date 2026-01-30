import {
  WeeklyReviewData,
  TimeframeData,
  WeeklyCandle,
  ThesisCheck,
  WeeklyLessons,
  Scenario,
  WeeklyKeyLevel,
  TrafficLightMode,
  TierSignal,
  ThesisStatus,
  GammaShifts,
  ParsedWeeklyReview,
} from "@/types/weekly-review";
import matter from "gray-matter";

export const WEEKLY_PARSER_VERSION = "1.0.0";

interface WeeklyFrontmatter {
  week_start?: string;
  week_end?: string;
  mode?: string;
  mode_guidance?: string;
  daily_cap_pct?: number;

  // Candle data
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  change_dollars?: number;
  change_pct?: number;

  // Timeframe signals
  monthly_signal?: string;
  weekly_signal?: string;
  daily_signal?: string;

  // Thesis
  thesis_status?: string;
  supporting_points?: string[];
  concerning_points?: string[];

  // Scenarios
  scenarios?: {
    bull?: { probability: number; trigger: string; response: string };
    base?: { probability: number; trigger: string; response: string };
    bear?: { probability: number; trigger: string; response: string };
  };

  // Levels
  levels?: Array<{
    price: number;
    name: string;
    emoji?: string;
    description?: string;
  }>;
}

export function parseWeeklyReview(markdown: string): ParsedWeeklyReview {
  const warnings: string[] = [];

  // Try to parse YAML frontmatter
  let frontmatter: WeeklyFrontmatter | null = null;
  let content = markdown;

  try {
    const parsed = matter(markdown);
    if (parsed.data && Object.keys(parsed.data).length > 0) {
      frontmatter = parsed.data as WeeklyFrontmatter;
      content = parsed.content;
    }
  } catch {
    warnings.push("Failed to parse YAML frontmatter");
  }

  // Extract data combining frontmatter and markdown parsing
  const extracted_data = extractWeeklyData(content, frontmatter, warnings);

  return {
    raw_markdown: markdown,
    extracted_data,
    parser_warnings: warnings,
  };
}

function parseMode(modeStr: string | undefined): TrafficLightMode {
  if (!modeStr) return "yellow";
  const lower = modeStr.toLowerCase();
  if (lower.includes("green")) return "green";
  if (lower.includes("orange")) return "orange";
  if (lower.includes("red")) return "red";
  return "yellow";
}

function parseSignal(signalStr: string | undefined): TierSignal {
  if (!signalStr) return "yellow";
  const lower = signalStr.toLowerCase();
  if (lower.includes("🟢") || lower.includes("green")) return "green";
  if (lower.includes("🟠") || lower.includes("orange")) return "orange";
  if (lower.includes("🔴") || lower.includes("red")) return "red";
  return "yellow";
}

function parseThesisStatus(statusStr: string | undefined): ThesisStatus {
  if (!statusStr) return "intact";
  const lower = statusStr.toLowerCase();
  if (lower.includes("strengthening")) return "strengthening";
  if (lower.includes("weakening")) return "weakening";
  if (lower.includes("review")) return "under_review";
  return "intact";
}

function extractWeeklyData(
  markdown: string,
  fm: WeeklyFrontmatter | null,
  warnings: string[]
): WeeklyReviewData {
  // Week dates
  const weekDates = extractWeekDates(markdown, fm);

  // Mode
  const mode = fm?.mode ? parseMode(fm.mode) : extractModeFromMarkdown(markdown);
  const modeGuidance = fm?.mode_guidance || extractModeGuidance(markdown, mode);
  const dailyCapPct = fm?.daily_cap_pct || getModeDefaultCap(mode);

  // Candle data
  const candle = extractCandle(markdown, fm, warnings);

  // Timeframes
  const monthly = extractTimeframe(markdown, "monthly", fm);
  const weekly = extractTimeframe(markdown, "weekly", fm);
  const daily = extractTimeframe(markdown, "daily", fm);

  // Confluence
  const confluence = extractConfluence(markdown, monthly, weekly, daily);

  // Narrative sections
  const what_happened = extractSection(markdown, "What Happened", "What We Learned");
  const lessons = extractLessons(markdown);
  const thesis = extractThesis(markdown, fm);
  const looking_ahead = extractSection(markdown, "Looking Ahead", null);

  // Levels and scenarios
  const key_levels = extractLevels(markdown, fm);
  const scenarios = extractScenarios(markdown, fm);

  // Optional gamma
  const gamma_shifts = extractGammaShifts(markdown);

  return {
    week_start: weekDates.start,
    week_end: weekDates.end,
    mode,
    mode_guidance: modeGuidance,
    daily_cap_pct: dailyCapPct,
    candle,
    monthly,
    weekly,
    daily,
    confluence,
    what_happened,
    lessons,
    thesis,
    looking_ahead,
    key_levels,
    scenarios,
    gamma_shifts,
  };
}

function extractWeekDates(
  markdown: string,
  fm: WeeklyFrontmatter | null
): { start: string; end: string } {
  if (fm?.week_start && fm?.week_end) {
    return { start: fm.week_start, end: fm.week_end };
  }

  // Try to extract from header: "Week of January 27 – 31, 2026"
  const datePattern = /Week\s+of\s+(\w+)\s+(\d+)\s*[–-]\s*(\d+),?\s*(\d{4})/i;
  const match = markdown.match(datePattern);
  
  if (match) {
    const month = match[1];
    const startDay = parseInt(match[2]);
    const endDay = parseInt(match[3]);
    const year = parseInt(match[4]);
    
    const monthNum = new Date(`${month} 1, ${year}`).getMonth();
    const startDate = new Date(year, monthNum, startDay);
    const endDate = new Date(year, monthNum, endDay);
    
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  }

  // Default to current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    start: monday.toISOString().split("T")[0],
    end: friday.toISOString().split("T")[0],
  };
}

function extractModeFromMarkdown(markdown: string): TrafficLightMode {
  // Look for mode banner: "🟠 ORANGE MODE"
  const modePattern = /([🟢🟡🟠🔴])\s*(GREEN|YELLOW|ORANGE|RED)\s*MODE/i;
  const match = markdown.match(modePattern);
  if (match) {
    return match[2].toLowerCase() as TrafficLightMode;
  }
  return "yellow";
}

function extractModeGuidance(markdown: string, mode: TrafficLightMode): string {
  const defaultGuidance: Record<TrafficLightMode, string> = {
    green: "Full steam ahead — 25% daily cap",
    yellow: "Proceed with measured optimism — 15% daily cap",
    orange: "Structure stressed, controlled entries only — 10% daily cap",
    red: "Defensive mode, nibbles only — 5% daily cap",
  };

  // Try to extract guidance from mode banner
  const guidancePattern = new RegExp(
    `${mode.toUpperCase()}\\s*MODE[^]*?([^\\n]+daily\\s*cap[^\\n]*)`,
    "i"
  );
  const match = markdown.match(guidancePattern);
  
  return match ? match[1].trim() : defaultGuidance[mode];
}

function getModeDefaultCap(mode: TrafficLightMode): number {
  const caps: Record<TrafficLightMode, number> = {
    green: 25,
    yellow: 15,
    orange: 10,
    red: 5,
  };
  return caps[mode];
}

function extractCandle(
  markdown: string,
  fm: WeeklyFrontmatter | null,
  warnings: string[]
): WeeklyCandle {
  if (fm?.open && fm?.high && fm?.low && fm?.close) {
    const change = fm.change_dollars || fm.close - fm.open;
    const changePct = fm.change_pct || (change / fm.open) * 100;
    return {
      open: fm.open,
      high: fm.high,
      low: fm.low,
      close: fm.close,
      change_dollars: change,
      change_pct: changePct,
    };
  }

  // Extract from markdown stats: Open: $448, High: $452, etc.
  const statPattern = (label: string): RegExp =>
    new RegExp(`${label}[:\\s]*\\$?([\\d.]+)`, "i");

  const open = parseFloat(markdown.match(statPattern("Open"))?.[1] || "0");
  const high = parseFloat(markdown.match(statPattern("High"))?.[1] || "0");
  const low = parseFloat(markdown.match(statPattern("Low"))?.[1] || "0");
  const close = parseFloat(markdown.match(statPattern("Close"))?.[1] || "0");

  // Extract change
  const changeMatch = markdown.match(/Change[:\s]*([+-]?[\d.]+)%/i);
  const changePct = changeMatch ? parseFloat(changeMatch[1]) : 0;
  const change = open > 0 ? (changePct / 100) * open : 0;

  if (open === 0 || close === 0) {
    warnings.push("Could not extract complete candle data");
  }

  return {
    open,
    high,
    low,
    close,
    change_dollars: change,
    change_pct: changePct,
  };
}

function extractTimeframe(
  markdown: string,
  timeframe: "monthly" | "weekly" | "daily",
  fm: WeeklyFrontmatter | null
): TimeframeData {
  // Get signal from frontmatter or markdown
  const signalKey = `${timeframe}_signal` as keyof WeeklyFrontmatter;
  const signal = fm?.[signalKey]
    ? parseSignal(fm[signalKey] as string)
    : extractTimeframeSignal(markdown, timeframe);

  // Extract timeframe card content
  const cardPattern = new RegExp(
    `${timeframe}[\\s\\S]*?BX-Trender[\\s\\S]*?([\\s\\S]*?)(?=timeframe-card|$)`,
    "i"
  );
  const cardMatch = markdown.match(cardPattern);

  // Parse BX-Trender
  const bxPattern = new RegExp(
    `${timeframe}[\\s\\S]*?BX-Trender[^|]*\\|[^|]*([^|]+)`,
    "i"
  );
  const bxMatch = markdown.match(bxPattern);
  const bxText = bxMatch?.[1]?.trim() || "";
  const bxColor = bxText.toLowerCase().includes("green") ? "green" : "red";
  const bxPattern2 = bxText.match(/(HH|HL|LL|LH)/i);
  const bxTrenderPattern = bxPattern2?.[1]?.toUpperCase() || "—";

  // Parse structure
  const structurePattern = new RegExp(
    `${timeframe}[\\s\\S]*?Structure[^|]*\\|[^|]*([^|]+)`,
    "i"
  );
  const structureMatch = markdown.match(structurePattern);
  const structure = structureMatch?.[1]?.trim() || "—";

  // Parse EMA statuses
  const ema9Status = extractEmaStatus(markdown, timeframe, "9");
  const ema21Status = extractEmaStatus(markdown, timeframe, "21");
  const ema13Status = timeframe === "weekly" ? extractEmaStatus(markdown, timeframe, "13") : undefined;

  // Parse interpretation
  const interpPattern = new RegExp(
    `${timeframe}[\\s\\S]*?interpretation[^"]*"([^"]+)"`,
    "i"
  );
  const interpMatch = markdown.match(interpPattern);
  const interpretation = interpMatch?.[1]?.trim() || "";

  return {
    signal,
    bx_trender: {
      color: bxColor as "green" | "red",
      pattern: bxTrenderPattern,
    },
    structure,
    ema_9_status: ema9Status,
    ema_21_status: ema21Status,
    ...(ema13Status && { ema_13_status: ema13Status }),
    interpretation,
  };
}

function extractTimeframeSignal(
  markdown: string,
  timeframe: string
): TierSignal {
  // Look for pattern like: <span class="timeframe-signal signal-yellow">🟡 YELLOW</span>
  const signalPattern = new RegExp(
    `${timeframe}[\\s\\S]*?signal-([a-z]+)\\s*>\\s*([🟢🟡🟠🔴])`,
    "i"
  );
  const match = markdown.match(signalPattern);
  if (match) {
    return match[1].toLowerCase() as TierSignal;
  }
  return "yellow";
}

function extractEmaStatus(
  markdown: string,
  timeframe: string,
  period: string
): "above" | "below" {
  const pattern = new RegExp(
    `${timeframe}[\\s\\S]*?${period}\\s*EMA[^|]*\\|[^|]*([^|]+)`,
    "i"
  );
  const match = markdown.match(pattern);
  const text = match?.[1]?.toLowerCase() || "";
  return text.includes("below") || text.includes("⚠") ? "below" : "above";
}

function extractConfluence(
  markdown: string,
  monthly: TimeframeData,
  weekly: TimeframeData,
  daily: TimeframeData
): { reading: string; explanation: string } {
  // Try to extract from markdown
  const readingPattern = /confluence-verdict[^>]*>([^<]+)/i;
  const readingMatch = markdown.match(readingPattern);

  const explanationPattern = /confluence-explanation[^>]*>([^<]+)/i;
  const explanationMatch = markdown.match(explanationPattern);

  // Generate default if not found
  const monthlyStatus = monthly.signal === "green" || monthly.signal === "yellow" ? "✓" : "⚠️";
  const weeklyStatus = weekly.signal === "green" ? "✓" : weekly.signal === "red" ? "⚠️" : "~";
  const dailyStatus = daily.signal === "green" ? "↑" : daily.signal === "red" ? "↓" : "→";

  return {
    reading:
      readingMatch?.[1]?.trim() ||
      `Monthly ${monthlyStatus} → Weekly ${weeklyStatus} → Daily ${dailyStatus}`,
    explanation:
      explanationMatch?.[1]?.trim() ||
      "Check timeframe alignment for entry quality.",
  };
}

function extractSection(
  markdown: string,
  startMarker: string,
  endMarker: string | null
): string {
  const endPattern = endMarker ? `(?=##\\s*[^#]*${endMarker}|$)` : "(?=##|$)";
  const pattern = new RegExp(
    `##\\s*[^#]*${startMarker}[\\s\\S]*?<div[^>]*narrative[^>]*>([\\s\\S]*?)<\\/div>`,
    "i"
  );
  const match = markdown.match(pattern);
  
  if (match) {
    // Clean up HTML and convert to readable text
    return match[1]
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<span[^>]*>/gi, "")
      .replace(/<\/span>/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  // Fallback: try markdown section
  const mdPattern = new RegExp(
    `##\\s*[📖📝💡👀]*\\s*${startMarker}[\\s\\S]*?(?=##|$)`,
    "i"
  );
  const mdMatch = markdown.match(mdPattern);
  if (mdMatch) {
    return mdMatch[0]
      .replace(/##\s*[^\n]+\n/, "")
      .trim();
  }

  return "";
}

function extractLessons(markdown: string): WeeklyLessons {
  const extractList = (marker: string): string[] => {
    const pattern = new RegExp(`${marker}[\\s\\S]*?<ul>([\\s\\S]*?)<\\/ul>`, "i");
    const match = markdown.match(pattern);
    if (match) {
      return match[1]
        .split(/<li[^>]*>/i)
        .slice(1)
        .map((item) => item.replace(/<\/li>.*/gi, "").trim())
        .filter(Boolean);
    }

    // Fallback: markdown bullets
    const mdPattern = new RegExp(`${marker}[\\s\\S]*?((?:\\n-[^\\n]+)+)`, "i");
    const mdMatch = markdown.match(mdPattern);
    if (mdMatch) {
      return mdMatch[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("-"))
        .map((line) => line.replace(/^-\s*/, "").trim());
    }

    return [];
  };

  return {
    what_worked: extractList("What Worked"),
    what_didnt: extractList("What Didn't"),
    lessons_forward: extractList("Lessons"),
  };
}

function extractThesis(
  markdown: string,
  fm: WeeklyFrontmatter | null
): ThesisCheck {
  const status = fm?.thesis_status
    ? parseThesisStatus(fm.thesis_status)
    : extractThesisStatusFromMarkdown(markdown);

  const supporting = fm?.supporting_points || extractBulletList(markdown, "Supporting");
  const concerning = fm?.concerning_points || extractBulletList(markdown, "Concerning");

  // Extract narrative
  const narrativePattern = /Thesis\s*Check[\s\S]*?<div[^>]*narrative[^>]*>([\s\S]*?)<\/div>/i;
  const narrativeMatch = markdown.match(narrativePattern);
  const narrative = narrativeMatch?.[1]
    ?.replace(/<[^>]+>/g, "")
    .trim() || "";

  return {
    status,
    supporting_points: supporting,
    concerning_points: concerning,
    narrative,
  };
}

function extractThesisStatusFromMarkdown(markdown: string): ThesisStatus {
  const statusPattern = /THESIS\s+(INTACT|STRENGTHENING|WEAKENING|UNDER REVIEW)/i;
  const match = markdown.match(statusPattern);
  if (match) {
    return parseThesisStatus(match[1]);
  }
  return "intact";
}

function extractBulletList(markdown: string, marker: string): string[] {
  const pattern = new RegExp(`${marker}[\\s\\S]*?((?:\\n[•\\-]\\s*[^\\n]+)+)`, "i");
  const match = markdown.match(pattern);
  if (match) {
    return match[1]
      .split("\n")
      .filter((line) => line.trim().match(/^[•\-]/))
      .map((line) => line.replace(/^[•\-]\s*/, "").trim());
  }
  return [];
}

function extractLevels(
  markdown: string,
  fm: WeeklyFrontmatter | null
): WeeklyKeyLevel[] {
  if (fm?.levels) {
    return fm.levels.map((l) => ({
      price: l.price,
      name: l.name,
      emoji: l.emoji || "📍",
      description: l.description || "",
    }));
  }

  // Extract from markdown table or list
  const levels: WeeklyKeyLevel[] = [];
  const levelPattern = /\$(\d+)\s*([⚡📈⏸️🛡️❌📍])\s*([^—\n]+)(?:—\s*([^\n]+))?/g;
  let match;

  while ((match = levelPattern.exec(markdown)) !== null) {
    levels.push({
      price: parseFloat(match[1]),
      emoji: match[2],
      name: match[3].trim(),
      description: match[4]?.trim() || "",
    });
  }

  return levels;
}

function extractScenarios(
  markdown: string,
  fm: WeeklyFrontmatter | null
): Scenario[] {
  if (fm?.scenarios) {
    const scenarios: Scenario[] = [];
    if (fm.scenarios.bull) {
      scenarios.push({
        type: "bull",
        probability: fm.scenarios.bull.probability,
        trigger: fm.scenarios.bull.trigger,
        response: fm.scenarios.bull.response,
      });
    }
    if (fm.scenarios.base) {
      scenarios.push({
        type: "base",
        probability: fm.scenarios.base.probability,
        trigger: fm.scenarios.base.trigger,
        response: fm.scenarios.base.response,
      });
    }
    if (fm.scenarios.bear) {
      scenarios.push({
        type: "bear",
        probability: fm.scenarios.bear.probability,
        trigger: fm.scenarios.bear.trigger,
        response: fm.scenarios.bear.response,
      });
    }
    return scenarios;
  }

  // Extract from markdown
  const scenarios: Scenario[] = [];
  
  const scenarioPattern = /([🐂⚖️🐻])\s*(\d+)%\s*[—-]\s*([^,\n]+),?\s*([^\n]*)/g;
  let match;

  while ((match = scenarioPattern.exec(markdown)) !== null) {
    const emoji = match[1];
    const type = emoji === "🐂" ? "bull" : emoji === "🐻" ? "bear" : "base";
    scenarios.push({
      type: type as "bull" | "base" | "bear",
      probability: parseInt(match[2]),
      trigger: match[3].trim(),
      response: match[4]?.trim() || "",
    });
  }

  return scenarios;
}

function extractGammaShifts(markdown: string): GammaShifts | undefined {
  // Look for gamma section
  const gammaSection = markdown.match(/Gamma\s*Context[\s\S]*?(?=##|$)/i);
  if (!gammaSection) return undefined;

  const extractShift = (
    label: string
  ): { start: number; end: number } | null => {
    const pattern = new RegExp(`${label}[:\\s]*\\$?(\\d+)\\s*[→→]\\s*\\$?(\\d+)`, "i");
    const match = gammaSection[0].match(pattern);
    if (match) {
      return { start: parseFloat(match[1]), end: parseFloat(match[2]) };
    }
    return null;
  };

  const callWall = extractShift("Call Wall");
  const gammaStrike = extractShift("Gamma Strike");
  const hedgeWall = extractShift("Hedge Wall");
  const putWall = extractShift("Put Wall");

  if (!callWall && !gammaStrike && !hedgeWall && !putWall) {
    return undefined;
  }

  // Extract interpretation
  const interpPattern = /"([^"]+)"/;
  const interpMatch = gammaSection[0].match(interpPattern);

  return {
    call_wall: callWall || { start: 0, end: 0 },
    gamma_strike: gammaStrike || { start: 0, end: 0 },
    hedge_wall: hedgeWall || { start: 0, end: 0 },
    put_wall: putWall || { start: 0, end: 0 },
    interpretation: interpMatch?.[1] || "",
  };
}

export function validateWeeklyReview(data: WeeklyReviewData): string[] {
  const errors: string[] = [];

  if (!data.week_start || !data.week_end) {
    errors.push("Week dates are required");
  }

  if (data.candle.close <= 0) {
    errors.push("Valid candle close price is required");
  }

  if (!data.what_happened) {
    errors.push("'What Happened' narrative is required");
  }

  return errors;
}
