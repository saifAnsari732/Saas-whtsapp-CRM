require('dotenv').config({ path: '.env.local' });
const { getWhatsAppConfigForAccount } = require('./src/lib/whatsapp/get-config');

async function checkPhone() {
  const config = await getWhatsAppConfigForAccount('61740bf8-b21e-42dd-9ab3-9118bca90bc6');
  console.log('Phone Number ID:', config.phone_number_id);
  console.log('WABA ID:', config.waba_id);

  const res = await fetch(`https://graph.facebook.com/v21.0/${config.phone_number_id}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,status,messaging_limit_tier`, {
    headers: { Authorization: `Bearer ${config.decrypted_access_token}` }
  });
  const data = await res.json();
  console.log('Phone details from Meta:', JSON.stringify(data, null, 2));

  if (config.waba_id) {
    const wabaRes = await fetch(`https://graph.facebook.com/v21.0/${config.waba_id}?fields=account_review_status,name,status`, {
      headers: { Authorization: `Bearer ${config.decrypted_access_token}` }
    });
    const wabaData = await wabaRes.json();
    console.log('WABA details from Meta:', JSON.stringify(wabaData, null, 2));
  }
}
checkPhone().catch(console.error);
