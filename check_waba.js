require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function decrypt(encryptedText) {
  const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const parts = encryptedText.split(':');
  if (parts.length === 3) {
    const [ivHex, ctHex, tagHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(ctHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  return '';
}

async function checkAccountStatus() {
  const { data: config } = await supabase.from('whatsapp_config').select('*').limit(1).single();
  const accessToken = decrypt(config.access_token);
  
  const wabaId = config.waba_id;
  const url = `https://graph.facebook.com/v21.0/${wabaId}?fields=name,currency,timezone_id,message_template_namespace,account_review_status,health_status`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const body = await res.json();
  console.log('WABA Status:', JSON.stringify(body, null, 2));

  // Also check the phone number quality status
  const phoneUrl = `https://graph.facebook.com/v21.0/${config.phone_number_id}?fields=display_phone_number,quality_rating,status,name_status`;
  const resPhone = await fetch(phoneUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  const phoneBody = await resPhone.json();
  console.log('Phone Status:', JSON.stringify(phoneBody, null, 2));
}

checkAccountStatus();
