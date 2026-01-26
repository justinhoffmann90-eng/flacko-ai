-- Catalysts Table for Flacko AI
-- Tracks upcoming Tesla events, earnings, product launches, and macro events

CREATE TABLE IF NOT EXISTS public.catalysts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'projected' CHECK (status IN ('confirmed', 'projected', 'speculative')),
    notes TEXT,
    valuation_impact TEXT,
    source_url TEXT,
    notion_page_id TEXT, -- Link back to Notion row for sync
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for date queries (upcoming catalysts)
CREATE INDEX IF NOT EXISTS idx_catalysts_date ON public.catalysts(event_date ASC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_catalysts_status ON public.catalysts(status);

-- Unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalysts_unique ON public.catalysts(event_date, name);

-- Enable RLS
ALTER TABLE public.catalysts ENABLE ROW LEVEL SECURITY;

-- Public read access (all authenticated users can view catalysts)
CREATE POLICY "Catalysts are viewable by authenticated users" ON public.catalysts
    FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can insert/update (API routes with service key)
CREATE POLICY "Service role can manage catalysts" ON public.catalysts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE public.catalysts IS 'Tesla catalyst calendar - synced from Notion via Clawd';
