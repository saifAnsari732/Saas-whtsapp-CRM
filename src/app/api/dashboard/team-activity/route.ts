import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId || '61740bf8-b21e-42dd-9ab3-9118bca90bc6';
    const currentUser = accCtx?.user;
    const currentAccountRole = accCtx?.accountRole;

    const membersMap = new Map<string, {
      id: string;
      full_name: string | null;
      email: string;
      role: string | null;
      account_role: string | null;
      avatar_url: string | null;
      messagesSent: number;
    }>();

    // 1. Fetch team members from Firebase Firestore users collection
    try {
      const db = getAdminDb();
      const usersRef = db.collection('users');

      // Query by accountId
      let qSnap = await usersRef.where('accountId', '==', accountId).get();
      if (qSnap.empty) {
        qSnap = await usersRef.where('account_id', '==', accountId).get();
      }

      if (!qSnap.empty) {
        for (const doc of qSnap.docs) {
          const u = doc.data();
          membersMap.set(doc.id, {
            id: doc.id,
            full_name: u.fullName || u.full_name || (u.email ? u.email.split('@')[0] : 'Member'),
            email: u.email || '',
            role: u.role || 'user',
            account_role: u.accountRole || u.account_role || 'member',
            avatar_url: u.avatarUrl || u.avatar_url || null,
            messagesSent: 0,
          });
        }
      }

      // Also check subcollection accounts/{accountId}/members
      try {
        const mSnap = await db.collection('accounts').doc(accountId).collection('members').get();
        for (const mDoc of mSnap.docs) {
          const mData = mDoc.data();
          const uid = mDoc.id;
          if (!membersMap.has(uid)) {
            membersMap.set(uid, {
              id: uid,
              full_name: mData.fullName || mData.full_name || (mData.email ? mData.email.split('@')[0] : 'Member'),
              email: mData.email || '',
              role: mData.role || 'user',
              account_role: mData.accountRole || mData.account_role || 'agent',
              avatar_url: mData.avatarUrl || mData.avatar_url || null,
              messagesSent: 0,
            });
          }
        }
      } catch {}

      // If current user is not in map, add them
      if (currentUser?.uid && !membersMap.has(currentUser.uid)) {
        try {
          const selfDoc = await usersRef.doc(currentUser.uid).get();
          if (selfDoc.exists) {
            const u = selfDoc.data()!;
            membersMap.set(currentUser.uid, {
              id: currentUser.uid,
              full_name: u.fullName || u.full_name || currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Owner'),
              email: u.email || currentUser.email || '',
              role: u.role || 'admin',
              account_role: u.accountRole || u.account_role || currentAccountRole || 'owner',
              avatar_url: u.avatarUrl || u.avatar_url || null,
              messagesSent: 0,
            });
          } else {
            membersMap.set(currentUser.uid, {
              id: currentUser.uid,
              full_name: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Owner'),
              email: currentUser.email || '',
              role: 'admin',
              account_role: currentAccountRole || 'owner',
              avatar_url: null,
              messagesSent: 0,
            });
          }
        } catch {}
      }
    } catch (fsErr) {
      console.warn('[GET /api/dashboard/team-activity] Firestore users query warning:', fsErr);
    }

    const team = Array.from(membersMap.values());
    return NextResponse.json({ team });
  } catch (err: any) {
    console.error('[GET /api/dashboard/team-activity] error:', err);
    return NextResponse.json({ team: [] });
  }
}
