const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env vars
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking users table...\n');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total users in public.users: ${users.length}\n`);

  if (users.length === 0) {
    console.log('❌ No users found in public.users table!\n');
  } else {
    console.log('Users:');
    users.forEach(u => {
      const adminLabel = u.is_admin ? '👑 ADMIN' : '👤 USER';
      console.log(`  ${adminLabel} | ${u.email} | ${new Date(u.created_at).toLocaleString()}`);
    });
  }

  console.log('\n\n🔍 Checking auth.users...\n');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  console.log(`Total auth users: ${authData.users.length}\n`);

  if (authData.users.length === 0) {
    console.log('❌ No users found in auth.users!\n');
  } else {
    console.log('Auth users:');
    authData.users.forEach(u => {
      console.log(`  📧 ${u.email} | Created: ${new Date(u.created_at).toLocaleString()}`);
    });
  }

  // Check for mismatch
  const authEmails = new Set(authData.users.map(u => u.email));
  const publicEmails = new Set(users.map(u => u.email));

  const inAuthNotPublic = [...authEmails].filter(e => !publicEmails.has(e));
  const inPublicNotAuth = [...publicEmails].filter(e => !authEmails.has(e));

  if (inAuthNotPublic.length > 0) {
    console.log('\n⚠️  Users in auth.users but NOT in public.users:');
    inAuthNotPublic.forEach(email => console.log(`  - ${email}`));
  }

  if (inPublicNotAuth.length > 0) {
    console.log('\n⚠️  Users in public.users but NOT in auth.users:');
    inPublicNotAuth.forEach(email => console.log(`  - ${email}`));
  }

  console.log('\n✅ Done');
})();
