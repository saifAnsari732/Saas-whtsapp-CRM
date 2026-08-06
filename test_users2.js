require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  users.forEach(u => console.log(u.email, 'Confirmed at:', u.email_confirmed_at));
}
getUsers();
