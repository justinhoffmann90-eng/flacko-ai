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
                  ⚠️ <strong>Kill Leverage:</strong> $${keyLevels.masterEject}${keyLevels.masterEjectAction ? ` — ${keyLevels.masterEjectAction}` : ' — See daily report for action steps'}
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
              <span style="color: #9ca3af !important; font-size: 12px;"> — ${modeInfo.cap}</span>
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

export function getNewReportEmailHtml({
  userName,
  mode,
  reportDate,
  closePrice,
  changePct,
}: {
  userName: string;
  mode: TrafficLightMode;
  reportDate: string;
  closePrice: number;
  changePct: number;
}) {
  const modeColors = {
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <h1 style="color: #f9fafb; margin: 0 0 8px 0; font-size: 24px;">
            New TSLA Report Available
          </h1>
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            ${reportDate}
          </p>
        </div>

        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; background-color: ${modeColors[mode]}20; border: 2px solid ${modeColors[mode]}; border-radius: 8px; padding: 16px 32px;">
              <span style="color: ${modeColors[mode]}; font-weight: bold; font-size: 24px; text-transform: uppercase;">${mode} MODE</span>
            </div>
          </div>

          <div style="text-align: center;">
            <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">TSLA Close</p>
            <p style="color: #f9fafb; margin: 0; font-size: 32px; font-weight: bold;">
              ${formatPrice(closePrice)}
              <span style="color: ${changePct >= 0 ? "#22c55e" : "#ef4444"}; font-size: 18px; margin-left: 8px;">
                ${formatPercent(changePct)}
              </span>
            </p>
          </div>
        </div>

        <div style="text-align: center; padding: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Read Today's Report
          </a>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9ca3af;">Unsubscribe from report emails</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
