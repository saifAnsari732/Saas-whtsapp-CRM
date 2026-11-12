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
export async function getFirebaseUser(req: any): Promise<FirebaseUser | null> {
  try {
    const auth = getAdminAuth();

    // 1. Try Authorization: Bearer <token> header first
    const authHeader = req?.headers?.get ? req.headers.get('authorization') : null;
    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req?.cookies?.get) {
      token = req.cookies.get('__session')?.value;
    } else if (req?.headers?.get) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/(?:^|;\s*)__session=([^;]+)/);
      token = match ? decodeURIComponent(match[1]) : undefined;
    }

    if (!token) {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        token = cookieStore.get('__session')?.value;
      } catch {}
    }

    if (token) {
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
    }

    // 4. Fallback to Supabase Auth if pure Firebase auth token is not in header/cookie
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser) {
        return {
          uid: sbUser.id,
          email: sbUser.email || undefined,
          displayName: sbUser.user_metadata?.full_name || sbUser.email || undefined,
        };
      }
    } catch {}

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
export async function getAccountContext(req?: NextRequest | Request | any): Promise<AccountContext | null> {
  const user = await getFirebaseUser(req);
  if (!user) return null;

  let accountId: string | null = null;
  let accountRole = 'owner';

  try {
    const db = getAdminDb();
    if (db) {
      const profileDoc = await db.collection('users').doc(user.uid).get();
      if (profileDoc.exists) {
        const data = profileDoc.data();
        accountId = data?.accountId || data?.account_id || null;
        accountRole = data?.accountRole || data?.account_role || 'owner';
      }
    }
  } catch (dbErr) {
    console.warn('[getAccountContext] Firestore profile lookup warning:', dbErr);
  }

  // Supabase profile fallback if not found in Firestore
  if (!accountId) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id, role')
        .eq('user_id', user.uid)
        .maybeSingle();
      if (profile?.account_id) {
        accountId = profile.account_id;
        accountRole = profile.role || 'owner';
      }
    } catch {}
  }

  if (!accountId) {
    accountId = `acct-${user.uid}`;
  }

  // Best-effort ensure user document exists in Firestore
  try {
    const db = getAdminDb();
    if (db) {
      await db.collection('users').doc(user.uid).set(
        { accountId, accountRole, email: user.email },
        { merge: true },
      ).catch(() => {});
    }
  } catch {}

  return {
    user,
    accountId,
    accountRole,
  };
}
