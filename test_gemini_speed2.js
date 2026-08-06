require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function decrypt(encryptedText) {
  const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const parts = encryptedText.split(':');
  const [ivHex, ctHex, tagHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(ctHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function testGeminiSpeed() {
  const { data: config } = await supabase.from('ai_configs').select('*').limit(1).single();
  const apiKey = decrypt(config.api_key);
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  for (const m of ['gemini-3.5-flash', 'gemini-3.5-flash-lite']) {
    console.log(`Testing ${m}...`);
    const model = genAI.getGenerativeModel({ model: m });
    const start = Date.now();
    try {
      const result = await model.generateContent("Hello, how are you? Please reply in 2 sentences.");
      console.log(`[${m}] Time: ${Date.now() - start}ms - ${result.response.text().trim().split('\\n')[0]}`);
    } catch (e) {
      console.log(`[${m}] Failed: ${e.message}`);
    }
  }
}

testGeminiSpeed();
