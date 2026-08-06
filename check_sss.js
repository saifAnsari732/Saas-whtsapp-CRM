require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSSS() {
  const { data: template } = await supabase
    .from('message_templates')
    .select('*')
    .eq('name', 'sss')
    .limit(1)
    .single();

  console.log('Template sss:', JSON.stringify(template, null, 2));
}

checkSSS();
