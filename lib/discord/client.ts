// Discord webhook client for sending alerts
// No dependencies needed - uses native fetch

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_REPORTS_WEBHOOK_URL = process.env.DISCORD_REPORTS_WEBHOOK_URL;
const DISCORD_ALERTS_WEBHOOK_URL = process.env.DISCORD_ALERTS_WEBHOOK_URL;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export interface DiscordEmbed {
  title?: string;
  url?: string;
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
  username?: string;
}

export interface DiscordSendResult {
  success: boolean;
  messageId?: string;  // Only set when wait=true succeeds
  error?: string;
}

export async function sendDiscordMessage(message: DiscordMessage): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("DISCORD_WEBHOOK_URL is not set");
    return false;
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

/**
 * Send alert to #alerts channel.
 * Uses wait=true so we get the message ID back — required for delete/edit capability.
 * Returns { success, messageId } so the caller can store the ID for future management.
 */
export async function sendAlertMessage(message: DiscordMessage): Promise<DiscordSendResult> {
  const webhookUrl = DISCORD_ALERTS_WEBHOOK_URL || DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("No Discord webhook URL configured for alerts");
    return { success: false, error: "No webhook URL configured" };
  }

  try {
    // CRITICAL: ?wait=true makes Discord return the created message object (with its ID).
    // Without this we have no way to delete or edit the alert later.
    const response = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`Discord alerts webhook error: ${response.status} ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json() as { id?: string; channel_id?: string };
    const messageId = data.id;

    if (!messageId) {
      console.warn("[DISCORD] Alert sent but no message ID returned — delete/edit will not work");
    } else {
      console.log(`[DISCORD] Alert sent. Message ID: ${messageId} | Channel: ${data.channel_id}`);
    }

    return { success: true, messageId };
  } catch (error) {
    console.error("Error sending Discord alert:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a specific alert message by ID.
 * Requires DISCORD_BOT_TOKEN with MANAGE_MESSAGES permission in #alerts.
 */
export async function deleteAlertMessage(channelId: string, messageId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    console.error("[DISCORD] DISCORD_BOT_TOKEN not set — cannot delete messages");
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "User-Agent": "DiscordBot (https://flacko.ai, 1.0)",
        },
      }
    );

    if (response.status === 204) {
      console.log(`[DISCORD] Deleted message ${messageId} from channel ${channelId}`);
      return true;
    }

    const errorText = await response.text().catch(() => "");
    console.error(`[DISCORD] Delete failed: ${response.status} ${errorText}`);
    return false;
  } catch (error) {
    console.error("[DISCORD] Error deleting message:", error);
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
      headers: { "Content-Type": "application/json" },
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
export const DISCORD_COLORS: Record<string, number> = {
  green: 5763719,    // #57F287
  yellow: 16776960,  // #FFFF00
  orange: 16744192,  // #FFA500
  red: 15158332,     // #E74C3C
  blue: 0x3b82f6,
};
