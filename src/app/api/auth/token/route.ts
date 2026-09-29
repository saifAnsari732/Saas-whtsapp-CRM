import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAuthTokens, setAuthTokenCookies, verifyJwt } from "@/lib/auth/jwt";
import { getPlanConfig } from "@/lib/billing/plan-features";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile and account subscription plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role, account_id, account_role")
      .eq("user_id", user.id)
      .maybeSingle();

    let planId = "essential";
    let accountId = profile?.account_id || null;

    if (accountId) {
      const { data: account } = await supabase
        .from("accounts")
        .select("subscription_plan, subscription_status, trial_ends_at, created_at")
        .eq("id", accountId)
        .maybeSingle();

      if (account) {
        const now = new Date();
        let isTrialActive = false;
        if (account.subscription_status === "trial" || (!account.subscription_status && account.created_at)) {
          const trialEnds = account.trial_ends_at
            ? new Date(account.trial_ends_at)
            : new Date(new Date(account.created_at).getTime() + 5 * 86400000);
          if (trialEnds > now) isTrialActive = true;
        }

        const planConfig = getPlanConfig(account.subscription_plan, isTrialActive);
        planId = planConfig.id;
      }
    }

    // Issue JWT Access Token (1h) and Refresh Token (30d)
    const { accessToken, refreshToken } = await createAuthTokens({
      userId: user.id,
      email: user.email || profile?.email || "",
      accountId,
      planId,
      role: profile?.role || "user",
      accountRole: profile?.account_role || "member",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        accountId,
        planId,
        role: profile?.role,
        accountRole: profile?.account_role,
      },
      accessToken,
      expiresIn: 3600,
    });

    return setAuthTokenCookies(response, accessToken, refreshToken);
  } catch (error: any) {
    console.error("Token generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      // Check cookies
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(/cf_access_token=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (!token) {
      return NextResponse.json({ authenticated: false, error: "No access token provided" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload) {
      return NextResponse.json({ authenticated: false, error: "Invalid or expired access token" }, { status: 401 });
    }

    const planConfig = getPlanConfig(payload.planId);

    return NextResponse.json({
      authenticated: true,
      tokenPayload: payload,
      planConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
