/**
 * Individual section parsers for the daily report
 * Each parser extracts specific data from a section of the report
 */

export interface KeyMetrics {
  close: number;
  open?: number;
  high: number;
  low: number;
  change: number;
  changePct: number;
  volume?: number;
}

export function parseKeyMetrics(section: string): Partial<KeyMetrics> {
  const metrics: Partial<KeyMetrics> = {};

  // Close price
  const closeMatch = section.match(/close[:\s]*\$?([\d,.]+)/i);
  if (closeMatch) {
    metrics.close = parseFloat(closeMatch[1].replace(",", ""));
  }

  // Open price
  const openMatch = section.match(/open[:\s]*\$?([\d,.]+)/i);
  if (openMatch) {
    metrics.open = parseFloat(openMatch[1].replace(",", ""));
  }

  // High
  const highMatch = section.match(/high[:\s]*\$?([\d,.]+)/i);
  if (highMatch) {
    metrics.high = parseFloat(highMatch[1].replace(",", ""));
  }

  // Low
  const lowMatch = section.match(/low[:\s]*\$?([\d,.]+)/i);
  if (lowMatch) {
    metrics.low = parseFloat(lowMatch[1].replace(",", ""));
  }

  // Change percent
  const changePctMatch = section.match(/([+-]?[\d.]+)%/);
  if (changePctMatch) {
    metrics.changePct = parseFloat(changePctMatch[1]);
  }

  // Volume
  const volumeMatch = section.match(/volume[:\s]*([\d,.]+)([MBK])?/i);
  if (volumeMatch) {
    let volume = parseFloat(volumeMatch[1].replace(",", ""));
    const suffix = volumeMatch[2]?.toUpperCase();
    if (suffix === "M") volume *= 1000000;
    if (suffix === "B") volume *= 1000000000;
    if (suffix === "K") volume *= 1000;
    metrics.volume = volume;
  }

  return metrics;
}

export interface RegimeAssessment {
  mode: "green" | "yellow" | "red";
  label: string;
  reasons: string[];
  summary: string;
}

export function parseRegimeAssessment(section: string): RegimeAssessment {
  // Default values
  let mode: "green" | "yellow" | "red" = "yellow";
  let label = "YELLOW MODE - Caution";
  const reasons: string[] = [];
  let summary = "";

  // Find mode
  const modeMatch = section.match(/(green|yellow|red)\s*mode/i);
  if (modeMatch) {
    mode = modeMatch[1].toLowerCase() as "green" | "yellow" | "red";
  }

  // Find full label line
  const labelMatch = section.match(/[*#]*\s*\**(green|yellow|red)\s*mode\s*[-–:]*\s*([^\n*]+)/i);
  if (labelMatch) {
    label = `${labelMatch[1].toUpperCase()} MODE${labelMatch[2] ? ` - ${labelMatch[2].trim()}` : ""}`;
  }

  // Extract bullet points as reasons
  const bulletMatches = section.matchAll(/[-*•]\s+([^\n]+)/g);
  for (const match of bulletMatches) {
    reasons.push(match[1].trim());
  }

  // Get summary (first substantial paragraph after mode declaration)
  const paragraphs = section.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (
      trimmed.length > 50 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*") &&
      !/mode/i.test(trimmed.slice(0, 20))
    ) {
      summary = trimmed;
      break;
    }
  }

  return { mode, label, reasons, summary };
}

export interface EntryQuality {
  score: number;
  label: string;
  factors: string[];
}

export function parseEntryQuality(section: string): EntryQuality {
  let score = 3;
  let label = "Average";
  const factors: string[] = [];

  // Find score
  const scoreMatch = section.match(/(?:score|quality|rating)[:\s]*(\d)(?:\s*\/\s*5)?/i);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1]);
  }

  // Alternative: look for X/5 pattern
  if (!scoreMatch) {
    const altMatch = section.match(/(\d)\s*\/\s*5/);
    if (altMatch) {
      score = parseInt(altMatch[1]);
    }
  }

  // Score labels
  const labels: Record<number, string> = {
    1: "Poor",
    2: "Below Average",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };
  label = labels[score] || "Average";

  // Extract factors (bullet points)
  const bulletMatches = section.matchAll(/[-*•]\s+([^\n]+)/g);
  for (const match of bulletMatches) {
    factors.push(match[1].trim());
  }

  return { score, label, factors };
}

export interface AlertLevel {
  type: "upside" | "downside";
  levelName: string;
  price: number;
  action: string;
  reason: string;
}

