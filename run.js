require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ; ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_plan TEXT; ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial'; ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ; ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ; UPDATE accounts SET trial_ends_at = NOW() + INTERVAL '7 days' WHERE trial_ends_at IS NULL;"
  });
  console.log('Result:', error || 'Success');
}
run();
