// Discord webhook client for sending alerts
// No dependencies needed - uses native fetch

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_REPORTS_WEBHOOK_URL = process.env.DISCORD_REPORTS_WEBHOOK_URL;
const DISCORD_ALERTS_WEBHOOK_URL = process.env.DISCORD_ALERTS_WEBHOOK_URL;

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
}

export async function sendDiscordMessage(message: DiscordMessage): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL is not set");
    return false;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Discord webhook error: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord message:", error);
    return false;
  }
}

// Send alert to #alerts channel (price alerts, mode changes, etc.)
export async function sendAlertMessage(message: DiscordMessage): Promise<boolean> {
  // Use dedicated alerts webhook, fall back to generic webhook
  const webhookUrl = DISCORD_ALERTS_WEBHOOK_URL || DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error("No Discord webhook URL configured for alerts");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Discord alerts webhook error: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord alert:", error);
    return false;
  }
}

// Send report notification to #reports channel
export async function sendReportNotification(message: DiscordMessage): Promise<boolean> {
  const webhookUrl = DISCORD_REPORTS_WEBHOOK_URL || DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error("No Discord webhook URL configured for reports");
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(`Discord reports webhook error: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending Discord report notification:", error);
    return false;
  }
}

// Color codes for embeds (decimal format)
export const DISCORD_COLORS = {
  green: 0x22c55e,
  yellow: 0xeab308,
  red: 0xef4444,
  blue: 0x3b82f6,
};
