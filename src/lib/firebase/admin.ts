// ============================================================
// Firebase Admin SDK — server-side only (Node.js / Next.js
// API routes, server components, middleware).
// Equivalent replacement for src/lib/supabase/admin.ts
//
// IMPORTANT: Never import this from client components.
// ============================================================
import * as admin from 'firebase-admin';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // 1. Try FIREBASE_SERVICE_ACCOUNT JSON string env variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      if (sa && (sa.private_key || sa.privateKey)) {
        return initializeApp({
          credential: cert(sa),
        });
      }
    } catch (saErr) {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT JSON parse warning:', saErr);
    }
  }

  // 2. Try GOOGLE_APPLICATION_CREDENTIALS or service-account.json file from disk
  try {
    const fs = require('fs');
    const path = require('path');
    const envSaPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const saPath = envSaPath ? path.resolve(envSaPath) : path.resolve(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(saPath)) {
      const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      if (sa && (sa.private_key || sa.privateKey)) {
        return initializeApp({
          credential: cert(sa),
        });
      }
    }
  } catch (fileErr) {
    console.warn('[Firebase Admin] service-account.json file read warning:', fileErr);
  }

  // 3. Fallback: Parse individual environment variables with robust key formatting
  const projectId = 
    process.env.FIREBASE_ADMIN_PROJECT_ID || 
    process.env.FIREBASE_PROJECT_ID || 
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
    'whatsapp-saas-7ab44';

  const clientEmail = 
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
    `firebase-adminsdk-fbsvc@${projectId}.iam.gserviceaccount.com`;

  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');

    try {
      if (privateKey.includes('BEGIN PRIVATE KEY')) {
        return initializeApp({
          credential: cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey,
          }),
          projectId: projectId,
        });
      }
    } catch (certErr) {
      console.warn('[Firebase Admin] Cert init failed with env private key:', certErr);
    }
  }

  console.error('[Firebase Admin CRITICAL ERROR] No service account key found! Place service-account.json in root or set FIREBASE_SERVICE_ACCOUNT in .env.local on the server.');

  return initializeApp({
    projectId: projectId,
  });
}

let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;
let _adminStorage: Storage | null = null;

/**
 * Returns the Firebase Admin Firestore instance.
 * Use this for privileged server-side database operations
 * (equivalent to Supabase service-role client).
 */
export function getAdminDb(): Firestore {
  if (!_adminDb) {
    const app = getAdminApp();
    _adminDb = getFirestore(app);
  }
  return _adminDb;
}

/**
 * Returns the Firebase Admin Auth instance.
 * Use this to verify ID tokens, create users, set custom claims, etc.
 */
export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    const app = getAdminApp();
    _adminAuth = getAuth(app);
  }
  return _adminAuth;
}

/**
 * Returns the Firebase Admin Storage instance.
 */
export function getAdminStorage(): Storage {
  if (!_adminStorage) {
    const app = getAdminApp();
    _adminStorage = getStorage(app);
  }
  return _adminStorage;
}

/**
 * Legacy compat — old code calls createAdminClient().
 * Returns the admin Firestore db.
 */
export function createAdminClient() {
  return getAdminDb();
}

export { admin };
