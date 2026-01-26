-- Fix: Add INSERT policy for reports table
-- The service client should bypass RLS, but adding this as a safety net

-- Allow admins to insert reports
CREATE POLICY "Admins can insert reports" ON public.reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Allow admins to update reports  
CREATE POLICY "Admins can update reports" ON public.reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- Allow admins to delete reports
CREATE POLICY "Admins can delete reports" ON public.reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );
