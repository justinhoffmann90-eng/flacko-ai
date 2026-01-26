-- Migration: Add Discord user ID for role management
-- Date: 2026-01-26

-- Add discord_user_id column to users (different from discord_username)
-- discord_username is for display, discord_user_id is for API calls
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS discord_user_id TEXT;

-- Create index for Discord user lookups
CREATE INDEX IF NOT EXISTS idx_users_discord_user_id 
ON public.users(discord_user_id) 
WHERE discord_user_id IS NOT NULL;

-- Add unique constraint (one Discord account per user)
ALTER TABLE public.users
ADD CONSTRAINT users_discord_user_id_unique UNIQUE (discord_user_id);
