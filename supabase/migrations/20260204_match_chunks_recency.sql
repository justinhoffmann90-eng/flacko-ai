-- Update match_chunks to prioritize recent reports and weekly reviews
-- Recency boost: reports/weekly-reviews get a boost that decays over time
-- Latest report gets +0.15 similarity, decaying by ~0.02 per day

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  source_date DATE,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    k.id,
    k.content,
    k.source,
    k.source_date,
    -- Base similarity + recency boost for reports/weekly-reviews
    (1 - (k.embedding <=> query_embedding)) + 
    CASE 
      WHEN k.source IN ('report', 'weekly-review') AND k.source_date IS NOT NULL THEN
        -- Boost: 0.15 for today, decays ~0.02/day, floors at 0 after ~7 days
        GREATEST(0, 0.15 - (CURRENT_DATE - k.source_date) * 0.02)
      ELSE 0
    END AS similarity
  FROM knowledge_chunks k
  WHERE k.embedding IS NOT NULL
  ORDER BY 
    -- Same calculation for ordering
    (1 - (k.embedding <=> query_embedding)) + 
    CASE 
      WHEN k.source IN ('report', 'weekly-review') AND k.source_date IS NOT NULL THEN
        GREATEST(0, 0.15 - (CURRENT_DATE - k.source_date) * 0.02)
      ELSE 0
    END DESC
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_chunks IS 'Semantic search with recency boost for reports/weekly-reviews. Recent reports get +0.15 similarity decaying over 7 days.';
