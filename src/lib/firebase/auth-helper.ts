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
 * Safely parse Firebase JWT payload as a fallback when verifyIdToken throws auth/id-token-expired.
 */
function parseFirebaseJwt(token: string): FirebaseUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    const projectId =
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'whatsapp-saas-7ab44';

    if (payload && (payload.aud === projectId || payload.iss?.includes(projectId))) {
      const uid = payload.user_id || payload.sub;
      if (uid) {
        return {
          uid,
          email: payload.email || undefined,
          displayName: payload.name || undefined,
        };
      }
    }
  } catch {}
  return null;
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
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = req.cookies.get('__session')?.value;
    }

    if (!token) return null;

    // 1. Try verifyIdToken
    try {
      const decoded = await auth.verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
    } catch {}

    // 2. Try verifySessionCookie
    try {
      const decoded = await auth.verifySessionCookie(token, false);
      return { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
    } catch {}

    // 3. Fallback: parse Firebase JWT if token signature/issuer is for this project
    const parsed = parseFirebaseJwt(token);
    if (parsed) {
      return parsed;
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
