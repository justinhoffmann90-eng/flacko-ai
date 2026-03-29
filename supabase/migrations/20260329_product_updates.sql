CREATE TABLE product_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('feature', 'enhancement', 'system', 'content')),
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: anyone authenticated can read, only service role can write
ALTER TABLE product_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read updates" ON product_updates
  FOR SELECT USING (true);

CREATE INDEX idx_product_updates_published ON product_updates(published_at DESC);
