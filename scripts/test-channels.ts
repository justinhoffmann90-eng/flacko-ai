import { Client, GatewayIntentBits, ChannelType } from "discord.js";

async function main() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });

  client.once("ready", (c) => {
    console.log(`Logged in as ${c.user.tag}`);
    
    for (const guild of c.guilds.cache.values()) {
      console.log(`\nGuild: ${guild.name}`);
      const textChannels = guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
      console.log(`Text channels (${textChannels.size}):`);
      for (const [id, channel] of textChannels) {
        console.log(`  - #${channel.name} (${id})`);
      }
    }
    
    process.exit(0);
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
}

main();
