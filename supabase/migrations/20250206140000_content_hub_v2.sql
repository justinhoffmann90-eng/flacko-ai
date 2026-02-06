-- Content Hub v2: New tables for scheduler and prompt versioning

-- Table 1: content_prompts_v2 (using new schema with content_type)
CREATE TABLE IF NOT EXISTS content_prompts_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL UNIQUE,
    prompt TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_prompts_v2_content_type ON content_prompts_v2(content_type);

-- Table 2: content_prompt_versions (version history)
CREATE TABLE IF NOT EXISTS content_prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID REFERENCES content_prompts_v2(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    version INT NOT NULL,
    change_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'system'
);

-- Add index for version lookups
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON content_prompt_versions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_version ON content_prompt_versions(prompt_id, version);

-- Table 3: scheduled_content (content calendar)
CREATE TABLE IF NOT EXISTS scheduled_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    content TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    posted_at TIMESTAMPTZ,
    created_by TEXT DEFAULT 'system',
    approved_by TEXT
);

-- Add indexes for scheduled content queries
CREATE INDEX IF NOT EXISTS idx_scheduled_content_date ON scheduled_content(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_type ON scheduled_content(content_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_date_status ON scheduled_content(scheduled_for, status);

-- Enable RLS on new tables
ALTER TABLE content_prompts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_prompts_v2
CREATE POLICY "Admins can read prompts v2"
    ON content_prompts_v2
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can modify prompts v2"
    ON content_prompts_v2
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

-- RLS Policies for content_prompt_versions
CREATE POLICY "Admins can read prompt versions"
    ON content_prompt_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can modify prompt versions"
    ON content_prompt_versions
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

-- RLS Policies for scheduled_content
CREATE POLICY "Admins can read scheduled content"
    ON scheduled_content
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

CREATE POLICY "Admins can modify scheduled content"
    ON scheduled_content
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_content_prompts_v2_updated_at ON content_prompts_v2;
CREATE TRIGGER update_content_prompts_v2_updated_at
    BEFORE UPDATE ON content_prompts_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_content_updated_at ON scheduled_content;
CREATE TRIGGER update_scheduled_content_updated_at
    BEFORE UPDATE ON scheduled_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create version on prompt update
CREATE OR REPLACE FUNCTION create_prompt_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INT;
BEGIN
    -- Get the next version number
    SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM content_prompt_versions
    WHERE prompt_id = NEW.id;
    
    -- Insert new version
    INSERT INTO content_prompt_versions (prompt_id, prompt, version, created_by)
    VALUES (NEW.id, OLD.prompt, next_version, 'system');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-create versions
DROP TRIGGER IF EXISTS trigger_create_prompt_version ON content_prompts_v2;
CREATE TRIGGER trigger_create_prompt_version
    BEFORE UPDATE ON content_prompts_v2
    FOR EACH ROW
    WHEN (OLD.prompt IS DISTINCT FROM NEW.prompt)
    EXECUTE FUNCTION create_prompt_version();
