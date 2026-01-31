const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rctbqtemkahdbifxrqom.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  // Using raw SQL via Supabase
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS weekly_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        week_start DATE NOT NULL,
        week_end DATE NOT NULL,
        raw_markdown TEXT NOT NULL,
        extracted_data JSONB NOT NULL,
        parser_version TEXT NOT NULL DEFAULT '1.0.0',
        parser_warnings TEXT[] DEFAULT '{}',
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(week_start, week_end)
      );

      -- Enable RLS
      ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

      -- Policy for authenticated users to read
      CREATE POLICY IF NOT EXISTS "Users can read weekly reviews" ON weekly_reviews
        FOR SELECT TO authenticated USING (true);

      -- Policy for service role to insert/update
      CREATE POLICY IF NOT EXISTS "Service can manage weekly reviews" ON weekly_reviews
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    `
  });

  if (error) {
    console.error('Error creating table via RPC:', error);
    console.log('Table may need to be created manually in Supabase dashboard');
    console.log('');
    console.log('Run this SQL in Supabase SQL Editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  raw_markdown TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  parser_version TEXT NOT NULL DEFAULT '1.0.0',
  parser_warnings TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(week_start, week_end)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read weekly reviews" ON weekly_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service can manage weekly reviews" ON weekly_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);
    `);
    process.exit(1);
  }

  console.log('✅ Table created successfully!');
}

createTable().catch(console.error);
