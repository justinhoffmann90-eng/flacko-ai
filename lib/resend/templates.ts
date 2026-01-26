import { ReportAlert, TrafficLightMode } from "@/types";
import { formatPrice, formatPercent } from "@/lib/utils";

export function getAlertEmailHtml({
  userName,
  alerts,
  currentPrice,
  mode,
  reportDate,
}: {
  userName: string;
  alerts: ReportAlert[];
  currentPrice: number;
  mode: TrafficLightMode;
  reportDate: string;
}) {
  const modeColors = {
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444",
  };

  const alertRows = alerts
    .map(
      (alert) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #374151;">
          <span style="color: ${alert.type === "upside" ? "#22c55e" : "#ef4444"}; font-weight: bold;">
            ${alert.type === "upside" ? "▲" : "▼"} ${alert.level_name}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #374151; text-align: right;">
          ${formatPrice(alert.price)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #374151;">
          ${alert.action}
        </td>
      </tr>
    `
    )
    .join("");

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
            TSLA Alert Triggered
          </h1>
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">
            ${reportDate}
          </p>
        </div>

        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <p style="color: #9ca3af; margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase;">Current Price</p>
              <p style="color: #f9fafb; margin: 0; font-size: 28px; font-weight: bold;">${formatPrice(currentPrice)}</p>
            </div>
            <div style="background-color: ${modeColors[mode]}20; border: 1px solid ${modeColors[mode]}; border-radius: 6px; padding: 8px 16px;">
              <span style="color: ${modeColors[mode]}; font-weight: bold; text-transform: uppercase;">${mode} MODE</span>
            </div>
          </div>
        </div>

        <div style="background-color: #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #f9fafb; margin: 0 0 16px 0; font-size: 18px;">Triggered Alerts</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #374151;">
                <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Level</th>
                <th style="padding: 12px; text-align: right; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Price</th>
                <th style="padding: 12px; text-align: left; color: #9ca3af; font-size: 12px; text-transform: uppercase;">Action</th>
              </tr>
            </thead>
            <tbody style="color: #f9fafb;">
              ${alertRows}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; padding: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/report" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
            View Full Report
          </a>
        </div>

        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">
            This is an automated alert from Flacko AI.
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
