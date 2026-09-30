import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

const PUBLIC_API_PATHS = [
  '/api/whatsapp/webhook',
  '/api/auth/session',
  '/api/invitations',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/chatflyr-logo') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public pages
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '?'))) {
    return NextResponse.next();
  }

  // Allow public API paths
  if (PUBLIC_API_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = req.cookies.get('__session')?.value;
  if (!sessionCookie) {
    // API routes return 401, pages redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('__session');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inbox/:path*',
    '/contacts/:path*',
    '/broadcasts/:path*',
    '/automations/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/billing/:path*',
    '/pipelines/:path*',
    '/notifications/:path*',
    '/keyword-flows/:path*',
    '/profile/:path*',
    '/api/account/:path*',
    '/api/admin/:path*',
    '/api/ai/:path*',
    '/api/automations/:path*',
    '/api/billing/:path*',
    '/api/chatbot/:path*',
    '/api/contacts/:path*',
    '/api/flows/:path*',
    '/api/quick-replies/:path*',
    '/api/v1/:path*',
    '/api/whatsapp/config/:path*',
    '/api/whatsapp/send/:path*',
    '/api/whatsapp/templates/:path*',
    '/api/whatsapp/broadcast/:path*',
    '/api/whatsapp/baileys/:path*',
    '/api/whatsapp/media/:path*',
  ],
};
