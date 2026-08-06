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

async function testSend() {
  const { data: config } = await supabase.from('whatsapp_config').select('*').limit(1).single();
  const accessToken = decrypt(config.access_token);
  
  const payload = {
    messaging_product: 'whatsapp',
    to: '919511450914',
    type: 'template',
    template: {
      name: 'tech_mine',
      language: { code: 'en' },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link: 'https://yjurmdwekyqigdqyihyk.supabase.co/storage/v1/object/public/chat-media/account-61740bf8-b21e-42dd-9ab3-9118bca90bc6/1785306525890-ChatGPT_Image_Jul_20_2026_06_16_03_PM.png'
              }
            }
          ]
        }
      ]
    }
  };

  console.log('Sending payload...', JSON.stringify(payload));
  const res = await fetch(`https://graph.facebook.com/v21.0/${config.phone_number_id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  const body = await res.json();
  console.log('Meta response:', JSON.stringify(body, null, 2));
}

testSend();
