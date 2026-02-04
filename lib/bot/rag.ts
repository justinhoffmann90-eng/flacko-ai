import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServiceClient } from "@/lib/supabase/server";
import { BOBBY_AXELROD_PROMPT } from "@/lib/bot/personality";
import { getMarketSnapshot } from "@/lib/price/yahoo-finance";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002";

export interface RagChunk {
  id: string;
  content: string;
  source: string;
  source_date: string | null;
  similarity?: number | null;
}

export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  const embedding = data.data[0]?.embedding || [];
  if (!embedding.length) {
    throw new Error("Empty embedding returned from OpenAI");
  }

  return embedding;
}

/**
 * Apply recency boost to chunks from reports and weekly reviews.
 * Recent content gets a similarity boost that decays over ~7 days.
 */
function applyRecencyBoost(chunks: RagChunk[]): RagChunk[] {
  const now = new Date();
  
  return chunks.map(chunk => {
    let boostedSimilarity = chunk.similarity || 0;
    
    // Only boost reports and weekly reviews
    if ((chunk.source === 'report' || chunk.source === 'weekly-review') && chunk.source_date) {
      const sourceDate = new Date(chunk.source_date);
      const daysDiff = Math.floor((now.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Boost: 0.15 for today, decays ~0.02/day, floors at 0 after ~7 days
      const recencyBoost = Math.max(0, 0.15 - daysDiff * 0.02);
      boostedSimilarity += recencyBoost;
    }
    
    return { ...chunk, similarity: boostedSimilarity };
  });
}

export async function retrieveChunks(
  question: string,
  matchCount = 5
): Promise<RagChunk[]> {
  const embedding = await embedText(question);
  const supabase = await createServiceClient();

  // Fetch more chunks than needed, then rerank with recency boost
  const fetchCount = Math.max(matchCount * 3, 15);
  
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: fetchCount,
  });

  if (error) {
    throw new Error(`Supabase match_chunks error: ${error.message}`);
  }

  const chunks = (data || []) as RagChunk[];
  
  // Apply recency boost and re-sort
  const boostedChunks = applyRecencyBoost(chunks);
  boostedChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  
  // Return top N after reranking
  return boostedChunks.slice(0, matchCount);
}

export async function generateAnswer(
  question: string,
  chunks: RagChunk[]
): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }

  // Fetch live market data for current price context
  let liveDataContext = "";
  try {
    console.log("[RAG] Fetching live market data...");
    const snapshot = await getMarketSnapshot();
    console.log("[RAG] Market snapshot:", JSON.stringify(snapshot));
    
    const now = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    
    const parts = [];
    if (snapshot.tsla) {
      parts.push(`TSLA: $${snapshot.tsla.price.toFixed(2)} (${snapshot.tsla.changePct >= 0 ? '+' : ''}${snapshot.tsla.changePct.toFixed(2)}%)`);
    }
    if (snapshot.vix) {
      parts.push(`VIX: ${snapshot.vix.price.toFixed(2)} (${snapshot.vix.changePct >= 0 ? '+' : ''}${snapshot.vix.changePct.toFixed(2)}%)`);
    }
    if (snapshot.qqq) {
      parts.push(`QQQ: $${snapshot.qqq.price.toFixed(2)} (${snapshot.qqq.changePct >= 0 ? '+' : ''}${snapshot.qqq.changePct.toFixed(2)}%)`);
    }
    
    if (parts.length > 0) {
      liveDataContext = `\n\n[LIVE MARKET DATA as of ${now} CT]\n${parts.join(" | ")}\n(Use these current prices when answering about today's market)`;
      console.log("[RAG] Live data context added:", liveDataContext);
    } else {
      console.warn("[RAG] No live data returned from snapshot");
    }
  } catch (error) {
    console.error("[RAG] Failed to fetch live market data:", error);
    // Continue without live data
  }

  const context = chunks
    .map((chunk, index) => {
      const sourceTag = chunk.source_date
        ? `${chunk.source} ${chunk.source_date}`
        : chunk.source;
      return `[${index + 1}] (${sourceTag}) ${chunk.content}`;
    })
    .join("\n\n");

  const userPrompt = `Context:\n${context || "No relevant context found."}${liveDataContext}\n\nQuestion: ${question}\n\nAnswer in 2-4 sentences. No financial advice.`;
  const fullPrompt = `${BOBBY_AXELROD_PROMPT}\n\n${userPrompt}`;

  const result = await model.generateContent(fullPrompt);
  const message = result.response.text().trim();

  return message || "I don't know based on the data I have.";
}

export async function queryKnowledge(question: string) {
  const chunks = await retrieveChunks(question);
  const answer = await generateAnswer(question, chunks);

  return { answer, chunks };
}
