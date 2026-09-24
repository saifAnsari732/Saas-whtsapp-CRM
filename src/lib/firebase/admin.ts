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

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: privateKey!,
    }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
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
