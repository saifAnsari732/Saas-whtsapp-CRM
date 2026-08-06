require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAiConfigs() {
  const { data: config } = await supabase.from('ai_configs').select('provider, model, system_prompt');
  console.log(config[0].system_prompt.substring(0, 200) + '...');
}

checkAiConfigs();
