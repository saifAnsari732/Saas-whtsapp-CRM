import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getFirebaseUser } from '@/lib/firebase/auth-helper';
import { FieldValue } from 'firebase-admin/firestore';

const ADMIN_EMAILS = [
  'ansarisaifuddin732@gmail.com',
  'kisandeveloper2@gmail.com',
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
  ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
];

function checkIsAdmin(userEmail: string | undefined | null, profileRole: string | undefined | null): boolean {
  if (profileRole === 'admin' || profileRole === 'superadmin') return true;
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) return true;
  return false;
}

export async function GET(request: Request) {
  try {
    const user = await getFirebaseUser(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Platform Admin access required' }, { status: 403 });
    }

    const usersSnap = await db.collection('users').get();
    const now = new Date();

    const formattedUsers = await Promise.all(
      usersSnap.docs.map(async (docSnap) => {
        const u = docSnap.data();
        const isAdmin = checkIsAdmin(u.email, u.role);

        let accData: any = null;
        if (u.accountId) {
          const accDoc = await db.collection('accounts').doc(u.accountId).get();
          if (accDoc.exists) {
            accData = accDoc.data();
          }
        }

        let walletBalance = 0;
        if (u.accountId) {
          const walletDoc = await db.collection('accounts').doc(u.accountId).collection('wallet').doc('data').get();
          if (walletDoc.exists) {
            walletBalance = Number(walletDoc.data()?.balance) || 0;
          }
        }

        let status = accData?.subscriptionStatus || 'trial';
        const trialEndsAt = accData?.trialEndsAt?.toDate?.() || (accData?.trialEndsAt ? new Date(accData.trialEndsAt) : null);
        if (status === 'trial' && trialEndsAt && trialEndsAt.getTime() <= now.getTime()) {
          status = 'expired';
        }

        return {
          id: docSnap.id,
          user_id: u.uid || docSnap.id,
          full_name: u.fullName || u.email || 'User',
          email: u.email,
          role: u.role || (isAdmin ? 'admin' : 'user'),
          is_admin: isAdmin,
          account_id: u.accountId,
          status,
          plan: accData?.subscriptionPlan || 'None',
          trial_ends_at: trialEndsAt ? trialEndsAt.toISOString() : null,
          created_at: u.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          wallet_balance: walletBalance,
        };
      })
    );

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getFirebaseUser(request as any);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    if (!checkIsAdmin(user.email || profile?.email, profile?.role)) {
      return NextResponse.json({ error: 'Forbidden: Platform Admin access required' }, { status: 403 });
    }

    const { user_id, action, plan_id, days } = await request.json();
    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetUserDoc = await db.collection('users').doc(user_id).get();
    if (!targetUserDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const targetProfile = targetUserDoc.data();
    const accountId = targetProfile?.accountId;
    if (!accountId) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const accountRef = db.collection('accounts').doc(accountId);

    if (action === 'block') {
      await accountRef.update({ subscriptionStatus: 'blocked', updatedAt: FieldValue.serverTimestamp() });
    } else if (action === 'unblock') {
      await accountRef.update({ subscriptionStatus: 'active', updatedAt: FieldValue.serverTimestamp() });
    } else if (action === 'extend_trial') {
      const daysToAdd = Number(days) || 5;
      const accDoc = await accountRef.get();
      const accData = accDoc.data();
      const currentExpiry = accData?.trialEndsAt?.toDate?.() || new Date();
      const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + daysToAdd);
      await accountRef.update({
        trialEndsAt: baseDate,
        subscriptionStatus: 'trial',
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (action === 'change_plan' || action === 'force_bypass') {
      await accountRef.update({
        subscriptionPlan: plan_id || 'allinone',
        subscriptionStatus: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (action === 'toggle_role') {
      const newRole = targetProfile?.role === 'admin' ? 'user' : 'admin';
      await db.collection('users').doc(user_id).update({ role: newRole, updatedAt: FieldValue.serverTimestamp() });
    } else if (action === 'grant_wallet_credit') {
      const creditAmount = Number(plan_id) || 500;
      const walletRef = accountRef.collection('wallet').doc('data');
      await walletRef.set({
        balance: FieldValue.increment(creditAmount),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      await accountRef.collection('wallet_transactions').add({
        amount: creditAmount,
        type: 'credit',
        description: `Admin Bonus Credit (₹${creditAmount})`,
        referenceId: `ADMIN-${Date.now()}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
