import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/firebase/session';
import { getAdminAuth } from '@/lib/firebase/admin';

// POST /api/auth/session — create session cookie from Firebase ID token
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'No token provided' }, { status: 400 });

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ success: true, uid: decoded.uid });
    response.cookies.set('__session', sessionCookie, {
      maxAge: 60 * 60 * 24 * 14, // 14 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('[Auth Session] Error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// DELETE /api/auth/session — sign out
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('__session', '', { maxAge: 0, path: '/' });
  return response;
}