export function parseAlertLevels(section: string): AlertLevel[] {
  const alerts: AlertLevel[] = [];

  // Try table format first: | Level | Price | Action | Reason |
  const tableRowRegex = /\|\s*([^|]+)\s*\|\s*\$?([\d,.]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|/g;
  let match;

  while ((match = tableRowRegex.exec(section)) !== null) {
    const levelName = match[1].trim();
    const price = parseFloat(match[2].replace(",", ""));
    const action = match[3].trim();
    const reason = match[4].trim();

    // Skip header rows
    if (levelName.toLowerCase() === "level" || isNaN(price)) continue;

    // Determine type based on level name
    const isDownside =
      /support|eject|stop|downside|floor|bounce/i.test(levelName) ||
      /protect|exit|cut/i.test(action);

    alerts.push({
      type: isDownside ? "downside" : "upside",
      levelName,
      price,
      action,
      reason,
    });
  }

  // If no table found, try other formats
  if (alerts.length === 0) {
    // Try "Level Name: $XXX - Action" format
    const lineRegex = /([^:\n]+):\s*\$?([\d,.]+)\s*[-–]\s*([^\n]+)/g;
    while ((match = lineRegex.exec(section)) !== null) {
      const levelName = match[1].trim();
      const price = parseFloat(match[2].replace(",", ""));
      const action = match[3].trim();

      const isDownside = /support|eject|stop|downside|floor/i.test(levelName);

      alerts.push({
        type: isDownside ? "downside" : "upside",
        levelName,
        price,
        action,
        reason: "",
      });
    }
  }

  return alerts;
}

export interface PositionGuidance {
  stance: string;
  dailyCapPct: number;
  sizeRecommendation: string;
  notes: string[];
}

export function parsePositionGuidance(
  section: string,
  mode: "green" | "yellow" | "red"
): PositionGuidance {
  // Default caps by mode
  const defaultCaps: Record<string, number> = {
    green: 50,
    yellow: 25,
    red: 10,
  };

  let stance = "";
  let dailyCapPct = defaultCaps[mode];
  let sizeRecommendation = "Partial";
  const notes: string[] = [];

  // Find daily cap
  const capMatch = section.match(/(?:daily\s*)?cap[:\s]*(\d+)%/i);
  if (capMatch) {
    dailyCapPct = parseInt(capMatch[1]);
  }

  // Find size recommendation
  const sizeMatch = section.match(/(full|partial|toe-in|none|minimal)/i);
  if (sizeMatch) {
    sizeRecommendation = sizeMatch[1].charAt(0).toUpperCase() + sizeMatch[1].slice(1).toLowerCase();
  }

  // Find stance
  const stanceMatch = section.match(/stance[:\s]*([^\n.]+)/i);
  if (stanceMatch) {
    stance = stanceMatch[1].trim();
  }

  // Extract notes (bullet points)
  const bulletMatches = section.matchAll(/[-*•]\s+([^\n]+)/g);
  for (const match of bulletMatches) {
    notes.push(match[1].trim());
  }

  return { stance, dailyCapPct, sizeRecommendation, notes };
}

export interface GamePlanScenario {
  condition: string;
  action: string;
}

export function parseGamePlan(section: string): GamePlanScenario[] {
  const scenarios: GamePlanScenario[] = [];

  // Look for IF/THEN patterns
  const ifThenRegex = /IF[:\s]+([^\n]+?)(?:THEN|→|->|:)[:\s]*([^\n]+)/gi;
  let match;

  while ((match = ifThenRegex.exec(section)) !== null) {
    scenarios.push({
      condition: match[1].trim(),
      action: match[2].trim(),
    });
  }

  // Also look for numbered scenarios
  const numberedRegex = /\d+\.\s*(?:IF\s+)?([^\n:]+)[:\s]+([^\n]+)/gi;
  while ((match = numberedRegex.exec(section)) !== null) {
    // Avoid duplicates
    const condition = match[1].trim();
    if (!scenarios.some((s) => s.condition === condition)) {
      scenarios.push({
        condition,
        action: match[2].trim(),
      });
    }
  }

  return scenarios;
}

export interface PerformanceReview {
  score: number;
  total: number;
  forecasts: Array<{
    prediction: string;
    result: "correct" | "incorrect" | "partial";
  }>;
}

export function parsePerformanceReview(section: string): PerformanceReview | null {
  // Look for score pattern like "3/4" or "3 of 4"
  const scoreMatch = section.match(/(\d)\s*(?:\/|of)\s*(\d)/);
  if (!scoreMatch) return null;

  const score = parseInt(scoreMatch[1]);
  const total = parseInt(scoreMatch[2]);
  const forecasts: PerformanceReview["forecasts"] = [];

  // Try to extract individual forecasts
  const forecastRegex = /[-*•✓✗]\s*([^:\n]+)[:\s]*(correct|incorrect|partial|hit|miss|✓|✗)/gi;
  let match;

  while ((match = forecastRegex.exec(section)) !== null) {
    const prediction = match[1].trim();
    const resultText = match[2].toLowerCase();
    let result: "correct" | "incorrect" | "partial" = "incorrect";

    if (resultText === "correct" || resultText === "hit" || resultText === "✓") {
      result = "correct";
    } else if (resultText === "partial") {
      result = "partial";
    }

    forecasts.push({ prediction, result });
  }

  return { score, total, forecasts };
}
