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

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

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
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
  }

  try {
    if (privateKey && privateKey.includes('BEGIN PRIVATE KEY')) {
      return initializeApp({
        credential: cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
        projectId: projectId,
      });
    }
  } catch (err) {
    console.warn('[Firebase Admin] Cert init failed, falling back to basic config:', err);
  }

  return initializeApp({
    projectId: projectId,
  });
}

let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

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
 * Legacy compat — old code calls createAdminClient().
 * Returns the admin Firestore db.
 */
export function createAdminClient() {
  return getAdminDb();
}

export { admin };
