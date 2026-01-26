import { ExtractedReportData, ParsedReportData, ReportAlert, TrafficLightMode, TierSignal, TierSignals, Positioning, LevelMapEntry } from "@/types";
import matter from "gray-matter";

export const PARSER_VERSION = "3.1.1"; // Support JSON in HTML comments + null actions

// Interface for level in frontmatter (v3.1)
interface FrontmatterLevel {
  price: number;
  name: string;
  action: string | null; // Can be null for Current Price marker
}

// Interface for YAML frontmatter data (v3.1)
interface ReportFrontmatter {
  // Basic info
  date?: string;
  day?: string;
  price_close?: number;
  price_change?: number;
  price_change_pct?: number | string; // Can be number or string like "-0.07" or "+3.98%"

  // Mode
  mode?: string; // e.g., "Yellow (Improving)", "Green", "Red"
  mode_emoji?: string; // "🟢", "🟡", "🔴"

  // Tiers (v3.1 uses emoji values like "🔴", "🟢", "🟡")
  tier1_regime?: string;
  tier2_trend?: string;
  tier3_timing?: string;
  tier4_flow?: string;
  // Legacy format (v3.0)
  tier_1_regime?: string;
  tier_2_trend?: string;
  tier_3_timing?: string;
  tier_4_flow?: string;

  // Positioning
  positioning?: string; // "Lean Bullish", "Neutral", "Lean Bearish"
  daily_cap_pct?: number;
  daily_cap_dollars?: number;
  per_trade_dollars?: number;
  target_position?: number;
  // Legacy format
  daily_cap_min?: number;
  daily_cap_max?: number;
  vehicle?: string;
  posture?: string;

  // Risk
  correction_risk?: string; // "LOW", "LOW-MODERATE", "MODERATE", "HIGH"

  // Levels array (v3.1)
  levels?: FrontmatterLevel[];

  // Key levels
  master_eject?: number;
  key_gamma_strike?: number;
  gamma_regime?: string; // "Positive" or "Negative"

  // Earnings
  earnings_date?: string;
  earnings_days_away?: number;
}

interface ParseResult {
  parsed_data: ParsedReportData;
  extracted_data: ExtractedReportData;
  warnings: string[];
}

export function parseReport(markdown: string): ParseResult {
  const warnings: string[] = [];

  // Try to parse YAML frontmatter first (v3.1 format)
  let frontmatter: ReportFrontmatter | null = null;
  let content = markdown;

  try {
    const parsed = matter(markdown);
    if (parsed.data && Object.keys(parsed.data).length > 0) {
      frontmatter = parsed.data as ReportFrontmatter;
      content = parsed.content; // Markdown without frontmatter
    }
  } catch {
    // No valid frontmatter, continue with other formats
  }

  // If no YAML frontmatter, try to parse JSON from HTML comment (<!-- REPORT_DATA {...} -->)
  if (!frontmatter) {
    const jsonCommentMatch = markdown.match(/<!--\s*REPORT_DATA\s*([\s\S]*?)-->/);
    if (jsonCommentMatch) {
      try {
        const jsonData = JSON.parse(jsonCommentMatch[1].trim());
        frontmatter = jsonData as ReportFrontmatter;
        // Remove the comment from content
        content = markdown.replace(/<!--\s*REPORT_DATA[\s\S]*?-->/, '').trim();
      } catch {
        warnings.push("Found REPORT_DATA comment but failed to parse JSON");
      }
    }
  }

  // Parse sections from markdown content
  const parsed_data = parseSections(content, warnings);

  // Extract structured data (using frontmatter if available, falling back to regex)
  const extracted_data = extractData(content, parsed_data, warnings, frontmatter);

  return {
    parsed_data,
    extracted_data,
    warnings,
  };
}

