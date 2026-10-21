// ============================================================
// Firebase client-side SDK — browser singleton
// Equivalent replacement for src/lib/supabase/client.ts
// ============================================================
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBfNEJvLhY14u9CC3Eed9RuvHaeUGt7UJM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'whatsapp-saas-7ab44.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'whatsapp-saas-7ab44',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'whatsapp-saas-7ab44.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '636788413828',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:636788413828:web:485159899275395362b9d1',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-C9RF03BW2H',
};

// Singleton — one app shared across the whole browser session.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getClientAuth(): Auth {
  if (!_auth) {
    const app = getFirebaseApp();
    _auth = getAuth(app);
  }
  return _auth;
}

export function getClientDb(): Firestore {
  if (!_db) {
    const app = getFirebaseApp();
    _db = getFirestore(app);
  }
  return _db;
}

export function getClientStorage(): FirebaseStorage {
  if (!_storage) {
    const app = getFirebaseApp();
    _storage = getStorage(app);
  }
  return _storage;
}

// Legacy compat export — old code calls createClient()
// Returns an object with firestore methods exposed via db
export function createClient() {
  return getClientDb();
}
