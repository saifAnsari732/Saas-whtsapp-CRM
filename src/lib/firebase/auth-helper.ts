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
    // Try Authorization: Bearer <token> header first
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = await getAdminAuth().verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
    }
    // Try session cookie
    const sessionCookie = req.cookies.get('__session')?.value;
    if (sessionCookie) {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
      return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
    }
    return null;
  } catch {
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
  if (!profileDoc.exists) return null;

  const profile = profileDoc.data()!;
  return {
    user,
    accountId: profile.accountId as string,
    accountRole: profile.accountRole as string,
  };
}
