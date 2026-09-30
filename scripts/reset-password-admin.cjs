const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
privateKey = privateKey.replace(/\\n/g, '\n');
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}

let app;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

async function resetUserPassword(email, newPassword) {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password: newPassword });
    console.log(`✅ Password successfully updated for ${email}`);
  } catch (err) {
    console.error(`❌ Error updating password for ${email}:`, err.message);
  }
}

resetUserPassword('kisandeveloper2@gmail.com', 'Password123!');
resetUserPassword('ansarisaifuddin732@gmail.com', 'Password123!');
