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

function buildRulebookDocuments(): KnowledgeChunkInput[] {
  const primaryPath = path.join(process.cwd(), "content", "rulebook.md");
  const fallbackPath = path.join(process.cwd(), "content", "trading-rulebook.md");
  const filePath = fs.existsSync(primaryPath)
    ? primaryPath
    : fs.existsSync(fallbackPath)
      ? fallbackPath
      : null;

  if (!filePath) return [];

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const title = (data as { title?: string }).title || "Rulebook";

  return [
    {
      content: `# ${title}\n\n${content}`,
      source: "rulebook",
      source_date: null,
    },
  ];
}

export async function indexKnowledgeBase({
  days,
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

  const reportQuery = supabase
    .from("reports")
    .select("raw_markdown, report_date")
    .order("report_date", { ascending: false });

  if (days && Number.isFinite(days)) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toISOString().slice(0, 10);
    reportQuery.gte("report_date", cutoffDate);
  }

  const { data: reports, error: reportsError } = await reportQuery;

  if (reportsError) {
    throw new Error(`Failed to load reports: ${reportsError.message}`);
  }

  const reportDocs: KnowledgeChunkInput[] = (reports || [])
    .filter((report) => report.raw_markdown)
    .map((report) => ({
      content: report.raw_markdown as string,
      source: "report",
      source_date: report.report_date as string,
    }));

  const { data: weeklyReviews, error: weeklyError } = await supabase
    .from("weekly_reviews")
    .select("raw_markdown, week_end")
    .order("week_end", { ascending: false });

  if (weeklyError) {
    throw new Error(`Failed to load weekly reviews: ${weeklyError.message}`);
  }

  const weeklyDocs: KnowledgeChunkInput[] = (weeklyReviews || [])
    .filter((review) => review.raw_markdown)
    .map((review) => ({
      content: review.raw_markdown as string,
      source: "weekly-review",
      source_date: review.week_end as string,
    }));

  const { data: discordLogs, error: discordError } = await supabase
    .from("discord_alert_log")
    .select("message_preview, channel_name, created_at")
    .in("channel_name", ["fs-insight", "tesla-research", "hiro-intraday"])
    .order("created_at", { ascending: false });

  if (discordError) {
    throw new Error(`Failed to load Discord logs: ${discordError.message}`);
  }

  const discordDocs: KnowledgeChunkInput[] = (discordLogs || [])
    .filter((log) => log.message_preview)
    .map((log) => ({
      content: log.message_preview as string,
      source: `discord/${log.channel_name}`,
      source_date: log.created_at ? String(log.created_at).slice(0, 10) : null,
    }));

  const learnDocs = buildLearnDocuments();
  const rulebookDocs = buildRulebookDocuments();
  const allDocs = [
    ...reportDocs,
    ...weeklyDocs,
    ...discordDocs,
    ...rulebookDocs,
    ...learnDocs,
  ];

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
    weeklyCount: weeklyDocs.length,
    discordCount: discordDocs.length,
    rulebookCount: rulebookDocs.length,
    learnCount: learnDocs.length,
    chunkCount: rows.length,
  };
}
