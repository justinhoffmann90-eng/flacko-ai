CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  source text NOT NULL,
  source_date date,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS bot_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  chunks_used uuid[],
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION match_chunks(query_embedding vector(1536), match_count int)
RETURNS TABLE(id uuid, content text, source text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT k.id, k.content, k.source, 1 - (k.embedding <=> query_embedding) as similarity
  FROM knowledge_chunks k
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
