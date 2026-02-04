import { Client, GatewayIntentBits, Partials } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_MS = 15_000;
const ASK_CHANNEL_ID = "1468414857815523459";
const HIRO_CHANNEL_ID = "1465366178099630292";

// Cache for HIRO messages (refresh every 5 minutes)
let hiroCache: { messages: string; timestamp: number } | null = null;
const HIRO_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

// Fetch recent HIRO messages from Discord channel
async function getRecentHiroMessages(client: Client): Promise<string> {
  try {
    // Check cache first
    if (hiroCache && Date.now() - hiroCache.timestamp < HIRO_CACHE_TTL) {
      return hiroCache.messages;
    }

    const channel = await client.channels.fetch(HIRO_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.log("[HIRO] Channel not found or not text-based");
      return "";
    }

    // Fetch last 5 messages from HIRO channel
    const messages = await (channel as any).messages.fetch({ limit: 5 });
    
    if (!messages || messages.size === 0) {
      return "";
    }

    // Get today's date for filtering
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    
    // Format messages, prioritizing today's
    const hiroUpdates: string[] = [];
    messages.forEach((msg: any) => {
      if (msg.author.bot) {
        const msgDate = msg.createdAt.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
        const msgTime = msg.createdAt.toLocaleTimeString('en-US', { 
          timeZone: 'America/Chicago', 
          hour: 'numeric', 
          minute: '2-digit' 
        });
        const isToday = msgDate === today;
        
        // Try embeds first, then fall back to message content
        let content = "";
        if (msg.embeds && msg.embeds.length > 0) {
          const embed = msg.embeds[0];
          content = embed.description || "";
          if (embed.fields) {
            embed.fields.forEach((f: any) => {
              content += `\n${f.name}: ${f.value}`;
            });
          }
        } else if (msg.content) {
          // HIRO bot uses plain text, not embeds
          content = msg.content;
        }
        
        if (content) {
          hiroUpdates.push(`[HIRO ${isToday ? 'TODAY' : msgDate} ${msgTime}] ${content.slice(0, 500)}`);
        }
      }
    });

    if (hiroUpdates.length === 0) {
      return "";
    }

    const result = `\n\n[RECENT HIRO INTRADAY ALERTS]\n${hiroUpdates.join("\n\n")}`;
    
    // Update cache
    hiroCache = { messages: result, timestamp: Date.now() };
    console.log("[HIRO] Fetched", hiroUpdates.length, "messages");
    
    return result;
  } catch (error) {
    console.error("[HIRO] Error fetching messages:", error);
    return "";
  }
}

// Fetch live market data from Yahoo Finance
async function getLiveMarketData(): Promise<string> {
  try {
    const tickers = ["TSLA", "^VIX", "QQQ"];
    const results = await Promise.all(tickers.map(async (ticker) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      });
      if (!response.ok) return null;
      const data = await response.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (!meta) return null;
      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const changePct = ((price - prevClose) / prevClose) * 100;
      const name = ticker === "^VIX" ? "VIX" : ticker;
      const prefix = ticker === "^VIX" ? "" : "$";
      return `${name}: ${prefix}${price.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
    }));
    const valid = results.filter(Boolean);
    if (valid.length === 0) return "";
    const now = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    return `\n\n[LIVE MARKET DATA as of ${now} CT]\n${valid.join(" | ")}\nUSE THESE CURRENT PRICES when answering about today's market.`;
  } catch (error) {
    console.error("[LIVE DATA ERROR]", error);
    return "";
  }
}

async function queryKnowledge(question: string, userId: string, username: string, client: Client): Promise<string> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get today's date in Chicago timezone (CT)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  
  // Fetch live market data and HIRO updates in parallel
  const [liveData, hiroData] = await Promise.all([
    getLiveMarketData(),
    getRecentHiroMessages(client),
  ]);
  console.log("[LIVE DATA]", liveData || "(none)");
  console.log("[HIRO DATA]", hiroData ? `${hiroData.length} chars` : "(none)");
  
  const embedding = await embedText(question);
  
  // Get more chunks from semantic search
  const { data: searchChunks, error } = await supabase.rpc("match_chunks", { query_embedding: embedding, match_count: 20 });
  if (error) throw new Error(`Supabase error: ${error.message}`);
  
  // ALSO directly fetch today's report chunks (bypass buggy ivfflat index)
  const { data: todayChunks } = await supabase
    .from("knowledge_chunks")
    .select("id, content, source, source_date")
    .eq("source_date", today)
    .limit(4);
  
  // Merge: today's chunks first (with high similarity), then search results
  const todayChunksWithSim = (todayChunks || []).map((c: any) => ({ ...c, similarity: 0.95 }));
  const allChunks = [...todayChunksWithSim, ...(searchChunks || [])];
  
  // Dedupe by id and take top 6
  const seen = new Set();
  const chunks = allChunks.filter((c: any) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  }).slice(0, 6);
  
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const context = (chunks || []).map((c: any, i: number) => `[${i+1}] (${c.source} ${c.source_date || ""}) ${c.content}`).join("\n\n");
  
  const prompt = `${BOBBY_AXELROD_PROMPT}\n\nTODAY'S DATE: ${today}\nALWAYS prioritize data from today's date (${today}) when answering about current conditions, mode, or outlook.${liveData}${hiroData}\n\n---\nKNOWLEDGE BASE:\n${context || "No specific context."}\n---\n\nUser: "${question}"\n\nRespond as Bobby Axelrod (vary your style):`;
  
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
      const answer = await queryKnowledge(message.content, message.author.id, message.author.tag, client);
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
