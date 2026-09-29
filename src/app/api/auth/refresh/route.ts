import { NextResponse } from "next/server";
import { createAuthTokens, setAuthTokenCookies, verifyJwt } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    let refreshToken: string | null = null;

    // Read refresh token from cookies first
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/cf_refresh_token=([^;]+)/);
      if (match) refreshToken = match[1];
    }

    // Fallback: check JSON body
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken || null;
      } catch {}
    }

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token is required" }, { status: 400 });
    }

    // Verify Refresh Token
    const payload = await verifyJwt(refreshToken);
    if (!payload || payload.type !== "refresh") {
      return NextResponse.json({ error: "Invalid or expired refresh token. Please sign in again." }, { status: 401 });
    }

    // Generate rotated token pair
    const { accessToken, refreshToken: newRefreshToken } = await createAuthTokens({
      userId: payload.sub,
      email: payload.email,
      accountId: payload.accountId,
      planId: payload.planId,
      role: payload.role,
      accountRole: payload.accountRole,
    });

    const response = NextResponse.json({
      success: true,
      accessToken,
      expiresIn: 3600,
    });

    return setAuthTokenCookies(response, accessToken, newRefreshToken);
  } catch (error: any) {
    console.error("Token refresh error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
