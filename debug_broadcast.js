require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFailedBroadcasts() {
  const { data: broadcasts } = await supabase
    .from('broadcasts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!broadcasts || broadcasts.length === 0) {
    console.log('No broadcasts found');
    return;
  }

  const broadcast = broadcasts[0];
  console.log(`Latest broadcast: ${broadcast.name} (${broadcast.id})`);

  const { data: recipients } = await supabase
    .from('broadcast_recipients')
    .select('*')
    .eq('broadcast_id', broadcast.id)
    .eq('status', 'failed');

  if (!recipients || recipients.length === 0) {
    console.log('No failed recipients found for this broadcast');
  } else {
    console.log('Failed recipients:', JSON.stringify(recipients, null, 2));
  }
}

checkFailedBroadcasts();
