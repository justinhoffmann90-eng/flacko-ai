/**
 * EOD Accuracy Card Generator
 * 
 * Generates the EOD accuracy card showing how well predicted levels performed.
 */

import { getIntradayPriceData } from "@/lib/price/yahoo-finance";
import { compareLevels, calculateAccuracy, type LevelResult } from "@/lib/accuracy/compareLevels";

interface EODAccuracyCardResult {
  html?: string;
  data?: {
    mode: string;
    modeEmoji: string;
    modeClass: string;
    date: string;
    ohlc: {
      open: number;
      high: number;
      low: number;
      close: number;
    };
    accuracy: {
      total: number;
      hit: number;
      broken: number;
      notTested: number;
      percentage: number;
    };
    results: LevelResult[];
  };
  error?: string;
}

function getModeEmoji(mode: string): string {
  const modeUpper = mode.toUpperCase();
  if (modeUpper.includes('GREEN') || modeUpper.includes('ACCUMULATION')) return '🟢';
  if (modeUpper.includes('YELLOW')) return '🟡';
  if (modeUpper.includes('ORANGE')) return '🟠';
  if (modeUpper.includes('RED') || modeUpper.includes('DEFENSIVE')) return '🔴';
  return '🟡';
}

function getModeClass(mode: string): string {
  const modeUpper = mode.toUpperCase();
  if (modeUpper.includes('GREEN') || modeUpper.includes('ACCUMULATION')) return 'accumulation';
  if (modeUpper.includes('YELLOW')) return 'yellow';
  if (modeUpper.includes('ORANGE')) return 'orange';
  if (modeUpper.includes('RED') || modeUpper.includes('DEFENSIVE')) return 'defensive';
  return 'yellow';
}

