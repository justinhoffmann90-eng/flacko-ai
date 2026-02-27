CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_path_created_at ON public.page_views(path, created_at);
CREATE INDEX idx_page_views_session_path_created_at ON public.page_views(session_id, path, created_at);
CREATE INDEX idx_page_views_utm_source ON public.page_views(utm_source);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage page views" ON public.page_views FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Admins can view page views" ON public.page_views FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));
