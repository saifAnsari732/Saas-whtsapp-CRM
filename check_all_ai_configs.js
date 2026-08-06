require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAiConfigs() {
  const { data: config } = await supabase.from('ai_configs').select('*');
  console.log('AI Configs count:', config.length);
  for (let c of config) {
    console.log('ID:', c.id);
    console.log('Provider:', c.provider);
    console.log('Model:', c.model);
    console.log('Is Active:', c.is_active);
  }
}

checkAiConfigs();
