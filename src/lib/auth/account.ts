// ============================================================
// Server-side account context — for API routes and server
// components using Firebase Firestore & Auth.
// ============================================================

import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { hasMinRole, isAccountRole, type AccountRole } from "./roles";

export class UnauthorizedError extends Error {
  readonly status = 401 as const;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[toErrorResponse] uncategorized error:", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export interface AccountContext {
  userId: string;
  accountId: string;
  role: AccountRole;
  account: { id: string; name: string };
  // Legacy compatibility property
  supabase: any;
}

export async function getCurrentAccount(): Promise<AccountContext> {
  let token: string | undefined;

  // Try Bearer token from headers
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  } catch {}

  // Fallback to session cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("__session")?.value;
    } catch {}
  }

  if (!token) {
    throw new UnauthorizedError();
  }

  let uid: string;
  try {
    const adminAuth = getAdminAuth();
    try {
      const decoded = await adminAuth.verifySessionCookie(token, true);
      uid = decoded.uid;
    } catch {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    }
  } catch (err) {
    console.error("[getCurrentAccount] auth verify error:", err);
    throw new UnauthorizedError();
  }

  const db = getAdminDb();
  const profileDoc = await db.collection("users").doc(uid).get();

  if (!profileDoc.exists) {
    throw new ForbiddenError("Profile does not exist");
  }

  const profileData = profileDoc.data();
  const accountId = profileData?.accountId;
  const accountRole = profileData?.accountRole || "owner";

  if (!accountId) {
    throw new ForbiddenError("Profile is not linked to an account");
  }

  if (!isAccountRole(accountRole)) {
    throw new ForbiddenError(`Unknown account role: ${accountRole}`);
  }

  const accountDoc = await db.collection("accounts").doc(accountId).get();
  if (!accountDoc.exists) {
    throw new ForbiddenError("Profile is not linked to an account");
  }

  const accountData = accountDoc.data();

  return {
    userId: uid,
    accountId,
    role: accountRole as AccountRole,
    account: { id: accountDoc.id, name: accountData?.name || "My Account" },
    supabase: null,
  };
}

export async function requireRole(min: AccountRole): Promise<AccountContext> {
  const ctx = await getCurrentAccount();
  if (!hasMinRole(ctx.role, min)) {
    throw new ForbiddenError(
      `This action requires the '${min}' role or higher`,
    );
  }
  return ctx;
}
