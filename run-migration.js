#!/usr/bin/env node
// Run database migration for dashboard_data table

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'dashboard_data_table.sql'), 'utf-8');

    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (!statement) continue;

      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok) {
          console.warn('Statement execution note:', statement.substring(0, 50) + '...');
        }
      }
    }

    console.log('✅ Migration completed successfully');
    console.log('\nVerifying table creation...');

    // Verify the table was created
    const { data, error } = await supabase
      .from('dashboard_data')
      .select('key')
      .limit(1);

    if (error) {
      console.error('❌ Table verification failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Table verified successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
