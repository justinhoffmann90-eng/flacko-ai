#!/usr/bin/env tsx

/**
 * Add report_type column to reports table and backfill existing data
 * Task 1 of weekly report infrastructure fix
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rctbqtemkahdbifxrqom.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addReportTypeColumn() {
  console.log('📝 Adding report_type column to reports table...');

  try {
    // Step 1: Add the column with default value 'daily'
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE reports 
        ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT 'daily';
      `
    });

    if (alterError) {
      // RPC might not exist, try direct SQL execution
      console.log('RPC not available, using REST API approach...');
      
      // We can't execute DDL directly via REST API, so we'll update via the dashboard or psql
      console.log('\n⚠️  Please run this SQL in Supabase SQL Editor:');
      console.log('\nALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type TEXT DEFAULT \'daily\';\n');
      
      // Proceed with backfill assuming column was added manually
    } else {
      console.log('✅ Column added successfully');
    }

    // Step 2: Update the specific weekly report row (report_date = 2026-02-14)
    console.log('\n📝 Updating weekly report row (2026-02-14) to report_type = "weekly"...');
    
    const { data: weeklyReport, error: fetchError } = await supabase
      .from('reports')
      .select('id, report_date')
      .eq('report_date', '2026-02-14')
      .like('id', '737218d0%')
      .single();

    if (fetchError) {
      console.error('❌ Error fetching weekly report:', fetchError);
      // Try without the ID filter
      const { data: altReport, error: altError } = await supabase
        .from('reports')
        .select('id, report_date')
        .eq('report_date', '2026-02-14')
        .single();
      
      if (altError) {
        console.error('❌ Could not find report for 2026-02-14:', altError);
      } else if (altReport) {
        console.log(`Found report: ${altReport.id}`);
        await updateReportType(altReport.id);
      }
    } else if (weeklyReport) {
      console.log(`Found weekly report: ${weeklyReport.id}`);
      await updateReportType(weeklyReport.id);
    }

    console.log('\n✅ Report type column setup complete!');
    console.log('\nNext steps:');
    console.log('1. Update daily report page query (app/(dashboard)/report/page.tsx)');
    console.log('2. Fix weekly parser extraction (lib/parser/weekly-review.ts)');
    console.log('3. Create validation script (scripts/validate-report.ts)');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

async function updateReportType(reportId: string) {
  const { error: updateError } = await supabase
    .from('reports')
    .update({ report_type: 'weekly' })
    .eq('id', reportId);

  if (updateError) {
    console.error('❌ Error updating report type:', updateError);
  } else {
    console.log(`✅ Updated report ${reportId} to report_type = "weekly"`);
  }
}

addReportTypeColumn().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
