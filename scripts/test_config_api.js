require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

let app;
if (!getApps().length) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || 'whatsapp-saas-7ab44';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }
  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId
  });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function decrypt(encryptedText) {
  try {
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
  } catch (e) {
    console.error('Decryption failed:', e.message);
  }
  return '';
}

async function testGetConfig(accountId) {
  console.log(`Testing config lookup for accountId: ${accountId}`);

  let config = null;

  // 1. Check top-level whatsapp_configs doc
  const fsDoc = await db.collection('whatsapp_configs').doc(accountId).get();
  if (fsDoc.exists) {
    console.log('Found in Firestore whatsapp_configs collection!');
    config = fsDoc.data();
  } else {
    // 2. Check nested accounts/{accountId}/whatsapp_config/config
    const nestedFsDoc = await db.doc(`accounts/${accountId}/whatsapp_config/config`).get();
    if (nestedFsDoc.exists) {
      console.log('Found in Firestore nested whatsapp_config doc!');
      config = nestedFsDoc.data();
    }
  }

  // 3. Check Supabase
  if (!config) {
    const { data: sbConfig } = await supabase.from('whatsapp_config').select('*').eq('account_id', accountId).maybeSingle();
    if (sbConfig) {
      console.log('Found in Supabase whatsapp_config table!');
      config = sbConfig;
    }
  }

  if (!config) {
    console.log('RESULT: No config found');
    return;
  }

  const mappedConfig = {
    account_id: accountId,
    phone_number_id: config.phone_number_id || config.phoneNumberId || '',
    waba_id: config.waba_id || config.wabaId || '',
    access_token: config.access_token || config.accessToken || '',
    verify_token: config.verify_token || config.verifyToken || '',
    status: config.status || 'connected',
    connected_at: config.connected_at || config.connectedAt || null,
  };

  const decryptedToken = decrypt(mappedConfig.access_token);
  console.log('RESULT: Config loaded successfully!');
  console.log('Mapped Config:', {
    phone_number_id: mappedConfig.phone_number_id,
    waba_id: mappedConfig.waba_id,
    status: mappedConfig.status,
    decryptedTokenValid: Boolean(decryptedToken && decryptedToken.startsWith('EAA')),
    tokenSnippet: decryptedToken ? decryptedToken.substring(0, 15) + '...' : 'FAILED'
  });
}

testGetConfig('61740bf8-b21e-42dd-9ab3-9118bca90bc6').catch(console.error);