function parseSections(markdown: string, warnings: string[]): ParsedReportData {
  const sections: ParsedReportData = {
    header: "",
    key_metrics: "",
    regime_assessment: "",
    qqq_context: "",
    technical_analysis: "",
    spotgamma_analysis: "",
    entry_quality: "",
    key_levels: "",
    position_guidance: "",
    game_plan: "",
    claude_take: "",
    risk_alerts: "",
    previous_review: "",
    disclaimer: "",
  };

  // Updated section markers to match actual report format (v2 and v3)
  const sectionPatterns: { key: keyof ParsedReportData; pattern: RegExp }[] = [
    { key: "header", pattern: /^#\s+TSLA\s+Daily\s+Report/im },
    { key: "key_metrics", pattern: /##\s*\d*\.?\s*Executive Summary/i },
    { key: "previous_review", pattern: /##\s*\d*\.?\s*(?:📊|✅)?\s*Previous Day|##\s*\d*\.?\s*Yesterday/i },
    { key: "qqq_context", pattern: /##\s*\d*\.?\s*🌐?\s*QQQ|##\s*\d*\.?\s*Macro Context/i },
    { key: "regime_assessment", pattern: /##\s*\d*\.?\s*🚦?\s*(?:Regime Status|Mode)/i },
    { key: "claude_take", pattern: /##\s*\d*\.?\s*Claude's Take/i },
    { key: "entry_quality", pattern: /##\s*\d*\.?\s*Should You Be Buying|##\s*\d*\.?\s*Entry Quality/i },
    { key: "game_plan", pattern: /##\s*\d*\.?\s*(?:💡)?\s*(?:The Game Plan|Game Plan|Bottom Line)/i },
    { key: "position_guidance", pattern: /##\s*\d*\.?\s*(?:💰|📊)?\s*(?:Position Sizing|Position|Today's Positioning)/i },
    { key: "key_levels", pattern: /##\s*\d*\.?\s*(?:📍)?\s*(?:Key Levels|Levels Map)/i },
    { key: "risk_alerts", pattern: /##\s*\d*\.?\s*(?:🚨|🔔)?\s*Alerts/i },
    { key: "technical_analysis", pattern: /##\s*\d*\.?\s*Technical Analysis/i },
    { key: "spotgamma_analysis", pattern: /##\s*\d*\.?\s*(?:⚠️|🎯)?\s*(?:Discipline|SpotGamma)/i },
    { key: "disclaimer", pattern: /##\s*\d*\.?\s*📸?\s*Overview|---\s*\n.*not financial advice/i },
  ];

  // Extract each section
  const lines = markdown.split("\n");
  let currentSection: keyof ParsedReportData | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    let foundSection = false;

    for (const { key, pattern } of sectionPatterns) {
      if (pattern.test(line)) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join("\n").trim();
        }
        currentSection = key;
        currentContent = [line];
        foundSection = true;
        break;
      }
    }

    if (!foundSection && currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections[currentSection] = currentContent.join("\n").trim();
  }

  return sections;
}

function extractData(
  markdown: string,
  parsed: ParsedReportData,
  warnings: string[],
  frontmatter: ReportFrontmatter | null = null
): ExtractedReportData {
  // If we have frontmatter, extract data from there first (much more reliable)
  if (frontmatter) {
    return extractFromFrontmatter(markdown, parsed, warnings, frontmatter);
  }

  // Fall back to regex extraction for v3.0 and older formats
  // Extract mode from executive summary or regime section
  const mode = extractMode(markdown, parsed, warnings);

  // Extract price from executive summary
  const price = extractPrice(markdown, parsed.key_metrics, warnings);

  // Extract master eject
  const master_eject = extractMasterEject(markdown, warnings);

  // Extract entry quality
  const entry_quality = extractEntryQuality(markdown, parsed.entry_quality, warnings);

  // Extract alerts (try v3.0 format first, fall back to old format)
  const alerts = extractAlertsV3(markdown, warnings) || extractAlerts(markdown, parsed.risk_alerts, warnings);

  // Extract position guidance
  const position = extractPositionGuidance(parsed.position_guidance, mode.current, warnings);

  // Extract QQQ status
  const qqq_status = extractQQQStatus(parsed.qqq_context);

  // Extract performance (if present)
  const performance = extractPerformance(parsed.previous_review);

  // v3.0 fields
  const tiers = extractTiers(markdown);
  const positioning = extractPositioning(markdown);
  const levels_map = extractLevelsMap(markdown);

  return {
    mode,
    price,
    master_eject,
    entry_quality,
    alerts,
    position,
    qqq_status,
    performance,
    tiers,
    positioning,
    levels_map,
  };
}

// Helper to convert emoji or text tier value to TierSignal
function parseTierValue(value: string | undefined): TierSignal {
  if (!value) return 'yellow';
  const v = value.toLowerCase().trim();
  if (v === '🟢' || v === 'green') return 'green';
  if (v === '🟠' || v === 'orange') return 'orange';
  if (v === '🔴' || v === 'red') return 'red';
  return 'yellow';
}

// Helper to parse mode string (e.g., "Yellow (Improving)" -> { base: "yellow", subtype: "Improving" })
function parseMode(modeStr: string | undefined): { base: TrafficLightMode; subtype: string } {
  if (!modeStr) return { base: 'yellow', subtype: '' };

  // Check for subtype in parentheses: "Yellow (Improving)"
  const match = modeStr.match(/^(green|yellow|orange|red)\s*(?:\(([^)]+)\))?$/i);
  if (match) {
    return {
      base: match[1].toLowerCase() as TrafficLightMode,
      subtype: match[2] || '',
    };
  }

  // Simple mode without subtype
  const lower = modeStr.toLowerCase();
  if (lower.includes('green')) return { base: 'green', subtype: '' };
  if (lower.includes('orange')) return { base: 'orange', subtype: '' };
  if (lower.includes('red')) return { base: 'red', subtype: '' };
  return { base: 'yellow', subtype: '' };
}

// Extract data from YAML frontmatter (v3.1 format) - much more reliable
function extractFromFrontmatter(
  markdown: string,
  parsed: ParsedReportData,
  warnings: string[],
  fm: ReportFrontmatter
): ExtractedReportData {
  // Mode from frontmatter
  const { base: modeBase, subtype: modeSubtype } = parseMode(fm.mode);
  const mode: ExtractedReportData["mode"] = {
    current: modeBase,
    label: modeSubtype ? `${modeBase.toUpperCase()} (${modeSubtype}) MODE` : `${modeBase.toUpperCase()} MODE`,
    summary: modeSubtype,
  };

  // Price from frontmatter
  let changePct = 0;
  if (fm.price_change_pct !== undefined) {
    const pctStr = String(fm.price_change_pct);
    changePct = parseFloat(pctStr.replace('%', '').replace('+', ''));
    if (isNaN(changePct)) changePct = 0;
  }
  const price: ExtractedReportData["price"] = {
    close: fm.price_close || 0,
    change_pct: changePct,
    range: { low: 0, high: 0 },
  };

  // Master eject from frontmatter
  const master_eject: ExtractedReportData["master_eject"] = {
    price: fm.master_eject || 0,
    action: "Daily close below = exit all positions",
  };

  // Tiers from frontmatter (support both v3.1 and v3.0 field names)
  const tier1 = fm.tier1_regime || fm.tier_1_regime;
  const tier2 = fm.tier2_trend || fm.tier_2_trend;
  const tier3 = fm.tier3_timing || fm.tier_3_timing;
  const tier4 = fm.tier4_flow || fm.tier_4_flow;

  const tiers: TierSignals | undefined = (tier1 || tier2 || tier3 || tier4) ? {
    regime: parseTierValue(tier1),
    trend: parseTierValue(tier2),
    timing: parseTierValue(tier3),
    flow: parseTierValue(tier4),
  } : undefined;

  // Positioning from frontmatter (v3.1 format)
  // v3.1: daily_cap_pct is a single number, daily_cap_dollars and per_trade_dollars are explicit
  // v3.0: daily_cap_min/max were ranges
  const dailyCapPct = fm.daily_cap_pct || (
    fm.daily_cap_min && fm.daily_cap_max
      ? Math.round((fm.daily_cap_min + fm.daily_cap_max) / 2)
      : fm.daily_cap_min || 15
  );

  const dailyCapStr = fm.daily_cap_pct
    ? `${fm.daily_cap_pct}% of target position`
    : fm.daily_cap_min && fm.daily_cap_max
    ? `${fm.daily_cap_min}-${fm.daily_cap_max}% of target position`
    : fm.daily_cap_min
    ? `${fm.daily_cap_min}% of target position`
    : '';

  // v3.1 uses 'positioning' field for stance (e.g., "Lean Bullish")
  // v3.0 used 'posture' field
  const posture = fm.positioning || fm.posture || '';

  const positioning: Positioning | undefined = (dailyCapStr || fm.vehicle || posture) ? {
    daily_cap: dailyCapStr,
    vehicle: fm.vehicle || '',
    posture: posture,
  } : undefined;

  // Position guidance derived from frontmatter
  const position: ExtractedReportData["position"] = {
    current_stance: posture || 'See report for details',
    daily_cap_pct: dailyCapPct,
    size_recommendation: fm.vehicle || 'See report for details',
  };

  // Entry quality - still need to extract from markdown or default
  const entry_quality = extractEntryQuality(markdown, parsed.entry_quality, warnings);

  // Alerts - extract from frontmatter levels array (v3.1) or fall back to markdown parsing
  let alerts: ReportAlert[] = [];
  if (fm.levels && fm.levels.length > 0) {
    alerts = extractAlertsFromLevels(fm.levels, fm.price_close || 0);
  }
  // If no alerts from frontmatter, try markdown parsing
  if (alerts.length === 0) {
    alerts = extractAlertsV3(markdown, warnings) || extractAlerts(markdown, parsed.risk_alerts, warnings);
  }

  // QQQ status - still from markdown
  const qqq_status = extractQQQStatus(parsed.qqq_context);

  // Performance - still from markdown
  const performance = extractPerformance(parsed.previous_review);

  // Levels map from frontmatter (v3.1) or markdown tables
  let levels_map: LevelMapEntry[] | undefined;
  if (fm.levels && fm.levels.length > 0) {
    levels_map = fm.levels.map(level => ({
      level: level.name,
      price: level.price,
      source: 'Report',
      depth: '—',
      action: level.action || '—', // Handle null action
    }));
  } else {
    levels_map = extractLevelsMap(markdown);
  }

  // Validate required fields
  if (price.close <= 0) {
    warnings.push("Could not extract close price from frontmatter");
  }
  if (master_eject.price <= 0) {
    warnings.push("Could not extract Master Eject from frontmatter");
  }

  return {
    mode,
    price,
    master_eject,
    entry_quality,
    alerts,
    position,
    qqq_status,
    performance,
    tiers,
    positioning,
    levels_map,
  };
}

// Convert frontmatter levels array to ReportAlert objects (v3.1)
// Trim actions (above current price) = upside, Nibble actions (below current price) = downside
function extractAlertsFromLevels(levels: FrontmatterLevel[], currentPrice: number): ReportAlert[] {
  const alerts: ReportAlert[] = [];

  for (const level of levels) {
    // Skip entries with null/undefined action (like Current Price marker)
    if (!level.action) continue;

    const action = level.action.toLowerCase();

    // Skip current price marker and master eject (handled separately)
    if (level.name.toLowerCase().includes('current price')) continue;
    if (level.name.toLowerCase().includes('master eject')) continue;
    if (action.includes('exit all')) continue;

    // Determine type based on action keywords
    // Trim = upside (take profit), Nibble = downside (buy the dip)
    let type: 'upside' | 'downside';

    if (action.includes('trim') || action.includes('breakout')) {
      type = 'upside';
    } else if (action.includes('nibble') || action.includes('pause') || action.includes('buy')) {
      type = 'downside';
    } else {
      // Use price relative to current to determine type
      type = level.price > currentPrice ? 'upside' : 'downside';
    }

    alerts.push({
      type,
      level_name: level.name,
      price: level.price,
      action: level.action,
      reason: '', // v3.1 doesn't have separate reason field
    });
  }

  // Sort: upside first (descending by price), then downside (descending by price)
  alerts.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'upside' ? -1 : 1;
    }
    return b.price - a.price;
  });

  return alerts;
}

function extractMode(
  markdown: string,
  parsed: ParsedReportData,
  warnings: string[]
): ExtractedReportData["mode"] {
  // v3.0 Pattern: ## 🚦 Mode: 🟢 GREEN or ## 🚦 Mode: [🟢/🟡/🟠/🔴] [GREEN/YELLOW/ORANGE/RED]
  const v3Pattern = /##\s*🚦?\s*Mode:\s*([🔴🟠🟡🟢])\s*(GREEN|YELLOW|ORANGE|RED)(?:\s*\(([^)]+)\))?/i;
  const v3Match = markdown.match(v3Pattern);

  if (v3Match) {
    const current = v3Match[2].toLowerCase() as TrafficLightMode;
    const variant = v3Match[3] ? ` (${v3Match[3]})` : '';

    // Get the explanation line (bold text after the mode line)
    const afterMode = markdown.slice(v3Match.index! + v3Match[0].length);
    const explanationMatch = afterMode.match(/^\s*\n+\*\*([^*]+)\*\*/);
    const summary = explanationMatch ? explanationMatch[1].trim() : '';

    return {
      current,
      label: `${current.toUpperCase()}${variant} MODE`,
      summary,
    };
  }

  // Pattern 1: Table format with emoji
  // | **Mode** | 🟡 **Yellow (Improving)** — Early recovery...
  // | **Mode** | 🔴 **RED — Defensive mode...
  const tablePattern = /\*\*Mode\*\*\s*\|\s*([🔴🟠🟡🟢])\s*\*\*(Red|Orange|Yellow|Green)(?:\s*\([^)]*\))?\*\*\s*[—-]\s*([^|]+)/i;
  const tableMatch = markdown.match(tablePattern);

  if (tableMatch) {
    const current = tableMatch[2].toLowerCase() as TrafficLightMode;
    const summary = tableMatch[3].trim();
    return {
      current,
      label: `${current.toUpperCase()} MODE`,
      summary,
    };
  }

  // Pattern 2: Simpler table format
  // | **Mode** | 🔴 **RED** |
  const simpleTablePattern = /\*\*Mode\*\*\s*\|\s*([🔴🟠🟡🟢])\s*\*\*(Red|Orange|Yellow|Green)/i;
  const simpleMatch = markdown.match(simpleTablePattern);

  if (simpleMatch) {
    const current = simpleMatch[2].toLowerCase() as TrafficLightMode;
    return {
      current,
      label: `${current.toUpperCase()} MODE`,
      summary: "",
    };
  }

  // Pattern 3: Look for emoji + mode word anywhere
  const emojiModePattern = /([🔴🟠🟡🟢])\s*\*?\*?(Red|Orange|Yellow|Green)/i;
  const emojiMatch = markdown.match(emojiModePattern);

  if (emojiMatch) {
    const current = emojiMatch[2].toLowerCase() as TrafficLightMode;
    return {
      current,
      label: `${current.toUpperCase()} MODE`,
      summary: "",
    };
  }

  // Fallback: general pattern
  const modePattern = /(green|yellow|orange|red)\s*mode/i;
  const match = markdown.match(modePattern);

  if (!match) {
    warnings.push("Could not extract mode");
    return {
      current: "yellow",
      label: "UNKNOWN MODE",
      summary: "Mode could not be determined",
    };
  }

  return {
    current: match[1].toLowerCase() as TrafficLightMode,
    label: `${match[1].toUpperCase()} MODE`,
    summary: "",
  };
}

function extractPrice(
  markdown: string,
  section: string,
  warnings: string[]
): ExtractedReportData["price"] {
  // v3.0 Pattern: Look for Current Price in Levels Map
  // | **Current Price** | **$419** | — | — | — |
  const currentPricePattern = /\|\s*\*\*Current\s*Price\*\*\s*\|\s*\*\*\$?([\d.]+)\*\*/i;
  const currentPriceMatch = markdown.match(currentPricePattern);

  if (currentPriceMatch) {
    const close = parseFloat(currentPriceMatch[1]);
    // In v3.0, change % might not be in the same table, try to find it elsewhere
    const changePattern = /([+-][\d.]+)%/;
    const changeMatch = markdown.match(changePattern);
    const changePct = changeMatch ? parseFloat(changeMatch[1]) : 0;

    return {
      close,
      change_pct: changePct,
      range: { low: 0, high: 0 },
    };
  }

  // Look for price in executive summary table
  // Pattern: | **Price** | $419.25 (-$18.25, -4.17%)
  const priceTablePattern = /\*\*Price\*\*\s*\|\s*\$?([\d.]+)\s*\(([^)]+)\)/i;
  const priceMatch = markdown.match(priceTablePattern);

  if (priceMatch) {
    const close = parseFloat(priceMatch[1]);
    const changeStr = priceMatch[2];
    const changePattern = /([+-]?[\d.]+)%/;
    const changeMatch = changeStr.match(changePattern);
    const changePct = changeMatch ? parseFloat(changeMatch[1]) : 0;

    return {
      close,
      change_pct: changePct,
      range: { low: 0, high: 0 },
    };
  }

  // Fallback: look for "Price" or "Close" patterns
  const closePattern = /(?:close|price)[:\s]*\$?([\d.]+)/i;
  const changePattern = /([+-]?[\d.]+)%/;

  const closeMatch = (section || markdown).match(closePattern);
  const changeMatch = (section || markdown).match(changePattern);

  if (!closeMatch) {
    warnings.push("Could not extract close price");
  }

  return {
    close: closeMatch ? parseFloat(closeMatch[1]) : 0,
    change_pct: changeMatch ? parseFloat(changeMatch[1]) : 0,
    range: { low: 0, high: 0 },
  };
}

function extractMasterEject(
  markdown: string,
  warnings: string[]
): ExtractedReportData["master_eject"] {
  // v3.0 Pattern: Master Eject in Levels Map table
  // | **Master Eject** | **$XXX** | Structure | — | **Daily close below = exit all** |
  const levelsTablePattern = /\|\s*\*?\*?Master\s*Eject\*?\*?\s*\|\s*\*?\*?\$?([\d.]+)\*?\*?\s*\|/i;
  const levelsMatch = markdown.match(levelsTablePattern);
  if (levelsMatch) {
    return {
      price: parseFloat(levelsMatch[1]),
      action: "Daily close below = exit all positions",
    };
  }

  // v3.0 Pattern at end of Page 2: **Master Eject:** $XXX
  const page2Pattern = /\*\*Master\s*Eject:\*\*\s*\$?([\d.]+)/i;
  const page2Match = markdown.match(page2Pattern);
  if (page2Match) {
    return {
      price: parseFloat(page2Match[1]),
      action: "Daily close below = exit all positions",
    };
  }

  // Look for "Master Eject Level:" or "Master Eject:" patterns (legacy)
  const patterns = [
    /Master\s*Eject\s*Level[:\s]*\$?([\d.]+)/i,
    /Master\s*Eject[:\s]*\$?([\d.]+)/i,
    /\*\*Master\s*Eject\*\*[:\s]*\$?([\d.]+)/i,
    /NEW\s*Master\s*Eject[:\s]*\$?([\d.]+)/i,
    /Eject\s*\|\s*\$?([\d.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match) {
      return {
        price: parseFloat(match[1]),
        action: "Exit all positions immediately",
      };
    }
  }

  warnings.push("Could not extract Master Eject price");
  return { price: 0, action: "Exit all positions" };
}

function extractEntryQuality(
  markdown: string,
  section: string,
  warnings: string[]
): ExtractedReportData["entry_quality"] {
  // Look for "Entry Quality: X/5" or "0/5"
  const scorePattern = /Entry\s*Quality[:\s]*[❌✅⚠️]?\s*(\d)\/5/i;
  const match = markdown.match(scorePattern);

  if (match) {
    return {
      score: parseInt(match[1]),
      factors: [],
    };
  }

  // Look for score in tables
  const tablePattern = /\|\s*Entry\s*Quality\s*\|\s*(\d)\/5/i;
  const tableMatch = markdown.match(tablePattern);

  if (tableMatch) {
    return {
      score: parseInt(tableMatch[1]),
      factors: [],
    };
  }

  // Default based on mode
  const modePattern = /(green|yellow|red)\s*mode/i;
  const modeMatch = markdown.match(modePattern);
  const mode = modeMatch ? modeMatch[1].toLowerCase() : "yellow";

  const defaultScores: Record<string, number> = {
    green: 4,
    yellow: 2,
    red: 0,
  };

  return {
    score: defaultScores[mode] || 2,
    factors: [],
  };
}

function extractAlerts(
  markdown: string,
  section: string,
  warnings: string[]
): ReportAlert[] {
  const alerts: ReportAlert[] = [];

  // Find the "Alerts to Set" section specifically (handle both 🚨 and 🔔 emojis)
  const alertsSectionMatch = markdown.match(/###?\s*(?:🚨|🔔)?\s*Alerts\s+to\s+Set[\s\S]*?(?=###|##|\n---\n|$)/i);

  if (!alertsSectionMatch) {
    warnings.push("Could not find 'Alerts to Set' section");
    return alerts;
  }

  const alertsSection = alertsSectionMatch[0];

  // Try both column orders:
  // Format 1: | emoji | Price | Level | Action | Why |
  // Format 2: | emoji | Level | Price | Action | Why |

  // First, detect column order from header
  const headerMatch = alertsSection.match(/\|\s*\|\s*(\w+)\s*\|\s*(\w+)\s*\|/i);
  const priceFirst = headerMatch && headerMatch[1].toLowerCase() === "price";

  let tableRowPattern: RegExp;
  if (priceFirst) {
    // Format: | emoji | Price | Level | Action | Why |
    tableRowPattern = /\|\s*(🟢|🔴|⚠️)\s*\|\s*\$?([\d.]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|/g;
  } else {
    // Format: | emoji | Level | Price | Action | Why |
    tableRowPattern = /\|\s*(🟢|🔴|⚠️)\s*\|\s*([^|]+)\s*\|\s*\$?([\d.]+)\s*\|\s*([^|]+)\s*\|\s*([^|]*)\s*\|/g;
  }

  let match;
  while ((match = tableRowPattern.exec(alertsSection)) !== null) {
    const emoji = match[1].trim();

    let price: number;
    let levelName: string;
    let action: string;
    let reason: string;

    if (priceFirst) {
      // Format: | emoji | Price | Level | Action | Why |
      price = parseFloat(match[2]);
      levelName = match[3].trim();
      action = match[4].trim();
      reason = match[5]?.trim() || "";
    } else {
      // Format: | emoji | Level | Price | Action | Why |
      levelName = match[2].trim();
      price = parseFloat(match[3]);
      action = match[4].trim();
      reason = match[5]?.trim() || "";
    }

    // Skip header rows and separator rows
    if (
      levelName.toLowerCase() === "level" ||
      levelName.startsWith("---") ||
      levelName.startsWith("Price")
    ) {
      continue;
    }

    // Skip if not a valid price
    if (isNaN(price) || price <= 0) continue;

    // Determine type based on emoji (🟢 = upside, 🔴 = downside)
    const isDownside = emoji === "🔴";

    alerts.push({
      type: isDownside ? "downside" : "upside",
      level_name: levelName,
      price,
      action,
      reason,
    });
  }

  // Sort: upside first (descending by price), then downside (descending by price)
  alerts.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "upside" ? -1 : 1;
    }
    return b.price - a.price;
  });

  return alerts;
}

function extractPositionGuidance(
  section: string,
  mode: TrafficLightMode,
  warnings: string[]
): ExtractedReportData["position"] {
  // Default caps by mode (v3.0 style)
  const defaultCaps: Record<TrafficLightMode, number> = {
    green: 30, // 25-35% midpoint
    yellow: 15, // 10-20% midpoint
    red: 7, // 5-10% midpoint
  };

  // Try v3.0 format first: | **Daily Cap** | 15-25% of target position |
  const v3CapPattern = /\|\s*\*?\*?Daily\s*Cap\*?\*?\s*\|\s*(\d+)(?:-(\d+))?%/i;
  const v3CapMatch = section.match(v3CapPattern);

  let dailyCapPct: number;
  if (v3CapMatch) {
    // Use the midpoint if it's a range like 15-25%
    const low = parseInt(v3CapMatch[1]);
    const high = v3CapMatch[2] ? parseInt(v3CapMatch[2]) : low;
    dailyCapPct = Math.round((low + high) / 2);
  } else {
    const capPattern = /(?:daily\s*)?cap[:\s]*(\d+)%/i;
    const capMatch = section.match(capPattern);
    dailyCapPct = capMatch ? parseInt(capMatch[1]) : defaultCaps[mode];
  }

  // Try v3.0 posture
  const posturePattern = /\|\s*\*?\*?Posture\*?\*?\s*\|\s*([^|]+)\s*\|/i;
  const postureMatch = section.match(posturePattern);
  const posture = postureMatch ? postureMatch[1].trim() : '';

  const sizePattern = /(?:recommended|position)[:\s]*(ZERO|FULL|PARTIAL|CASH|NONE)/i;
  const sizeMatch = section.match(sizePattern);

  // Determine stance from posture or size
  let stance = "See report for details";
  if (posture) {
    stance = posture;
  } else if (sizeMatch) {
    stance = sizeMatch[1];
  }

  return {
    current_stance: stance,
    daily_cap_pct: dailyCapPct,
    size_recommendation: sizeMatch ? sizeMatch[1] : (mode === "red" ? "Nibbles only" : "Controlled accumulation"),
  };
}

function extractQQQStatus(section: string): string {
  if (!section) return "See report for QQQ analysis";

  // Look for verdict
  const verdictPattern = /QQQ\s*Verdict[:\s]*([❌⚠️✅]?\s*\w+)/i;
  const verdictMatch = section.match(verdictPattern);

  if (verdictMatch) {
    return verdictMatch[1].trim();
  }

  // Extract first meaningful sentence
  const sentences = section.split(/[.!?]/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 20 && !/^#+/.test(trimmed)) {
      return trimmed;
    }
  }

  return "See report for QQQ analysis";
}

function extractPerformance(
  section: string
): ExtractedReportData["performance"] | undefined {
  if (!section) return undefined;

  const scorePattern = /Scorecard[:\s]*(\d)\s*\/\s*(\d)/i;
  const match = section.match(scorePattern);

  if (!match) {
    // Try alternate pattern
    const altPattern = /(\d)\s*(?:\/|of)\s*(\d)\s*[✅]/;
    const altMatch = section.match(altPattern);
    if (altMatch) {
      return {
        score: parseInt(altMatch[1]),
        total: parseInt(altMatch[2]),
        forecasts: [],
      };
    }
    return undefined;
  }

  return {
    score: parseInt(match[1]),
    total: parseInt(match[2]),
    forecasts: [],
  };
}

export function validateReport(extracted: ExtractedReportData): string[] {
  const errors: string[] = [];

  if (!extracted.mode.current) {
    errors.push("Mode is required");
  }

  if (extracted.price.close <= 0) {
    errors.push("Valid close price is required");
  }

  if (extracted.master_eject.price <= 0) {
    errors.push("Master Eject price is required");
  }

  // Relaxed: only require at least 2 alerts
  if (extracted.alerts.length < 2) {
    errors.push("At least 2 alerts are required");
  }

  return errors;
}

// v3.0 Extraction Functions

function emojiToSignal(emoji: string): TierSignal {
  if (emoji.includes('🟢')) return 'green';
  if (emoji.includes('🔴')) return 'red';
  return 'yellow';
}

function extractTiers(markdown: string): TierSignals | undefined {
  // Look for tier table: | Tier 1 (Regime) | Tier 2 (Trend) | Tier 3 (Timing) | Tier 4 (Flow) |
  // Followed by: | 🟢 | 🟡 | 🔴 | 🟢 |
  const tierHeaderPattern = /\|\s*Tier\s*1[^|]*\|\s*Tier\s*2[^|]*\|\s*Tier\s*3[^|]*\|\s*Tier\s*4[^|]*\|/i;
  const headerMatch = markdown.match(tierHeaderPattern);

  if (!headerMatch) return undefined;

  // Find the data row after the header (skip separator row)
  const afterHeader = markdown.slice(headerMatch.index! + headerMatch[0].length);
  const dataRowPattern = /\|\s*([🟢🟡🔴][^|]*)\s*\|\s*([🟢🟡🔴][^|]*)\s*\|\s*([🟢🟡🔴][^|]*)\s*\|\s*([🟢🟡🔴][^|]*)\s*\|/;
  const dataMatch = afterHeader.match(dataRowPattern);

  if (!dataMatch) return undefined;

  return {
    regime: emojiToSignal(dataMatch[1]),
    trend: emojiToSignal(dataMatch[2]),
    timing: emojiToSignal(dataMatch[3]),
    flow: emojiToSignal(dataMatch[4]),
  };
}

function extractPositioning(markdown: string): Positioning | undefined {
  // Look for positioning table with format:
  // | **Daily Cap** | 15-25% of target position |
  // | **Vehicle** | TSLL / Shares |
  // | **Posture** | Building into recovery |
  // OR: | **Positioning** | Lean Bullish |

  const dailyCapPattern = /\|\s*\*?\*?Daily\s*Cap\*?\*?\s*\|\s*([^|]+)\s*\|/i;
  const vehiclePattern = /\|\s*\*?\*?Vehicle\*?\*?\s*\|\s*([^|]+)\s*\|/i;
  const posturePattern = /\|\s*\*?\*?(?:Posture|Positioning)\*?\*?\s*\|\s*([^|]+)\s*\|/i;

  const dailyCapMatch = markdown.match(dailyCapPattern);
  const vehicleMatch = markdown.match(vehiclePattern);
  const postureMatch = markdown.match(posturePattern);

  // Clean up posture - remove leading emoji and extract just the stance
  let posture = postureMatch ? postureMatch[1].trim() : '';
  if (posture) {
    // Remove emoji prefix and extract stance like "Lean Bullish" from "Lean Bullish — explanation"
    posture = posture.replace(/^[🟢🟡🔴]\s*/, '').split('—')[0].trim();
  }

  if (!dailyCapMatch && !vehicleMatch && !posture) return undefined;

  return {
    daily_cap: dailyCapMatch ? dailyCapMatch[1].trim() : '',
    vehicle: vehicleMatch ? vehicleMatch[1].trim() : '',
    posture: posture,
  };
}

function extractLevelsMap(markdown: string): LevelMapEntry[] | undefined {
  // Look for Levels Map table:
  // | Level | Price | Source | Depth | Action |
  const levelsHeaderPattern = /\|\s*Level\s*\|\s*Price\s*\|\s*Source\s*\|\s*Depth\s*\|\s*Action\s*\|/i;
  const headerMatch = markdown.match(levelsHeaderPattern);

  if (!headerMatch) return undefined;

  const levels: LevelMapEntry[] = [];
  const afterHeader = markdown.slice(headerMatch.index! + headerMatch[0].length);

  // Match rows like: | Call Wall | $XXX | SpotGamma | — | Resistance |
  // or: | **Current Price** | **$419** | — | — | — |
  const rowPattern = /\|\s*\*?\*?([^|*]+)\*?\*?\s*\|\s*\*?\*?\$?([\d.]+)\*?\*?\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)\s*\|/g;

  let match;
  while ((match = rowPattern.exec(afterHeader)) !== null) {
    const level = match[1].trim();
    const price = parseFloat(match[2]);
    const source = match[3].trim();
    const depth = match[4].trim();
    const action = match[5].trim();

    // Skip header/separator rows
    if (level.toLowerCase() === 'level' || level.startsWith('---') || isNaN(price)) {
      continue;
    }

    // Stop if we hit another section
    if (level.startsWith('#') || level.startsWith('##')) {
      break;
    }

    levels.push({ level, price, source, depth, action });
  }

  return levels.length > 0 ? levels : undefined;
}

function extractAlertsV3(markdown: string, warnings: string[]): ReportAlert[] | null {
  // v3.0 format: ## 🔔 Alerts to Set
  // Table: | Alert | Price | What It Means | Action |
  // Rows: | 🟢 | $XXX | Level name | Action |

  // First, find the Alerts to Set section - look for it more broadly
  const sectionPattern = /##\s*🔔\s*Alerts\s+to\s+Set[\s\S]*?(?=##\s*[💡⚠️📌]|---\s*\n\s*---|$)/i;
  let sectionMatch = markdown.match(sectionPattern);

  if (!sectionMatch) {
    // Try without emoji
    const altSectionPattern = /##\s*Alerts\s+to\s+Set[\s\S]*?(?=##\s*[💡⚠️📌]|---\s*\n\s*---|$)/i;
    sectionMatch = markdown.match(altSectionPattern);
  }

  if (!sectionMatch) {
    return null; // Fall back to old format
  }

  const alertsSection = sectionMatch[0];

  // Look for the table header
  const alertsHeaderPattern = /\|\s*Alert\s*\|\s*Price\s*\|\s*What\s*It\s*Means\s*\|\s*Action\s*\|/i;
  const headerMatch = alertsSection.match(alertsHeaderPattern);

  if (!headerMatch) return null; // Fall back to old format

  const alerts: ReportAlert[] = [];
  const afterHeader = alertsSection.slice(headerMatch.index! + headerMatch[0].length);

  // Split into lines and process each row
  const lines = afterHeader.split('\n');

  for (const line of lines) {
    // Skip separator rows and empty lines
    if (!line.trim() || line.includes('---')) continue;

    // Match rows like: | 🟢 | $460 | Prior swing resistance | Trim 10%, raise stops |
    // Use alternation for emojis (more reliable than character class for multi-byte)
    const rowMatch = line.match(/\|\s*(🟢|🟡|🔴)\s*\|\s*\$?([\d.]+)\s*\|\s*\*?\*?([^|]+?)\*?\*?\s*\|\s*\*?\*?([^|]+?)\*?\*?\s*\|/);

    if (!rowMatch) continue;

    const emoji = rowMatch[1];
    const price = parseFloat(rowMatch[2]);
    const levelName = rowMatch[3].trim();
    const action = rowMatch[4].trim();

    // Skip if not a valid price
    if (isNaN(price) || price <= 0) continue;

    // Skip Master Eject row (it's extracted separately)
    if (levelName.toLowerCase().includes('master eject')) continue;

    // Determine type: 🟢 = upside (take profit), 🔴 = downside (buy dip), 🟡 = neutral/caution
    const isDownside = emoji === '🔴';
    const isUpside = emoji === '🟢';

    alerts.push({
      type: isDownside ? 'downside' : 'upside',
      level_name: levelName,
      price,
      action,
      reason: emoji === '🟡' ? 'Caution level' : '',
    });
  }

  if (alerts.length === 0) return null; // Fall back to old format

  // Sort: upside first (descending by price), then downside (descending by price)
  alerts.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'upside' ? -1 : 1;
    }
    return b.price - a.price;
  });

  return alerts;
}
