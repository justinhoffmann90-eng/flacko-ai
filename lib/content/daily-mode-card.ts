/**
 * Daily Mode Card Generator
 * 
 * Generates the Daily Mode Card visual asset for X posting.
 * Runs entirely server-side without local file dependencies.
 */

interface DailyModeCardResult {
  html?: string;
  data?: {
    mode: string;
    modeClass: string;
    dailyCap: string;
    date: string;
    levels: Array<{
      name: string;
      price: number;
      type: string;
      pctFromClose: number;
    }>;
    take: {
      action: string;
      caution: string;
    };
  };
  error?: string;
}

interface ParsedReport {
  mode: string;
  modeClass: string;
  dailyCap: string;
  closePrice: number;
  levels: Array<{ name: string; price: number; type: string; desc?: string }>;
  take: { action: string; caution: string };
}

function parseReportContent(content: string): ParsedReport {
  const result: ParsedReport = {
    mode: 'ORANGE',
    modeClass: 'orange',
    dailyCap: '10',
    closePrice: 0,
    levels: [],
    take: { action: '', caution: '' }
  };

  // Extract mode
  const modePatterns = [
    { pattern: /🔴\s*(RED|DEFENSIVE)/i, mode: 'DEFENSIVE', class: 'defensive' },
    { pattern: /🟠\s*ORANGE/i, mode: 'ORANGE', class: 'orange' },
    { pattern: /🟡\s*YELLOW/i, mode: 'YELLOW', class: 'yellow' },
    { pattern: /🟢\s*(GREEN|ACCUMULATION)/i, mode: 'ACCUMULATION', class: 'accumulation' },
  ];

  for (const p of modePatterns) {
    if (p.pattern.test(content)) {
      result.mode = p.mode;
      result.modeClass = p.class;
      break;
    }
  }

  // Extract daily cap
  const capMatch = content.match(/daily\s*cap[:\s|]*\**(\d+(?:-\d+)?)\s*%/i);
  if (capMatch) result.dailyCap = capMatch[1];

  // Extract close price
  const closeMatch = content.match(/\*\*\$([\d.]+)\*\*\s*\|\s*\*\*📍\s*Current/i) ||
                     content.match(/current\s*price[:\s]*\$?([\d.]+)/i);
  if (closeMatch) result.closePrice = parseFloat(closeMatch[1]);

  // Extract levels from Alert Levels table
  const levelRegex = /\|\s*\$?([\d.]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
  let match;
  while ((match = levelRegex.exec(content)) !== null) {
    const price = parseFloat(match[1]);
    const levelName = match[2].replace(/[*🎯🔇⚡📈⏸️🛡️⚠️❌📍]/g, '').trim();
    const action = match[3].trim();
    
    if (price > 0 && levelName && !levelName.includes('Level') && !levelName.includes('Price')) {
      let type = 'upside';
      if (action.toLowerCase().includes('exit') || levelName.toLowerCase().includes('eject')) {
        type = 'eject';
      } else if (price < result.closePrice) {
        type = 'downside';
      }
      
      result.levels.push({ name: levelName, price, type, desc: action });
    }
  }

  // Extract "What I'd do" section
  const actionMatch = content.match(/\*\*what\s*i'?d?\s*do:?\*\*\s*([\s\S]{20,300}?)(?=\n\n|\n>|\n\*\*)/i);
  if (actionMatch) result.take.action = actionMatch[1].replace(/[>*]/g, '').trim();

  // Extract "Would change my mind" section  
  const cautionMatch = content.match(/\*\*(?:what\s*)?would\s*change\s*my\s*mind:?\*\*\s*([\s\S]{20,200}?)(?=\n\n|\n#|\n---)/i);
  if (cautionMatch) result.take.caution = cautionMatch[1].replace(/[>*]/g, '').trim();

  return result;
}

function selectKeyLevels(parsed: ParsedReport): Array<{ name: string; price: number; type: string; pctFromClose: number }> {
  const closePrice = parsed.closePrice;
  
  // Sort levels by distance from close
  const sorted = parsed.levels
    .map(l => ({
      ...l,
      distance: Math.abs(l.price - closePrice),
      pctFromClose: ((l.price - closePrice) / closePrice) * 100
    }))
    .sort((a, b) => a.distance - b.distance);

  // Select: 3 closest upside, 3 closest downside, master eject
  const upside = sorted.filter(l => l.type === 'upside').slice(0, 3);
  const downside = sorted.filter(l => l.type === 'downside').slice(0, 3);
  const eject = sorted.find(l => l.type === 'eject');

  const selected = [...upside, ...downside];
  if (eject) selected.push(eject);

  // Add close price marker
  selected.push({
    name: 'Last Close',
    price: closePrice,
    type: 'close',
    pctFromClose: 0
  });

  return selected.sort((a, b) => b.price - a.price);
}

function generateHTML(parsed: ParsedReport, levels: ReturnType<typeof selectKeyLevels>, date: string): string {
  const nextSession = getNextSession(date);
  
  // Generate level lines
  const levelLines = levels.map((level, idx) => {
    const top = 20 + idx * 42;
    const pctStr = level.type === 'close' ? '' : 
      (level.pctFromClose >= 0 ? '+' : '') + level.pctFromClose.toFixed(1) + '%';
    const pctClass = level.pctFromClose >= 0 ? 'pct-positive' : 'pct-negative';
    const marker = level.type === 'close' ? '<div class="close-marker"></div>' : '';
    
    return `
      <div class="price-line ${level.type}" style="top: ${top}px;">
        ${marker}
        <div class="line"></div>
        <div class="price-label">
          <span class="level-name">${level.name}</span>
          <span class="price-value">$${level.price.toFixed(2)}</span>
          ${pctStr ? `<span class="price-pct ${pctClass}">${pctStr}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Generate legend items
  const legendItems = levels.filter(l => l.type !== 'close').map(level => {
    const colorClass = level.type === 'upside' ? 'green' : level.type === 'downside' ? 'red' : 'orange';
    const pctClass = level.pctFromClose > 0 ? 'positive' : 'negative';
    const pctStr = (level.pctFromClose >= 0 ? '+' : '') + level.pctFromClose.toFixed(1) + '%';
    
    return `
      <div class="level-item">
        <div class="level-dot ${colorClass}"></div>
        <div class="level-info">
          <div class="level-header">
            <span><span class="level-price">$${level.price.toFixed(2)}</span><span class="level-label">${level.name}</span></span>
            <span class="level-pct ${pctClass}">${pctStr}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Generate take section
  const takeHTML = `
    ${parsed.take.action ? `<div class="take-section"><div class="take-label action">✅ WHAT I'D DO</div><div class="take-text">${parsed.take.action}</div></div>` : ''}
    ${parsed.take.caution ? `<div class="take-section"><div class="take-label caution">⚠️ WOULD CHANGE MY MIND</div><div class="take-text">${parsed.take.caution}</div></div>` : ''}
  `;

  const chartHeight = 20 + levels.length * 42 + 20;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flacko AI Daily Levels</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #fff;
    }
    .container { width: 1200px; padding: 24px 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { font-size: 22px; font-weight: 700; }
    .ticker-date { display: flex; align-items: center; gap: 12px; margin-left: 24px; }
    .ticker { font-size: 20px; font-weight: 700; }
    .date { font-size: 14px; color: #888; }
    .gameplan-for { font-size: 12px; color: #4ade80; font-weight: 600; padding: 4px 10px; background: rgba(74,222,128,0.1); border-radius: 6px; border: 1px solid rgba(74,222,128,0.3); }
    .mode-badge { display: flex; align-items: center; gap: 16px; }
    .daily-cap { font-size: 15px; color: #ccc; }
    .daily-cap span { font-weight: 700; color: #fff; }
    .mode { padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 15px; text-transform: uppercase; }
    .mode.defensive { background: #dc2626; }
    .mode.orange { background: #f97316; }
    .mode.yellow { background: #eab308; }
    .mode.accumulation { background: #22c55e; }
    .main-content { display: flex; gap: 20px; }
    .chart-panel { flex: 1; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); position: relative; min-height: ${chartHeight}px; height: ${chartHeight}px; }
    .price-line { position: absolute; left: 0; right: 0; height: 2px; display: flex; align-items: center; }
    .price-line .line { flex: 1; height: 100%; }
    .price-line.upside .line { background: linear-gradient(90deg, transparent 5%, #22c55e 30%, #22c55e 70%, transparent 95%); }
    .price-line.downside .line { background: linear-gradient(90deg, transparent 5%, #ef4444 30%, #ef4444 70%, transparent 95%); }
    .price-line.eject .line { background: repeating-linear-gradient(90deg, #f97316 0px, #f97316 8px, transparent 8px, transparent 16px); height: 3px; }
    .price-line.close .line { background: linear-gradient(90deg, transparent 5%, #3b82f6 30%, #3b82f6 70%, transparent 95%); }
    .price-label { position: absolute; right: 16px; transform: translateY(-50%); display: flex; align-items: center; gap: 8px; }
    .level-name { font-size: 11px; color: #999; text-align: right; max-width: 120px; }
    .price-value { background: rgba(0,0,0,0.8); padding: 4px 10px; border-radius: 5px; font-weight: 700; font-size: 14px; }
    .price-pct { font-size: 12px; font-weight: 600; }
    .pct-positive { color: #22c55e; }
    .pct-negative { color: #ef4444; }
    .price-line.upside .price-value { border: 2px solid #22c55e; color: #22c55e; }
    .price-line.downside .price-value { border: 2px solid #ef4444; color: #ef4444; }
    .price-line.eject .price-value { border: 2px solid #f97316; color: #f97316; }
    .price-line.close .price-value { border: 2px solid #3b82f6; color: #fff; background: #3b82f6; }
    .close-marker { position: absolute; left: 40px; width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; transform: translateY(-50%); box-shadow: 0 0 8px #3b82f6; }
    .info-panel { width: 380px; display: flex; flex-direction: column; gap: 12px; }
    .take-box { background: rgba(124,58,237,0.08); border-radius: 10px; border: 1px solid rgba(124,58,237,0.25); padding: 14px; }
    .take-title { font-size: 11px; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 600; }
    .take-section { margin-bottom: 10px; }
    .take-label { font-size: 12px; font-weight: 700; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; }
    .take-label.action { color: #22c55e; }
    .take-label.caution { color: #f97316; }
    .take-text { font-size: 13px; color: #d1d5db; line-height: 1.4; }
    .levels-box { background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); padding: 14px; }
    .levels-title { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .level-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .level-item:last-child { border-bottom: none; }
    .level-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; margin-top: 2px; }
    .level-dot.green { background: #22c55e; }
    .level-dot.red { background: #ef4444; }
    .level-dot.orange { background: #f97316; }
    .level-info { flex: 1; }
    .level-header { display: flex; justify-content: space-between; align-items: baseline; }
    .level-price { font-size: 15px; font-weight: 700; color: #fff; }
    .level-label { font-size: 13px; color: #a1a1aa; margin-left: 8px; }
    .level-pct { font-size: 13px; font-weight: 600; }
    .level-pct.positive { color: #22c55e; }
    .level-pct.negative { color: #ef4444; }
    .footer { margin-top: 14px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; }
    .footer-url { font-weight: 700; font-size: 14px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="logo">⚔️ flacko ai</div>
        <div class="ticker-date">
          <span class="ticker">TSLA</span>
          <span class="date">${date}</span>
          <span class="gameplan-for">📅 Gameplan for ${nextSession}</span>
        </div>
      </div>
      <div class="mode-badge">
        <div class="daily-cap">Daily Cap: <span>${parsed.dailyCap}%</span></div>
        <div class="mode ${parsed.modeClass}">${parsed.mode}</div>
      </div>
    </div>
    <div class="main-content">
      <div class="chart-panel">${levelLines}</div>
      <div class="info-panel">
        <div class="take-box">
          <div class="take-title">🧠 FLACKO AI'S TAKE</div>
          ${takeHTML}
        </div>
        <div class="levels-box">
          <div class="levels-title">Key Levels</div>
          ${legendItems}
        </div>
      </div>
    </div>
    <div class="footer">
      <span>Your TSLA trading operating system. Join the gang:</span>
      <span class="footer-url">⚔️ flacko.ai</span>
    </div>
  </div>
</body>
</html>`;
}

function getNextSession(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export async function generateDailyModeCard(date: string): Promise<DailyModeCardResult> {
  try {
    // Import Supabase dynamically to avoid build issues
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();

    // Get report from database
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("markdown_content, report_date")
      .eq("report_date", date)
      .single();

    if (reportError || !report?.markdown_content) {
      return { error: `Report not found for ${date}` };
    }

    // Parse report content
    const parsed = parseReportContent(report.markdown_content);
    
    if (parsed.closePrice === 0) {
      return { error: "Could not extract close price from report" };
    }

    // Select key levels
    const levels = selectKeyLevels(parsed);

    // Generate HTML
    const html = generateHTML(parsed, levels, date);

    return {
      html,
      data: {
        mode: parsed.mode,
        modeClass: parsed.modeClass,
        dailyCap: parsed.dailyCap,
        date,
        levels,
        take: parsed.take
      }
    };
  } catch (error) {
    console.error("Daily mode card generation error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
