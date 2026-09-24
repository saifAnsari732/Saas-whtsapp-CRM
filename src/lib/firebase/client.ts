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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
