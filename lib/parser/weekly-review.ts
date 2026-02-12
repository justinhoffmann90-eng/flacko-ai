import {
  WeeklyReviewData,
  TimeframeData,
  WeeklyCandle,
  ThesisCheck,
  WeeklyLessons,
  Scenario,
  WeeklyKeyLevel,
  WeeklyKeyLevelV2,
  CatalystV2,
  TrafficLightMode,
  TierSignal,
  ThesisStatus,
  GammaShifts,
  ParsedWeeklyReview,
  Catalyst,
} from "@/types/weekly-review";
import matter from "gray-matter";

export const WEEKLY_PARSER_VERSION = "3.0.0";

// v2.0 JSON block interface
interface WeeklyReviewJSON {
  week_start: string;
  week_end: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  change_pct?: number;
  weekly_candle?: string;
  mode_start?: string;
  mode_end?: string;
  mode_trajectory?: string;
  weekly_9ema?: number;
  weekly_13ema?: number;
  weekly_21ema?: number;
  ema_extension_pct?: number;
  weekly_bx_color?: string;
  weekly_bx_pattern?: string;
  weekly_bx_state?: string;
  weekly_bx_histogram?: number;
  correction_stage?: string;
  master_eject_step?: number;
  call_alert_score?: number;
  call_alert_setups?: Array<{name: string; status: string; result: string; pnl_pct: number}>;
  call_alert_running_win_rate?: number | null;
  daily_scores?: number[];
  daily_system_values?: string[];
  system_value_days?: number;
  weekly_avg_score?: number;
  weekly_grade?: string;
  buy_levels_tested?: number;
  buy_levels_held?: number;
  trim_levels_tested?: number;
  trim_levels_effective?: number;
  slow_zone_triggered?: boolean;
  master_eject?: number;
  master_eject_distance_pct?: number;
  thesis_status?: string;
  next_week_mode?: string;
  next_week_bias?: string;
  key_levels_next_week?: WeeklyKeyLevelV2[];
  qqq_verdict?: string;
  hiro_eow?: number;
  catalysts?: CatalystV2[];
}

interface WeeklyFrontmatter {
  week_start?: string;
  week_end?: string;
  mode?: string;
  mode_trend?: string;
  mode_guidance?: string;
  daily_cap_pct?: number;
  current_price?: number;

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

  // Try to parse v2.0 JSON block first: <!-- WEEKLY_REVIEW_DATA ... -->
  let jsonData: WeeklyReviewJSON | null = null;
  const jsonMatch = markdown.match(/<!--\s*WEEKLY_REVIEW_DATA\s*\n([\s\S]*?)\n-->/);
  if (jsonMatch) {
    try {
      jsonData = JSON.parse(jsonMatch[1]);
    } catch (e) {
      warnings.push("Failed to parse WEEKLY_REVIEW_DATA JSON block");
    }
  }

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

