// Discord Bot API client for role management
// Uses the Discord bot token to manage member roles

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "1245751580058456104";
const DISCORD_SUBSCRIBER_ROLE_ID = process.env.DISCORD_SUBSCRIBER_ROLE_ID;

const DISCORD_API_BASE = "https://discord.com/api/v10";

interface DiscordApiError {
  code: number;
  message: string;
}

/**
 * Add a role to a Discord guild member
 */
export async function addRoleToMember(
  discordUserId: string,
  roleId: string = DISCORD_SUBSCRIBER_ROLE_ID || ""
): Promise<{ success: boolean; error?: string }> {
  if (!DISCORD_BOT_TOKEN) {
    return { success: false, error: "DISCORD_BOT_TOKEN not configured" };
  }
  
  if (!roleId) {
    return { success: false, error: "DISCORD_SUBSCRIBER_ROLE_ID not configured" };
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 204 || response.ok) {
      return { success: true };
    }

    const errorData = (await response.json()) as DiscordApiError;
    return { 
      success: false, 
      error: `Discord API error: ${errorData.message} (${errorData.code})` 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to add role: ${error instanceof Error ? error.message : "Unknown error"}` 
    };
  }
}

/**
 * Remove a role from a Discord guild member
 */
export async function removeRoleFromMember(
  discordUserId: string,
  roleId: string = DISCORD_SUBSCRIBER_ROLE_ID || ""
): Promise<{ success: boolean; error?: string }> {
  if (!DISCORD_BOT_TOKEN) {
    return { success: false, error: "DISCORD_BOT_TOKEN not configured" };
  }
  
  if (!roleId) {
    return { success: false, error: "DISCORD_SUBSCRIBER_ROLE_ID not configured" };
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (response.status === 204 || response.ok) {
      return { success: true };
    }

    const errorData = (await response.json()) as DiscordApiError;
    return { 
      success: false, 
      error: `Discord API error: ${errorData.message} (${errorData.code})` 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to remove role: ${error instanceof Error ? error.message : "Unknown error"}` 
    };
  }
}

/**
 * Check if a member has a specific role
 */
export async function memberHasRole(
  discordUserId: string,
  roleId: string = DISCORD_SUBSCRIBER_ROLE_ID || ""
): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN || !roleId) {
    return false;
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const member = await response.json() as { roles: string[] };
    return member.roles.includes(roleId);
  } catch {
    return false;
  }
}

/**
 * Get Discord user info by ID
 */
export async function getDiscordUser(discordUserId: string): Promise<{
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
} | null> {
  if (!DISCORD_BOT_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(
      `${DISCORD_API_BASE}/users/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
