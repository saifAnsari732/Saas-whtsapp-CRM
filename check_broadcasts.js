require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBroadcasts() {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('id, name, status, total_recipients, delivered_count, failed_count, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log('Recent Broadcasts:', JSON.stringify(data, null, 2));
}

checkBroadcasts();
