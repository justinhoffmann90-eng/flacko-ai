import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('reports')
    .select('extracted_data, report_date')
    .order('report_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Report Date:', data.report_date);
    console.log('Mode:', data.extracted_data?.mode?.current);
    console.log('\nAlerts:');
    data.extracted_data?.alerts?.forEach((a: any) => {
      console.log(`  ${a.type}: ${a.level_name} @ $${a.price} - ${a.action}`);
    });
    console.log('\nLevels Map:');
    data.extracted_data?.levels_map?.forEach((l: any) => {
      console.log(`  ${l.level} @ $${l.price} - ${l.action}`);
    });
  }
}
main();
