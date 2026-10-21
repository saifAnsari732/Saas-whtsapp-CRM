import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getAccountContext } from '@/lib/firebase/auth-helper';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const accCtx = await getAccountContext(request as any);
    const accountId = accCtx?.accountId;

    if (!accountId) {
      return NextResponse.json({ team: [] });
    }

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

      for (const docSnap of qSnap.docs) {
        const u = docSnap.data();
        const uid = u.uid || docSnap.id;
        const fullName = u.fullName || u.full_name || u.displayName || (u.email ? u.email.split('@')[0] : 'User');
        membersMap.set(uid, {
          id: uid,
          full_name: fullName,
          email: u.email || '',
          role: u.role || 'user',
          account_role: u.accountRole || u.account_role || 'owner',
          avatar_url: u.avatarUrl || u.avatar_url || null,
          messagesSent: 0,
        });
      }

      // Also check subcollection accounts/{accountId}/members if present
      try {
        const membersSubSnap = await db.collection('accounts').doc(accountId).collection('members').get();
        for (const mDoc of membersSubSnap.docs) {
          const mData = mDoc.data();
          const uid = mDoc.id || mData.userId || mData.user_id;
          if (uid && !membersMap.has(uid)) {
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
      if (accCtx.user?.uid && !membersMap.has(accCtx.user.uid)) {
        try {
          const selfDoc = await usersRef.doc(accCtx.user.uid).get();
          if (selfDoc.exists) {
            const u = selfDoc.data()!;
            membersMap.set(accCtx.user.uid, {
              id: accCtx.user.uid,
              full_name: u.fullName || u.full_name || accCtx.user.displayName || (accCtx.user.email ? accCtx.user.email.split('@')[0] : 'Owner'),
              email: u.email || accCtx.user.email || '',
              role: u.role || 'admin',
              account_role: u.accountRole || u.account_role || accCtx.accountRole || 'owner',
              avatar_url: u.avatarUrl || u.avatar_url || null,
              messagesSent: 0,
            });
          } else {
            membersMap.set(accCtx.user.uid, {
              id: accCtx.user.uid,
              full_name: accCtx.user.displayName || (accCtx.user.email ? accCtx.user.email.split('@')[0] : 'Owner'),
              email: accCtx.user.email || '',
              role: 'admin',
              account_role: accCtx.accountRole || 'owner',
              avatar_url: null,
              messagesSent: 0,
            });
          }
        } catch {}
      }
    } catch (fsErr) {
      console.warn('[GET /api/dashboard/team-activity] Firestore users query warning:', fsErr);
    }

    // 2. Fetch any profiles from Supabase as fallback/merge
    try {
      const admin = createAdminClient();
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, user_id, full_name, email, role, account_role, avatar_url')
        .eq('account_id', accountId);

      if (profiles && Array.isArray(profiles)) {
        for (const p of profiles) {
          const key = p.user_id || p.id;
          if (key && !membersMap.has(key)) {
            membersMap.set(key, {
              id: key,
              full_name: p.full_name || (p.email ? p.email.split('@')[0] : 'Member'),
              email: p.email || '',
              role: p.role || 'user',
              account_role: p.account_role || 'member',
              avatar_url: p.avatar_url || null,
              messagesSent: 0,
            });
          }
        }
      }
    } catch {}

    // 3. 7-Day Message Activity
    try {
      const admin = createAdminClient();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: messages } = await admin
        .from('messages')
        .select('sender_id')
        .eq('account_id', accountId)
        .eq('sender_type', 'agent')
        .gte('created_at', sevenDaysAgo);

      if (messages && Array.isArray(messages)) {
        for (const m of messages) {
          if (m.sender_id && membersMap.has(m.sender_id)) {
            const member = membersMap.get(m.sender_id)!;
            member.messagesSent = (member.messagesSent || 0) + 1;
          }
        }
      }
    } catch {}

    const team = Array.from(membersMap.values());
    return NextResponse.json({ team });
  } catch (err: any) {
    console.error('[GET /api/dashboard/team-activity] error:', err);
    return NextResponse.json({ team: [] });
  }
}
