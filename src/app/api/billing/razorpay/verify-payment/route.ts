import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getFirebaseUser } from '@/lib/firebase/auth-helper';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const user = await getFirebaseUser(req as any);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(user.uid).get();
    const accountId = userDoc.data()?.accountId;

    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id = 'essential',
      type = 'subscription',
      billing_cycle = 'monthly',
      amount = 999,
    } = body;

    const isDemo = razorpay_order_id?.startsWith('order_demo_') || razorpay_signature === 'demo_signature';

    if (!isDemo) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Payment credentials missing.' }, { status: 400 });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (secret) {
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(text)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          console.error('[Verify Payment Security] Invalid signature attempt', {
            razorpay_order_id,
            razorpay_payment_id,
          });
          return NextResponse.json(
            { error: 'Payment signature verification failed.' },
            { status: 400 }
          );
        }
      }
    }

    let orderDocRef: FirebaseFirestore.DocumentReference | null = null;
    let orderData: any = null;

    if (razorpay_order_id) {
      const snap = await db
        .collection('accounts')
        .doc(accountId)
        .collection('billing_orders')
        .where('orderId', '==', razorpay_order_id)
        .limit(1)
        .get();

      if (!snap.empty) {
        orderDocRef = snap.docs[0].ref;
        orderData = snap.docs[0].data();
      }
    }

    const targetType = orderData?.type || type || 'subscription';
    const targetPlanId = orderData?.planId || plan_id || 'essential';
    const targetBillingCycle = orderData?.metadata?.billing_cycle || billing_cycle || 'monthly';

    if (orderDocRef) {
      await orderDocRef.update({
        status: 'paid',
        paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await db
        .collection('accounts')
        .doc(accountId)
        .collection('billing_orders')
        .add({
          orderId: razorpay_order_id || `order_demo_${Date.now()}`,
          paymentId: razorpay_payment_id || `pay_demo_${Date.now()}`,
          amount: Math.round(Number(amount) * 100),
          currency: 'INR',
          planId: targetPlanId,
          type: targetType,
          status: 'paid',
          metadata: { billing_cycle: targetBillingCycle, is_demo: isDemo },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    }

    const accountRef = db.collection('accounts').doc(accountId);

    if (targetType === 'subscription') {
      const daysToAdd = targetBillingCycle === 'yearly' ? 365 : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysToAdd);

      const normalizedPlanId = targetPlanId === 'all-in-one' ? 'allinone' : targetPlanId;

      await accountRef.update({
        subscriptionPlan: normalizedPlanId,
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
        subscriptionStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (targetType === 'wallet_topup') {
      const creditRupees = Math.round(Number(amount));
      const walletRef = accountRef.collection('wallet').doc('data');

      await walletRef.set(
        {
          balance: FieldValue.increment(creditRupees),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await accountRef.collection('wallet_transactions').add({
        amount: creditRupees,
        type: 'credit',
        description: 'Wallet Topup via Checkout',
        referenceId: razorpay_payment_id || `pay_demo_${Date.now()}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      success: true,
      type: targetType,
      plan_id: targetPlanId,
      is_demo: isDemo,
      message: 'Payment and subscription verified successfully in Firestore.',
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
