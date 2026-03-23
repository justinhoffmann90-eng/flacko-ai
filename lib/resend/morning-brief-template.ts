import { TrafficLightMode } from "@/types";
import { formatPrice, formatPercent } from "@/lib/utils";

interface MorningBriefEmailProps {
  userName: string;
  mode: TrafficLightMode;
  reportDate: string;
  closePrice: number;
  changePct: number;
  modeSummary?: string;
  currentStance?: string;
  dailyCapPct?: number;
  correctionRisk?: string;
  // Macro Translation
  macroContext?: string;
  // Key Levels
  keyLevels?: {
    gamma_strike?: number;
    put_wall?: number;
    call_wall?: number;
    hedge_wall?: number;
    master_eject?: number;
  };
  masterEject?: { price: number; action: string };
  // EMAs
  emas?: { ema8?: number; ema21?: number; ema50?: number; ema200?: number };
  // Flow / Gamma
  gammaRegime?: string;
  hiroReading?: number;
  // Catalysts
  catalystWatch?: string;
  // Game Plan
  todayGameplan?: string;
  // Alerts
  alerts?: { type: "upside" | "downside"; level_name: string; price: number; action: string; reason?: string }[];
  // Entry Quality
  entryQualityScore?: number;
}

export function getMorningBriefEmailHtml(props: MorningBriefEmailProps): string {
  const {
    mode, reportDate, closePrice, changePct, modeSummary, currentStance,
    dailyCapPct, correctionRisk, macroContext, keyLevels, masterEject,
    emas, gammaRegime, hiroReading, catalystWatch, todayGameplan,
    alerts, entryQualityScore,
  } = props;

  const modeColors: Record<string, string> = {
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
  };
  const modeEmoji: Record<string, string> = { green: "🟢", yellow: "🟡", orange: "🟠", red: "🔴" };
  const modeColor = modeColors[mode] || modeColors.yellow;

  const modeGuidance: Record<string, string> = {
    green: "Full deployment. Trim slowly — let winners run.",
    yellow: "Spread entries over 5-6 days minimum. Tighter stops.",
    orange: "Small nibbles only at key support. Bounces are suspect.",
    red: "Defensive stance. Protect capital. Bounces are exits.",
  };

  const card = (content: string, opts?: { border?: string; bg?: string }) => {
    const bg = opts?.bg || "#18181b";
    return `<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${bg}" style="background-color: ${bg} !important; border-radius: 8px; margin-bottom: 16px;${opts?.border ? ` border: ${opts.border};` : ""}"><tr><td bgcolor="${bg}" style="padding: 20px; background-color: ${bg} !important;">${content}</td></tr></table>`;
  };

  const renderNarrative = (text?: string) => {
    if (!text?.trim()) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^[•]\s+(.*)$/gm, '<li style="margin-bottom: 4px;">$1</li>')
      .replace(/\n\n+/g, '</p><p style="margin: 0 0 10px 0;">')
      .replace(/\n/g, "<br />")
      .replace(
        /(<li[^>]*>.*?<\/li>(?:<br \/>)?)+/gs,
        (match) => `<ul style="margin: 6px 0; padding-left: 18px;">${match.replace(/<br \/>/g, "")}</ul>`
      );
  };

  // --- Mode Banner ---
  const modeBanner = card(`
    <div style="text-align: center;">
      <span style="display: inline-block; background-color: ${modeColor}20; border: 2px solid ${modeColor}; border-radius: 8px; padding: 12px 24px;">
        <span style="color: ${modeColor}; font-weight: bold; font-size: 22px;">${modeEmoji[mode] || ""} ${mode.toUpperCase()} MODE</span>
      </span>
      <p style="color: #f9fafb; margin: 12px 0 4px 0; font-size: 32px; font-weight: 700;">
        ${formatPrice(closePrice)}
        <span style="color: ${changePct >= 0 ? "#22c55e" : "#ef4444"}; font-size: 16px; margin-left: 6px;">${formatPercent(changePct)}</span>
      </p>
      <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 13px;">${modeGuidance[mode] || ""}</p>
    </div>
    ${currentStance || dailyCapPct !== undefined || entryQualityScore !== undefined ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; border-top: 1px solid #374151; padding-top: 8px;">
      ${currentStance ? `<tr><td style="padding: 4px 0; color: #9ca3af; font-size: 13px; width: 120px;">Lean</td><td style="padding: 4px 0; color: #f9fafb; font-size: 13px; font-weight: 600;">${currentStance}</td></tr>` : ""}
      ${dailyCapPct !== undefined ? `<tr><td style="padding: 4px 0; color: #9ca3af; font-size: 13px;">Daily Cap</td><td style="padding: 4px 0; color: #d1d5db; font-size: 13px;">${dailyCapPct}%</td></tr>` : ""}
      ${entryQualityScore !== undefined ? `<tr><td style="padding: 4px 0; color: #9ca3af; font-size: 13px;">Entry Quality</td><td style="padding: 4px 0; color: #d1d5db; font-size: 13px;">${entryQualityScore}/10</td></tr>` : ""}
      ${correctionRisk ? `<tr><td style="padding: 4px 0; color: #9ca3af; font-size: 13px;">Correction Risk</td><td style="padding: 4px 0; color: #fca5a5; font-size: 13px; font-weight: 600;">${correctionRisk}</td></tr>` : ""}
    </table>` : ""}
  `);

  // --- Macro Translation ---
  const macroSection = macroContext ? card(`
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb !important;">🌍 Macro Translation</h2>
    <div style="color: #d1d5db !important; font-size: 14px; line-height: 1.6;"><p style="margin: 0 0 10px 0;">${renderNarrative(macroContext)}</p></div>
  `) : "";

  // --- Key Levels ---
  const upsideAlerts = (alerts || []).filter(a => a.type === "upside").sort((a, b) => a.price - b.price);
  const downsideAlerts = (alerts || []).filter(a => a.type === "downside").sort((a, b) => b.price - a.price);

  const levelRow = (label: string, price: number, action: string, color: string) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #374151;">
        <span style="color: ${color}; font-weight: 600;">${formatPrice(price)}</span>
        <span style="color: #9ca3af; font-size: 12px; margin-left: 6px;">${label}</span>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #374151; color: #d1d5db; font-size: 13px;">${action}</td>
    </tr>`;

  const levelsContent = (upsideAlerts.length > 0 || downsideAlerts.length > 0) ? card(`
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb !important;">📊 Key Levels</h2>
    ${upsideAlerts.length > 0 ? `
      <p style="color: #22c55e; font-weight: 600; font-size: 13px; margin: 0 0 4px 0;">▲ UPSIDE</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; margin-bottom: 12px;">
        ${upsideAlerts.map(a => levelRow(a.level_name, a.price, a.action, "#22c55e")).join("")}
      </table>` : ""}
    ${downsideAlerts.length > 0 ? `
      <p style="color: #ef4444; font-weight: 600; font-size: 13px; margin: 0 0 4px 0;">▼ DOWNSIDE</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        ${downsideAlerts.map(a => levelRow(a.level_name, a.price, a.action, "#ef4444")).join("")}
      </table>` : ""}
  `) : "";

  // --- EMAs ---
  const emaSection = emas && (emas.ema8 || emas.ema21 || emas.ema50 || emas.ema200) ? card(`
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb !important;">📈 Moving Averages</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
      ${emas.ema8 ? `<tr><td style="padding: 4px 0; color: #9ca3af; width: 80px;">8 EMA</td><td style="color: #d1d5db;">${formatPrice(emas.ema8)}</td></tr>` : ""}
      ${emas.ema21 ? `<tr><td style="padding: 4px 0; color: #9ca3af;">21 EMA</td><td style="color: #d1d5db;">${formatPrice(emas.ema21)}</td></tr>` : ""}
      ${emas.ema50 ? `<tr><td style="padding: 4px 0; color: #9ca3af;">50 SMA</td><td style="color: #d1d5db;">${formatPrice(emas.ema50)}</td></tr>` : ""}
      ${emas.ema200 ? `<tr><td style="padding: 4px 0; color: #9ca3af;">200 SMA</td><td style="color: #d1d5db;">${formatPrice(emas.ema200)}</td></tr>` : ""}
    </table>
  `) : "";

  // --- Flow / Gamma ---
  const flowItems = [
    gammaRegime ? `Gamma Regime: ${gammaRegime}` : "",
    hiroReading !== undefined ? `HIRO Reading: ${hiroReading}` : "",
    keyLevels?.gamma_strike ? `Gamma Strike: ${formatPrice(keyLevels.gamma_strike)}` : "",
    keyLevels?.hedge_wall ? `Hedge Wall: ${formatPrice(keyLevels.hedge_wall)}` : "",
    keyLevels?.put_wall ? `Put Wall: ${formatPrice(keyLevels.put_wall)}` : "",
    keyLevels?.call_wall ? `Call Wall: ${formatPrice(keyLevels.call_wall)}` : "",
  ].filter(Boolean);

  const flowSection = flowItems.length > 0 ? card(`
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb !important;">🔮 Flow & Gamma</h2>
    <ul style="margin: 0; padding-left: 18px; color: #d1d5db !important; font-size: 14px; line-height: 1.8;">
      ${flowItems.map(i => `<li>${i}</li>`).join("")}
    </ul>
  `) : "";

  // --- Master Eject ---
  const ejectSection = masterEject ? card(`
    <p style="margin: 0; color: #fca5a5 !important; font-size: 14px;">
      ⚠️ <strong>Kill Leverage: ${formatPrice(masterEject.price)}</strong> — ${masterEject.action}
    </p>
  `, { border: "1px solid #991b1b" }) : "";

  // --- Catalysts ---
  const catalystSection = catalystWatch ? card(`
    <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #f9fafb !important;">📅 Catalysts</h2>
    <p style="margin: 0; color: #d1d5db !important; font-size: 13px; line-height: 1.6;">${renderNarrative(catalystWatch)}</p>
  `) : "";

  // --- Game Plan ---
  const gameplanSection = todayGameplan ? card(`
    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb !important;">🎯 Game Plan</h2>
    <div style="color: #d1d5db !important; font-size: 14px; line-height: 1.6;"><p style="margin: 0 0 10px 0;">${renderNarrative(todayGameplan)}</p></div>
  `) : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
  <style>
    :root { color-scheme: dark only; }
    * { color-scheme: dark only; }
    body, .body, .wrapper, table, td, div { background-color: #0a0a0a !important; }
    .card { background-color: #18181b !important; }
    u + .body .gmail-blend-screen { background:#000 !important; }
    u + .body .gmail-blend-difference { background:#000 !important; }
    @media (prefers-color-scheme: light) {
      body, .body, .wrapper, table, td, div { background-color: #0a0a0a !important; }
      .card { background-color: #18181b !important; }
    }
  </style>
</head>
<body class="body" bgcolor="#0a0a0a" style="margin: 0; padding: 0; background-color: #0a0a0a !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f9fafb;">
  <div class="wrapper" style="background-color: #0a0a0a !important; width: 100%; table-layout: fixed;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color: #0a0a0a !important;">
    <tr>
      <td align="center" bgcolor="#0a0a0a" style="padding: 0; background-color: #0a0a0a !important;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="background-color: #18181b !important; border-radius: 8px; margin-bottom: 16px;"><tr><td bgcolor="#18181b" style="padding: 24px; background-color: #18181b !important;">
      <h1 style="color: #f9fafb !important; margin: 0 0 4px 0; font-size: 22px;">☀️ TSLA Morning Brief</h1>
      <p style="color: #9ca3af !important; margin: 0; font-size: 13px;">${reportDate}</p>
    </td></tr></table>

    ${modeBanner}
    ${macroSection}
    ${levelsContent}
    ${emaSection}
    ${flowSection}
    ${ejectSection}
    ${catalystSection}
    ${gameplanSection}

    <!-- CTA -->
    <div style="text-align: center; padding: 16px;">
      <a href="https://www.flacko.ai/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">View Full Report →</a>
    </div>

    <div style="text-align: center; padding: 14px; color: #6b7280; font-size: 12px;">
      <a href="https://www.flacko.ai/settings" style="color: #9ca3af;">Manage email preferences</a>
    </div>
  </div>
      </td>
    </tr>
  </table>
  </div>
</body>
</html>`;
}
