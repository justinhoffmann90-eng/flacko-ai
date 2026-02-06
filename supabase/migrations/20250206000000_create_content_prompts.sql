-- Create content_prompts table for editable system prompts
CREATE TABLE IF NOT EXISTS content_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    prompt_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_prompts_section_key ON content_prompts(section_key);

-- Add RLS policies
ALTER TABLE content_prompts ENABLE ROW LEVEL SECURITY;

-- Only admins can read prompts
CREATE POLICY "Admins can read prompts"
    ON content_prompts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Only admins can insert/update prompts
CREATE POLICY "Admins can modify prompts"
    ON content_prompts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );
