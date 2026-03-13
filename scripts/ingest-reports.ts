/**
 * ingest-reports.ts
 *
 * Reads TSLA daily report markdown files, chunks them into ~500-token segments,
 * generates OpenAI embeddings, and upserts into Supabase knowledge_chunks table.
 *
 * Usage:
 *   pnpm tsx scripts/ingest-reports.ts
 *   pnpm tsx scripts/ingest-reports.ts --since 2026-02-12
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Load .env.local
const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const REPORTS_DIR = path.join(os.homedir(), "trading_inputs/daily-reports");
const REPORT_GLOB = /^TSLA_Daily_Report_(\d{4}-\d{2}-\d{2})\.md$/;
const CHUNK_TARGET_TOKENS = 500;
const OVERLAP_TOKENS = 50;
// Rough chars-per-token ratio for English prose
const CHARS_PER_TOKEN = 4;
const CHUNK_SIZE_CHARS = CHUNK_TARGET_TOKENS * CHARS_PER_TOKEN; // 2000
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;        // 200

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let sinceDate: string | null = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--since" && args[i + 1]) {
    sinceDate = args[i + 1];
    i++;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Split text into overlapping chunks of ~CHUNK_SIZE_CHARS characters */
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE_CHARS, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start += CHUNK_SIZE_CHARS - OVERLAP_CHARS;
  }
  return chunks.filter((c) => c.length > 50); // drop tiny trailing chunks
}

/** Generate embedding via OpenAI text-embedding-ada-002 */
async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-ada-002", input: text }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI embedding error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
  const embedding = data.data[0]?.embedding;
  if (!embedding || embedding.length !== 1536) {
    throw new Error(`Unexpected embedding dimension: ${embedding?.length}`);
  }
  return embedding;
}

/** Sleep helper for rate limiting */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Discover report files
  const allFiles = fs.readdirSync(REPORTS_DIR);
  const reportFiles = allFiles
    .filter((f) => REPORT_GLOB.test(f))
    .map((f) => {
      const match = f.match(REPORT_GLOB)!;
      return { filename: f, date: match[1] };
    })
    .filter(({ date }) => (sinceDate ? date >= sinceDate : true))
    .sort((a, b) => a.date.localeCompare(b.date));

  console.log(
    `📂 Found ${reportFiles.length} report(s) to process${sinceDate ? ` (since ${sinceDate})` : ""}`
  );

  let totalNew = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const { filename, date } of reportFiles) {
    const filePath = path.join(REPORTS_DIR, filename);
    const text = fs.readFileSync(filePath, "utf-8");
    const chunks = chunkText(text);

    console.log(`\n📄 ${filename} → ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      const fingerprint = content.slice(0, 100);

      // Skip check: look for existing row with same source + source_date + first 100 chars
      const { data: existing, error: selectError } = await supabase
        .from("knowledge_chunks")
        .select("id")
        .eq("source", "report")
        .eq("source_date", date)
        .ilike("content", `${fingerprint.replace(/[%_]/g, "\\$&")}%`)
        .limit(1);

      if (selectError) {
        console.error(`  ⚠️  Skip-check error on chunk ${i + 1}: ${selectError.message}`);
        totalErrors++;
        continue;
      }

      if (existing && existing.length > 0) {
        process.stdout.write(`  ⏭  chunk ${i + 1}/${chunks.length} already exists\r`);
        totalSkipped++;
        continue;
      }

      // Generate embedding
      let embedding: number[];
      try {
        embedding = await embedText(content);
      } catch (err: any) {
        console.error(`  ❌ Embedding error on chunk ${i + 1}: ${err.message}`);
        totalErrors++;
        // Rate limit: back off if OpenAI is complaining
        if (err.message.includes("429")) await sleep(10_000);
        continue;
      }

      // Upsert into knowledge_chunks
      const { error: insertError } = await supabase.from("knowledge_chunks").insert({
        content,
        source: "report",
        source_date: date,
        embedding,
      });

      if (insertError) {
        console.error(`  ❌ Insert error on chunk ${i + 1}: ${insertError.message}`);
        totalErrors++;
        continue;
      }

      process.stdout.write(`  ✅ chunk ${i + 1}/${chunks.length} ingested        \r`);
      totalNew++;

      // Polite rate limiting: ~200ms between embeddings (~5 req/s)
      await sleep(200);
    }

    // Clear the \r line
    process.stdout.write("\n");
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ingest complete
   Reports processed : ${reportFiles.length}
   New chunks added  : ${totalNew}
   Skipped (exist)   : ${totalSkipped}
   Errors            : ${totalErrors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (totalErrors > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
