require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFolder() {
  const { data, error } = await supabase
    .storage
    .from('chat-media')
    .list('account-61740bf8-b21e-42dd-9ab3-9118bca90bc6', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Recent uploads in folder:', JSON.stringify(data, null, 2));
  }
}

checkFolder();
