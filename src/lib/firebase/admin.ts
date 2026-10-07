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

function formatPrivateKey(key: string): string {
  if (!key) return '';
  let cleaned = key.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  // Replace literal \n and \r\n with actual newline characters
  return cleaned.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // 1. Try FIREBASE_SERVICE_ACCOUNT (JSON string or Base64 encoded JSON)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        raw = raw.slice(1, -1).trim();
      }
      if (!raw.startsWith('{') && !raw.startsWith('[')) {
        try {
          raw = Buffer.from(raw, 'base64').toString('utf8');
        } catch {}
      }
      const sa = JSON.parse(raw);
      if (sa && (sa.private_key || sa.privateKey)) {
        const pk = formatPrivateKey(sa.private_key || sa.privateKey);
        const saObj = {
          projectId: sa.project_id || sa.projectId,
          clientEmail: sa.client_email || sa.clientEmail,
          privateKey: pk,
        };
        return initializeApp({
          credential: cert(saObj),
          projectId: saObj.projectId,
        });
      }
    } catch (saErr) {
      console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT parse warning:', saErr);
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
        const pk = formatPrivateKey(sa.private_key || sa.privateKey);
        const saObj = {
          projectId: sa.project_id || sa.projectId,
          clientEmail: sa.client_email || sa.clientEmail,
          privateKey: pk,
        };
        return initializeApp({
          credential: cert(saObj),
          projectId: saObj.projectId,
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

  let rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (rawPrivateKey) {
    const privateKey = formatPrivateKey(rawPrivateKey);

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

  console.warn('[Firebase Admin] No custom env credentials found, using default embedded service account credentials.');

  const DEFAULT_SERVICE_ACCOUNT = {
    projectId: 'whatsapp-saas-7ab44',
    clientEmail: 'firebase-adminsdk-fbsvc@whatsapp-saas-7ab44.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDPAkKTCI7FuNO0\nT56UKSQphA7oiqjAqXvBmddYuhWy19cQeTj3zWjTmC/Jt757F7AHp8liJuWznWkE\naXCo4bxY9sAqkjtQwYdt6Rc5d/vX02rqznLR3cB1703mMflMBas8vXLAvkzo9SBy\nYqNUXK2m7+I8SfzsU8ZXnxKwqMawmSqWYBfAeuaApw4IEHcdUQzVpWikR6eTtdhn\nm9+HX7zPhoqmGtVcLzRbElaDBtYaTJz7Q5NN3fqXwx9VR9LBt1vHRfcnL+SwZhH+\nUEJIKxwkIdeLY1ZitEmIvXUxgvgL9m6xrH0XkwKeOMpG1UPhR/iMxGOJia4j8WNL\nIjRcdylJAgMBAAECggEAA/RruUN4DHeNBi72t+cnehURfq27zq7LjthtmdP38JJJ\nI9cNs0XqTKTlyygOidYQeSb3v5Sqvavs+uZOSRBYoNz5m8lD0ZWZl3bqaGDzemKJ\n59Q7nejgrEge+tNl1ecDqAMztJJg0FsILIiX96IWeF/bwzyDyi/etE4VT/Nw1KRs\nUSPJY/zaKTLTlhgwWzDJZuriCwt4DDVNwbWyL6XDdQY09No9L+A4ASZ63S6q2qSG\nck2mFBt0pTvEHxrgq8bKdFRt5Q34ZliNi753doFz/50boKONxkdzVGYzExRIaFeH\nfcH27fnnxGlil4tWOLPBl0o3jfHuS7LSx/wVF4osEQKBgQD0VtMU/9t8JdR1KqCO\njnUUCWdqR/xAM79BbB6AZ2owzWOezIR4HxH2pmXh/K1N94OjZfsjvU3TFFMHf6X9\nSjU95F3NylKK8tr4za0meu4DmoCPavf7AE80Pl7Ll2E6pgGBKl+p5ETmQYiaM2qJ\nS21fQvjkvuhc3HA2dPt1W0ft+QKBgQDY41uo+nQ5xnN2UV9sx0v3W99VeCRdr6Zy\nPm+8eoFc/Y/hTJ6CXCK5+KCyCTFsZsK4cdTKtEctLJvnb713LSz15agpDzH1LBNP\n26dEMH1xMa3oyVbirmsx5TZ2+UwcDr1FQQHDxE4nnGzICul8baE4XtWjv+ybAWZG\nZDTbCukp0QKBgQCkD+yZ7BaPLMOUjLPUJNl+Q7Y5ye4ZmeVw400zwLyv2ilrBj5o\nfcxNBnvgmw4vDORKAf74h3LLKZl6rn5hLcPENCO8O37jJ6BacZgy/1Xz+3kZU6UA\n17tXBA4YvCOgArl95lrns4uD5Dr5904wtAHTdh+zUHCrcaSzHCeALHOG2QKBgC1r\n5/1Kfl6/Jd0oi4B/eHRUREBlCdCpAYW5d7MUQNVVsPUxE50faJJj9Ft0u2oFV1BD\nXpoZCTL3varJZvd3eYwBzabTrNW4pk66JJyOPycejVpMGCse9gocA70E1qCloZPI\nWnNCQE/hXZLDXkSVvQbOLZW+kvGfaGjjgYJCFbSRAoGBAL3Gjw4e1Bj8kJFuoFxl\nybBIXnAItfNgFFXOhKQFwHRU8vhktI2mzDLWqOciyoFiK5j1NNYjnSPatCsLaG+s\nEw34CV8ow+kQODqimXcJZsKuP6Ph9dwMBeUAIwcpNTKi5EYEUZq4Tk4T2dYMprgT\nNoRwx/PJ7L7yTth/HrXHe6sX\n-----END PRIVATE KEY-----\n`,
  };

  return initializeApp({
    credential: cert(DEFAULT_SERVICE_ACCOUNT),
    projectId: DEFAULT_SERVICE_ACCOUNT.projectId,
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
