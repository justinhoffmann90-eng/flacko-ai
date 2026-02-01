-- Dashboard Data Storage
-- Stores JSON data for command center (agent status, tasks info)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.dashboard_data (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read dashboard data
CREATE POLICY "Admins can read dashboard data"
ON public.dashboard_data
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
);

-- Policy: Service role can write dashboard data
CREATE POLICY "Service role can write dashboard data"
ON public.dashboard_data
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_data_updated_at ON public.dashboard_data(updated_at);

-- Insert initial empty data
INSERT INTO public.dashboard_data (key, value) VALUES
    ('agent-status', '{}'::jsonb),
    ('tasks-info', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;
