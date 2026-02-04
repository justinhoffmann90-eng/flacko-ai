import { Client, GatewayIntentBits, Partials } from "discord.js";
import { queryKnowledge } from "@/lib/bot/rag";
import { createServiceClient } from "@/lib/supabase/server";

const RATE_LIMIT_MS = 60_000;

export function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN is not set");
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  const rateLimit = new Map<string, number>();
  const allowedChannelId = process.env.DISCORD_ASK_CHANNEL_ID;
  const allowedChannelName = process.env.DISCORD_ASK_CHANNEL || "ask-flacko";

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (allowedChannelId) {
      if (message.channelId !== allowedChannelId) return;
    } else if ("name" in message.channel) {
      if (message.channel.name !== allowedChannelName) return;
    }

    const last = rateLimit.get(message.author.id) || 0;
    if (Date.now() - last < RATE_LIMIT_MS) {
      await message.reply("Give it a minute. I’m not running a free hotline.");
      return;
    }

    rateLimit.set(message.author.id, Date.now());

    try {
      await message.channel.sendTyping();

      const { answer, chunks } = await queryKnowledge(message.content);
      const response = answer.length > 1900 ? `${answer.slice(0, 1900)}…` : answer;

      await message.reply(response);

      const supabase = await createServiceClient();
      await supabase.from("bot_queries").insert({
        user_id: message.author.id,
        question: message.content,
        answer,
        chunks_used: chunks.map((chunk) => chunk.id),
      });
    } catch (error) {
      console.error("Discord bot error:", error);
      await message.reply("Something broke. Try again in a minute.");
    }
  });

  client.once("ready", () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);
  });

  client.login(token);

  return client;
}
