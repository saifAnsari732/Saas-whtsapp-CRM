const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

const db = getFirestore(app);

const ADMIN_EMAILS = [
  'kisandeveloper2@gmail.com',
  'ansarisaifuddin732@gmail.com',
];

async function fixAdminRoles() {
  console.log('🔍 Checking and updating admin accounts in Firestore...');

  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.docs.length} total user profile documents.`);

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const email = (data.email || '').toLowerCase().trim();

    if (ADMIN_EMAILS.includes(email)) {
      console.log(`\n👑 Updating Admin User Document [${doc.id}] (${email})...`);
      
      await doc.ref.update({
        role: 'admin',
        accountRole: 'owner',
        account_role: 'owner',
        updatedAt: new Date().toISOString(),
      });
      console.log(`✅ Set role='admin', accountRole='owner' for ${email}`);

      const accountId = data.accountId || data.account_id;
      if (accountId) {
        const accRef = db.collection('accounts').doc(accountId);
        const accSnap = await accRef.get();
        if (accSnap.exists) {
          await accRef.update({
            subscriptionStatus: 'active',
            subscription_status: 'active',
            subscriptionPlan: 'enterprise',
            subscription_plan: 'enterprise',
            updatedAt: new Date().toISOString(),
          });
          console.log(`✅ Account [${accountId}] updated to active Enterprise plan for admin.`);
        }
      }
    }
  }

  console.log('\n🎉 Admin roles update completed successfully!');
}

fixAdminRoles().catch((err) => {
  console.error('❌ Error updating admin roles:', err);
});
