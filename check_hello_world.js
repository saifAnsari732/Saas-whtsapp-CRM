require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHelloWorld() {
  const { data: template } = await supabase
    .from('message_templates')
    .select('*')
    .eq('name', 'hello_world')
    .limit(1)
    .single();

  console.log('Template:', JSON.stringify(template, null, 2));
}

checkHelloWorld();
