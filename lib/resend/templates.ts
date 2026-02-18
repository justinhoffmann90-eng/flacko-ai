import { ReportAlert, TrafficLightMode } from "@/types";
import { formatPrice, formatPercent } from "@/lib/utils";

// Mode descriptions for context
const modeDescriptions: Record<TrafficLightMode, { emoji: string; cap: string; trimCap: string; guidance: string }> = {
  green: {
    emoji: "🟢",
    cap: "up to 30%",
    trimCap: "10% of remaining per level",
    guidance: "Favorable conditions for swing entries. Full deployment permitted. Trim slowly -- let winners run.",
  },
  yellow: {
    emoji: "🟡",
    cap: "17.5%",
    trimCap: "20% of remaining per level",
    guidance: "Warning signs present. Spread entries over 5-6 days minimum. Tighter stops.",
  },
  red: {
    emoji: "🔴",
    cap: "5% or less",
    trimCap: "30% of remaining per level",
    guidance: "Defensive stance. Protect capital. Nibbles only at extreme support. Bounces are exits.",
  },
};

// Orange mode (between yellow and red)
const orangeMode = {
  emoji: "🟠",
  cap: "10% or less",
  trimCap: "25% of remaining per level",
  guidance: "Elevated caution. Small nibbles only at key support. Bounces are suspect -- trim faster.",
};

