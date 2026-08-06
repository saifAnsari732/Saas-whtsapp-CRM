require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBroadcast() {
  const { data: broadcasts } = await supabase
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!broadcasts || broadcasts.length === 0) {
    console.log('No broadcasts found');
    return;
  }

  console.log('Broadcast:', JSON.stringify(broadcasts[0], null, 2));
}

checkBroadcast();
