import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createServiceClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/bot/rag";
import { getLearnContent, getLearnSlugs } from "@/lib/learn/getContent";

export interface KnowledgeChunkInput {
  content: string;
  source: string;
  source_date?: string | null;
}

const DEFAULT_CHUNK_TOKENS = 500;
const DEFAULT_REPORT_DAYS = 30;

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function chunkText(text: string, maxTokens = DEFAULT_CHUNK_TOKENS): string[] {
  const words = normalizeText(text).split(" ");
  if (!words.length) return [];

  const chunks: string[] = [];
  let buffer: string[] = [];

  for (const word of words) {
    buffer.push(word);
    if (buffer.length >= maxTokens) {
      chunks.push(buffer.join(" "));
      buffer = [];
    }
  }

  if (buffer.length) {
    chunks.push(buffer.join(" "));
  }

  return chunks;
}

function getLearnIndexContent() {
  const filePath = path.join(process.cwd(), "content", "learn", "index.mdx");
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug: "index",
    title: data.title || "Learn",
    content,
  };
}

function buildLearnDocuments(): KnowledgeChunkInput[] {
  const documents: KnowledgeChunkInput[] = [];

  const indexDoc = getLearnIndexContent();
  if (indexDoc) {
    const text = `# ${indexDoc.title}\n\n${indexDoc.content}`;
    documents.push({ content: text, source: "learn/index", source_date: null });
  }

  const slugs = getLearnSlugs();
  for (const slug of slugs) {
    const doc = getLearnContent(slug);
    if (!doc) continue;
    const text = `# ${doc.title}\n\n${doc.content}`;
    documents.push({ content: text, source: `learn/${slug}`, source_date: null });
  }

  return documents;
}

export async function indexKnowledgeBase({
  days = DEFAULT_REPORT_DAYS,
  reset = false,
}: {
  days?: number;
  reset?: boolean;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const supabase = await createServiceClient();

  if (reset) {
    const { error: deleteError } = await supabase
      .from("knowledge_chunks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      throw new Error(`Failed to reset knowledge_chunks: ${deleteError.message}`);
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select("markdown_content, report_date")
    .gte("report_date", cutoffDate)
    .order("report_date", { ascending: false });

  if (reportsError) {
    throw new Error(`Failed to load reports: ${reportsError.message}`);
  }

  const reportDocs: KnowledgeChunkInput[] = (reports || [])
    .filter((report) => report.markdown_content)
    .map((report) => ({
      content: report.markdown_content as string,
      source: "report",
      source_date: report.report_date as string,
    }));

  const learnDocs = buildLearnDocuments();
  const allDocs = [...reportDocs, ...learnDocs];

  const chunks: KnowledgeChunkInput[] = [];
  for (const doc of allDocs) {
    const docChunks = chunkText(doc.content);
    for (const chunk of docChunks) {
      chunks.push({
        content: chunk,
        source: doc.source,
        source_date: doc.source_date ?? null,
      });
    }
  }

  const rows = [] as Array<{
    content: string;
    source: string;
    source_date: string | null;
    embedding: number[];
  }>;

  for (const chunk of chunks) {
    const embedding = await embedText(chunk.content);
    rows.push({
      content: chunk.content,
      source: chunk.source,
      source_date: chunk.source_date ?? null,
      embedding,
    });
  }

  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from("knowledge_chunks")
      .insert(batch);

    if (insertError) {
      throw new Error(`Failed to insert knowledge chunks: ${insertError.message}`);
    }
  }

  return {
    reportCount: reportDocs.length,
    learnCount: learnDocs.length,
    chunkCount: rows.length,
  };
}
