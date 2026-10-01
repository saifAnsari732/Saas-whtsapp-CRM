// ============================================================
// Firebase Auth Helper — server-side only (API routes)
// Replaces: const { data: { user } } = await supabase.auth.getUser()
// ============================================================
import { getAdminAuth, getAdminDb } from './admin';
import { NextRequest } from 'next/server';

export interface FirebaseUser {
  uid: string;
  email: string | undefined;
  displayName?: string | null;
}

export interface AccountContext {
  user: FirebaseUser;
  accountId: string;
  accountRole: string;
}

/**
 * Verify Firebase ID token from Authorization header or session cookie.
 * Drop-in replacement for supabase.auth.getUser() in API routes.
 */
export async function getFirebaseUser(req: NextRequest): Promise<FirebaseUser | null> {
  try {
    const auth = getAdminAuth();

    // 1. Try Authorization: Bearer <token> header first
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = await auth.verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
      } catch {
        try {
          const decoded = await auth.verifySessionCookie(token, false);
          return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
        } catch {}
      }
    }

    // 2. Try session cookie __session
    const sessionCookie = req.cookies.get('__session')?.value;
    if (sessionCookie) {
      try {
        const decoded = await auth.verifySessionCookie(sessionCookie, false);
        return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
      } catch {
        try {
          const decoded = await auth.verifyIdToken(sessionCookie);
          return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
        } catch {}
      }
    }

    return null;
  } catch (err) {
    console.error("[getFirebaseUser] auth error:", err);
    return null;
  }
}

/**
 * Get user + their account context (accountId, role).
 * Replaces the Supabase profile lookup pattern.
 */
export async function getAccountContext(req: NextRequest): Promise<AccountContext | null> {
  const user = await getFirebaseUser(req);
  if (!user) return null;

  const db = getAdminDb();
  const profileDoc = await db.collection('users').doc(user.uid).get();
  
  let accountId = profileDoc.exists ? (profileDoc.data()?.accountId || profileDoc.data()?.account_id) : null;
  let accountRole = profileDoc.exists ? (profileDoc.data()?.accountRole || profileDoc.data()?.account_role || 'owner') : 'owner';

  if (!accountId) {
    accountId = `acct-${user.uid}`;
    await db.collection('users').doc(user.uid).set({ accountId, accountRole: 'owner', email: user.email }, { merge: true }).catch(() => {});
  }

  return {
    user,
    accountId,
    accountRole,
  };
}
