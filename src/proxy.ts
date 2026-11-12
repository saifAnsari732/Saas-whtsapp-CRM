import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

const PUBLIC_API_PATHS = [
  '/api/whatsapp/webhook',
  '/api/whatsapp/auth',
  '/api/auth/session',
  '/api/invitations',
  '/api/whatsapp/baileys',
  '/api/whatsapp/coexistence',
];

export async function proxy(req: NextRequest) {
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

  // Check session cookie or Authorization header or Supabase auth token
  const sessionCookie = req.cookies.get('__session')?.value;
  const authHeader = req.headers.get('authorization');
  const hasBearer = authHeader && authHeader.startsWith('Bearer ');
  const hasSupabaseCookie = Array.from(req.cookies.getAll()).some(c => c.name.includes('-auth-token'));

  if (!sessionCookie && !hasBearer && !hasSupabaseCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Session authenticated — allow request
  return NextResponse.next();
}

export const middleware = proxy;

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
    '/api/whatsapp/media/:path*',
  ],
};
