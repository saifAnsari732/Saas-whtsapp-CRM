import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
// fskn
  const { data: { user } } = await supabase.auth.getUser()

  // getUser() transparently refreshes an expired access token, which
  // ROTATES the refresh token and writes the new cookies onto
  // `supabaseResponse` via setAll() above. Any response we return in
  // place of `supabaseResponse` (every redirect / JSON branch below)
  // is a fresh object that does NOT carry those Set-Cookie headers, so
  // the rotated token never reaches the browser. The next request then
  // replays the old, now-consumed refresh token, the refresh fails, and
  // the session wedges — the user gets a broken reload after idling and
  // can only recover by manually clearing cookies (issue #288). Copy the
  // refreshed cookies onto whatever response we hand back to fix that.
  const withRefreshedCookies = <T extends NextResponse>(response: T): T => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })
    return response
  }

  // Auth pages - redirect to dashboard if already logged in.
  // Exception: when an invite token is in the query string we
  // send the already-signed-in user to /join/<token> instead so
  // they can accept the invitation in one click. Without this,
  // a forwarded invite link to someone who's already signed in
  // would silently drop them on /dashboard.
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/forgot-password'
  )) {
    const url = request.nextUrl.clone()
    const inviteToken = request.nextUrl.searchParams.get('invite')
    if (
      inviteToken &&
      (request.nextUrl.pathname === '/login' ||
        request.nextUrl.pathname === '/signup')
    ) {
      url.pathname = `/join/${encodeURIComponent(inviteToken)}`
      url.search = ''
    } else {
      url.pathname = '/dashboard'
      url.search = ''
    }
    return withRefreshedCookies(NextResponse.redirect(url))
  }

  // Protected pages - redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings']
  if (!user && protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withRefreshedCookies(NextResponse.redirect(url))
  }

  // API routes that need auth (not webhooks)
  if (!user && request.nextUrl.pathname.startsWith('/api/whatsapp/') &&
      !request.nextUrl.pathname.includes('/webhook')) {
    return withRefreshedCookies(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
  }

  // Subscription enforcement for both Pages and API routes
  if (user) {
    const pathname = request.nextUrl.pathname;
    
    // Always accessible regardless of subscription
    const isExempt = 
      pathname.startsWith('/billing') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/api/billing') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/whatsapp/webhook');

    const GATED_PAGES = [
      '/dashboard',
      '/inbox',
      '/broadcasts',
      '/automations',
      '/contacts',
      '/pipelines',
      '/flows',
      '/keyword-flows',
      '/agents'
    ];

    const SUBSCRIPTION_GATED_API = [
      '/api/whatsapp/send',
      '/api/broadcasts',
      '/api/automations',
      '/api/contacts',
      '/api/flows',
      '/api/keyword-flows',
    ];

    const isGatedPage = !isExempt && GATED_PAGES.some(path => pathname.startsWith(path));
    const isGatedApi = !isExempt && SUBSCRIPTION_GATED_API.some(path => pathname.startsWith(path));

    if (isGatedPage || isGatedApi) {
      // 1. Query profile to get account_id, role and email
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id, account_role, role, email')
        .eq('user_id', user.id)
        .single();

      const ADMIN_EMAILS = [
        'ansarisaifuddin732@gmail.com',
        'kisandeveloper2@gmail.com',
        ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
        ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
      ];

      const isPlatformAdmin = profile?.role === 'admin' || profile?.role === 'superadmin' || (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

      // Platform admins have unconditional full access
      if (isPlatformAdmin) {
        return withRefreshedCookies(NextResponse.next());
      }

      if (profile?.account_id) {
        // Query accounts for subscription_status and trial_ends_at
        const { data: account } = await supabase
          .from('accounts')
          .select('subscription_status, subscription_plan, trial_ends_at, subscription_expires_at, created_at')
          .eq('id', profile.account_id)
          .single();

        if (account) {
          let isActive = false;
          const now = new Date();

          if (account.subscription_status === 'active') {
            if (account.subscription_expires_at) {
              const expiresAt = new Date(account.subscription_expires_at);
              if (expiresAt > now) {
                isActive = true;
              }
            } else {
              isActive = true;
            }
          } else {
            let trialEndsAt = account.trial_ends_at ? new Date(account.trial_ends_at) : null;
            if (!trialEndsAt && account.created_at) {
              trialEndsAt = new Date(new Date(account.created_at).getTime() + 5 * 24 * 60 * 60 * 1000);
            }
            if (trialEndsAt && trialEndsAt > now) {
              isActive = true;
            } else if (!trialEndsAt) {
              // Safety fallback for new accounts
              isActive = true;
            }
          }

          // If trial or subscription is expired, block access and redirect to billing
          if (!isActive) {
            if (isGatedApi) {
              return withRefreshedCookies(
                NextResponse.json({
                  error: "Subscription required",
                  code: "SUBSCRIPTION_EXPIRED",
                  message: "Your trial has expired. Please upgrade your plan to continue.",
                  upgrade_url: "/billing"
                }, { status: 403 })
              );
            } else {
              const url = request.nextUrl.clone();
              url.pathname = '/billing';
              url.search = '?expired=true';
              return withRefreshedCookies(NextResponse.redirect(url));
            }
          }
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
