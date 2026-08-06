require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateModel() {
  const { data, error } = await supabase
    .from('ai_configs')
    .update({ model: 'gemini|gemini-3.5-flash-lite' })
    .eq('model', 'gemini|gemini-3.5-flash');

  console.log('Update result:', data, error);
}

updateModel();
