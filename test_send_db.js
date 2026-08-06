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

async function testSendWithDB() {
  const { data: config } = await supabase.from('whatsapp_config').select('*').limit(1).single();
  const accessToken = decrypt(config.access_token);
  
  const payload = {
    messaging_product: 'whatsapp',
    to: '919905234866',
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
                link: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png'
              }
            }
          ]
        }
      ]
    }
  };

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
  
  if (body.messages && body.messages[0]) {
    const messageId = body.messages[0].id;
    // Insert into messages so we can see the webhook update
    const { data: conv } = await supabase.from('conversations').select('id').limit(1).single();
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_type: 'bot',
      content_type: 'template',
      message_id: messageId,
      status: 'sent'
    });
    console.log('Inserted message with ID', messageId);
  }
}

testSendWithDB();
