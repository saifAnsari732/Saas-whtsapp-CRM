// ============================================================
// GET /api/account/members
//
// Lists every member of the caller's account. Any member can call
// it (the Members tab is shown to admins+, but agents/viewers see
// a read-only roster too).
//
// Backed primarily by Firebase Firestore `users` collection, with
// Supabase profiles fallback/merge for maximum compatibility.
// ============================================================

import { NextResponse } from "next/server";
import { getCurrentAccount, toErrorResponse } from "@/lib/auth/account";
import { canManageMembers, isAccountRole } from "@/lib/auth/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountMember } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ctx = await getCurrentAccount();
    const canSeeEmails = canManageMembers(ctx.role);
    const membersMap = new Map<string, AccountMember>();

    // 1. Fetch members from Firebase Firestore users collection
    try {
      const db = getAdminDb();
      const usersRef = db.collection("users");

      let snap = await usersRef.where("accountId", "==", ctx.accountId).get();
      if (snap.empty) {
        snap = await usersRef.where("account_id", "==", ctx.accountId).get();
      }

      for (const doc of snap.docs) {
        const u = doc.data();
        const role = u.accountRole || u.account_role || "owner";
        const uid = u.uid || doc.id;
        membersMap.set(uid, {
          user_id: uid,
          full_name: u.fullName || u.full_name || u.displayName || "",
          email: canSeeEmails ? (u.email || null) : null,
          avatar_url: u.avatarUrl || u.avatar_url || null,
          role: isAccountRole(role) ? role : "owner",
          joined_at: u.createdAt?.toDate?.()?.toISOString() || (typeof u.createdAt === "string" ? u.createdAt : null) || new Date().toISOString(),
        });
      }

      // Check subcollection accounts/{accountId}/members
      try {
        const membersSubSnap = await db.collection("accounts").doc(ctx.accountId).collection("members").get();
        for (const mDoc of membersSubSnap.docs) {
          const mData = mDoc.data();
          const uid = mDoc.id || mData.userId || mData.user_id;
          if (uid && !membersMap.has(uid)) {
            const role = mData.accountRole || mData.account_role || "agent";
            membersMap.set(uid, {
              user_id: uid,
              full_name: mData.fullName || mData.full_name || "",
              email: canSeeEmails ? (mData.email || null) : null,
              avatar_url: mData.avatarUrl || mData.avatar_url || null,
              role: isAccountRole(role) ? role : "agent",
              joined_at: mData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            });
          }
        }
      } catch {}

      // Ensure caller is included
      if (!membersMap.has(ctx.userId)) {
        try {
          const callerDoc = await usersRef.doc(ctx.userId).get();
          if (callerDoc.exists) {
            const u = callerDoc.data()!;
            const role = u.accountRole || u.account_role || ctx.role || "owner";
            membersMap.set(ctx.userId, {
              user_id: ctx.userId,
              full_name: u.fullName || u.full_name || u.displayName || "",
              email: canSeeEmails ? (u.email || null) : null,
              avatar_url: u.avatarUrl || u.avatar_url || null,
              role: isAccountRole(role) ? role : "owner",
              joined_at: u.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            });
          }
        } catch {}
      }
    } catch (fsErr) {
      console.warn("[GET /api/account/members] Firestore users query warning:", fsErr);
    }

    // 2. Fetch and merge Supabase profiles if present
    try {
      const admin = createAdminClient();
      const { data: profiles, error } = await admin
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, account_role, created_at")
        .eq("account_id", ctx.accountId)
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(profiles)) {
        for (const row of profiles) {
          if (isAccountRole(row.account_role) && !membersMap.has(row.user_id)) {
            membersMap.set(row.user_id, {
              user_id: row.user_id,
              full_name: row.full_name ?? "",
              email: canSeeEmails ? row.email : null,
              avatar_url: row.avatar_url,
              role: row.account_role,
              joined_at: row.created_at,
            });
          }
        }
      }
    } catch {}

    const members: AccountMember[] = Array.from(membersMap.values());
    return NextResponse.json({ members });
  } catch (err) {
    return toErrorResponse(err);
  }
}
