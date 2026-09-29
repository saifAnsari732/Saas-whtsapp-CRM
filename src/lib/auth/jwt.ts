import { NextRequest, NextResponse } from "next/server";

// Secret key for HMAC-SHA256 JWT signing (uses env var or fallback)
const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "chatflyr_secure_jwt_secret_key_2026_enterprise_auth";

let cachedCryptoKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) return cachedCryptoKey;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET_STRING);
  cachedCryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return cachedCryptoKey;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  accountId: string | null;
  planId: string;
  role: string | null;
  accountRole: string | null;
  type: "access" | "refresh";
  tokenId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Sign a JWT token using native Web Crypto HMAC-SHA256
 */
export async function signJwt(payload: Omit<JwtTokenPayload, "iat" | "exp">, expiresInSeconds: number): Promise<string> {
  const key = await getCryptoKey();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  
  const fullPayload: JwtTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)));

  const dataToSign = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
  const signatureB64 = base64UrlEncode(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Verify and decode a JWT token using native Web Crypto HMAC-SHA256
 */
export async function verifyJwt(token: string): Promise<JwtTokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlDecode(signatureB64);

    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, dataToVerify);
    if (!isValid) return null;

    const payloadText = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload: JwtTokenPayload = JSON.parse(payloadText);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a pair of Access Token (1h) and Refresh Token (30 days)
 */
export async function createAuthTokens(userPayload: {
  userId: string;
  email: string;
  accountId: string | null;
  planId: string;
  role: string | null;
  accountRole: string | null;
}) {
  const accessToken = await signJwt(
    {
      sub: userPayload.userId,
      email: userPayload.email,
      accountId: userPayload.accountId,
      planId: userPayload.planId,
      role: userPayload.role,
      accountRole: userPayload.accountRole,
      type: "access",
    },
    3600 // 1 hour
  );

  const refreshToken = await signJwt(
    {
      sub: userPayload.userId,
      email: userPayload.email,
      accountId: userPayload.accountId,
      planId: userPayload.planId,
      role: userPayload.role,
      accountRole: userPayload.accountRole,
      type: "refresh",
      tokenId: `rt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    },
    30 * 86400 // 30 days
  );

  return { accessToken, refreshToken };
}

/**
 * Attach HttpOnly Access & Refresh Token cookies onto a Next.js Response
 */
export function setAuthTokenCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set("cf_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600, // 1 hour
  });

  response.cookies.set("cf_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 86400, // 30 days
  });

  return response;
}

/**
 * Clear Auth Token cookies on logout
 */
export function clearAuthTokenCookies(response: NextResponse) {
  response.cookies.set("cf_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("cf_refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });

  return response;
}
