import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServiceClient } from "@/lib/supabase/server";
import { BOBBY_AXELROD_PROMPT } from "@/lib/bot/personality";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

export async function retrieveChunks(
  question: string,
  matchCount = 5
): Promise<RagChunk[]> {
  const embedding = await embedText(question);
  const supabase = await createServiceClient();

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Supabase match_chunks error: ${error.message}`);
  }

  return (data || []) as RagChunk[];
}

export async function generateAnswer(
  question: string,
  chunks: RagChunk[]
): Promise<string> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }

  const context = chunks
    .map((chunk, index) => {
      const sourceTag = chunk.source_date
        ? `${chunk.source} ${chunk.source_date}`
        : chunk.source;
      return `[${index + 1}] (${sourceTag}) ${chunk.content}`;
    })
    .join("\n\n");

  const userPrompt = `Context:\n${context || "No relevant context found."}\n\nQuestion: ${question}\n\nAnswer in 2-4 sentences. No financial advice.`;
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
