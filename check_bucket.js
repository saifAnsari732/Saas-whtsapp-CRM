require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBucket() {
  const { data, error } = await supabase
    .storage
    .from('chat-media')
    .list('', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Recent uploads in chat-media:', JSON.stringify(data, null, 2));
  }
}

checkBucket();
