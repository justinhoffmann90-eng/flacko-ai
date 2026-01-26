-- Migration: Add trial support to subscriptions
-- Date: 2026-01-26

-- Add trial_ends_at column to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Create index for trial expiry checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at 
ON public.subscriptions(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- Update the RLS policy for reports to include trial access
DROP POLICY IF EXISTS "Subscribers can view reports" ON public.reports;
CREATE POLICY "Subscribers can view reports" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE user_id = auth.uid()
            AND (
                status IN ('active', 'comped')
                OR (status = 'trial' AND trial_ends_at > now())
            )
        )
    );

-- Function to create trial subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, x_handle)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'x_handle', '@unknown')
    );
    
    -- Auto-create trial subscription (7 days)
    INSERT INTO public.subscriptions (user_id, status, price_tier, locked_price_cents, trial_ends_at)
    VALUES (
        NEW.id,
        'trial',
        1,
        2999,
        now() + interval '7 days'
    );
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (function already updated above)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
