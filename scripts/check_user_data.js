require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

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

const auth = getAuth(app);
const db = getFirestore(app);

async function checkFirebaseUsers() {
  console.log('=== FIREBASE AUTH USERS ===');
  const userRecords = await auth.listUsers(100);
  userRecords.users.forEach(u => {
    console.log(`Email: ${u.email} | UID: ${u.uid} | Provider: ${u.providerData.map(p => p.providerId).join(',')}`);
  });

  // Copy top-level whatsapp_configs doc for account 61740bf8-b21e-42dd-9ab3-9118bca90bc6 if missing
  const accId = '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
  const nestedDoc = await db.doc(`accounts/${accId}/whatsapp_config/config`).get();
  if (nestedDoc.exists) {
    const data = nestedDoc.data();
    console.log('Found nested WA config:', data);
    const topLevelDoc = {
      account_id: accId,
      phone_number_id: data.phoneNumberId || data.phone_number_id,
      waba_id: data.wabaId || data.waba_id,
      access_token: data.accessToken || data.access_token,
      verify_token: data.verifyToken || data.verify_token,
      status: data.status || 'connected',
      connected_at: data.connectedAt ? (data.connectedAt.toDate ? data.connectedAt.toDate().toISOString() : data.connectedAt) : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.collection('whatsapp_configs').doc(accId).set(topLevelDoc, { merge: true });
    console.log('Successfully synced nested config to top-level whatsapp_configs/' + accId);
  }
}

checkFirebaseUsers().catch(console.error);
