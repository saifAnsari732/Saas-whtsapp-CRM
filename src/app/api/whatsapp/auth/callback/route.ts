import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // URL to redirect the user back to in the CRM
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saas-whtsapp-crm-sigma.vercel.app';
  const settingsUrl = new URL('/settings', baseUrl);
  settingsUrl.searchParams.set('tab', 'whatsapp');

  if (error) {
    console.error('Facebook OAuth Error:', error, errorDescription);
    settingsUrl.searchParams.set('oauth_error', errorDescription || 'Failed to connect to Facebook');
    return NextResponse.redirect(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set('oauth_error', 'No authorization code received');
    return NextResponse.redirect(settingsUrl);
  }

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  
  // The redirect_uri must EXACTLY match what was sent in the initial request
  const redirectUri = `${baseUrl}/api/whatsapp/auth/callback`;

  if (!clientId || !clientSecret) {
    settingsUrl.searchParams.set('oauth_error', 'Missing Facebook App configuration');
    return NextResponse.redirect(settingsUrl);
  }

  try {
    // Exchange the code for an access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
    );
    
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Failed to exchange code for token:', tokenData);
      settingsUrl.searchParams.set('oauth_error', tokenData.error?.message || 'Failed to generate access token');
      return NextResponse.redirect(settingsUrl);
    }

    // Successfully retrieved the access token
    // We redirect the user back to the settings page with the token in the URL.
    // The frontend will intercept this, exchange it for WABA IDs, and clear it from the URL.
    settingsUrl.searchParams.set('accessToken', tokenData.access_token);
    
    return NextResponse.redirect(settingsUrl);

  } catch (err) {
    console.error('Exception during token exchange:', err);
    settingsUrl.searchParams.set('oauth_error', 'Internal server error during authentication');
    return NextResponse.redirect(settingsUrl);
  }
}