export function getAlertEmailHtml({
  userName,
  alerts,
  currentPrice,
  mode,
  reportDate,
  keyLevels,
  positioning,
}: {
  userName: string;
  alerts: ReportAlert[];
  currentPrice: number;
  mode: TrafficLightMode;
  reportDate: string;
  keyLevels?: {
    hedgeWall?: number;
    gammaStrike?: number;
    putWall?: number;
    callWall?: number;
    masterEject?: number;
    masterEjectAction?: string;
  };
  positioning?: string;
}) {
  const modeColors: Record<string, string> = {
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
  };

  // Determine if this is orange mode (mode is yellow but we treat it as orange based on context)
  const displayMode = mode === "yellow" ? "orange" : mode;
  const modeColor = modeColors[displayMode] || modeColors.yellow;
  const modeInfo = displayMode === "orange" ? orangeMode : modeDescriptions[mode];

  // Build alert details with reasons
  const alertDetails = alerts
    .map(
      (alert) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
        <tr>
          <td bgcolor="#27272a" style="background-color: #27272a !important; border-radius: 6px; padding: 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="color: ${alert.type === "upside" ? "#22c55e" : "#ef4444"} !important; font-weight: bold; font-size: 16px;">
                  ${alert.type === "upside" ? "▲" : "▼"} ${alert.level_name}
                </td>
                <td align="right" style="color: #f9fafb !important; font-weight: bold; font-size: 18px;">${formatPrice(alert.price)}</td>
              </tr>
            </table>
            <p style="color: #d1d5db !important; margin: 12px 0 8px 0; font-size: 14px;">
              <strong>Action:</strong> ${alert.action}
            </p>
            ${alert.reason ? `
            <p style="color: #9ca3af !important; margin: 0; font-size: 13px; font-style: italic;">
              💡 ${alert.reason}
            </p>
            ` : ""}
          </td>
        </tr>
      </table>
    `
    )
    .join("");

  // Build key levels section if provided (only Master Eject / Kill Leverage)
  const keyLevelsHtml = keyLevels?.masterEject ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="background-color: #18181b !important; border-radius: 8px; margin-bottom: 20px;">
      <tr>
        <td bgcolor="#18181b" style="padding: 24px; background-color: #18181b !important;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td bgcolor="#450a0a" style="background-color: #450a0a !important; border: 1px solid #ef4444; border-radius: 6px; padding: 12px;">
                <p style="color: #fca5a5 !important; margin: 0; font-size: 12px;">
                  ⚠️ <strong>Kill Leverage:</strong> $${keyLevels.masterEject}${keyLevels.masterEjectAction ? ` - ${keyLevels.masterEjectAction}` : ' - See daily report for action steps'}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  ` : "";

  return `
    <!DOCTYPE html>
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
        .card-inner { background-color: #27272a !important; }
        u + .body .gmail-blend-screen { background:#000 !important; }
        u + .body .gmail-blend-difference { background:#000 !important; }
        @media (prefers-color-scheme: light) {
          body, .body, .wrapper, table, td, div { background-color: #0a0a0a !important; }
        }
      </style>
    </head>
    <body class="body" bgcolor="#0a0a0a" style="margin: 0; padding: 0; background-color: #0a0a0a !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f9fafb;">
      <div class="wrapper" style="background-color: #0a0a0a !important; width: 100%; table-layout: fixed;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color: #0a0a0a !important; max-width: 600px; margin: 0 auto;">
        <tr>
          <td align="center" bgcolor="#0a0a0a" style="padding: 20px; background-color: #0a0a0a !important;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a !important;">

        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="background-color: #18181b !important; border-radius: 8px; margin-bottom: 20px;">
          <tr>
            <td bgcolor="#18181b" style="padding: 24px; background-color: #18181b !important;">
              <h1 style="color: #f9fafb !important; margin: 0; font-size: 24px;">
                🚨 TSLA Alert Triggered
              </h1>
            </td>
          </tr>
        </table>

        <!-- Price + Mode -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="background-color: #18181b !important; border-radius: 8px; margin-bottom: 20px;">
          <tr>
            <td bgcolor="#18181b" style="padding: 24px; background-color: #18181b !important;">
          <div style="margin-bottom: 16px;">
            <p style="color: #9ca3af !important; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Current Price</p>
            <p style="color: #f9fafb !important; margin: 0; font-size: 32px; font-weight: bold;">${formatPrice(currentPrice)}</p>
          </div>
          <div style="background-color: ${modeColor}20 !important; border: 1px solid ${modeColor}; border-radius: 6px; padding: 12px;">
            <p style="margin: 0 0 8px 0;">
              <span style="color: ${modeColor} !important; font-weight: bold; text-transform: uppercase; font-size: 16px;">
                ${modeInfo.emoji} ${displayMode.toUpperCase()} MODE
              </span>
              <span style="color: #9ca3af !important; font-size: 12px;"> - ${modeInfo.cap}</span>
            </p>
            <p style="color: #d1d5db !important; margin: 0; font-size: 13px;">${modeInfo.guidance}</p>
          </div>
            </td>
          </tr>
        </table>

        <!-- Triggered Alerts with Details -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="background-color: #18181b !important; border-radius: 8px; margin-bottom: 20px;">
          <tr>
            <td bgcolor="#18181b" style="padding: 24px; background-color: #18181b !important;">
              <h2 style="color: #f9fafb !important; margin: 0 0 16px 0; font-size: 18px;">Triggered Alerts</h2>
              ${alertDetails}
            </td>
          </tr>
        </table>

        <!-- Key Levels -->
        ${keyLevelsHtml}

        ${positioning ? `
        <!-- Positioning Context -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#18181b" style="background-color: #18181b !important; border-radius: 8px; margin-bottom: 20px;">
          <tr>
            <td bgcolor="#18181b" style="padding: 24px; background-color: #18181b !important;">
              <h2 style="color: #f9fafb !important; margin: 0 0 12px 0; font-size: 16px;">📊 Current Posture</h2>
              <p style="color: #d1d5db !important; margin: 0; font-size: 14px;">${positioning}</p>
            </td>
          </tr>
        </table>
        ` : ""}

        <!-- CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" bgcolor="#0a0a0a" style="padding: 20px; background-color: #0a0a0a !important;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/report" style="display: inline-block; background-color: #ffffff !important; color: #0a0a0a !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                View Full Report
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" bgcolor="#0a0a0a" style="padding: 20px; background-color: #0a0a0a !important; color: #6b7280 !important; font-size: 12px;">
              <p style="margin: 0 0 8px 0; color: #6b7280 !important;">
                Automated alert from Flacko AI
              </p>
              <p style="margin: 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9ca3af !important;">Manage alert settings</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
          </td>
        </tr>
      </table>
      </div>
    </body>
    </html>
  `;
}

// Types for structured alert/level data in email
interface EmailAlert {
  type: "upside" | "downside";
  level_name: string;
  price: number;
  action: string;
  reason?: string;
}

interface EmailLevelMap {
  type?: string;
  level: string;
  price: number;
  action: string;
}

export function getNewReportEmailHtml({
  userName,
  mode,
  reportDate,
  closePrice,
  changePct,
  modeSummary,
  currentStance,
  dailyCapPct,
  correctionRisk,
  tiers,
  keyLevels,
  hiroReading,
  slowZoneActive,
  slowZone,
  masterEject,
  gammaRegime,
  entryQualityScore,
  alerts,
  levelsMap,
}: {
  userName: string;
  mode: TrafficLightMode;
  reportDate: string;
  closePrice: number;
  changePct: number;
  modeSummary?: string;
  currentStance?: string;
  dailyCapPct?: number;
  correctionRisk?: string;
  tiers?: { long?: string; medium?: string; short?: string; hourly?: string };
  keyLevels?: {
    gamma_strike?: number;
    put_wall?: number;
    call_wall?: number;
    hedge_wall?: number;
    master_eject?: number;
  };
  hiroReading?: number;
  slowZoneActive?: boolean;
  slowZone?: number;
  masterEject?: { price: number; action: string };
  gammaRegime?: string;
  entryQualityScore?: number;
  alerts?: EmailAlert[];
  levelsMap?: EmailLevelMap[];
}) {
  const modeColors: Record<string, string> = {
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    red: "#ef4444",
  };

  const modeColor = modeColors[mode] || modeColors.yellow;
  const modeEmoji: Record<string, string> = { green: "🟢", yellow: "🟡", orange: "🟠", red: "🔴" };

  const modeGuidance: Record<string, string> = {
    green: "Full deployment. Trim slowly — let winners run.",
    yellow: "Spread entries over 5-6 days minimum. Tighter stops.",
    orange: "Small nibbles only at key support. Bounces are suspect.",
    red: "Defensive. Protect capital. Nibbles only at extreme support.",
  };

  // --- Build tier row ---
  const tierColors: Record<string, string> = { green: "#22c55e", yellow: "#eab308", orange: "#f97316", red: "#ef4444" };
  const tierDot = (t?: string) => t ? `<span style="color: ${tierColors[t] || "#9ca3af"};">●</span> ${t.toUpperCase()}` : "—";
  const tiersRow = tiers ? `
    <tr>
      <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Tiers</td>
      <td style="padding: 6px 0; color: #d1d5db; font-size: 13px;">L ${tierDot(tiers.long)} · M ${tierDot(tiers.medium)} · S ${tierDot(tiers.short)} · H ${tierDot(tiers.hourly)}</td>
    </tr>` : "";

  // --- Build upside alerts ---
  const upsideAlerts = (alerts || []).filter(a => a.type === "upside").sort((a, b) => a.price - b.price);
  const downsideAlerts = (alerts || []).filter(a => a.type === "downside").sort((a, b) => b.price - a.price);

  const alertRow = (a: EmailAlert, color: string) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #374151;">
        <span style="color: ${color}; font-weight: 600;">${formatPrice(a.price)}</span>
        <span style="color: #9ca3af; font-size: 12px; margin-left: 6px;">${a.level_name}</span>
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #374151; color: #d1d5db; font-size: 13px;">${a.action}</td>
    </tr>`;

  const upsideRows = upsideAlerts.map(a => alertRow(a, "#22c55e")).join("");
  const downsideRows = downsideAlerts.map(a => alertRow(a, "#ef4444")).join("");

  // --- Build SpotGamma row ---
  const spotgammaItems = [
    keyLevels?.gamma_strike ? `Gamma Strike: ${formatPrice(keyLevels.gamma_strike)}` : "",
    keyLevels?.hedge_wall ? `Hedge Wall: ${formatPrice(keyLevels.hedge_wall)}` : "",
    keyLevels?.put_wall ? `Put Wall: ${formatPrice(keyLevels.put_wall)}` : "",
    keyLevels?.call_wall ? `Call Wall: ${formatPrice(keyLevels.call_wall)}` : "",
    gammaRegime ? `Regime: ${gammaRegime}` : "",
  ].filter(Boolean);

  const spotgammaSection = spotgammaItems.length > 0 ? `
    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb;">SpotGamma Levels</h2>
      <ul style="margin: 0; padding-left: 18px; color: #d1d5db; font-size: 14px; line-height: 1.8;">
        ${spotgammaItems.map(i => `<li>${i}</li>`).join("")}
      </ul>
    </div>` : "";

  // --- Master eject warning ---
  const ejectSection = masterEject ? `
    <div style="background-color: #1f2937; border: 1px solid #991b1b; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; color: #fca5a5; font-size: 14px;">
        ⚠️ <strong>Kill Leverage: ${formatPrice(masterEject.price)}</strong> — ${masterEject.action}
      </p>
    </div>` : "";

  // --- Slow zone warning ---
  const slowZoneSection = slowZone && slowZoneActive ? `
    <div style="background-color: #1f2937; border: 1px solid #92400e; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <p style="margin: 0; color: #fbbf24; font-size: 14px;">
        ⚠️ <strong>Slow Zone ACTIVE</strong> at ${formatPrice(slowZone)} — daily cap reduced
      </p>
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <meta name="supported-color-schemes" content="dark only">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background-color: #18181b; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
      <h1 style="color: #f9fafb; margin: 0 0 4px 0; font-size: 22px;">TSLA Morning Gameplan</h1>
      <p style="color: #9ca3af; margin: 0; font-size: 13px;">${reportDate}</p>
    </div>

    <!-- Mode + Price Card -->
    <div style="background-color: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; background-color: ${modeColor}20; border: 2px solid ${modeColor}; border-radius: 6px; padding: 8px 14px;">
          <span style="color: ${modeColor}; font-weight: bold; font-size: 18px;">${modeEmoji[mode] || ""} ${mode.toUpperCase()} MODE</span>
        </span>
      </div>
      <p style="color: #f9fafb; margin: 0 0 4px 0; font-size: 28px; font-weight: 700;">
        ${formatPrice(closePrice)}
        <span style="color: ${changePct >= 0 ? "#22c55e" : "#ef4444"}; font-size: 16px; margin-left: 6px;">${formatPercent(changePct)}</span>
      </p>
      <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 13px;">${modeGuidance[mode] || ""}</p>

      <!-- Quick Stats Table -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px; border-top: 1px solid #374151; padding-top: 12px;">
        ${currentStance ? `<tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px; width: 120px;">Lean</td>
          <td style="padding: 6px 0; color: #f9fafb; font-size: 13px; font-weight: 600;">${currentStance}</td>
        </tr>` : ""}
        ${dailyCapPct !== undefined ? `<tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Daily Cap</td>
          <td style="padding: 6px 0; color: #d1d5db; font-size: 13px;">${dailyCapPct}%</td>
        </tr>` : ""}
        ${correctionRisk ? `<tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Correction Risk</td>
          <td style="padding: 6px 0; color: #fca5a5; font-size: 13px; font-weight: 600;">${correctionRisk}</td>
        </tr>` : ""}
        ${hiroReading !== undefined ? `<tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">HIRO</td>
          <td style="padding: 6px 0; color: #d1d5db; font-size: 13px;">${hiroReading}</td>
        </tr>` : ""}
        ${entryQualityScore !== undefined ? `<tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Entry Quality</td>
          <td style="padding: 6px 0; color: #d1d5db; font-size: 13px;">${entryQualityScore}/10</td>
        </tr>` : ""}
        ${gammaRegime ? `<tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Gamma</td>
          <td style="padding: 6px 0; color: #d1d5db; font-size: 13px;">${gammaRegime}</td>
        </tr>` : ""}
        ${tiersRow}
      </table>
    </div>

    ${ejectSection}
    ${slowZoneSection}

    <!-- Upside Levels -->
    ${upsideRows ? `
    <div style="background-color: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb;">▲ Upside Targets</h2>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        ${upsideRows}
      </table>
    </div>` : ""}

    <!-- Downside Levels -->
    ${downsideRows ? `
    <div style="background-color: #18181b; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
      <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #f9fafb;">▼ Downside Levels</h2>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        ${downsideRows}
      </table>
    </div>` : ""}

    ${spotgammaSection}

    <!-- CTA -->
    <div style="text-align: center; padding: 16px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">Open Full Report</a>
    </div>

    <div style="text-align: center; padding: 14px; color: #6b7280; font-size: 12px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9ca3af;">Manage email preferences</a>
    </div>
  </div>
</body>
</html>`;
}
