import { ReportAlert, TrafficLightMode } from "@/types";
import { formatPrice, formatPercent } from "@/lib/utils";

// Mode descriptions for context
const modeDescriptions: Record<TrafficLightMode, { emoji: string; cap: string; guidance: string }> = {
  green: {
    emoji: "🟢",
    cap: "Full position (20%)",
    guidance: "Favorable conditions for swing entries. Consider adding on dips to key levels.",
  },
  yellow: {
    emoji: "🟡", 
    cap: "Reduced (15%)",
    guidance: "Proceed with caution. Tighter stops, smaller positions. Wait for clearer signals.",
  },
  red: {
    emoji: "🔴",
    cap: "Minimal (10%)",
    guidance: "Defensive stance. Protect capital. Only trade with tight risk management.",
  },
};

// Orange mode (between yellow and red)
const orangeMode = {
  emoji: "🟠",
  cap: "10% daily cap",
  guidance: "Elevated caution. Respect key levels. Size positions conservatively.",
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
      <div style="background-color: #374151; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="color: ${alert.type === "upside" ? "#22c55e" : "#ef4444"}; font-weight: bold; font-size: 16px;">
            ${alert.type === "upside" ? "▲" : "▼"} ${alert.level_name}
          </span>
          <span style="color: #f9fafb; font-weight: bold; font-size: 18px;">${formatPrice(alert.price)}</span>
        </div>
        <p style="color: #d1d5db; margin: 0 0 8px 0; font-size: 14px;">
          <strong>Action:</strong> ${alert.action}
        </p>
        ${alert.reason ? `
        <p style="color: #9ca3af; margin: 0; font-size: 13px; font-style: italic;">
          💡 ${alert.reason}
        </p>
        ` : ""}
      </div>
    `
    )
    .join("");

  // Build key levels section if provided
  const keyLevelsHtml = keyLevels ? `
    <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
      <h2 style="color: #f9fafb; margin: 0 0 16px 0; font-size: 16px;">📍 Key Levels to Watch</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${keyLevels.callWall ? `
        <div style="background-color: #374151; border-radius: 6px; padding: 12px;">
          <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Call Wall (Resistance)</p>
          <p style="color: #22c55e; margin: 0; font-size: 16px; font-weight: bold;">$${keyLevels.callWall}</p>
        </div>
        ` : ""}
        ${keyLevels.gammaStrike ? `
        <div style="background-color: #374151; border-radius: 6px; padding: 12px;">
          <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Gamma Strike (Pivot)</p>
          <p style="color: #eab308; margin: 0; font-size: 16px; font-weight: bold;">$${keyLevels.gammaStrike}</p>
        </div>
        ` : ""}
        ${keyLevels.hedgeWall ? `
        <div style="background-color: #374151; border-radius: 6px; padding: 12px;">
          <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Hedge Wall (Support)</p>
          <p style="color: #3b82f6; margin: 0; font-size: 16px; font-weight: bold;">$${keyLevels.hedgeWall}</p>
        </div>
        ` : ""}
        ${keyLevels.putWall ? `
        <div style="background-color: #374151; border-radius: 6px; padding: 12px;">
          <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase;">Put Wall (Major Support)</p>
          <p style="color: #ef4444; margin: 0; font-size: 16px; font-weight: bold;">$${keyLevels.putWall}</p>
        </div>
        ` : ""}
      </div>
      ${keyLevels.masterEject ? `
      <div style="margin-top: 12px; background-color: #7f1d1d; border: 1px solid #ef4444; border-radius: 6px; padding: 12px;">
        <p style="color: #fca5a5; margin: 0; font-size: 12px;">
          ⚠️ <strong>Master Eject:</strong> $${keyLevels.masterEject} — Exit all positions if breached
        </p>
      </div>
      ` : ""}
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <h1 style="color: #f9fafb; margin: 0; font-size: 24px;">
            🚨 TSLA Alert Triggered
          </h1>
        </div>

        <!-- Price + Mode -->
        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <div style="margin-bottom: 16px;">
            <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Current Price</p>
            <p style="color: #f9fafb; margin: 0; font-size: 32px; font-weight: bold;">${formatPrice(currentPrice)}</p>
          </div>
          <div style="background-color: ${modeColor}20; border: 1px solid ${modeColor}; border-radius: 6px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: ${modeColor}; font-weight: bold; text-transform: uppercase; font-size: 16px;">
                ${modeInfo.emoji} ${displayMode.toUpperCase()} MODE
              </span>
              <span style="color: #9ca3af; font-size: 12px;">${modeInfo.cap}</span>
            </div>
            <p style="color: #d1d5db; margin: 0; font-size: 13px;">${modeInfo.guidance}</p>
          </div>
        </div>

        <!-- Triggered Alerts with Details -->
        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #f9fafb; margin: 0 0 16px 0; font-size: 18px;">Triggered Alerts</h2>
          ${alertDetails}
        </div>

        <!-- Key Levels -->
        ${keyLevelsHtml}

        ${positioning ? `
        <!-- Positioning Context -->
        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #f9fafb; margin: 0 0 12px 0; font-size: 16px;">📊 Current Posture</h2>
          <p style="color: #d1d5db; margin: 0; font-size: 14px;">${positioning}</p>
        </div>
        ` : ""}

        <!-- CTA -->
        <div style="text-align: center; padding: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">
            View Full Report
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">
            Automated alert from Flacko AI
          </p>
          <p style="margin: 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9ca3af;">Manage alert settings</a>
          </p>
        </div>
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
