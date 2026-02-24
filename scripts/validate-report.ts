#!/usr/bin/env tsx

/**
 * Validate parsed report data for completeness
 * Usage:
 *   pnpm tsx scripts/validate-report.ts daily [YYYY-MM-DD]
 *   pnpm tsx scripts/validate-report.ts weekly [YYYY-MM-DD]
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rctbqtemkahdbifxrqom.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type ReportType = 'daily' | 'weekly';

interface ValidationResult {
  field: string;
  status: 'PASS' | 'FAIL';
  value?: any;
  message?: string;
}

async function validateReport(reportType: ReportType, reportDate?: string) {
  console.log(`\n🔍 Validating ${reportType} report${reportDate ? ` for ${reportDate}` : ' (latest)'}...\n`);

  let query = supabase
    .from(reportType === 'weekly' ? 'weekly_reviews' : 'reports')
    .select('*');

  // Note: Skip report_type filtering if column doesn't exist yet
  // Once migration is run, this can be uncommented:
  // if (reportType === 'daily') {
  //   query = query.or('report_type.is.null,report_type.eq.daily');
  // }

  if (reportDate) {
    const dateField = reportType === 'weekly' ? 'week_start' : 'report_date';
    query = query.eq(dateField, reportDate);
  } else {
    const dateField = reportType === 'weekly' ? 'week_start' : 'report_date';
    query = query.order(dateField, { ascending: false }).limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error('❌ Failed to fetch report:', error?.message || 'No data found');
    process.exit(1);
  }

  const extractedData = data.extracted_data;
  const results: ValidationResult[] = [];

  if (reportType === 'daily') {
    // Validate daily report fields
    results.push(validateField('mode', extractedData?.mode?.current, 'string'));
    results.push(validateField('master_eject.price', extractedData?.master_eject?.price, 'number'));
    results.push(validateField('price.close', extractedData?.price?.close, 'number'));
    results.push(validateField('key_levels', extractedData?.key_levels, 'object'));
    results.push(validateField('positioning.posture', extractedData?.positioning?.posture, 'string'));
    results.push(validateField('price.change_pct', extractedData?.price?.change_pct, 'number'));
  } else {
    // Validate weekly report fields
    results.push(validateField('mode', extractedData?.mode, 'string'));
    results.push(validateField('master_eject', extractedData?.master_eject, 'number'));
    results.push(validateField('buy_levels_held', extractedData?.buy_levels_held, 'number'));
    results.push(validateField('trim_levels_effective', extractedData?.trim_levels_effective, 'number'));
    results.push(validateField('candle.change_pct', extractedData?.candle?.change_pct, 'number'));
    
    // BX trender patterns
    results.push(validateField('monthly.bx_trender.pattern', extractedData?.monthly?.bx_trender?.pattern, 'string'));
    results.push(validateField('weekly.bx_trender.pattern', extractedData?.weekly?.bx_trender?.pattern, 'string'));
    results.push(validateField('daily.bx_trender.pattern', extractedData?.daily?.bx_trender?.pattern, 'string'));
    
    // Structure descriptions
    results.push(validateField('monthly.structure', extractedData?.monthly?.structure, 'string'));
    results.push(validateField('weekly.structure', extractedData?.weekly?.structure, 'string'));
    results.push(validateField('daily.structure', extractedData?.daily?.structure, 'string'));
  }

  // Print results
  console.log('Field                              Status    Value');
  console.log('─'.repeat(70));
  
  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    const statusColor = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';
    
    const fieldPadded = result.field.padEnd(34);
    const statusText = `${statusColor}${result.status}${resetColor}`;
    const valueText = result.value !== undefined ? String(result.value).substring(0, 30) : 'N/A';
    
    console.log(`${statusIcon} ${fieldPadded} ${statusText}  ${valueText}`);
    
    if (result.status === 'PASS') {
      passCount++;
    } else {
      failCount++;
      if (result.message) {
        console.log(`   └─ ${result.message}`);
      }
    }
  }

  console.log('─'.repeat(70));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);

  if (failCount > 0) {
    console.log('\n❌ VALIDATION FAILED - Some critical fields are missing or invalid\n');
    process.exit(1);
  } else {
    console.log('\n✅ VALIDATION PASSED - All critical fields present and valid\n');
    process.exit(0);
  }
}

function validateField(
  fieldPath: string,
  value: any,
  expectedType: 'string' | 'number' | 'object'
): ValidationResult {
  // Check for null/undefined
  if (value === null || value === undefined) {
    return {
      field: fieldPath,
      status: 'FAIL',
      value: undefined,
      message: 'Field is null or undefined',
    };
  }

  // Check for NaN
  if (expectedType === 'number' && (typeof value !== 'number' || isNaN(value))) {
    return {
      field: fieldPath,
      status: 'FAIL',
      value,
      message: 'Field is not a valid number or is NaN',
    };
  }

  // Check for empty string
  if (expectedType === 'string' && (typeof value !== 'string' || value.trim() === '' || value === '—')) {
    return {
      field: fieldPath,
      status: 'FAIL',
      value,
      message: 'Field is empty, not a string, or placeholder ("—")',
    };
  }

  // Check for empty object/array
  if (expectedType === 'object') {
    if (Array.isArray(value) && value.length === 0) {
      return {
        field: fieldPath,
        status: 'FAIL',
        value: '[]',
        message: 'Array is empty',
      };
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return {
        field: fieldPath,
        status: 'FAIL',
        value: '{}',
        message: 'Object is empty',
      };
    }
  }

  return {
    field: fieldPath,
    status: 'PASS',
    value: typeof value === 'object' ? JSON.stringify(value).substring(0, 30) + '...' : value,
  };
}

// Main execution
const args = process.argv.slice(2);
const reportType = args[0] as ReportType;
const reportDate = args[1];

if (!reportType || !['daily', 'weekly'].includes(reportType)) {
  console.error('\n❌ Usage: pnpm tsx scripts/validate-report.ts <daily|weekly> [YYYY-MM-DD]\n');
  process.exit(1);
}

validateReport(reportType, reportDate).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
