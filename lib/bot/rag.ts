import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import { BOBBY_AXELROD_PROMPT } from "@/lib/bot/personality";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const OPENAI_EMBEDDING_MODEL = "text-embedding-ada-002";
const DEFAULT_ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

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
  const context = chunks
    .map((chunk, index) => {
      const sourceTag = chunk.source_date
        ? `${chunk.source} ${chunk.source_date}`
        : chunk.source;
      return `[${index + 1}] (${sourceTag}) ${chunk.content}`;
    })
    .join("\n\n");

  const userPrompt = `Context:\n${context || "No relevant context found."}\n\nQuestion: ${question}\n\nAnswer in 2-4 sentences. No financial advice.`;

  const response = await anthropic.messages.create({
    model: DEFAULT_ANTHROPIC_MODEL,
    max_tokens: 320,
    system: BOBBY_AXELROD_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  return message || "I don't know based on the data I have.";
}

export async function queryKnowledge(question: string) {
  const chunks = await retrieveChunks(question);
  const answer = await generateAnswer(question, chunks);

  return { answer, chunks };
}
