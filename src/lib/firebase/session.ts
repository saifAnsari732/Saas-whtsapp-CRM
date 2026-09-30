// ============================================================
// Firebase Session Management — server-side
// Replaces Supabase cookie session
// ============================================================
import { getAdminAuth } from './admin';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

/**
 * Create a session cookie from a Firebase ID token.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_EXPIRY_MS });
}

/**
 * Get current user from session cookie (for Server Components & page.tsx).
 * Drop-in replacement for:
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function getCurrentUser(): Promise<{ uid: string; email?: string } | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!session) return null;
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