  // Extract data combining JSON, frontmatter and markdown parsing
  const extracted_data = extractWeeklyData(content, frontmatter, jsonData, warnings);

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
  json: WeeklyReviewJSON | null,
  warnings: string[]
): WeeklyReviewData {
  // Week dates - prefer JSON, then frontmatter, then markdown
  const weekDates = json?.week_start && json?.week_end
    ? { start: json.week_start, end: json.week_end }
    : extractWeekDates(markdown, fm);

  // Mode - prefer JSON
  const mode = json?.mode_end
    ? parseMode(json.mode_end)
    : (fm?.mode ? parseMode(fm.mode) : extractModeFromMarkdown(markdown));
  const modeTrend = json?.mode_trajectory || fm?.mode_trend || extractModeTrend(markdown);
  const modeGuidance = fm?.mode_guidance || extractModeGuidance(markdown, mode);
  const dailyCapPct = fm?.daily_cap_pct || getModeDefaultCap(mode);
  const currentPrice = json?.close || fm?.current_price || extractCurrentPrice(markdown);

  // Candle data - prefer JSON
  const candle = json?.open && json?.close
    ? {
        open: json.open,
        high: json.high || json.open,
        low: json.low || json.close,
        close: json.close,
        change_dollars: json.close - json.open,
        change_pct: json.change_pct || ((json.close - json.open) / json.open) * 100,
      }
    : extractCandle(markdown, fm, warnings);

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

  // Catalysts
  const catalysts = extractCatalysts(markdown);
  
  // Flacko AI's Take / "So What"
  const flacko_take = extractFlackoTake(markdown);

  // Optional gamma
  const gamma_shifts = extractGammaShifts(markdown);

  // Build result with v1.0 fields
  const result: WeeklyReviewData = {
    week_start: weekDates.start,
    week_end: weekDates.end,
    mode,
    mode_trend: modeTrend,
    mode_guidance: modeGuidance,
    daily_cap_pct: dailyCapPct,
    current_price: currentPrice,
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
    catalysts,
    flacko_take,
    gamma_shifts,
  };

  // Add v2.0 fields from JSON if present
  if (json) {
    // OHLC
    result.open = json.open;
    result.high = json.high;
    result.low = json.low;
    result.close = json.close;
    result.change_pct = json.change_pct;
    result.weekly_candle = json.weekly_candle;

    // Mode tracking
    result.mode_start = json.mode_start ? parseMode(json.mode_start) : undefined;
    result.mode_end = json.mode_end ? parseMode(json.mode_end) : undefined;
    result.mode_trajectory = json.mode_trajectory;

    // EMA levels
    result.weekly_9ema = json.weekly_9ema;
    result.weekly_13ema = json.weekly_13ema;
    result.weekly_21ema = json.weekly_21ema;
    result.ema_extension_pct = json.ema_extension_pct;

    // BX-Trender
    result.weekly_bx_color = json.weekly_bx_color;
    result.weekly_bx_pattern = json.weekly_bx_pattern;

    // v3.0+ BX-Trender state
    result.weekly_bx_state = json.weekly_bx_state;
    result.weekly_bx_histogram = json.weekly_bx_histogram;

    // Correction tracking
    result.correction_stage = json.correction_stage;

    // Daily assessment scores
    result.daily_scores = json.daily_scores;
    result.daily_system_values = json.daily_system_values;
    result.system_value_days = json.system_value_days;
    result.weekly_avg_score = json.weekly_avg_score;
    result.weekly_grade = json.weekly_grade;

    // Level testing
    result.buy_levels_tested = json.buy_levels_tested;
    result.buy_levels_held = json.buy_levels_held;
    result.trim_levels_tested = json.trim_levels_tested;
    result.trim_levels_effective = json.trim_levels_effective;
    result.slow_zone_triggered = json.slow_zone_triggered;

    // Kill Leverage / Master Eject
    result.master_eject = json.master_eject;
    result.master_eject_step = json.master_eject_step;
    result.master_eject_distance_pct = json.master_eject_distance_pct;

    // Call Options grading
    result.call_alert_score = json.call_alert_score;
    result.call_alert_setups = json.call_alert_setups;
    result.call_alert_running_win_rate = json.call_alert_running_win_rate;

    // Thesis
    result.thesis_status = json.thesis_status;

    // Week ahead
    result.next_week_mode = json.next_week_mode ? parseMode(json.next_week_mode) : undefined;
    result.next_week_bias = json.next_week_bias;
    result.key_levels_next_week = json.key_levels_next_week;

    // QQQ and HIRO
    result.qqq_verdict = json.qqq_verdict;
    result.hiro_eow = json.hiro_eow;

    // Catalysts v2
    result.catalysts_v2 = json.catalysts;
  }

  return result;
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

function extractModeTrend(markdown: string): string | undefined {
  // Look for pattern: "🟠 ORANGE — Bounce Encouraging" or "MODE — Description"
  const trendPattern = /(?:GREEN|YELLOW|ORANGE|RED)\s*(?:MODE)?\s*[—-]\s*([^,\n]+)/i;
  const match = markdown.match(trendPattern);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

function extractCurrentPrice(markdown: string): number | undefined {
  // Look for "Current price: $429.64" or similar
  const pricePattern = /Current\s*(?:Price)?[:\s]*\$?([\d.]+)/i;
  const match = markdown.match(pricePattern);
  if (match) {
    return parseFloat(match[1]);
  }
  return undefined;
}

function extractCatalysts(markdown: string): Catalyst[] {
  const catalysts: Catalyst[] = [];
  
  // Look for catalyst calendar section
  const sectionPattern = /Catalyst\s*Calendar[\s\S]*?(?=##|---|\n\n\n|$)/i;
  const sectionMatch = markdown.match(sectionPattern);
  
  if (!sectionMatch) return catalysts;
  
  const section = sectionMatch[0];
  
  // Extract from markdown table: | Date | Event | Impact |
  const tableRowPattern = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|/g;
  let match;
  let isHeader = true;
  
  while ((match = tableRowPattern.exec(section)) !== null) {
    // Skip header row
    if (isHeader) {
      isHeader = false;
      continue;
    }
    // Skip separator row
    if (match[1].includes('-')) continue;
    
    const date = match[1].trim();
    const event = match[2].trim();
    const impact = match[3]?.trim() || undefined;
    
    if (date && event && !date.toLowerCase().includes('date')) {
      catalysts.push({ date, event, impact });
    }
  }
  
  return catalysts;
}

function extractFlackoTake(markdown: string): string | undefined {
  // Look for "The 'So What'" or "Flacko AI's Take" section
  const patterns = [
    /##\s*💡\s*The\s*["']?So\s*What["']?\s*[—-]?\s*Flacko\s*AI['']?s?\s*Take[\s\S]*?(?=##|---\s*\n\*|$)/i,
    /##\s*🧠?\s*Flacko\s*AI['']?s?\s*Weekly\s*Take[\s\S]*?(?=##|---\s*\n\*|$)/i,
    /##\s*Flacko\s*AI['']?s?\s*Take[\s\S]*?(?=##|---\s*\n\*|$)/i,
    /##\s*The\s*["']?So\s*What["']?[\s\S]*?(?=##|---\s*\n\*|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      // Clean up the content - remove the header
      const content = match[0]
        .replace(/^##[^\n]+\n+/, '') // Remove header
        .replace(/---\s*$/, '') // Remove trailing separator
        .trim();
      
      if (content.length > 50) { // Make sure we have substantial content
        return content;
      }
    }
  }
  
  return undefined;
}

export function validateWeeklyReview(data: WeeklyReviewData): string[] {
  const errors: string[] = [];

  if (!data.week_start || !data.week_end) {
    errors.push("Week dates are required");
  }

  if (data.candle.close <= 0 && (!data.close || data.close <= 0)) {
    errors.push("Valid close price is required");
  }

  // v3.0+ reports don't have what_happened — only validate for v1.0/v2.0
  // Removed: what_happened requirement

  return errors;
}
