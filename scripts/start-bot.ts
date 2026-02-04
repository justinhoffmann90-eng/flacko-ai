import { Client, GatewayIntentBits, Partials } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_MS = 15_000;
const ASK_CHANNEL_ID = "1468414857815523459";

const BOBBY_AXELROD_PROMPT = `You are Bobby Axelrod — billionaire hedge fund legend from Billions. You built Axe Capital from nothing and you've seen every market trick in the book.

PERSONALITY:
- Confident bordering on cocky, but you back it up with results
- Witty, sharp, occasionally drop a killer one-liner
- You curse when it fits — you're not corporate
- You genuinely enjoy helping people who put in the work
- You have a sense of humor — trading is serious but you don't have to be boring

RESPONSE VARIETY — Mix it up! Don't be repetitive:
- Sometimes lead with a quip, sometimes lead with data
- Vary your sentence structure — short punchy lines, then longer explanations
- Use different openings: rhetorical questions, direct statements, callbacks to Billions, observations about market psychology
- Sometimes be teaching mode, sometimes be rapid-fire intel mode
- Reference different aspects: technicals, gamma levels, dealer positioning, psychology, risk management
- Don't start every response the same way

WHEN ANSWERING:
- ALWAYS include real data from context — specific numbers, levels, percentages
- If you have CURRENT PRICE data, compare it to key levels from reports
- Educational questions get teaching-style answers with the "why" explained
- Trade setup questions get tactical answers with entries/exits
- 3-6 sentences depending on complexity

WHAT NOT TO DO:
- Don't be repetitive in structure or phrasing
- Don't give vague answers when you have specific data
- Never give financial advice disclaimers
- Don't be preachy

You're talking to traders in "Flacko's Gang" — smart people who want actionable intel delivered with style.`;

async function embedText(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "text-embedding-ada-002", input: text }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error: ${response.status} - ${errText}`);
  }
  const data = await response.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0]?.embedding || [];
}

async function queryKnowledge(question: string, userId: string, username: string): Promise<string> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get today's date for context
  const today = new Date().toISOString().split('T')[0];
  
  const embedding = await embedText(question);
  // Get more chunks to have recent and relevant
  const { data: allChunks, error } = await supabase.rpc("match_chunks", { query_embedding: embedding, match_count: 12 });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  
  // Prioritize recent reports - sort by date desc, then take top 6
  const chunks = (allChunks || [])
    .sort((a: any, b: any) => {
      // Reports with today's date get priority
      if (a.source_date === today && b.source_date !== today) return -1;
      if (b.source_date === today && a.source_date !== today) return 1;
      // Then sort by date descending
      return (b.source_date || '').localeCompare(a.source_date || '');
    })
    .slice(0, 6);
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const context = (chunks || []).map((c: any, i: number) => `[${i+1}] (${c.source} ${c.source_date || ""}) ${c.content}`).join("\n\n");
  
  const prompt = `${BOBBY_AXELROD_PROMPT}\n\nTODAY'S DATE: ${today}\nALWAYS prioritize data from today's date (${today}) when answering about current conditions, mode, or outlook.\n\n---\nKNOWLEDGE BASE:\n${context || "No specific context."}\n---\n\nUser: "${question}"\n\nRespond as Bobby Axelrod (vary your style):`;
  
  const result = await model.generateContent(prompt);
  const answer = result.response.text().trim();

  const { error: insertError } = await supabase.from("bot_queries").insert({
    discord_user_id: userId,
    discord_username: username,
    question: question,
    answer: answer,
    chunks_used: (chunks || []).map((c: any) => c.id),
  });
  if (insertError) console.error("Failed to log query:", insertError);

  return answer;
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) { console.error("No token!"); process.exit(1); }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel, Partials.Message],
  });

  const rateLimit = new Map<string, number>();

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channelId !== ASK_CHANNEL_ID) return;

    console.log(`[${new Date().toISOString()}] ${message.author.tag}: ${message.content}`);

    const last = rateLimit.get(message.author.id) || 0;
    if (Date.now() - last < RATE_LIMIT_MS) {
      console.log(`[RATE LIMITED]`);
    }
    rateLimit.set(message.author.id, Date.now());

    try {
      await message.channel.sendTyping();
      const answer = await queryKnowledge(message.content, message.author.id, message.author.tag);
      console.log(`[ANSWER] ${answer.slice(0, 100)}...`);
      await message.reply(answer.slice(0, 1900));
    } catch (error: any) {
      console.error("[ERROR]", error?.message || error);
      await message.reply("Technical difficulties. Even the best systems glitch. Hit me again.");
    }
  });

  client.once("ready", (c) => {
    console.log(`✅ Axelrod online as ${c.user.tag}`);
  });

  await client.login(token);
}

main().catch(console.error);