function generateHTML(data: NonNullable<EODAccuracyCardResult['data']>): string {
  const { mode, modeEmoji, modeClass, date, ohlc, accuracy, results } = data;
  
  // Sort results by price (descending)
  const sortedResults = [...results].sort((a, b) => b.price - a.price);
  
  // Generate level rows
  const levelRows = sortedResults.map(result => {
    let statusIcon = '';
    let statusClass = '';
    let statusText = '';
    
    if (result.status === 'hit') {
      statusIcon = '✅';
      statusClass = 'hit';
      statusText = `Tested at $${result.actualPrice?.toFixed(2)}`;
    } else if (result.status === 'broken') {
      statusIcon = '🎯';
      statusClass = 'broken';
      statusText = `Broken (${result.type === 'resistance' ? 'high' : 'low'}: $${result.actualPrice?.toFixed(2)})`;
    } else {
      statusIcon = '❌';
      statusClass = 'not-tested';
      statusText = 'Not tested';
    }
    
    const typeClass = result.type === 'resistance' || result.type === 'eject' ? 'resistance' : 'support';
    
    return `
      <div class="level-row ${statusClass}">
        <div class="level-info">
          <div class="level-indicator ${typeClass}"></div>
          <div class="level-details">
            <div class="level-name">${result.level}</div>
            <div class="level-price">$${result.price.toFixed(2)}</div>
          </div>
        </div>
        <div class="level-result">
          <span class="status-icon">${statusIcon}</span>
          <span class="status-text">${statusText}</span>
        </div>
      </div>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flacko AI - EOD Accuracy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      font-family: 'Segoe UI', 'Roboto', sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #fff;
    }
    .container { width: 1200px; padding: 32px; }
    
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { font-size: 24px; font-weight: 700; }
    .title { font-size: 18px; color: #888; margin-left: 24px; }
    .date { font-size: 14px; color: #666; margin-left: 12px; }
    .mode-badge { display: flex; align-items: center; gap: 12px; }
    .mode { padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 15px; text-transform: uppercase; }
    .mode.defensive { background: #dc2626; }
    .mode.orange { background: #f97316; }
    .mode.yellow { background: #eab308; }
    .mode.accumulation { background: #22c55e; }
    
    /* Accuracy Summary */
    .accuracy-summary {
      background: rgba(124,58,237,0.1);
      border: 2px solid rgba(124,58,237,0.3);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .summary-main { flex: 1; }
    .summary-title { font-size: 14px; color: #a78bfa; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .summary-percentage {
      font-size: 48px;
      font-weight: 700;
      color: #fff;
      line-height: 1;
    }
    .summary-subtitle { font-size: 16px; color: #999; margin-top: 8px; }
    .summary-stats {
      display: flex;
      gap: 32px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }
    .stat-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .stat-item.hit .stat-value { color: #22c55e; }
    .stat-item.broken .stat-value { color: #ef4444; }
    .stat-item.not-tested .stat-value { color: #666; }
    
    /* OHLC Bar */
    .ohlc-bar {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 16px 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-around;
    }
    .ohlc-item {
      text-align: center;
    }
    .ohlc-label {
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .ohlc-value {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
    }
    
    /* Levels Table */
    .levels-container {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 20px;
    }
    .levels-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #fff;
    }
    .level-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .level-row:last-child { margin-bottom: 0; }
    .level-row.hit { border-left: 4px solid #22c55e; }
    .level-row.broken { border-left: 4px solid #ef4444; }
    .level-row.not-tested { border-left: 4px solid #444; }
    .level-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .level-indicator {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }
    .level-indicator.resistance { background: #22c55e; }
    .level-indicator.support { background: #ef4444; }
    .level-details {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }
    .level-name {
      font-size: 14px;
      color: #999;
    }
    .level-price {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }
    .level-result {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-icon {
      font-size: 18px;
    }
    .status-text {
      font-size: 14px;
      color: #ccc;
    }
    
    /* Footer */
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer-url {
      font-weight: 700;
      color: #a78bfa;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">
        <div class="logo">⚔️ flacko ai</div>
        <div class="title">EOD Accuracy Check</div>
        <div class="date">${date}</div>
      </div>
      <div class="mode-badge">
        <div class="mode ${modeClass}">${modeEmoji} ${mode}</div>
      </div>
    </div>
    
    <div class="accuracy-summary">
      <div class="summary-main">
        <div class="summary-title">Overall Accuracy</div>
        <div class="summary-percentage">${accuracy.percentage.toFixed(0)}%</div>
        <div class="summary-subtitle">${accuracy.hit + accuracy.notTested} of ${accuracy.total} levels accurate</div>
      </div>
      <div class="summary-stats">
        <div class="stat-item hit">
          <div class="stat-value">${accuracy.hit}</div>
          <div class="stat-label">Hit</div>
        </div>
        <div class="stat-item not-tested">
          <div class="stat-value">${accuracy.notTested}</div>
          <div class="stat-label">Not Tested</div>
        </div>
        <div class="stat-item broken">
          <div class="stat-value">${accuracy.broken}</div>
          <div class="stat-label">Broken</div>
        </div>
      </div>
    </div>
    
    <div class="ohlc-bar">
      <div class="ohlc-item">
        <div class="ohlc-label">Open</div>
        <div class="ohlc-value">$${ohlc.open.toFixed(2)}</div>
      </div>
      <div class="ohlc-item">
        <div class="ohlc-label">High</div>
        <div class="ohlc-value">$${ohlc.high.toFixed(2)}</div>
      </div>
      <div class="ohlc-item">
        <div class="ohlc-label">Low</div>
        <div class="ohlc-value">$${ohlc.low.toFixed(2)}</div>
      </div>
      <div class="ohlc-item">
        <div class="ohlc-label">Close</div>
        <div class="ohlc-value">$${ohlc.close.toFixed(2)}</div>
      </div>
    </div>
    
    <div class="levels-container">
      <div class="levels-title">Level Performance</div>
      ${levelRows}
    </div>
    
    <div class="footer">
      Track our accuracy over time at
      <span class="footer-url">flacko.ai/accuracy</span>
    </div>
  </div>
</body>
</html>`;
}

export async function generateEODAccuracyCard(date: string): Promise<EODAccuracyCardResult> {
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();
    
    // Get report for the date
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("extracted_data, report_date")
      .eq("report_date", date)
      .single();
    
    if (reportError || !report) {
      return { error: `Report not found for ${date}` };
    }
    
    const extracted = report.extracted_data as any;
    
    if (!extracted?.alerts || extracted.alerts.length === 0) {
      return { error: "No alert levels found in report" };
    }
    
    // Get OHLC data for the date
    const priceData = await getIntradayPriceData(date);
    
    if (priceData.high === 0) {
      return { error: "No price data available for this date" };
    }
    
    // Compare levels
    const results = compareLevels(
      extracted.alerts,
      {
        open: priceData.open,
        high: priceData.high,
        low: priceData.low,
        close: priceData.close
      }
    );
    
    const accuracy = calculateAccuracy(results);
    
    const mode = extracted.mode?.current || "YELLOW";
    const modeEmoji = getModeEmoji(mode);
    const modeClass = getModeClass(mode);
    
    const cardData = {
      mode,
      modeEmoji,
      modeClass,
      date,
      ohlc: {
        open: priceData.open,
        high: priceData.high,
        low: priceData.low,
        close: priceData.close
      },
      accuracy,
      results
    };
    
    const html = generateHTML(cardData);
    
    return {
      html,
      data: cardData
    };
  } catch (error) {
    console.error("EOD accuracy card generation error:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
