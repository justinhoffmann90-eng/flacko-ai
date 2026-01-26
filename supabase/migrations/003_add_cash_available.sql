-- Rename portfolio_size_exact to cash_available
ALTER TABLE public.user_settings 
RENAME COLUMN portfolio_size_exact TO cash_available;
