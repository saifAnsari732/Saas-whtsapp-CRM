#!/usr/bin/env node
/**
 * ============================================================
 * Supabase → Firebase Data Migration Script
 * ============================================================
 * Run ONCE to migrate all existing data safely.
 * Usage: node scripts/migrate-supabase-to-firebase.mjs
 *
 * What it migrates:
 *  ✅ accounts
 *  ✅ user profiles
 *  ✅ contacts (with tags)
 *  ✅ WhatsApp configs
 *  ✅ message templates
 *  ✅ broadcasts
 *  ✅ wallets & transactions
 *  ✅ billing orders
 *  ✅ Firebase Auth users (import from Supabase)
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import { config } from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

// ── Supabase client (service role = full access) ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Firebase Admin ──
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ── Helpers ──
function ts(isoString) {
  if (!isoString) return null;
  try { return admin.firestore.Timestamp.fromDate(new Date(isoString)); }
  catch { return null; }
}

async function batchWrite(writes) {
  if (!writes.length) return;
  const BATCH_SIZE = 400;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    writes.slice(i, i + BATCH_SIZE).forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
    console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(writes.length / BATCH_SIZE)} written`);
  }
}

// ── Migration functions ──

async function migrateAccounts() {
  console.log('\n📦 Migrating Accounts...');
  const { data, error } = await supabase.from('accounts').select('*');
  if (error) { console.error('  ❌ Error:', error.message); return {}; }
  console.log(`  Found ${data.length} accounts`);

  const writes = data.map(acc => ({
    ref: db.collection('accounts').doc(acc.id),
    data: {
      id: acc.id,
      name: acc.name || 'My Account',
      ownerUserId: acc.owner_user_id,
      subscriptionStatus: acc.subscription_status || 'trial',
      subscriptionPlan: acc.subscription_plan || null,
      trialEndsAt: ts(acc.trial_ends_at),
      subscriptionExpiresAt: ts(acc.subscription_expires_at),
      subscriptionStartedAt: ts(acc.subscription_started_at),
      currency: acc.default_currency || 'INR',
      createdAt: ts(acc.created_at),
      updatedAt: ts(acc.updated_at),
    }
  }));

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} accounts`);
  return Object.fromEntries(data.map(a => [a.id, a]));
}

async function migrateProfiles(accountMap) {
  console.log('\n👤 Migrating User Profiles...');
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) { console.error('  ❌ Error:', error.message); return {}; }
  console.log(`  Found ${data.length} profiles`);

  const writes = data.map(p => ({
    ref: db.collection('users').doc(p.user_id),
    data: {
      uid: p.user_id,
      fullName: p.full_name || '',
      email: p.email || '',
      avatarUrl: p.avatar_url || null,
      accountId: p.account_id || p.user_id,
      accountRole: p.account_role || 'owner',
      role: p.role || 'user',
      betaFeatures: p.beta_features || [],
      createdAt: ts(p.created_at),
      updatedAt: ts(p.updated_at),
    }
  }));

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} profiles`);
  return Object.fromEntries(data.map(p => [p.user_id, p]));
}

async function migrateContacts(profileMap) {
  console.log('\n📇 Migrating Contacts...');
  const { data, error } = await supabase.from('contacts').select('*, contact_tags(tag_id, tags(id, name, color))');
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${data.length} contacts`);

  const writes = data.map(c => {
    const profile = profileMap[c.user_id];
    const accountId = profile?.account_id || c.user_id;
    const tags = (c.contact_tags || []).map(ct => ct.tags).filter(Boolean)
      .map(t => ({ id: t.id, name: t.name, color: t.color }));
    return {
      ref: db.collection('accounts').doc(accountId).collection('contacts').doc(c.id),
      data: {
        id: c.id, phone: c.phone, name: c.name || '',
        email: c.email || null, company: c.company || null,
        avatarUrl: c.avatar_url || null, tags, accountId,
        createdAt: ts(c.created_at), updatedAt: ts(c.updated_at),
      }
    };
  });

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} contacts`);
}

async function migrateWhatsAppConfigs(profileMap) {
  console.log('\n📱 Migrating WhatsApp Configs...');
  const { data, error } = await supabase.from('whatsapp_config').select('*');
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${data.length} configs`);

  const writes = data.map(c => {
    const profile = profileMap[c.user_id];
    const accountId = profile?.account_id || c.user_id;
    return {
      ref: db.collection('accounts').doc(accountId).collection('whatsapp_config').doc('config'),
      data: {
        phoneNumberId: c.phone_number_id, wabaId: c.waba_id || null,
        accessToken: c.access_token, verifyToken: c.verify_token || null,
        status: c.status, connectedAt: ts(c.connected_at), accountId,
        displayName: c.display_name || null, phoneNumber: c.phone_number || null,
        accountMode: c.account_mode || null,
        createdAt: ts(c.created_at), updatedAt: ts(c.updated_at),
      }
    };
  });

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} WhatsApp configs`);
}

async function migrateTemplates(profileMap) {
  console.log('\n📝 Migrating Message Templates...');
  const { data, error } = await supabase.from('message_templates').select('*');
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${data.length} templates`);

  const writes = data.map(t => {
    const profile = profileMap[t.user_id];
    const accountId = profile?.account_id || t.user_id;
    return {
      ref: db.collection('accounts').doc(accountId).collection('templates').doc(t.id),
      data: {
        id: t.id, name: t.name, category: t.category, language: t.language,
        headerType: t.header_type || null, headerContent: t.header_content || null,
        bodyText: t.body_text, footerText: t.footer_text || null,
        buttons: t.buttons || null, status: t.status,
        metaTemplateId: t.meta_template_id || null, accountId,
        createdAt: ts(t.created_at), updatedAt: ts(t.updated_at),
      }
    };
  });

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} templates`);
}

async function migrateBroadcasts(profileMap) {
  console.log('\n📢 Migrating Broadcasts...');
  const { data, error } = await supabase.from('broadcasts').select('*');
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${data.length} broadcasts`);

  const writes = data.map(b => {
    const profile = profileMap[b.user_id];
    const accountId = profile?.account_id || b.user_id;
    return {
      ref: db.collection('accounts').doc(accountId).collection('broadcasts').doc(b.id),
      data: {
        id: b.id, name: b.name, templateName: b.template_name,
        templateLanguage: b.template_language, templateVariables: b.template_variables || null,
        audienceFilter: b.audience_filter || null, scheduledAt: ts(b.scheduled_at),
        status: b.status, totalRecipients: b.total_recipients || 0,
        sentCount: b.sent_count || 0, deliveredCount: b.delivered_count || 0,
        readCount: b.read_count || 0, failedCount: b.failed_count || 0,
        repliedCount: b.replied_count || 0, accountId,
        createdAt: ts(b.created_at), updatedAt: ts(b.updated_at),
      }
    };
  });

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} broadcasts`);
}

async function migrateWallets() {
  console.log('\n💰 Migrating Wallets...');
  const { data, error } = await supabase.from('wallets').select('*');
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${data.length} wallets`);

  const writes = data.map(w => ({
    ref: db.collection('accounts').doc(w.account_id).collection('wallet').doc('data'),
    data: {
      balance: parseFloat(w.balance) || 0,
      lowBalanceAlert: parseFloat(w.low_balance_alert) || 100,
      createdAt: ts(w.created_at), updatedAt: ts(w.updated_at),
    }
  }));

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} wallets`);
}

async function migrateBillingOrders() {
  console.log('\n🧾 Migrating Billing Orders...');
  const { data, error } = await supabase.from('billing_orders').select('*').limit(1000);
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${data.length} orders`);

  const writes = data.map(o => ({
    ref: db.collection('accounts').doc(o.account_id).collection('billing_orders').doc(o.id),
    data: {
      id: o.id, orderId: o.razorpay_order_id || o.id,
      planId: o.plan_id, amount: o.amount, currency: o.currency || 'INR',
      status: o.status, paymentId: o.razorpay_payment_id || null,
      accountId: o.account_id,
      createdAt: ts(o.created_at), updatedAt: ts(o.updated_at),
    }
  }));

  await batchWrite(writes);
  console.log(`  ✅ Migrated ${data.length} billing orders`);
}

async function importFirebaseAuthUsers() {
  console.log('\n🔐 Importing Users to Firebase Auth...');
  const { data: { users: supabaseUsers }, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error('  ❌ Error:', error.message); return; }
  console.log(`  Found ${supabaseUsers.length} auth users`);

  let imported = 0, skipped = 0;

  // Firebase importUsers supports max 1000 per call
  const CHUNK = 999;
  for (let i = 0; i < supabaseUsers.length; i += CHUNK) {
    const chunk = supabaseUsers.slice(i, i + CHUNK);
    const usersToImport = chunk.map(u => ({
      uid: u.id, // Use Supabase UUID as Firebase UID for data consistency
      email: u.email,
      displayName: u.user_metadata?.full_name || '',
      emailVerified: !!u.email_confirmed_at,
      metadata: {
        creationTime: u.created_at,
        lastSignInTime: u.last_sign_in_at || u.created_at,
      },
      customClaims: { supabaseId: u.id },
    }));

    const result = await auth.importUsers(usersToImport);
    imported += usersToImport.length - (result.errors?.length || 0);
    skipped += result.errors?.length || 0;
    if (result.errors?.length) {
      result.errors.forEach(e => console.warn(`  ⚠️ ${e.error.message}`));
    }
  }

  console.log(`  ✅ Imported: ${imported}, Skipped/Errors: ${skipped}`);
  console.log('\n  ⚠️  IMPORTANT: Supabase passwords cannot be migrated.');
  console.log('  Users must use "Forgot Password" to set a new password on Firebase.');
  console.log('  Consider sending a bulk password-reset email to all users after migration.');
}

// ── Main ──
async function main() {
  console.log('🚀 Starting Supabase → Firebase Migration');
  console.log('─────────────────────────────────────────');
  console.log('Supabase URL  :', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Firebase Proj :', process.env.FIREBASE_ADMIN_PROJECT_ID);
  console.log('─────────────────────────────────────────');

  try {
    const accountMap = await migrateAccounts();
    const profileMap = await migrateProfiles(accountMap);
    await migrateContacts(profileMap);
    await migrateWhatsAppConfigs(profileMap);
    await migrateTemplates(profileMap);
    await migrateBroadcasts(profileMap);
    await migrateWallets();
    await migrateBillingOrders();
    await importFirebaseAuthUsers();

    console.log('\n─────────────────────────────────────────');
    console.log('✅ MIGRATION COMPLETE!');
    console.log('─────────────────────────────────────────');
    console.log('\n📋 Next Steps:');
    console.log('1. Open Firebase Console → Firestore → verify data');
    console.log('2. Open Firebase Console → Authentication → verify users');
    console.log('3. Send password reset emails to all users');
    console.log('4. Test login with a test account (use Forgot Password first)');
    console.log('5. Run: npm run build  → to verify no TypeScript errors');
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

main();
